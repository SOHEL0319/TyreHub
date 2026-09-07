import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/firestoreService';

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const allProducts = await getProducts();
        // Just grab the first 4 for featured
        setFeaturedProducts(allProducts.slice(0, 4));
      } catch (err) {
        console.error('Failed to load featured products', err);
      }
    }
    loadProducts();
  }, []);

  const fadeUpVariant = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#111111]">
      
      {/* 1. HERO SECTION (FULL-WIDTH VIDEO BACKGROUND) */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] px-4 py-24 sm:px-6 lg:px-8 flex items-center">
        {/* Background Video & Cinematic Atmosphere */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
          {/* Looping Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/videos/v.mp4"
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src="/videos/v.mp4" type="video/mp4" />
          </video>

          {/* Layered Cinematic Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.45)_50%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          
          {/* Subtle Atmospheric Red Glow Accent */}
          <div className="absolute top-0 right-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-[350px] w-[350px] translate-y-1/4 -translate-x-1/4 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />
        </div>

        {/* Hero Content (Over Background Video) */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer} 
              className="text-left"
            >
              <motion.div variants={fadeUpVariant} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-4 py-2 text-xs font-bold tracking-widest text-white/90 uppercase shadow-lg">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                Premium Tyre Solutions
              </motion.div>
              
              <motion.h1 variants={fadeUpVariant} className="text-4xl font-extrabold uppercase leading-tight tracking-[0.05em] text-white sm:text-6xl lg:text-7xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                Drive Safer.<br />
                <span className="text-red-500 drop-shadow-[0_4px_20px_rgba(239,68,68,0.4)]">Grip Better.</span>
              </motion.h1>
              
              <motion.p variants={fadeUpVariant} className="mt-6 max-w-xl text-base font-normal text-white/90 sm:text-lg lg:text-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-relaxed">
                Premium tyre solutions for bikes, cars, autos and lorries from Atmakur, Andhra Pradesh.
              </motion.p>
              
              <motion.div variants={fadeUpVariant} className="mt-10 flex flex-col items-stretch sm:items-center sm:flex-row gap-4">
                <Link to="/tyres" className="w-full sm:w-auto text-center rounded-full bg-red-600 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-1 hover:bg-red-500 hover:shadow-[0_10px_25px_rgba(220,38,38,0.4)] active:scale-95">
                  Explore Tyres
                </Link>
                <Link to="/contact" className="w-full sm:w-auto text-center rounded-full border border-white/30 bg-black/40 backdrop-blur-sm px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-1 hover:border-white hover:bg-white hover:text-black active:scale-95">
                  Contact Us
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. SERVICE STRIP */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { title: 'BIKE TYRES', description: 'Reliable grip for everyday riding.', icon: '🏍️', to: '/category/bike' },
            { title: 'CAR TYRES', description: 'Comfort, control and road confidence.', icon: '🚗', to: '/category/car' },
            { title: 'AUTO TYRES', description: 'Durable tyres for everyday commercial use.', icon: '🛺', to: '/category/auto' },
            { title: 'LORRY TYRES', description: 'Built for heavy loads and long routes.', icon: '🚚', to: '/category/lorry' },
          ].map((item) => (
            <motion.div 
              key={item.title} 
              variants={fadeUpVariant}
              className="h-full"
            >
              <Link
                to={item.to}
                className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/40 hover:shadow-[0_10px_30px_rgba(220,38,38,0.2)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-300 group-hover:bg-red-500/15" />
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-white/10 text-xl transition-transform duration-300 group-hover:scale-110 group-hover:border-red-500/30">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white group-hover:text-red-500 transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-xs text-white/40 group-hover:text-red-500 transition-all transform group-hover:translate-x-1">→</span>
                  </h3>
                  <p className="mt-2 text-sm text-white/50 group-hover:text-white/70 transition-colors">{item.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. FEATURED TYRES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
          className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-6"
        >
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-widest text-white">Featured Tyres</h2>
            <p className="mt-2 text-sm text-white/50">Popular tyre solutions from trusted brands.</p>
          </div>
          <Link to="/tyres" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-red-500 hover:text-white transition-colors">
            View All Tyres <span className="ml-2">→</span>
          </Link>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((tyre) => (
              <motion.article 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }}
                variants={fadeUpVariant}
                key={tyre._id} 
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1a] transition-all hover:border-white/20 hover:shadow-2xl"
              >
                <div className="flex h-48 items-center justify-center bg-black/50 p-6">
                  <img
                    src={tyre.image || '/tyres/bridgestone-turanza.jpg'}
                    alt={tyre.name}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/tyres/bridgestone-turanza.jpg'; }}
                  />
                </div>
                <div className="p-5 border-t border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{tyre.brand}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${tyre.stock > 5 ? 'bg-green-500/10 text-green-400' : tyre.stock > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tyre.stock > 5 ? 'In Stock' : tyre.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <h3 className="font-bold text-white truncate">{tyre.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-red-500">₹{tyre.price}</span>
                  </div>
                  <div className="mt-4">
                    <Link to="/contact" state={{ product: tyre }} className="block w-full text-center rounded-xl bg-red-500/10 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white uppercase tracking-wider">
                      ENQUIRE NOW
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
             <div className="col-span-full py-12 text-center text-white/40 border border-white/5 rounded-2xl bg-[#1a1a1a]">
               Loading featured products...
             </div>
          )}
        </div>
      </section>

      {/* 4. TRUSTED BRANDS */}
      <section className="border-y border-white/5 bg-[#0a0a0a] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-10">Trusted Brands</h2>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 lg:gap-24 opacity-60">
            {['MRF', 'CEAT', 'Apollo Tyres', 'JK Tyre', 'Bridgestone'].map(brand => (
              <span key={brand} className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider transition-opacity hover:opacity-100 cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA & LOCATION */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 md:p-12 overflow-hidden relative">
          {/* Accent blob */}
          <div className="absolute top-0 right-0 h-[300px] w-[300px] -translate-y-1/2 translate-x-1/2 rounded-full bg-red-600/10 blur-[80px] pointer-events-none" />

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="flex flex-col justify-center relative z-10"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-4">
              Need the right tyre?
            </h2>
            <p className="text-white/60 mb-8 max-w-md">
              Talk to Rasheed Tyres Planet for availability, pricing and expert tyre recommendations.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://wa.me/9182736329" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-transform hover:-translate-y-1 active:scale-95">
                WhatsApp Us
              </a>
              <Link to="/contact" className="inline-flex items-center rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-1 hover:bg-white hover:text-black active:scale-95">
                Contact Us
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="relative z-10 flex flex-col justify-center border-t border-white/10 lg:border-t-0 lg:border-l pt-8 lg:pt-0 lg:pl-12"
          >
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl">
              📍
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-2">Location</h3>
            <p className="text-lg font-medium text-white leading-relaxed max-w-sm">
              Bridgestone Rasheed Tyres Planet,<br/>
              KG Rd, Vaddla Peta,<br/>
              Atmakur, Andhra Pradesh 518422
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
