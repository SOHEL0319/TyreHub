import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { getProducts } from '../api/firestoreService';

const vehicleTypes = ['All', 'Bike', 'Car', 'Auto', 'Lorry'];
const DEFAULT_IMAGE = '/tyres/bridgestone-turanza.jpg';

function normalizeParam(val) {
  if (!val) return 'All';
  const lower = val.toLowerCase().trim();
  if (lower.includes('lorry') || lower.includes('truck') || lower.includes('commercial') || lower.includes('heavy')) return 'Lorry';
  if (lower.includes('bike') || lower.includes('motorcycle') || lower.includes('scooter') || lower.includes('two-wheeler')) return 'Bike';
  if (lower.includes('car') || lower.includes('four-wheeler')) return 'Car';
  if (lower.includes('auto') || lower.includes('three-wheeler') || lower.includes('rickshaw')) return 'Auto';
  return 'All';
}

export default function TyresPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const paramCategory = searchParams.get('category') || searchParams.get('vehicleType') || location.state?.vehicleType;
  const initialCategory = normalizeParam(paramCategory);

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vehicleType: initialCategory,
    brand: '',
    size: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    sort: ''
  });

  useEffect(() => {
    if (paramCategory) {
      setFilters(prev => ({ ...prev, vehicleType: normalizeParam(paramCategory) }));
    }
  }, [paramCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setAllProducts(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleResetFilters = () => {
    setFilters({
      vehicleType: 'All',
      brand: '',
      size: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sort: ''
    });
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (filters.vehicleType && filters.vehicleType !== 'All') {
      const vTarget = filters.vehicleType.toLowerCase().trim();
      result = result.filter(p => {
        const pVehicle = (p.vehicleType || '').toLowerCase().trim();
        const pCategory = (p.category || '').toLowerCase().trim();
        if (vTarget === 'lorry') {
          return (
            pVehicle === 'lorry' ||
            pVehicle === 'truck' ||
            pVehicle === 'commercial' ||
            pCategory.includes('lorry') ||
            pCategory.includes('truck') ||
            pCategory.includes('commercial')
          );
        }
        return pVehicle === vTarget || pCategory.includes(vTarget);
      });
    }

    if (filters.brand) {
      result = result.filter(p => (p.brand || '').toLowerCase().includes(filters.brand.toLowerCase()));
    }

    if (filters.size) {
      const searchSize = filters.size.replace(/\s+/g, '').toLowerCase();
      result = result.filter(p => (p.size || '').replace(/\s+/g, '').toLowerCase().includes(searchSize));
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(p => 
        (p.name || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.size || '').toLowerCase().includes(term)
      );
    }

    if (filters.minPrice) {
      result = result.filter(p => Number(p.price) >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter(p => Number(p.price) <= Number(filters.maxPrice));
    }

    if (filters.sort === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filters.sort === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (filters.sort === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [allProducts, filters]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-white">Tyre Catalog</h1>
          <p className="mt-1 text-sm text-white/60">
            Browse authentic tyres by vehicle type, brand, size, and stock availability.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name, brand, or SKU..."
            className="w-full rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500 md:w-72"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-xl">
        <select
          name="vehicleType"
          value={filters.vehicleType}
          onChange={handleFilterChange}
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs font-semibold text-white outline-none focus:border-red-500"
        >
          {vehicleTypes.map((v) => (
            <option key={v} value={v}>{v === 'All' ? 'All Vehicles' : `${v} Tyres`}</option>
          ))}
        </select>

        <input
          name="brand"
          value={filters.brand}
          onChange={handleFilterChange}
          placeholder="Brand (e.g. MRF)"
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-red-500 w-32"
        />

        <input
          name="size"
          value={filters.size}
          onChange={handleFilterChange}
          placeholder="Size (e.g. 205/55R16)"
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-red-500 w-36"
        />

        <input
          name="minPrice"
          value={filters.minPrice}
          onChange={handleFilterChange}
          placeholder="Min ₹"
          type="number"
          min="0"
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-red-500 w-24"
        />

        <input
          name="maxPrice"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          placeholder="Max ₹"
          type="number"
          min="0"
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-red-500 w-24"
        />

        <select
          name="sort"
          value={filters.sort}
          onChange={handleFilterChange}
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs font-semibold text-white outline-none focus:border-red-500"
        >
          <option value="">Sort by</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>

        <button
          onClick={handleResetFilters}
          className="ml-auto rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3 text-white/75 py-16 justify-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold uppercase tracking-wider">Loading tyre catalog...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6 text-center">
          <p className="font-semibold">{error}</p>
          <button onClick={fetchProducts} className="mt-3 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold uppercase text-white">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="py-20 text-center rounded-3xl border border-dashed border-white/10 bg-black/40 p-8">
          <p className="text-lg font-bold text-white mb-2">No tyres found</p>
          <p className="text-sm text-white/50 mb-4">Try adjusting or clearing your filters to see more results.</p>
          <button onClick={handleResetFilters} className="rounded-full bg-red-600 px-6 py-2 text-xs font-bold uppercase text-white">
            Clear Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((tyre) => {
          const stockNum = Number(tyre.stock) || 0;
          return (
            <article
              key={tyre._id || tyre.sku}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#161616] shadow-xl transition-all duration-300 hover:border-white/20 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full bg-black/60 p-4 flex items-center justify-center overflow-hidden border-b border-white/5">
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
                  <span className="absolute top-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white/80 border border-white/10 uppercase tracking-wider">
                    {tyre.vehicleType || 'Tyre'}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">{tyre.brand}</p>
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

                  <div className="mt-2 space-y-1 text-xs text-white/60">
                    <p>Size: <span className="font-semibold text-white/90">{tyre.size || 'Standard'}</span></p>
                    <p className="text-[11px] font-mono text-white/40">SKU: {tyre.sku}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mb-4">
                  <div>
                    <span className="text-xl font-extrabold text-white">₹{tyre.price}</span>
                    {tyre.mrp && Number(tyre.mrp) > Number(tyre.price) && (
                      <span className="ml-2 text-xs text-white/40 line-through">₹{tyre.mrp}</span>
                    )}
                  </div>
                  {tyre.discount && Number(tyre.discount) > 0 && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      {tyre.discount}% OFF
                    </span>
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
