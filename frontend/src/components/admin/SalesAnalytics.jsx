import { useState, useMemo } from 'react';
import { ComposedChart, AreaChart, Area, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6'];
const STATUS_COLORS = {
  Completed: '#10b981',
  Pending: '#f59e0b',
  Cancelled: '#ef4444',
  Paid: '#10b981',
  Partial: '#3b82f6'
};

export default function SalesAnalytics({ filteredSales, prevFilteredSales, products, setFilters }) {
  const [timeToggle, setTimeToggle] = useState('daily'); // daily, weekly, monthly, yearly
  
  // Local Toggles for Sub-charts
  const [brandMetric, setBrandMetric] = useState('revenue');
  const [categoryMetric, setCategoryMetric] = useState('revenue');
  const [productMetric, setProductMetric] = useState('volume');

  // Formatters
  const formatCurrencyIndian = (val) => {
    if (val === 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const formatCurrencyDetailed = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val) => new Intl.NumberFormat('en-IN').format(val);

  // Short Date Formatter
  const formatShortDate = (dateStr, toggle) => {
    if (!dateStr) return '';
    if (toggle === 'yearly') return dateStr;
    if (toggle === 'monthly') {
      const d = new Date(dateStr + '-01');
      return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
    if (toggle === 'weekly') return dateStr;
    // daily (YYYY-MM-DD)
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // 1. KPI Calculations with Deltas
  const kpis = useMemo(() => {
    const calcMetrics = (data) => {
      let revenue = 0, units = 0, tx = data.length;
      data.forEach(s => {
        revenue += Number(s.totalAmount) || 0;
        units += Number(s.quantity) || 0;
      });
      return { revenue, units, tx, avg: tx > 0 ? revenue / tx : 0 };
    };

    const current = calcMetrics(filteredSales);
    const prev = calcMetrics(prevFilteredSales);

    const getDelta = (curr, pr) => {
      if (pr === 0 && curr > 0) return { val: 100, text: '↑ 100%', positive: true };
      if (pr === 0 && curr === 0) return { val: 0, text: 'No previous-period comparison', positive: null };
      const diff = ((curr - pr) / pr) * 100;
      const isPositive = diff >= 0;
      return {
        val: diff,
        text: `${isPositive ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)}%`,
        positive: isPositive
      };
    };

    return {
      current,
      deltas: {
        revenue: getDelta(current.revenue, prev.revenue),
        units: getDelta(current.units, prev.units),
        tx: getDelta(current.tx, prev.tx),
        avg: getDelta(current.avg, prev.avg)
      }
    };
  }, [filteredSales, prevFilteredSales]);

  // 2. Chart Data Computations
  const stats = useMemo(() => {
    const timeMap = {};
    const productMap = {};
    const brandMap = {};
    const categoryMap = {};
    const paymentMap = {};
    const orderMap = {};
    const productSalesForStock = {};

    filteredSales.forEach(sale => {
      const rev = Number(sale.totalAmount) || 0;
      const qty = Number(sale.quantity) || 0;

      const dateObj = new Date(sale.date || sale.saleDate);
      if (isNaN(dateObj)) return;

      // Time Grouping
      let timeKey = '';
      if (timeToggle === 'daily') {
        timeKey = dateObj.toLocaleDateString('en-CA');
      } else if (timeToggle === 'weekly') {
        const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        timeKey = `W${weekNo} ${d.getUTCFullYear()}`;
      } else if (timeToggle === 'monthly') {
        timeKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeToggle === 'yearly') {
        timeKey = `${dateObj.getFullYear()}`;
      }

      if (!timeMap[timeKey]) timeMap[timeKey] = { date: timeKey, revenue: 0, tyresSold: 0, transactions: 0 };
      timeMap[timeKey].revenue += rev;
      timeMap[timeKey].tyresSold += qty;
      timeMap[timeKey].transactions += 1;

      const pName = sale.productName || 'Unknown';
      if (!productMap[pName]) productMap[pName] = { revenue: 0, volume: 0 };
      productMap[pName].revenue += rev;
      productMap[pName].volume += qty;
      
      const pId = sale.productId;
      if (pId) {
        productSalesForStock[pId] = (productSalesForStock[pId] || 0) + qty;
      }

      const brand = sale.brand || 'Unknown';
      if (!brandMap[brand]) brandMap[brand] = { revenue: 0, volume: 0, tx: 0 };
      brandMap[brand].revenue += rev;
      brandMap[brand].volume += qty;
      brandMap[brand].tx += 1;

      let category = sale.category;
      if (!category) {
        const prod = products.find(p => p._id === sale.productId);
        category = prod ? prod.category : 'Unknown';
      }
      if (!categoryMap[category]) categoryMap[category] = { revenue: 0, volume: 0 };
      categoryMap[category].revenue += rev;
      categoryMap[category].volume += qty;

      const payStatus = sale.paymentStatus || 'Unknown';
      paymentMap[payStatus] = (paymentMap[payStatus] || 0) + 1;

      const ordStatus = sale.status || sale.orderStatus || 'Unknown';
      orderMap[ordStatus] = (orderMap[ordStatus] || 0) + 1;
    });

    let timeSeriesData = Object.values(timeMap).sort((a, b) => a.date.localeCompare(b.date));

    // Handle single data point empty space issue by padding the dataset with nulls
    // so it centers the single data point instead of stretching it weirdly.
    if (timeSeriesData.length === 1) {
      const singlePoint = timeSeriesData[0];
      const d = new Date(singlePoint.date);
      let prevDateStr = '';
      let nextDateStr = '';
      
      if (timeToggle === 'daily') {
        const pd = new Date(d); pd.setDate(pd.getDate() - 1);
        const nd = new Date(d); nd.setDate(nd.getDate() + 1);
        prevDateStr = pd.toLocaleDateString('en-CA');
        nextDateStr = nd.toLocaleDateString('en-CA');
      } else if (timeToggle === 'monthly') {
        const pd = new Date(d); pd.setMonth(pd.getMonth() - 1);
        const nd = new Date(d); nd.setMonth(nd.getMonth() + 1);
        prevDateStr = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
        nextDateStr = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeToggle === 'yearly') {
        prevDateStr = String(d.getFullYear() - 1);
        nextDateStr = String(d.getFullYear() + 1);
      } else if (timeToggle === 'weekly') {
        prevDateStr = `Prev Wk ${d.getFullYear()}`;
        nextDateStr = `Next Wk ${d.getFullYear()}`;
      }

      timeSeriesData = [
        { date: prevDateStr, revenue: null, tyresSold: null, transactions: 0, _isPadding: true },
        singlePoint,
        { date: nextDateStr, revenue: null, tyresSold: null, transactions: 0, _isPadding: true }
      ];
    }

    // Calculate smart domains
    const actualData = timeSeriesData.filter(d => !d._isPadding);
    const maxRev = actualData.length > 0 ? Math.max(...actualData.map(d => d.revenue)) : 0;
    const maxVol = actualData.length > 0 ? Math.max(...actualData.map(d => d.tyresSold)) : 0;

    const calcMaxDomain = (val, isVolume = false) => {
      if (val === 0) return 5;
      
      // Tighter scaling for very small datasets like Volume = 4
      if (val <= 5) return val + (isVolume ? 1 : 1);
      if (val <= 10) return val + (isVolume ? 2 : 2);
      if (val <= 20) return val + 5;
      if (val <= 50) return Math.ceil(val / 10) * 10;
      
      const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
      const fraction = val / magnitude;
      let multiplier;
      if (fraction <= 1.25) multiplier = 1.25;
      else if (fraction <= 1.5) multiplier = 1.5;
      else if (fraction <= 2) multiplier = 2;
      else if (fraction <= 2.5) multiplier = 2.5;
      else if (fraction <= 3) multiplier = 3;
      else if (fraction <= 4) multiplier = 4;
      else if (fraction <= 5) multiplier = 5;
      else if (fraction <= 7.5) multiplier = 7.5;
      else multiplier = 10;
      return magnitude * multiplier;
    };

    const topProductsData = Object.entries(productMap)
      .map(([name, data]) => ({ name, revenue: data.revenue, volume: data.volume }))
      .sort((a, b) => b[productMetric] - a[productMetric])
      .slice(0, 10);

    const brandData = Object.entries(brandMap)
      .map(([name, data]) => ({ name, revenue: data.revenue, volume: data.volume, tx: data.tx }))
      .sort((a, b) => b[brandMetric] - a[brandMetric]);

    const categoryData = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, revenue: data.revenue, volume: data.volume }))
      .sort((a, b) => b[categoryMetric] - a[categoryMetric]);

    const paymentData = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));
    const orderData = Object.entries(orderMap).map(([name, value]) => ({ name, value }));
    
    const stockData = Object.entries(productSalesForStock)
      .map(([id, sold]) => {
        const p = products.find(prod => prod._id === id);
        return p ? { name: p.name, sold, stock: p.stock } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    return {
      timeSeriesData,
      revDomain: [0, calcMaxDomain(maxRev, false)],
      volDomain: [0, calcMaxDomain(maxVol, true)],
      topProductsData,
      brandData,
      categoryData,
      paymentData,
      orderData,
      stockData
    };
  }, [filteredSales, products, timeToggle, brandMetric, categoryMetric, productMetric]);

  const handleBrandClick = (data) => {
    if (data && data.name) setFilters(f => ({ ...f, brand: f.brand === data.name ? 'All' : data.name }));
  };
  const handleCategoryClick = (data) => {
    if (data && data.name) setFilters(f => ({ ...f, category: f.category === data.name ? 'All' : data.name }));
  };
  const handlePaymentClick = (data) => {
    if (data && data.name) setFilters(f => ({ ...f, payment: f.payment === data.name ? 'All' : data.name }));
  };
  const handleStatusClick = (data) => {
    if (data && data.name) setFilters(f => ({ ...f, status: f.status === data.name ? 'All' : data.name }));
  };

  const renderDelta = (deltaObj) => {
    if (!deltaObj.positive && deltaObj.positive !== false) return <span className="text-white/30 text-xs font-semibold">{deltaObj.text}</span>;
    return (
      <span className={`text-xs font-bold ${deltaObj.positive ? 'text-green-400' : 'text-red-400'}`}>
        {deltaObj.text} <span className="text-white/40 font-normal">vs prev</span>
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Ignore tooltip on padding points
      if (payload[0].payload._isPadding) return null;
      
      const data = payload[0].payload;
      return (
        <div className="bg-[#111] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 border-b border-white/10 pb-2">
            SALES DETAILS
          </p>
          <p className="text-white font-bold mb-4">{formatShortDate(label, timeToggle)}</p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Revenue</span>
            <span className="text-red-400 font-bold text-sm">{formatCurrencyDetailed(data.revenue)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Tyres Sold</span>
            <span className="text-blue-400 font-bold text-sm">{formatNumber(data.tyresSold)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/70 text-sm">Transactions</span>
            <span className="text-white font-bold text-sm">{formatNumber(data.transactions)}</span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
            <span className="text-white/70 text-sm">Avg Sale</span>
            <span className="text-white font-bold text-sm">{formatCurrencyDetailed(data.transactions > 0 ? data.revenue / data.transactions : 0)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col justify-between">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrencyDetailed(kpis.current.revenue)}</p>
          {renderDelta(kpis.deltas.revenue)}
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col justify-between">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Total Sales</p>
          <p className="text-3xl font-bold text-white mb-2">{formatNumber(kpis.current.tx)}</p>
          {renderDelta(kpis.deltas.tx)}
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col justify-between">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Tyres Sold</p>
          <p className="text-3xl font-bold text-white mb-2">{formatNumber(kpis.current.units)}</p>
          {renderDelta(kpis.deltas.units)}
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col justify-between">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Average Sale</p>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrencyDetailed(kpis.current.avg)}</p>
          {renderDelta(kpis.deltas.avg)}
        </div>
      </div>

      {stats.timeSeriesData.filter(d => !d._isPadding).length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1a1a1a] p-12 text-center shadow-md">
          <p className="text-xl font-bold text-white mb-2">No sales data available</p>
          <p className="text-sm text-white/50">Start recording sales to see your analytics.</p>
        </div>
      ) : (
        <>
          {/* Main Trend Graphs */}
          <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">SALES REVENUE & VOLUME TRENDS</h3>
                <p className="text-xs text-white/50 mt-1">Revenue and tyre sales over time.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex bg-black/40 rounded border border-white/5 p-1 gap-1">
                  {['daily', 'weekly', 'monthly', 'yearly'].map(t => (
                    <button key={t} onClick={() => setTimeToggle(t)} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition ${timeToggle === t ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[450px] w-full relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff70" 
                    fontSize={12} 
                    axisLine={{ stroke: '#ffffff30' }} 
                    tickLine={false} 
                    tickMargin={15} 
                    tickFormatter={(val) => formatShortDate(val, timeToggle)} 
                    minTickGap={40} 
                  />
                  
                  <YAxis 
                    yAxisId="left" 
                    stroke="#ef4444" 
                    fontSize={12} 
                    tickFormatter={formatCurrencyIndian} 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={15} 
                    domain={stats.revDomain} 
                    allowDataOverflow={true}
                    tickCount={6} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#3b82f6" 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={15} 
                    allowDecimals={false} 
                    domain={stats.volDomain} 
                    allowDataOverflow={true}
                    tickCount={6} 
                  />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#aaa', paddingBottom: '20px' }} />
                  
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    name="Revenue (₹)" 
                    dataKey="revenue" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} 
                    dot={{ r: 5, fill: '#ef4444', strokeWidth: 0 }} 
                    connectNulls={true}
                  />
                  <Area 
                    yAxisId="right" 
                    type="monotone" 
                    name="Tyres Sold" 
                    dataKey="tyresSold" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorVol)"
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} 
                    dot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }} 
                    connectNulls={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BI Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* TOP PRODUCTS */}
            <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Selling Products</h3>
                <div className="flex bg-black/40 rounded border border-white/5">
                  {['revenue', 'volume'].map(t => (
                    <button key={t} onClick={() => setProductMetric(t)} className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${productMetric === t ? 'bg-white/20 text-white' : 'text-white/40'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProductsData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} tickFormatter={productMetric === 'revenue' ? formatCurrencyIndian : undefined} />
                    <YAxis type="category" dataKey="name" stroke="#ffffff70" fontSize={11} width={120} axisLine={false} tickLine={false} tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '...' : val} />
                    <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} labelFormatter={(label) => label} formatter={(val) => [productMetric === 'revenue' ? formatCurrencyDetailed(val) : formatNumber(val), productMetric === 'revenue' ? 'Revenue' : 'Units']} />
                    <Bar dataKey={productMetric} fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BRAND */}
            <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Sales by Brand</h3>
                <div className="flex bg-black/40 rounded border border-white/5">
                  {['revenue', 'volume'].map(t => (
                    <button key={t} onClick={() => setBrandMetric(t)} className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${brandMetric === t ? 'bg-white/20 text-white' : 'text-white/40'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.brandData} layout="vertical" margin={{ left: 10, right: 20 }} onClick={handleBrandClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} tickFormatter={brandMetric === 'revenue' ? formatCurrencyIndian : undefined} />
                    <YAxis type="category" dataKey="name" stroke="#ffffff70" fontSize={11} width={100} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} formatter={(val) => [brandMetric === 'revenue' ? formatCurrencyDetailed(val) : formatNumber(val), brandMetric === 'revenue' ? 'Revenue' : 'Units']} />
                    <Bar dataKey={brandMetric} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} className="cursor-pointer hover:opacity-80" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-[10px] text-white/30 mt-3">Click a bar to filter dashboard</p>
            </div>

            {/* CATEGORY */}
            <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Sales by Category</h3>
                <div className="flex bg-black/40 rounded border border-white/5">
                  {['revenue', 'volume'].map(t => (
                    <button key={t} onClick={() => setCategoryMetric(t)} className={`px-3 py-1 text-[9px] font-bold uppercase rounded ${categoryMetric === t ? 'bg-white/20 text-white' : 'text-white/40'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={handleCategoryClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} tickFormatter={categoryMetric === 'revenue' ? formatCurrencyIndian : undefined} />
                    <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} formatter={(val) => [categoryMetric === 'revenue' ? formatCurrencyDetailed(val) : formatNumber(val), categoryMetric === 'revenue' ? 'Revenue' : 'Units']} />
                    <Bar dataKey={categoryMetric} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={36} className="cursor-pointer hover:opacity-80" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PAYMENT & STATUS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2 w-full text-center">Payment Status</h3>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" onClick={handlePaymentClick} className="cursor-pointer">
                        {stats.paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} className="hover:opacity-80" />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md flex flex-col items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2 w-full text-center">Order Status</h3>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.orderData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" onClick={handleStatusClick} className="cursor-pointer">
                        {stats.orderData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} className="hover:opacity-80" />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SALES VS INVENTORY */}
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#1a1a1a] p-5 shadow-md">
              <h3 className="mb-4 text-xs font-bold text-white uppercase tracking-wider">Sales vs Current Stock (Top 10 High Velocity)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.stockData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={9} axisLine={false} tickLine={false} tickFormatter={(val) => val.length > 15 ? val.substring(0,15)+'...' : val} />
                    <YAxis stroke="#ffffff30" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#ffffff0a'}} 
                      contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val, name) => [val, name === 'sold' ? 'Units Sold (Period)' : 'Current Stock Left']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                    <Bar dataKey="sold" name="Units Sold" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="stock" name="Current Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
