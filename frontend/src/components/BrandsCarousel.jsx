import React from 'react';
import { motion } from 'framer-motion';

const brands = [
  { id: 'mrf', name: 'MRF', color: '#e10600' },
  { id: 'ceat', name: 'CEAT', color: '#c41c1c' },
  { id: 'apollo', name: 'Apollo Tyres', color: '#ff2d00' },
  { id: 'jk', name: 'JK Tyre', color: '#d32f2f' },
  { id: 'bridgestone', name: 'Bridgestone', color: '#b71c1c' },
];

function LogoPill({ name, color }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div className="mx-4 flex h-20 w-40 items-center justify-center rounded-xl bg-white/5 px-4 py-3 shadow-md">
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="64" height="48" rx="8" fill={color} />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="18" fill="#fff" fontWeight="700">{initials}</text>
      </svg>
    </div>
  );
}

export default function BrandsCarousel() {
  // duplicate items for seamless loop
  const items = [...brands, ...brands];

  return (
    <section className="mt-12 w-full border-t border-white/5 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Popular Brands</h3>
          <p className="text-sm text-white/60">Trusted names in tyres</p>
        </div>
        <div className="relative overflow-hidden">
          <motion.div
            className="flex items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          >
            {items.map((b, idx) => (
              <div key={`${b.id}-${idx}`} className="flex-shrink-0">
                <LogoPill name={b.name} color={b.color} />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
