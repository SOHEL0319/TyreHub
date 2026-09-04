import { getProducts, getProductById, addEnquiry } from '../api/firestoreService';

// In-memory cache for products to minimize Firestore reads
let productsCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export const fetchCachedProducts = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && productsCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return productsCache;
  }
  try {
    const products = await getProducts();
    productsCache = products || [];
    lastFetchTime = now;
    return productsCache;
  } catch (err) {
    console.error('Error fetching products for chatbot:', err);
    if (productsCache) return productsCache;
    throw err;
  }
};

// Distinct brands dynamically extracted from Firestore
export const getAvailableBrands = async () => {
  const products = await fetchCachedProducts();
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort();
  return brands;
};

// Find out-of-stock alternatives
export const findAlternatives = (targetProduct, allProducts) => {
  if (!targetProduct) return [];
  const inStockProducts = allProducts.filter(p => p._id !== targetProduct._id && (Number(p.stock) > 0));

  // Score alternatives
  const scored = inStockProducts.map(product => {
    let score = 0;
    // 1. Same size (Highest priority)
    if (targetProduct.size && product.size && targetProduct.size.toLowerCase() === product.size.toLowerCase()) {
      score += 50;
    }
    // 2. Same vehicle type
    if (targetProduct.vehicleType && product.vehicleType && targetProduct.vehicleType.toLowerCase() === product.vehicleType.toLowerCase()) {
      score += 30;
    }
    // 3. Same category
    if (targetProduct.category && product.category && targetProduct.category.toLowerCase() === product.category.toLowerCase()) {
      score += 20;
    }
    // 4. Same brand
    if (targetProduct.brand && product.brand && targetProduct.brand.toLowerCase() === product.brand.toLowerCase()) {
      score += 15;
    }
    // 5. Similar price (within 25%)
    if (targetProduct.price && product.price) {
      const diff = Math.abs(targetProduct.price - product.price);
      if (diff <= targetProduct.price * 0.25) {
        score += 10;
      }
    }
    return { product, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.product);
};

// Size regex parser (e.g., 205/55R16, 175/65 R14, 90/90-19)
const extractSizePattern = (text) => {
  const match = text.match(/\b\d{2,3}\s*\/\s*\d{2}\s*[rR\-]?\s*\d{2}\b/i);
  return match ? match[0].replace(/\s+/g, '').toUpperCase() : null;
};

// Number/Quantity extractor (e.g. "4 tyres", "I need 5", "have 2")
const extractQuantity = (text) => {
  const match = text.match(/\b(?:need|want|have|buy|for)\s+(\d+)\b|\b(\d+)\s*(?:tyres?|units?|pieces?|nos?)\b/i);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  const directNum = text.match(/\b([1-9]|10|12|16|20)\b/);
  return directNum ? parseInt(directNum[1], 10) : null;
};

// Budget extractor (e.g., "under 7000", "below 5000", "between 4000 and 8000")
const extractBudget = (text) => {
  const betweenMatch = text.match(/(?:between|from)\s*₹?\s*(\d+)\s*(?:and|to)\s*₹?\s*(\d+)/i);
  if (betweenMatch) {
    return {
      minPrice: parseInt(betweenMatch[1], 10),
      maxPrice: parseInt(betweenMatch[2], 10)
    };
  }
  const underMatch = text.match(/(?:under|below|less\s+than|upto|within|budget(?:\s+is|\s+of)?)\s*₹?\s*(\d+)/i);
  if (underMatch) {
    return {
      minPrice: 0,
      maxPrice: parseInt(underMatch[1], 10)
    };
  }
  const aboveMatch = text.match(/(?:above|more\s+than|over)\s*₹?\s*(\d+)/i);
  if (aboveMatch) {
    return {
      minPrice: parseInt(aboveMatch[1], 10),
      maxPrice: Infinity
    };
  }
  return null;
};

// Vehicle type detector
const detectVehicleType = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('car') || lower.includes('sedan') || lower.includes('suv') || lower.includes('hatchback')) return 'Car';
  if (lower.includes('bike') || lower.includes('motorcycle') || lower.includes('scooter') || lower.includes('two wheeler') || lower.includes('2 wheeler')) return 'Bike';
  if (lower.includes('auto') || lower.includes('rickshaw') || lower.includes('three wheeler') || lower.includes('3 wheeler')) return 'Auto';
  if (lower.includes('lorry') || lower.includes('truck') || lower.includes('heavy') || lower.includes('bus') || lower.includes('commercial')) return 'Lorry';
  return null;
};

