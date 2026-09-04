import React from 'react';
import { motion } from 'framer-motion';

const brands = [
  {
    id: 'mrf',
    name: 'MRF',
    color: '#e10600',
    description: 'Industry-leading tyres engineered for performance and endurance.',
  },
  {
    id: 'ceat',
    name: 'CEAT',
    color: '#c41c1c',
    description: 'Trusted for safety and value across every road condition.',
  },
  {
    id: 'apollo',
    name: 'Apollo Tyres',
    color: '#ff2d00',
    description: 'Advanced technology for superior grip and ride comfort.',
  },
  {
    id: 'jk',
    name: 'JK Tyre',
    color: '#d32f2f',
    description: 'Durable tyres designed for long life and consistent performance.',
  },
  {
    id: 'bridgestone',
    name: 'Bridgestone',
    color: '#b71c1c',
    description: 'Global premium tyres engineered for safety and control.',
  },
];

function BrandLogo({ name, color }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/5 shadow-sm">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={name}>
        <rect width="56" height="56" rx="8" fill={color} />
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="20" fill="#fff" fontWeight="700">{initials}</text>
      </svg>
    </div>
  );
}

export default function BrandsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold text-white">Top Tyre Brands Available at Rasheed Tyres Planet</h2>
        <p className="mt-3 text-white/70">Trusted brands for safety, durability, and peak performance.</p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {brands.map((b) => (
          <motion.article
            key={b.id}
            whileHover={{ y: -10, scale: 1.03 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl"
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center rounded-lg bg-white/5 shadow-sm">
                <BrandLogo name={b.name} color={b.color} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{b.name}</h3>
                <p className="mt-1 text-sm text-white/70">{b.description}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <a href="/tyres" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black transition hover:opacity-95">Browse Tyres</a>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
