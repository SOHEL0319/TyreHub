import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../api/firestoreService';

const categoryDescriptions = {
  Bike: 'Premium motorcycle & scooter tyres designed for superior cornering grip, wet traction, and daily city riding.',
  Car: 'High-performance passenger car tyres engineered for comfort, low road noise, and highway safety.',
  Auto: 'Durable three-wheeler auto tyres built for heavy urban mileage and commercial reliability.',
  Lorry: 'Heavy-duty truck and commercial lorry tyres constructed for maximum load endurance and long-haul durability.',
};

const vehicleCategories = ['All', 'Bike', 'Car', 'Auto', 'Lorry'];
const DEFAULT_IMAGE = '/tyres/bridgestone-turanza.jpg';

// Helper to normalize category param (e.g. 'lorry', 'Lorry', 'truck' -> 'Lorry')
function normalizeCategory(type) {
  if (!type) return 'Lorry';
  const lower = type.toLowerCase().trim();
  if (lower.includes('lorry') || lower.includes('truck') || lower.includes('commercial') || lower.includes('heavy')) return 'Lorry';
  if (lower.includes('bike') || lower.includes('motorcycle') || lower.includes('scooter') || lower.includes('two-wheeler')) return 'Bike';
  if (lower.includes('car') || lower.includes('four-wheeler')) return 'Car';
  if (lower.includes('auto') || lower.includes('three-wheeler') || lower.includes('rickshaw')) return 'Auto';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function CategoryPage() {
  const { vehicleType: rawVehicleType } = useParams();
  const currentCategory = normalizeCategory(rawVehicleType);
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'all', // 'all', 'in_stock', 'low_stock'
    sort: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts();
        setAllProducts(data || []);
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Unable to load category products. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      brand: '',
      size: '',
      minPrice: '',
      maxPrice: '',
      stockStatus: 'all',
      sort: ''
    });
  };

  // Filter products by current category & active user filters
  const filteredProducts = useMemo(() => {
    // 1. Filter by category
    let result = (allProducts || []).filter(p => {
      const pVehicle = (p.vehicleType || '').toLowerCase().trim();
      const pCategory = (p.category || '').toLowerCase().trim();
      const target = currentCategory.toLowerCase();

      if (target === 'lorry') {
        return (
          pVehicle === 'lorry' ||
          pVehicle === 'truck' ||
          pVehicle === 'commercial' ||
          pCategory.includes('lorry') ||
          pCategory.includes('truck') ||
          pCategory.includes('commercial')
        );
      }
      return pVehicle === target || pCategory.includes(target);
    });

    // 2. Search query filter
    if (filters.search) {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.size || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
      );
    }

    // 3. Brand filter
    if (filters.brand) {
      const b = filters.brand.toLowerCase().trim();
      result = result.filter(p => (p.brand || '').toLowerCase().includes(b));
    }

    // 4. Size filter
    if (filters.size) {
      const s = filters.size.replace(/\s+/g, '').toLowerCase();
      result = result.filter(p => (p.size || '').replace(/\s+/g, '').toLowerCase().includes(s));
    }

    // 5. Price filters
    if (filters.minPrice) {
      result = result.filter(p => Number(p.price) >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(p => Number(p.price) <= Number(filters.maxPrice));
    }

    // 6. Stock status filter
    if (filters.stockStatus === 'in_stock') {
      result = result.filter(p => Number(p.stock) > 0);
    } else if (filters.stockStatus === 'low_stock') {
      result = result.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5);
    }

    // 7. Sorting
    if (filters.sort === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (filters.sort === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (filters.sort === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sort === 'name_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return result;
  }, [allProducts, currentCategory, filters]);

  const categoryDescription = categoryDescriptions[currentCategory] || 'Explore our comprehensive selection of authentic tyre solutions.';

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Category Header Card */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-[#161616] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/tyres" className="text-xs font-semibold text-white/50 hover:text-red-400 transition">
                All Tyres
              </Link>
              <span className="text-xs text-white/30">/</span>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">{currentCategory} Tyres</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-white">
              {currentCategory} Tyres
            </h1>
            <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
              {categoryDescription}
            </p>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} Available
            </span>
          </div>
        </div>

        {/* Vehicle Category Pills */}
        <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-white/10">
          <Link
            to="/tyres"
            className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            All Vehicles
          </Link>
          {vehicleCategories.filter(v => v !== 'All').map(cat => {
            const isActive = cat.toLowerCase() === currentCategory.toLowerCase();
            return (
              <Link
                key={cat}
                to={`/category/${cat.toLowerCase()}`}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat} Tyres
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-xl flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder={`Search ${currentCategory} tyres by name, brand, SKU...`}
            className="w-full rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-red-500 transition"
          />
        </div>

        {/* Brand Filter */}
        <input
          name="brand"
          value={filters.brand}
          onChange={handleFilterChange}
          placeholder="Brand (e.g. Apollo, MRF)"
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-red-500 w-36 sm:w-44"
        />

        {/* Size Filter */}
        <input
          name="size"
          value={filters.size}
          onChange={handleFilterChange}
          placeholder="Size (e.g. 10.00-20)"
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-red-500 w-32 sm:w-36"
        />

        {/* Price Min/Max */}
        <input
          name="minPrice"
          type="number"
          value={filters.minPrice}
          onChange={handleFilterChange}
          placeholder="Min ₹"
          className="rounded-full border border-white/10 bg-[#161616] px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-red-500 w-24"
        />
        <input
          name="maxPrice"
          type="number"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          placeholder="Max ₹"
          className="rounded-full border border-white/10 bg-[#161616] px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-red-500 w-24"
        />

        {/* Stock Filter */}
        <select
          name="stockStatus"
          value={filters.stockStatus}
          onChange={handleFilterChange}
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2.5 text-xs font-semibold text-white outline-none focus:border-red-500"
        >
          <option value="all">All Stock</option>
          <option value="in_stock">In Stock Only</option>
          <option value="low_stock">Low Stock (≤5)</option>
        </select>

        {/* Sort */}
        <select
          name="sort"
          value={filters.sort}
          onChange={handleFilterChange}
          className="rounded-full border border-white/10 bg-[#161616] px-4 py-2.5 text-xs font-semibold text-white outline-none focus:border-red-500"
        >
          <option value="">Sort By</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
        </select>

        {/* Reset Button */}
        {(filters.search || filters.brand || filters.size || filters.minPrice || filters.maxPrice || filters.stockStatus !== 'all' || filters.sort) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-white/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mr-3"></div>
          <span className="text-sm font-semibold uppercase tracking-wider">Loading {currentCategory} tyres...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center mb-6">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="py-20 text-center rounded-3xl border border-dashed border-white/10 bg-black/40 p-8">
          <div className="text-4xl mb-3">🚚</div>
          <p className="text-lg font-bold text-white mb-2">No {currentCategory} Tyres Found Matching Filters</p>
          <p className="text-sm text-white/50 mb-6">Try clearing your search filters or browse all vehicle categories.</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-bold uppercase text-white hover:bg-white/10 transition"
            >
              Clear Filters
            </button>
            <Link
              to="/tyres"
              className="rounded-full bg-red-600 px-6 py-2.5 text-xs font-bold uppercase text-white hover:bg-red-500 transition"
            >
              View Full Catalog
            </Link>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((tyre) => {
          const stockNum = Number(tyre.stock) || 0;
          return (
            <article
              key={tyre._id || tyre.sku}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#161616] shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-red-500/30 hover:-translate-y-1 group"
            >
              <div>
                <div className="h-48 w-full bg-black/60 p-4 flex items-center justify-center overflow-hidden border-b border-white/5 relative">
                  <img
                    src={tyre.image || DEFAULT_IMAGE}
                    alt={tyre.name}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
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
                  <div>
                    <span className="text-xl font-extrabold text-white">₹{tyre.price}</span>
                    {tyre.mrp && Number(tyre.mrp) > Number(tyre.price) && (
                      <span className="text-xs text-white/40 line-through ml-2">MRP ₹{tyre.mrp}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/contact"
                    state={{ product: tyre }}
                    className="block w-full text-center rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2.5 text-xs font-bold uppercase tracking-wider transition border border-red-500/30 active:scale-95"
                  >
                    Enquire
                  </Link>
                  <a
                    href={`https://wa.me/9182736329?text=${encodeURIComponent(`Hello, I want to check availability for:\nProduct: ${tyre.name}\nCategory: ${currentCategory} Tyres\nBrand: ${tyre.brand}\nSize: ${tyre.size}\nPrice: ₹${tyre.price}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center rounded-xl bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white py-2.5 text-xs font-bold uppercase tracking-wider transition border border-green-500/30 active:scale-95"
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
