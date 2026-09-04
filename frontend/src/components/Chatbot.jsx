import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { processUserMessage, submitChatbotEnquiry } from '../utils/chatbotEngine';

const INITIAL_WELCOME = {
  id: 'welcome',
  sender: 'bot',
  text: "Hello 👋 Welcome to Rasheed Tyres Planet.\n\nHow can I help you today?",
  quickActions: ['Find a Tyre', 'Check Stock', 'Check Price', 'Available Brands', 'Contact Us', 'WhatsApp Owner'],
  timestamp: new Date()
};

export default function Chatbot() {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionMemory, setSessionMemory] = useState({});

  // Enquiry inline form state
  const [enquiryFormVisible, setEnquiryFormVisible] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [enquiryFormData, setEnquiryFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState(null); // 'success' | 'error' | null

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // Handle opening chat
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // Handle closing chat
  const handleClose = () => {
    setIsOpen(false);
  };

  // Handle minimizing chat
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Clear chat conversation
  const handleClearChat = () => {
    setMessages([{ ...INITIAL_WELCOME, id: `welcome-${Date.now()}` }]);
    setSessionMemory({});
    setEnquiryFormVisible(false);
    setEnquiryProduct(null);
    setEnquiryStatus(null);
  };

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Process with chatbot engine
    try {
      // Simulate natural thinking delay (300-500ms)
      await new Promise(r => setTimeout(r, prefersReducedMotion ? 50 : 350));
      
      const response = await processUserMessage(text, sessionMemory);
      
      // Update memory
      if (response.memory) {
        setSessionMemory(response.memory);
      }

      // Check if response opened enquiry form
      if (response.enquiryForm) {
        setEnquiryFormVisible(true);
        setEnquiryProduct(response.selectedProduct || sessionMemory.currentProduct || null);
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        products: response.products || [],
        alternatives: response.alternatives || [],
        quickActions: response.quickActions || [],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I'm having trouble retrieving live stock information at this moment. Please try again or reach out on WhatsApp.",
        quickActions: ['WhatsApp Owner', 'Contact Us'],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'WhatsApp Owner') {
      window.open('https://wa.me/9182736329', '_blank');
      return;
    }
    if (action === 'Contact Us') {
      navigate('/contact');
      return;
    }
    if (action === 'Send Enquiry') {
      setEnquiryFormVisible(true);
      setEnquiryProduct(sessionMemory.currentProduct || null);
      return;
    }
    handleSendMessage(action);
  };

  const handleProductWhatsApp = (product) => {
    const text = `Hello, I am interested in:\n\nProduct: ${product.name}\nBrand: ${product.brand || 'TyreHub'}\nSKU: ${product.sku || 'N/A'}\nPrice: ₹${product.price}\n\nPlease provide availability details.`;
    const url = `https://wa.me/9182736329?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleProductEnquire = (product) => {
    setEnquiryProduct(product);
    setEnquiryFormVisible(true);
  };

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryFormData.name.trim() || !enquiryFormData.phone.trim()) {
      setEnquiryStatus('Please fill in your name and phone number.');
      return;
    }

    setEnquiryLoading(true);
    setEnquiryStatus(null);

    try {
      await submitChatbotEnquiry({
        name: enquiryFormData.name,
        phone: enquiryFormData.phone,
        email: enquiryFormData.email,
        message: enquiryFormData.message,
        product: enquiryProduct
      });

      setEnquiryStatus('success');
      setEnquiryFormData({ name: '', phone: '', email: '', message: '' });
      
      // Add confirmation to chat
      setMessages(prev => [
        ...prev,
        {
          id: `bot-enq-${Date.now()}`,
          sender: 'bot',
          text: `✅ Thank you, **${enquiryFormData.name}**! Your enquiry has been received by our store team.\n\nWe will get in touch with you shortly at **${enquiryFormData.phone}**.`,
          quickActions: ['WhatsApp Owner', 'Find Another Tyre', 'Check Stock'],
          timestamp: new Date()
        }
      ]);

      setTimeout(() => {
        setEnquiryFormVisible(false);
        setEnquiryStatus(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit enquiry from chatbot:', err);
      setEnquiryStatus('Failed to submit enquiry. Please try again or WhatsApp us.');
    } finally {
      setEnquiryLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <motion.button
          onClick={handleOpen}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
          whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 rounded-full bg-red-600 px-5 py-3.5 text-white font-bold shadow-[0_10px_25px_rgba(220,38,38,0.5)] border border-red-500/40 hover:bg-red-500 transition-all group"
          aria-label="Open customer chat"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="text-xl">💬</span>
          <span className="text-sm font-bold tracking-wide uppercase">Chat with us</span>

          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-red-600 shadow">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Modern Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
            className={`fixed z-50 flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#121212] text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl ${
              isMinimized 
                ? 'bottom-5 right-5 sm:bottom-6 sm:right-6 w-80 h-16' 
                : 'bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[410px] h-[580px] max-h-[90vh]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#1e1e1e] via-[#1a1a1a] to-[#240a0a] px-4 py-3.5 select-none">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600/20 border border-red-500/40 text-sm">
                  🏎️
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#121212]" />
                </div>
                <div>
                  <h2 className="text-xs font-bold tracking-wider uppercase text-white">TYREHUB ASSISTANT</h2>
                  <p className="flex items-center gap-1.5 text-[10px] font-medium text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online • Live Inventory
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear chat"
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition text-xs"
                >
                  🗑️
                </button>
                <button
                  onClick={handleMinimize}
                  title={isMinimized ? "Expand" : "Minimize"}
                  className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition font-mono text-sm leading-none"
                >
                  {isMinimized ? '□' : '—'}
                </button>
                <button
                  onClick={handleClose}
                  title="Close chat"
                  className="rounded-lg p-1.5 text-white/50 hover:bg-red-600/30 hover:text-red-400 transition text-sm leading-none font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-white/10">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md leading-relaxed whitespace-pre-wrap ${
                          msg.sender === 'user'
                            ? 'bg-red-600 text-white rounded-br-none'
                            : 'bg-white/10 text-white/95 border border-white/5 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Render Products (if returned by bot) */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-3 w-full space-y-2.5">
                          {msg.products.map((prod) => (
                            <div
                              key={prod._id || prod.sku}
                              className="rounded-2xl border border-white/10 bg-black/60 p-3 shadow-lg flex gap-3 items-center transition hover:border-red-500/30"
                            >
                              <img
                                src={prod.image || '/tyres/bridgestone-turanza.jpg'}
                                alt={prod.name}
                                onError={(e) => { e.target.onerror = null; e.target.src = '/tyres/bridgestone-turanza.jpg'; }}
                                className="h-16 w-16 rounded-xl object-contain bg-white/5 p-1 border border-white/5 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-white truncate">{prod.name}</h4>
                                <p className="text-[11px] text-white/60 truncate">{prod.brand} • {prod.size || 'Standard'}</p>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-red-400">₹{prod.price}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    Number(prod.stock) > 5 ? 'bg-green-500/20 text-green-400' :
                                    Number(prod.stock) > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {Number(prod.stock) > 5 ? `In Stock (${prod.stock})` :
                                     Number(prod.stock) > 0 ? `Only ${prod.stock} left` :
                                     'Out of Stock'}
                                  </span>
                                </div>
                                <div className="mt-2 flex gap-1.5">
                                  <button
                                    onClick={() => handleProductEnquire(prod)}
                                    className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 py-1 text-[10px] font-bold text-white transition text-center"
                                  >
                                    Enquire
                                  </button>
                                  <button
                                    onClick={() => handleProductWhatsApp(prod)}
                                    className="flex-1 rounded-lg bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white py-1 text-[10px] font-bold transition text-center border border-green-500/30"
                                  >
                                    WhatsApp
                                  </button>
                                  <Link
                                    to="/tyres"
                                    onClick={handleClose}
                                    className="rounded-lg bg-white/5 hover:bg-white/10 px-2 py-1 text-[10px] font-bold text-white/70 transition"
                                  >
                                    View
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Alternatives (if out of stock) */}
                      {msg.alternatives && msg.alternatives.length > 0 && (
                        <div className="mt-3 w-full space-y-2">
                          <p className="text-[11px] font-bold uppercase text-yellow-400 tracking-wider">Available In-Stock Alternatives:</p>
                          {msg.alternatives.map((alt) => (
                            <div
                              key={alt._id || alt.sku}
                              className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-2.5 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{alt.name}</p>
                                <p className="text-[10px] text-white/60">{alt.brand} • {alt.size} • ₹{alt.price}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => handleProductEnquire(alt)}
                                  className="rounded-lg bg-yellow-500/20 hover:bg-yellow-500 text-yellow-300 hover:text-black px-2 py-1 text-[10px] font-bold transition"
                                >
                                  Enquire
                                </button>
                                <button
                                  onClick={() => handleProductWhatsApp(alt)}
                                  className="rounded-lg bg-green-500/20 hover:bg-green-600 text-green-400 hover:text-white px-2 py-1 text-[10px] font-bold transition"
                                >
                                  WhatsApp
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Chips */}
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {msg.quickActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(action)}
                              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90 transition hover:border-red-500 hover:bg-red-600 hover:text-white active:scale-95"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="mt-1 text-[9px] text-white/40">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-3 w-16 rounded-bl-none border border-white/5">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}

                  {/* Embedded Enquiry Form Modal/Card */}
                  {enquiryFormVisible && (
                    <div className="rounded-2xl border border-red-500/30 bg-black/80 p-4 shadow-xl">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">
                          {enquiryProduct ? `Enquire: ${enquiryProduct.name}` : 'Send Customer Enquiry'}
                        </h4>
                        <button
                          onClick={() => setEnquiryFormVisible(false)}
                          className="text-white/50 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {enquiryProduct && (
                        <div className="mb-3 rounded-lg bg-white/5 p-2 text-[11px] text-white/70 border border-white/5">
                          <span className="font-bold text-white">{enquiryProduct.brand}</span> • {enquiryProduct.size} • ₹{enquiryProduct.price}
                        </div>
                      )}

                      <form onSubmit={handleSubmitEnquiry} className="space-y-2.5">
                        {enquiryStatus && enquiryStatus !== 'success' && (
                          <p className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{enquiryStatus}</p>
                        )}
                        {enquiryStatus === 'success' && (
                          <p className="text-[11px] text-green-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20">Enquiry sent successfully!</p>
                        )}

                        <input
                          type="text"
                          placeholder="Your Name *"
                          required
                          value={enquiryFormData.name}
                          onChange={(e) => setEnquiryFormData({ ...enquiryFormData, name: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number *"
                          required
                          value={enquiryFormData.phone}
                          onChange={(e) => setEnquiryFormData({ ...enquiryFormData, phone: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                        />
                        <input
                          type="email"
                          placeholder="Email Address (Optional)"
                          value={enquiryFormData.email}
                          onChange={(e) => setEnquiryFormData({ ...enquiryFormData, email: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                        />
                        <textarea
                          placeholder="Message or specific tyre requirement..."
                          rows="2"
                          value={enquiryFormData.message}
                          onChange={(e) => setEnquiryFormData({ ...enquiryFormData, message: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                        />

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEnquiryFormVisible(false)}
                            className="flex-1 rounded-xl border border-white/15 bg-transparent py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={enquiryLoading}
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                          >
                            {enquiryLoading ? 'Submitting...' : 'Submit Enquiry'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 border-t border-white/10 bg-[#161616] p-3"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none focus:border-red-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-bold transition hover:bg-red-500 disabled:opacity-40 active:scale-95 shrink-0"
                    aria-label="Send message"
                  >
                    ➤
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