// Brand detector
const detectBrand = (text, availableBrands) => {
  const lower = text.toLowerCase();
  for (const b of availableBrands) {
    const brandLower = b.toLowerCase();
    if (lower.includes(brandLower) || (brandLower.includes('apollo') && lower.includes('apollo')) || (brandLower.includes('jk') && lower.includes('jk'))) {
      return b;
    }
  }
  return null;
};

// Find matching product from natural language query
const findMatchingProduct = (text, products) => {
  const lower = text.toLowerCase();
  // Exact sku match
  const bySku = products.find(p => p.sku && lower.includes(p.sku.toLowerCase()));
  if (bySku) return bySku;

  // Exact or near name match
  const byName = products.find(p => p.name && lower.includes(p.name.toLowerCase()));
  if (byName) return byName;

  // Words score match
  let best = null;
  let maxMatchedWords = 1;

  for (const p of products) {
    if (!p.name) continue;
    const nameWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let matches = 0;
    for (const w of nameWords) {
      if (lower.includes(w)) matches++;
    }
    if (matches > maxMatchedWords) {
      maxMatchedWords = matches;
      best = p;
    }
  }
  return best;
};

/**
 * Process user input through the rule/intent engine with session memory
 */
export const processUserMessage = async (rawInput, sessionMemory = {}) => {
  const input = rawInput.trim();
  const lower = input.toLowerCase();
  
  // Clone memory to update
  const memory = { ...sessionMemory };

  // 1. GREETINGS
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|namaste|start|help|menu)\b/i.test(lower) && lower.length < 25) {
    return {
      text: "Hello 👋 Welcome to Bridgestone Rasheed Tyres Planet in Atmakur.\n\nHow can I help you find the right tyres today?",
      quickActions: ['Find a Tyre', 'Check Stock', 'Check Price', 'Available Brands', 'Contact Us', 'WhatsApp Owner'],
      memory
    };
  }

  // 2. CONTACT / ADDRESS / BUSINESS INFO
  if (lower.includes('address') || lower.includes('location') || lower.includes('where is') || lower.includes('where are you') || lower.includes('shop') || lower.includes('store') || lower.includes('timings') || lower.includes('hours') || lower.includes('phone') || lower.includes('email') || lower.includes('contact') || lower.includes('owner')) {
    return {
      text: `📍 **Bridgestone Rasheed Tyres Planet**\n\n**Address:**\nKG Rd, Vaddla Peta, Atmakur,\nAndhra Pradesh 518422\n\n**Contact:**\n📧 rasheedtyresplanet@gmail.com\n📞 +91 98765 43210\n💬 WhatsApp: +91 9182736329`,
      quickActions: ['WhatsApp Owner', 'Find a Tyre', 'Send Enquiry', 'Available Brands'],
      memory
    };
  }

  // 3. WHATSAPP DIRECT
  if (lower.includes('whatsapp') || lower.includes('chat with owner')) {
    return {
      text: `You can reach our store owner directly on WhatsApp at **+91 9182736329** for instant assistance or special orders.`,
      quickActions: ['WhatsApp Owner', 'Find a Tyre', 'Send Enquiry'],
      memory
    };
  }

  // 4. SEND ENQUIRY INTENT
  if (lower.includes('send enquiry') || lower.includes('make enquiry') || lower.includes('book tyre') || lower.includes('enquiry form') || lower === 'enquire') {
    return {
      text: `Please fill out your contact details below to send an enquiry directly to our store team:`,
      enquiryForm: true,
      selectedProduct: memory.currentProduct || null,
      memory
    };
  }

  // Fetch product catalog
  let allProducts = [];
  try {
    allProducts = await fetchCachedProducts();
  } catch (err) {
    return {
      text: "I'm unable to check our live inventory right now. Please try again or contact us on WhatsApp.",
      quickActions: ['WhatsApp Owner', 'Contact Us'],
      memory
    };
  }

  const availableBrands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean))).sort();

  // 5. AVAILABLE BRANDS INTENT
  if (lower.includes('brands') || lower.includes('brand list') || lower.includes('what brand') || lower.includes('which brand')) {
    const brandListStr = availableBrands.map(b => `• ${b}`).join('\n');
    return {
      text: `We carry genuine tyres from leading brands in our store:\n\n${brandListStr}\n\nWhich brand would you like to explore?`,
      quickActions: availableBrands.slice(0, 5),
      memory
    };
  }

  // Extract entities from input
  const extractedBrand = detectBrand(input, availableBrands);
  const extractedVehicle = detectVehicleType(input);
  const extractedSize = extractSizePattern(input);
  const extractedBudget = extractBudget(input);
  const extractedQty = extractQuantity(input);

  // Update session memory
  if (extractedBrand) memory.brand = extractedBrand;
  if (extractedVehicle) memory.vehicleType = extractedVehicle;
  if (extractedSize) memory.size = extractedSize;
  if (extractedBudget) memory.budget = extractedBudget;
  if (extractedQty) memory.quantity = extractedQty;

  // Check if referencing current product in memory or mentioning a new product
  const mentionedProduct = findMatchingProduct(input, allProducts);
  if (mentionedProduct) {
    memory.currentProduct = mentionedProduct;
  }
  const currentTargetProduct = memory.currentProduct;

  // 6. LIVE STOCK / QUANTITY CHECK
  const isStockQuery = lower.includes('stock') || lower.includes('available') || lower.includes('availability') || lower.includes('in stock') || lower.includes('how many') || lower.includes('do you have') || (extractedQty && currentTargetProduct);

  if (isStockQuery && currentTargetProduct) {
    // Check fresh stock from Firestore product
    const stockCount = Number(currentTargetProduct.stock) || 0;
    const qty = extractedQty || memory.quantity;

    if (stockCount === 0) {
      const alternatives = findAlternatives(currentTargetProduct, allProducts);
      return {
        text: `Sorry, **${currentTargetProduct.name}** is currently **Out of Stock**.\n\nHere are the closest available alternatives in our inventory:`,
        products: [currentTargetProduct],
        alternatives: alternatives,
        quickActions: ['Send Enquiry', 'WhatsApp Owner', 'Find a Tyre'],
        memory
      };
    }

    if (qty) {
      if (stockCount >= qty) {
        return {
          text: `Yes ✅ **${qty}** units of **${currentTargetProduct.name}** are currently available in stock (Total stock: **${stockCount}** units @ ₹${currentTargetProduct.price} each).`,
          products: [currentTargetProduct],
          quickActions: ['Send Enquiry', 'WhatsApp Owner', 'Check Another Tyre'],
          memory
        };
      } else {
        return {
          text: `We currently have only **${stockCount}** units of **${currentTargetProduct.name}** available (you requested ${qty}).`,
          products: [currentTargetProduct],
          quickActions: ['Send Enquiry', 'WhatsApp Owner', 'Find Alternatives'],
          memory
        };
      }
    }

    // General stock answer
    const stockMsg = stockCount > 5 
      ? `Yes ✅ We currently have **${stockCount}** units of **${currentTargetProduct.name}** in stock at ₹${currentTargetProduct.price}.`
      : `We currently have only **${stockCount}** units left in stock for **${currentTargetProduct.name}** (Low Stock).`;

    return {
      text: stockMsg,
      products: [currentTargetProduct],
      quickActions: ['Send Enquiry', 'WhatsApp Owner', 'Check Another Tyre'],
      memory
    };
  }

  // 7. PRICE QUESTIONS
  const isPriceQuery = lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('mrp') || lower.includes('discount') || lower.includes('rate');
  if (isPriceQuery && currentTargetProduct) {
    const mrpStr = currentTargetProduct.mrp ? ` (MRP: ₹${currentTargetProduct.mrp}${currentTargetProduct.discount ? `, ${currentTargetProduct.discount}% OFF` : ''})` : '';
    const stockStatusStr = currentTargetProduct.stock > 0 ? `In Stock (${currentTargetProduct.stock} units)` : 'Out of Stock';

    return {
      text: `**${currentTargetProduct.name}**\n• Price: **₹${currentTargetProduct.price}**${mrpStr}\n• Brand: **${currentTargetProduct.brand}**\n• Size: **${currentTargetProduct.size || 'Standard'}**\n• Status: **${stockStatusStr}**`,
      products: [currentTargetProduct],
      quickActions: ['Check Stock', 'Send Enquiry', 'WhatsApp Owner'],
      memory
    };
  }

  // 8. GUIDED FIND A TYRE / RECOMMENDATION INTENT
  if (lower === 'find a tyre' || lower === 'find tyres' || lower === 'recommend a tyre' || lower === 'suggest a tyre') {
    return {
      text: "Let's find the perfect tyre for you! Please select your vehicle type:",
      quickActions: ['Bike Tyres', 'Car Tyres', 'Auto Tyres', 'Lorry Tyres'],
      memory
    };
  }

  // 9. FILTER & SEARCH PRODUCTS USING REAL FIRESTORE DATA
  let filtered = [...allProducts];

  // Brand filter (from query or memory)
  if (memory.brand) {
    filtered = filtered.filter(p => p.brand && p.brand.toLowerCase() === memory.brand.toLowerCase());
  }

  // Vehicle filter (from query or memory)
  if (memory.vehicleType) {
    filtered = filtered.filter(p => {
      const v = (p.vehicleType || p.category || '').toLowerCase();
      return v.includes(memory.vehicleType.toLowerCase());
    });
  }

  // Size filter (from query or memory)
  if (memory.size) {
    const targetSize = memory.size.replace(/\s+/g, '').toLowerCase();
    filtered = filtered.filter(p => p.size && p.size.replace(/\s+/g, '').toLowerCase().includes(targetSize));
  }

  // Budget filter (from query or memory)
  if (memory.budget) {
    if (memory.budget.minPrice !== undefined) {
      filtered = filtered.filter(p => Number(p.price) >= memory.budget.minPrice);
    }
    if (memory.budget.maxPrice !== undefined && memory.budget.maxPrice !== Infinity) {
      filtered = filtered.filter(p => Number(p.price) <= memory.budget.maxPrice);
    }
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  }

  // Keyword filter if specific terms exist
  if (!extractedBrand && !extractedVehicle && !extractedSize && !extractedBudget) {
    const searchTerms = lower.replace(/[?,.!]/g, '').split(/\s+/).filter(w => w.length > 2 && !['show', 'need', 'have', 'want', 'tyre', 'tyres', 'please', 'tell', 'give', 'about'].includes(w));
    if (searchTerms.length > 0) {
      filtered = filtered.filter(p => {
        const textToSearch = `${p.name || ''} ${p.brand || ''} ${p.size || ''} ${p.category || ''} ${p.vehicleType || ''} ${p.sku || ''}`.toLowerCase();
        return searchTerms.some(term => textToSearch.includes(term));
      });
    }
  }

  if (filtered.length > 0) {
    // Pick the most relevant results
    const results = filtered.slice(0, 4);
    if (results.length === 1) {
      memory.currentProduct = results[0];
    }

    // Build smart descriptive context response
    let desc = "Here are matching tyres from our live inventory:";
    const contextParts = [];
    if (memory.brand) contextParts.push(memory.brand);
    if (memory.vehicleType) contextParts.push(memory.vehicleType);
    if (memory.size) contextParts.push(memory.size);
    if (memory.budget) {
      if (memory.budget.maxPrice !== Infinity) {
        contextParts.push(`under ₹${memory.budget.maxPrice}`);
      }
    }

    if (contextParts.length > 0) {
      desc = `Found **${filtered.length}** available **${contextParts.join(' ')}** tyre${filtered.length > 1 ? 's' : ''}:`;
    }

    return {
      text: desc,
      products: results,
      quickActions: ['Send Enquiry', 'WhatsApp Owner', 'Filter by Budget', 'All Brands'],
      memory
    };
  }

  // 10. NO EXACT MATCH FALLBACK -> OFFER CLOSEST IN-STOCK ALTERNATIVES
  const fallbackAlternatives = allProducts
    .filter(p => Number(p.stock) > 0)
    .filter(p => {
      if (memory.vehicleType && p.vehicleType) {
        return p.vehicleType.toLowerCase() === memory.vehicleType.toLowerCase();
      }
      if (memory.brand && p.brand) {
        return p.brand.toLowerCase() === memory.brand.toLowerCase();
      }
      return true;
    })
    .slice(0, 3);

  return {
    text: `I couldn't find an exact match for your search in our current stock.\n\nTry exploring by vehicle, brand, or size, or take a look at these popular in-stock tyres:`,
    products: fallbackAlternatives,
    quickActions: ['Find a Tyre', 'Available Brands', 'Contact Us', 'WhatsApp Owner'],
    memory
  };
};

/**
 * Submit Enquiry from Chatbot to Firestore
 */
export const submitChatbotEnquiry = async ({ name, phone, email, message, product }) => {
  if (!name || !phone) {
    throw new Error('Name and phone number are required.');
  }

  const enquiryData = {
    name: name.trim(),
    phone: phone.trim(),
    email: (email || '').trim(),
    message: message ? message.trim() : 'Customer enquiry submitted via website chatbot.',
    status: 'New',
    source: 'website_chatbot',
    createdAt: new Date().toISOString()
  };

  if (product) {
    enquiryData.productName = product.name || '';
    enquiryData.productId = product._id || '';
    enquiryData.sku = product.sku || '';
    enquiryData.brand = product.brand || '';
  }

  const result = await addEnquiry(enquiryData);
  return result;
};
