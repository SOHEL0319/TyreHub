import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct, updateProduct } from '../../api/firestoreService';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const statusClasses = (stock) => {
  if (stock === 0) return 'bg-red-500/15 text-red-400 border border-red-500/30';
  if (stock <= 5) return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
  return 'bg-green-500/15 text-green-400 border border-green-500/30';
};

const getStatusLabel = (stock) => {
  if (stock === 0) return 'OUT OF STOCK';
  if (stock <= 5) return 'LOW STOCK';
  return 'IN STOCK';
};

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('all'); // 'all', 'needs-restock', 'in-stock'
  const [sort, setSort] = useState('stock-asc');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchProducts();
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
    }
  };

  const handleStockAdjustment = async (id, adjustment) => {
    try {
      const product = products.find(p => p._id === id);
      if (!product) return;
      const newStock = Math.max(0, (product.stock || 0) + adjustment);
      
      // Optimistic UI update
      setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: newStock } : p));
      
      await updateProduct(id, { stock: newStock });
    } catch (err) {
      console.error(err);
      alert('Failed to update stock.');
      fetchProducts(); // revert on fail
    }
  };

  const stats = useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;
    products.forEach(p => {
      const s = p.stock || 0;
      if (s === 0) outOfStock++;
      else if (s <= 5) lowStock++;
      else inStock++;
    });
    return { outOfStock, lowStock, inStock, total: products.length };
  }, [products]);

  const { needsRestockList, inStockList } = useMemo(() => {
    let filtered = products;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || '').toLowerCase().includes(term) || 
        (p.sku || '').toLowerCase().includes(term) ||
        (p.brand || '').toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case 'stock-asc': return (a.stock || 0) - (b.stock || 0);
        case 'stock-desc': return (b.stock || 0) - (a.stock || 0);
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'brand-asc': return (a.brand || '').localeCompare(b.brand || '');
        case 'price-asc': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        default: return 0;
      }
    });

    return {
      needsRestockList: filtered.filter(p => (p.stock || 0) <= 5),
      inStockList: filtered.filter(p => (p.stock || 0) > 5)
    };
  }, [products, sort, searchTerm]);

  const ProductCard = ({ product }) => (
    <div className="rounded-3xl border border-white/10 bg-black/60 p-5 flex flex-col shadow-xl shadow-black/20 hover:border-white/20 transition h-full">
      
      {/* Image Top */}
      <div className="w-full h-40 shrink-0 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center mb-4 p-4">
        <img 
          src={product.image || '/tyres/bridgestone-turanza.jpg'} 
          alt={product.name} 
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = '/tyres/bridgestone-turanza.jpg'; }}
        />
      </div>
      
      {/* Product Info */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-base font-bold text-white line-clamp-2 min-h-[3rem]" title={product.name}>{product.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold tracking-wider ${statusClasses(product.stock || 0)}`}>
            {getStatusLabel(product.stock || 0)}
          </span>
        </div>
        <p className="text-xs text-white/70 mb-1">{product.brand} • {product.category}</p>
        <p className="text-[10px] text-white/40 font-mono">SKU: {product.sku}</p>
      </div>

      {/* Price & Stock */}
      <div className="flex justify-between items-center text-sm border-y border-white/5 py-4 my-4">
        <div className="text-white font-semibold">
          ₹{product.price}
          {product.mrp && <span className="block text-white/30 font-normal text-[10px] line-through">MRP: ₹{product.mrp}</span>}
        </div>
        <div className="text-right flex flex-col items-end">
          <span className={`font-bold text-xl leading-none ${product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-yellow-400' : 'text-white'}`}>
            {product.stock || 0}
          </span>
          <span className="text-white/40 text-[10px] uppercase tracking-wider mt-1">Current Stock</span>
        </div>
      </div>

      {/* Action Row */}
      <div className="grid grid-cols-4 gap-2 mt-auto">
        <button onClick={() => handleStockAdjustment(product._id, 5)} className="rounded-xl border border-white/10 bg-white/5 py-2 px-1 text-[10px] sm:text-xs font-semibold text-white transition hover:bg-white/10 text-center truncate">
          +5
        </button>
        <button onClick={() => handleStockAdjustment(product._id, -5)} className="rounded-xl border border-white/10 bg-white/5 py-2 px-1 text-[10px] sm:text-xs font-semibold text-white transition hover:bg-white/10 text-center truncate">
          -5
        </button>
        <button onClick={() => navigate(`/admin/product/${product._id}/edit`)} className="rounded-xl bg-primary/20 py-2 px-1 text-[10px] sm:text-xs font-semibold text-primary transition hover:bg-primary/30 text-center truncate">
          Edit
        </button>
        <button onClick={() => handleDelete(product._id)} className="rounded-xl bg-red-500/10 py-2 px-1 text-[10px] sm:text-xs font-semibold text-red-400 transition hover:bg-red-500/20 text-center truncate">
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) return <p className="text-white/70">Loading products...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="w-full space-y-6">
      
      {/* 1. MAIN HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider leading-tight">Product Management</h2>
          <p className="text-sm text-white/50 mt-1">Inventory control and stock priority</p>
        </div>
        <button onClick={() => navigate('/admin/product/new')} className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-white active:scale-95">
          + Add Product
        </button>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="flex flex-col justify-between rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-xl h-full">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Out of Stock</p>
          <p className="text-3xl font-bold text-red-400 leading-none">{stats.outOfStock}</p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 shadow-xl h-full">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-4">Low Stock</p>
          <p className="text-3xl font-bold text-yellow-400 leading-none">{stats.lowStock}</p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-green-500/20 bg-green-500/5 p-6 shadow-xl h-full">
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4">Total In Stock</p>
          <p className="text-3xl font-bold text-green-400 leading-none">{stats.inStock}</p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl h-full">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Total Products</p>
          <p className="text-3xl font-bold text-white leading-none">{stats.total}</p>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/60 p-4 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setFilter('all')} className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${filter === 'all' ? 'bg-white text-black' : 'border border-white/10 bg-transparent text-white hover:bg-white/10'}`}>
            All
          </button>
          <button onClick={() => setFilter('needs-restock')} className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${filter === 'needs-restock' ? 'bg-red-500 text-white' : 'border border-white/10 bg-transparent text-white hover:bg-white/10'}`}>
            Needs Restock
          </button>
          <button onClick={() => setFilter('in-stock')} className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${filter === 'in-stock' ? 'bg-green-500 text-white' : 'border border-white/10 bg-transparent text-white hover:bg-white/10'}`}>
            In Stock
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[200px] rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white outline-none focus:border-primary"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full sm:w-auto rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white outline-none focus:border-primary">
            <option value="stock-asc">Stock: Low → High</option>
            <option value="stock-desc">Stock: High → Low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="brand-asc">Brand: A → Z</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Product Sections */}
      <div className="space-y-10">
        {(filter === 'all' || filter === 'needs-restock') && (
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Needs Restocking</h3>
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">{needsRestockList.length} Items</span>
            </div>
            {needsRestockList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-white/50">
                All products are sufficiently stocked.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {needsRestockList.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </section>
        )}

        {(filter === 'all' || filter === 'in-stock') && (
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">In Stock</h3>
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">{inStockList.length} Items</span>
            </div>
            {inStockList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-white/50">
                No products are currently in stock.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {inStockList.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </section>
        )}
      </div>

    </div>
  );
}
