const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

function getTyreSvg(brand) {
  // A generic tyre-like SVG with the brand text in the center
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <circle cx="100" cy="100" r="90" fill="#1e1e1e" stroke="#333" stroke-width="10" />
    <circle cx="100" cy="100" r="50" fill="#333" stroke="#444" stroke-width="5" />
    <circle cx="100" cy="100" r="30" fill="#111" />
    <!-- Tread patterns -->
    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#222" stroke-width="8" stroke-dasharray="10 10" />
    <path d="M 20 100 A 80 80 0 0 0 180 100" fill="none" stroke="#222" stroke-width="8" stroke-dasharray="10 10" />
    <text x="100" y="105" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">${brand}</text>
  </svg>`;
}

async function migrateImagesLocal() {
  try {
    console.log('Initializing Firebase Admin...');
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'tyrehub-d049a'
    });
    const db = getFirestore(app);

    const outDir = path.resolve(__dirname, '../frontend/public/tyres');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Generate local SVGs
    const brands = ['MRF', 'CEAT', 'Apollo Tyres', 'JK Tyre', 'Bridgestone', 'Generic'];
    const brandFiles = {};
    for (const brand of brands) {
        const safeBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const filename = `${safeBrand}.svg`;
        const filepath = path.join(outDir, filename);
        fs.writeFileSync(filepath, getTyreSvg(brand));
        brandFiles[brand] = `/tyres/${filename}`;
    }

    console.log('Fetching products from Firestore...');
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
        throw new Error("No products found in Firestore!");
    }

    console.log(`Starting local migration for ${snapshot.size} products from Firestore...`);
    let successCount = 0;
    
    for (const doc of snapshot.docs) {
      const product = doc.data();
      const docId = doc.id;
      
      const brand = product.brand || 'Generic';
      // Find the best match local SVG
      let localUrl = brandFiles[brand] || brandFiles['Generic'];
      
      const currentUrl = product.image || '';
      
      // If already migrated, skip unless it's a via.placeholder.com URL
      if (currentUrl.startsWith('/tyres/') && !currentUrl.includes('via.placeholder.com')) {
          console.log(`Skipping ${docId} (already migrated).`);
          continue;
      }

      console.log(`Processing ${docId}... setting local image: ${localUrl}`);

      // Update Firestore
      await db.collection('products').doc(docId).update({
        image: localUrl,
        images: [localUrl]
      });
      console.log(`✅ ${docId} successfully updated with local URL: ${localUrl}`);
      successCount++;
      
      // Small delay
      await new Promise(r => setTimeout(r, 50));
    }

    console.log(`\nMigration complete. Successfully updated ${successCount} products.`);
    process.exit(0);

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  }
}

migrateImagesLocal();
