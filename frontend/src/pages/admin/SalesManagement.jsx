import { useEffect, useState, useRef, useMemo } from 'react';
import { getSales, bulkAddSales, addSale, deleteSale, getProducts, updateProduct, updateSale } from '../../api/firestoreService';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SalesAnalytics from '../../components/admin/SalesAnalytics';

export default function SalesManagement() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CSV Upload States
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [validationStats, setValidationStats] = useState(null);
  const fileInputRef = useRef(null);

  // Direct Sale States
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [form, setForm] = useState({
    productId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Power BI Style Slicer State
  const [filters, setFilters] = useState({
    dateRange: '30days', // 7days, 30days, 3months, 1year, all
    brand: 'All',
    category: 'All',
    payment: 'All',
    status: 'All',
    searchTerm: '',
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sData, pData] = await Promise.all([getSales(), getProducts()]);
      setSales(sData.sort((a, b) => new Date(b.date || b.saleDate) - new Date(a.date || a.saleDate)));
      setProducts(pData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) fetchAll();
        else setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // ---------- CSV IMPORT LOGIC ----------
  const handleDownloadTemplate = () => {
    const headers = "saleId,saleDate,customerName,customerEmail,customerPhone,productId,productName,brand,quantity,unitPrice,totalAmount,paymentStatus,orderStatus\n";
    const sampleRow = "SALE-001,2026-09-03,John Doe,john@example.com,1234567890,PROD-1,MRF Zapper,MRF,2,1500,3000,Paid,Completed\n";
    const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "sales_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (file.name.endsWith('.csv')) {
        parseCSV(text);
      } else {
        alert('Please upload a .csv file');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const parseCSV = (text) => {
    const rows = text.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 2) return alert("CSV must contain headers and at least one data row.");
    const headers = rows[0].split(',').map(h => h.trim());
    const parsedData = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const record = {};
      headers.forEach((header, index) => { record[header] = values[index] || ''; });
      parsedData.push(record);
    }
    validateData(parsedData);
  };

  const validateData = (data) => {
    let validRecords = [];
    let invalidCount = 0;
    let duplicateCount = 0;
    const existingSaleIds = new Set(sales.map(s => s.saleId || s._id));

    data.forEach(record => {
      if (!record.saleId || !record.productId || !record.quantity || !record.totalAmount) {
        invalidCount++;
        return;
      }
      if (existingSaleIds.has(record.saleId)) {
        duplicateCount++;
        return;
      }
      validRecords.push({
        ...record,
        quantity: Number(record.quantity),
        unitPrice: Number(record.unitPrice),
        totalAmount: Number(record.totalAmount),
        date: record.saleDate || new Date().toISOString(),
        status: record.orderStatus || 'Completed'
      });
    });

    setPreviewData(validRecords);
    setValidationStats({ total: data.length, valid: validRecords.length, invalid: invalidCount, duplicates: duplicateCount });
  };

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) return;
    setUploading(true);
    try {
      const imported = await bulkAddSales(previewData);
      alert(`Successfully imported ${imported} records!`);
      setPreviewData(null);
      fetchAll();
    } catch (error) {
      alert('Error importing data.');
    } finally {
      setUploading(false);
    }
  };

  // ---------- DIRECT SALE LOGIC ----------
  const openModal = (sale = null) => {
    if (sale) {
      setEditingSale(sale);
      setForm({
        productId: sale.productId || '',
        customerName: sale.customerName || '',
        customerEmail: sale.customerEmail || '',
        customerPhone: sale.customerPhone || '',
        quantity: sale.quantity || 1,
        paymentStatus: sale.paymentStatus || 'Paid',
        orderStatus: sale.status || 'Completed',
      });
    } else {
      setEditingSale(null);
      setForm({
        productId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        quantity: 1,
        paymentStatus: 'Paid',
        orderStatus: 'Completed',
      });
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleDirectSaleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!form.productId || form.quantity <= 0) {
      return setFormError('Please select a product and enter a valid quantity.');
    }

    const product = products.find(p => p._id === form.productId);
    if (!product) return setFormError('Product not found.');

    const qtyDiff = editingSale ? (Number(form.quantity) - Number(editingSale.quantity)) : Number(form.quantity);
    
    if (product.stock < qtyDiff) {
      return setFormError(`Insufficient stock. Only ${product.stock} left.`);
    }

    setFormLoading(true);
    try {
      const unitPrice = product.price;
      const totalAmount = unitPrice * form.quantity;
      const saleData = {
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        category: product.category || 'Unknown',
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        quantity: Number(form.quantity),
        unitPrice,
        totalAmount,
        paymentStatus: form.paymentStatus,
        status: form.orderStatus,
        date: editingSale ? editingSale.date : new Date().toISOString(),
      };

      if (editingSale) {
        await updateSale(editingSale._id || editingSale.saleId, saleData);
      } else {
        saleData.saleId = `SALE-${Date.now()}`;
        await addSale(saleData);
      }

      if (qtyDiff !== 0) {
        await updateProduct(product._id, { stock: product.stock - qtyDiff });
      }

      setShowModal(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      setFormError('Failed to save sale.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSale = async (sale) => {
    if (!window.confirm('Delete this sale permanently? This will restore the stock.')) return;
    try {
      await deleteSale(sale._id || sale.saleId);
      const product = products.find(p => p._id === sale.productId);
      if (product) {
        await updateProduct(product._id, { stock: product.stock + Number(sale.quantity) });
      }
      fetchAll();
    } catch (err) {
      alert('Failed to delete sale.');
    }
  };

  // Filter Logic (Current Period and Previous Period)
  const { filteredSales, prevFilteredSales } = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let prevStartDate = null;
    let prevEndDate = null;

    if (filters.dateRange === '7days') {
      startDate = new Date(now); startDate.setDate(now.getDate() - 7);
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(prevEndDate); prevStartDate.setDate(prevEndDate.getDate() - 7);
    } else if (filters.dateRange === '30days') {
      startDate = new Date(now); startDate.setDate(now.getDate() - 30);
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(prevEndDate); prevStartDate.setDate(prevEndDate.getDate() - 30);
    } else if (filters.dateRange === '3months') {
      startDate = new Date(now); startDate.setMonth(now.getMonth() - 3);
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(prevEndDate); prevStartDate.setMonth(prevEndDate.getMonth() - 3);
    } else if (filters.dateRange === '1year') {
      startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(prevEndDate); prevStartDate.setFullYear(prevEndDate.getFullYear() - 1);
    }

    const applyFilters = (s, isPrev = false) => {
      const sDate = new Date(s.date || s.saleDate);
      
      // Date filtering
      if (isPrev && prevStartDate && prevEndDate) {
        if (sDate < prevStartDate || sDate >= prevEndDate) return false;
      } else if (!isPrev && startDate) {
        if (sDate < startDate) return false;
      }

      // Dropdown filtering (applies to both current and previous to give accurate comparison)
      if (filters.brand !== 'All' && s.brand !== filters.brand) return false;
      
      if (filters.category !== 'All') {
        let cat = s.category;
        if (!cat) {
          const p = products.find(prod => prod._id === s.productId);
          cat = p ? p.category : 'Unknown';
        }
        if (cat !== filters.category) return false;
      }
      
      if (filters.payment !== 'All' && s.paymentStatus !== filters.payment) return false;
      
      const stat = s.status || s.orderStatus;
      if (filters.status !== 'All' && stat !== filters.status) return false;

      // Search filtering (only applies to current view, usually, but fine for both)
      if (filters.searchTerm) {
        const match = (s.customerName || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
                      (s.productName || '').toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                      (s.saleId || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
        if (!match) return false;
      }

      return true;
    };

    return {
      filteredSales: sales.filter(s => applyFilters(s, false)),
      prevFilteredSales: sales.filter(s => applyFilters(s, true))
    };
  }, [sales, products, filters]);

  const uniqueBrands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];
  const uniqueCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) return <p className="text-white/70">Loading sales dashboard...</p>;

  return (
    <div className="w-full space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider leading-tight">SALES HISTORY & REPORTS</h2>
          <p className="text-sm text-white/50 mt-1">Track customer invoice transactions, stock reduction, and analytics.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleDownloadTemplate} className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Export CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Upload CSV
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <button onClick={() => openModal()} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white shadow-lg shadow-red-500/20">
            + RECORD NEW SALE
          </button>
        </div>
      </div>

      {/* CSV Preview */}
      {previewData && validationStats && (
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Import Preview</h3>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-xs text-white/50 uppercase">Records</p>
              <p className="text-2xl font-bold text-white">{validationStats.total}</p>
            </div>
            <div className="rounded-xl bg-green-500/10 p-4 text-center">
              <p className="text-xs text-green-400/70 uppercase">Valid</p>
              <p className="text-2xl font-bold text-green-400">{validationStats.valid}</p>
            </div>
            <div className="rounded-xl bg-yellow-500/10 p-4 text-center">
              <p className="text-xs text-yellow-400/70 uppercase">Duplicates</p>
              <p className="text-2xl font-bold text-yellow-400">{validationStats.duplicates}</p>
            </div>
            <div className="rounded-xl bg-red-500/10 p-4 text-center">
              <p className="text-xs text-red-400/70 uppercase">Invalid</p>
              <p className="text-2xl font-bold text-red-400">{validationStats.invalid}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleImport} disabled={uploading || validationStats.valid === 0} className="rounded-full bg-green-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-green-600">
              {uploading ? 'Importing...' : 'Import Records'}
            </button>
            <button onClick={() => setPreviewData(null)} disabled={uploading} className="rounded-full border border-white/20 px-6 py-2 text-sm text-white hover:bg-white/10">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl">
            <h3 className="mb-6 text-2xl font-bold text-white tracking-wide">{editingSale ? 'Edit Sale' : 'Record New Sale'}</h3>
            {formError && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{formError}</p>}
            <form onSubmit={handleDirectSaleSubmit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Product *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary">
                  <option value="" disabled>Select a product...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} - ₹{p.price} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Customer Name *</label>
                  <input type="text" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Quantity *</label>
                  <input type="number" required min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Customer Email</label>
                  <input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Phone</label>
                  <input type="text" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Payment Status</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-white/50 uppercase tracking-wider">Order Status</label>
                  <select value={form.orderStatus} onChange={(e) => setForm({ ...form, orderStatus: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-primary">
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={formLoading} className="rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POWER BI SLICERS */}
      <div className="rounded-xl border border-white/10 bg-[#141414] p-4 shadow-md flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-[10px] font-bold text-white/50 uppercase tracking-wider">Date Range</label>
          <select value={filters.dateRange} onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-primary">
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="1year">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-[10px] font-bold text-white/50 uppercase tracking-wider">Brand</label>
          <select value={filters.brand} onChange={(e) => setFilters(f => ({ ...f, brand: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-primary">
            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-[10px] font-bold text-white/50 uppercase tracking-wider">Category</label>
          <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-primary">
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="mb-1 block text-[10px] font-bold text-white/50 uppercase tracking-wider">Payment</label>
          <select value={filters.payment} onChange={(e) => setFilters(f => ({ ...f, payment: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-primary">
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="mb-1 block text-[10px] font-bold text-white/50 uppercase tracking-wider">Status</label>
          <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-primary">
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex-none pt-5">
          <button onClick={() => setFilters({ dateRange: '30days', brand: 'All', category: 'All', payment: 'All', status: 'All', searchTerm: '' })} className="rounded-md border border-white/20 bg-transparent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10">
            Reset Filters
          </button>
        </div>
      </div>

      {/* ANALYTICS */}
      <SalesAnalytics filteredSales={filteredSales} prevFilteredSales={prevFilteredSales} products={products} setFilters={setFilters} />

      {/* TABLE */}
      <div className="rounded-xl border border-white/10 bg-[#141414] overflow-hidden shadow-xl mt-8">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sales History</h3>
          <input type="text" placeholder="Search Invoice #..." value={filters.searchTerm} onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))} className="rounded-md border border-white/10 bg-black px-3 py-1 text-xs text-white outline-none focus:border-primary w-[250px]" />
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm text-white/70 relative">
            <thead className="bg-[#1a1a1a] text-xs uppercase text-white/50 border-b border-white/10 tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">INVOICE #</th>
                <th className="px-6 py-3 whitespace-nowrap">DATE</th>
                <th className="px-6 py-3 whitespace-nowrap">CUSTOMER</th>
                <th className="px-6 py-3 whitespace-nowrap">PRODUCT</th>
                <th className="px-6 py-3 whitespace-nowrap">QTY</th>
                <th className="px-6 py-3 whitespace-nowrap">REVENUE</th>
                <th className="px-6 py-3 whitespace-nowrap">PAYMENT</th>
                <th className="px-6 py-3 whitespace-nowrap">STATUS</th>
                <th className="px-6 py-3 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.map((sale) => (
                <tr key={sale._id || sale.saleId} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-3 whitespace-nowrap text-white font-mono text-xs">
                    {sale.saleId || sale._id?.slice(-6)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs">
                    {sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <p className="text-white font-semibold text-xs">{sale.customerName}</p>
                  </td>
                  <td className="px-6 py-3 text-white max-w-[200px] truncate text-xs" title={sale.productName}>
                    {sale.productName}
                  </td>
                  <td className="px-6 py-3 text-white font-bold text-xs">{sale.quantity}</td>
                  <td className="px-6 py-3 text-green-400 font-bold text-xs">₹{sale.totalAmount}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${sale.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-400' : sale.paymentStatus === 'Pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {sale.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${sale.status === 'Completed' ? 'bg-green-500/10 text-green-400' : sale.status === 'Cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(sale)} className="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/20 transition">Edit</button>
                      <button onClick={() => handleDeleteSale(sale)} className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/20 transition">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-white/50">No records match the active slicers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
