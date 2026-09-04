import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, addProduct, updateProduct } from '../api/firestoreService';

const initialState = {
  name: '',
  brand: '',
  category: '',
  vehicleType: 'Bike',
  tyreType: 'Tubeless',
  size: '',
  sku: '',
  mrp: '',
  price: '',
  discount: '',
  stock: '',
  description: '',
  specifications: '',
  warranty: '',
  image: '',
};

export default function ProductFormPage() {
  const [product, setProduct] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        if (data) {
          setProduct({
            ...initialState,
            ...data,
            mrp: data.mrp || '',
            price: data.price || '',
            stock: data.stock || '',
            image: data.image || '',
            discount: data.discount || '',
            specifications: data.specifications || '',
            warranty: data.warranty || '',
            tyreType: data.tyreType || 'Tubeless',
            sku: data.sku || ''
          });
        }
      } catch (err) {
        setError('Unable to load product');
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto calculate discount if mrp and price are entered
      if (name === 'mrp' || name === 'price') {
        const mrpVal = Number(name === 'mrp' ? value : prev.mrp);
        const priceVal = Number(name === 'price' ? value : prev.price);
        if (mrpVal > 0 && priceVal > 0 && mrpVal >= priceVal) {
          updated.discount = Math.round(((mrpVal - priceVal) / mrpVal) * 100);
        } else {
          updated.discount = '';
        }
      }
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate local image picking by assigning the public path
      setProduct((prev) => ({ ...prev, image: `/tyres/${file.name}` }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    const mrp = Number(product.mrp);
    const price = Number(product.price);
    const stock = Number(product.stock);

    if (price < 0 || stock < 0 || mrp < 0) {
      setError('Price, MRP and Stock cannot be negative.');
      return;
    }
    if (mrp > 0 && price > mrp) {
      setError('Selling price cannot exceed MRP.');
      return;
    }
    if (!product.sku) {
      setError('SKU is required.');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: product.name,
        brand: product.brand,
        category: product.category,
        vehicleType: product.vehicleType,
        tyreType: product.tyreType,
        size: product.size,
        sku: product.sku,
        mrp: mrp,
        price: price,
        discount: Number(product.discount) || 0,
        stock: stock,
        description: product.description,
        specifications: product.specifications,
        warranty: product.warranty,
        image: product.image,
      };

      if (id) {
        await updateProduct(id, productData);
        setSuccess('Product updated successfully');
      } else {
        await addProduct(productData);
        setSuccess('Product created successfully');
      }

      setTimeout(() => navigate('/admin/products'), 1000);
    } catch (err) {
      console.error(err);
      setError('Unable to save product');
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = product.image;

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
        <h1 className="text-3xl font-semibold text-white">{id ? 'Edit Product' : 'Add Product'}</h1>
        
        {error && <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-red-400 border border-red-500/20">{error}</div>}
        {success && <div className="mt-4 rounded-xl bg-green-500/10 p-4 text-green-400 border border-green-500/20">{success}</div>}
        
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Product Name *</label>
            <input name="name" value={product.name} onChange={handleChange} required placeholder="e.g. MRF Zapper C" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Brand *</label>
            <select name="brand" value={product.brand} onChange={handleChange} required className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
              <option value="" disabled>Select Brand</option>
              <option value="MRF">MRF</option>
              <option value="CEAT">CEAT</option>
              <option value="Apollo Tyres">Apollo Tyres</option>
              <option value="JK Tyre">JK Tyre</option>
              <option value="Bridgestone">Bridgestone</option>
              <option value="Michelin">Michelin</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Category *</label>
            <select name="category" value={product.category} onChange={handleChange} required className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
              <option value="" disabled>Select Category</option>
              <option value="Bike Tyres">Bike Tyres</option>
              <option value="Car Tyres">Car Tyres</option>
              <option value="Auto Tyres">Auto Tyres</option>
              <option value="Lorry Tyres">Lorry Tyres</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Vehicle Type</label>
            <select name="vehicleType" value={product.vehicleType} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
              <option value="Bike">Bike</option>
              <option value="Car">Car</option>
              <option value="Auto">Auto</option>
              <option value="Lorry">Lorry</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Tyre Type</label>
            <select name="tyreType" value={product.tyreType} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary">
              <option value="Tubeless">Tubeless</option>
              <option value="Tube-type">Tube-type</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Size *</label>
            <input name="size" value={product.size} onChange={handleChange} required placeholder="e.g. 100/90-17" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">SKU *</label>
            <input name="sku" value={product.sku} onChange={handleChange} required placeholder="e.g. MRF-ZAP-001" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">MRP (₹)</label>
            <input name="mrp" value={product.mrp} onChange={handleChange} type="number" min="0" placeholder="e.g. 2500" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Selling Price (₹) *</label>
            <input name="price" value={product.price} onChange={handleChange} required type="number" min="0" placeholder="e.g. 2100" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Discount (%)</label>
            <input name="discount" value={product.discount} onChange={handleChange} type="number" placeholder="Auto-calculated or enter" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Stock *</label>
            <input name="stock" value={product.stock} onChange={handleChange} required type="number" min="0" placeholder="e.g. 50" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Warranty</label>
            <input name="warranty" value={product.warranty} onChange={handleChange} placeholder="e.g. 3 Years Manufacturer Warranty" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Description</label>
            <textarea name="description" value={product.description} onChange={handleChange} rows="3" placeholder="Product overview..." className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Specifications</label>
            <textarea name="specifications" value={product.specifications} onChange={handleChange} rows="3" placeholder="Key technical specs..." className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
          </div>

          <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/80" htmlFor="imageFile">Upload Local Image</label>
              <input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-white/80 file:cursor-pointer file:rounded-full file:border file:border-white/10 file:bg-white/5 file:px-4 file:py-2 file:text-white" />
              <p className="mt-2 text-xs text-white/50">Select a file from public/tyres/ to auto-fill the path, or type it below.</p>
              
              <label className="mt-4 mb-2 block text-sm text-white/80">Image Path</label>
              <input name="image" value={product.image} onChange={handleChange} placeholder="e.g. /tyres/mrf-zapper.jpg" className="w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" />
            </div>

            {previewUrl && (
              <div className="rounded-3xl border border-white/10 bg-black/80 p-4">
                <p className="text-sm text-white/70">Image preview</p>
                <img src={previewUrl} alt="Product preview" className="mt-4 h-48 w-full rounded-2xl object-contain bg-white/5" 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200x200?text=Invalid+Path' }}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <button type="button" onClick={() => navigate('/admin/products')} className="rounded-full border border-white/20 px-6 py-3 text-sm text-white transition hover:bg-white/10">
              Cancel
            </button>
            <button disabled={loading} type="submit" className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50">
              {loading ? 'Saving…' : id ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
