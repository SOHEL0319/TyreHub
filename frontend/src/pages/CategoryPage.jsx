import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProducts } from '../api/firestoreService';

const categories = {
  Bike: 'Premium bike tyres designed for ultimate cornering grip, wet traction, and daily city riding.',
  Car: 'High-performance passenger car tyres engineered for comfort, low road noise, and highway safety.',
  Auto: 'Durable three-wheeler auto tyres built for heavy urban mileage and commercial reliability.',
  Lorry: 'Heavy-duty truck and commercial lorry tyres constructed for maximum load endurance and long-haul durability.',
};

const DEFAULT_IMAGE = '/tyres/bridgestone-turanza.jpg';

export default function CategoryPage() {
  const { vehicleType } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const allProducts = await getProducts();
        const filtered = (allProducts || []).filter(
          p => (p.vehicleType || '').toLowerCase() === (vehicleType || '').toLowerCase()
        );
        setProducts(filtered);
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Unable to load category products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [vehicleType]);

  const description = categories[vehicleType] || 'Explore our full range of genuine tyre solutions for your vehicle.';

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 rounded-3xl border border-white/10 bg-[#161616] p-8 shadow-2xl">
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Category Catalog</span>
        <h1 className="text-3xl font-extrabold uppercase tracking-wide text-white mt-1">{vehicleType} Tyres</h1>
        <p className="mt-2 text-sm text-white/70 max-w-2xl">{description}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-white/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mr-3"></div>
          <span className="text-sm font-semibold uppercase tracking-wider">Loading {vehicleType} tyres...</span>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center mb-6">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-20 text-center rounded-3xl border border-dashed border-white/10 bg-black/40 p-8">
          <p className="text-lg font-bold text-white mb-2">No {vehicleType} Tyres Found</p>
          <p className="text-sm text-white/50 mb-6">Check our full catalog to explore other vehicle categories.</p>
          <Link to="/tyres" className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold uppercase text-white hover:bg-red-500 transition">
            View All Tyres
          </Link>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((tyre) => {
          const stockNum = Number(tyre.stock) || 0;
          return (
            <article
              key={tyre._id || tyre.sku}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#161616] shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:-translate-y-1"
            >
              <div>
                <div className="h-48 w-full bg-black/60 p-4 flex items-center justify-center overflow-hidden border-b border-white/5">
                  <img
                    src={tyre.image || DEFAULT_IMAGE}
                    alt={tyre.name}
                    className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                  />
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">{tyre.brand}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      stockNum > 5 ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                      stockNum > 0 ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                      'bg-red-500/15 text-red-400 border border-red-500/20'
                    }`}>
                      {stockNum > 5 ? 'In Stock' : stockNum > 0 ? `Low (${stockNum})` : 'Out of Stock'}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white line-clamp-2 min-h-[3rem]" title={tyre.name}>
                    {tyre.name}
                  </h2>

                  <div className="mt-2 text-xs text-white/60">
                    <p>Size: <span className="font-semibold text-white/90">{tyre.size || 'Standard'}</span></p>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mb-4">
                  <span className="text-xl font-extrabold text-white">₹{tyre.price}</span>
                  {tyre.mrp && Number(tyre.mrp) > Number(tyre.price) && (
                    <span className="text-xs text-white/40 line-through">MRP ₹{tyre.mrp}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/contact"
                    state={{ product: tyre }}
                    className="block w-full text-center rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2.5 text-xs font-bold uppercase tracking-wider transition border border-red-500/30"
                  >
                    Enquire
                  </Link>
                  <a
                    href={`https://wa.me/9182736329?text=${encodeURIComponent(`Hello, I want to check availability for:\nProduct: ${tyre.name}\nBrand: ${tyre.brand}\nSize: ${tyre.size}\nPrice: ₹${tyre.price}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center rounded-xl bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white py-2.5 text-xs font-bold uppercase tracking-wider transition border border-green-500/30"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
