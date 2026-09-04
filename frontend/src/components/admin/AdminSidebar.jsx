import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Overview', path: '/admin', icon: '📊' },
  { name: 'Products', path: '/admin/products', icon: '🛞' },
  { name: 'Sales', path: '/admin/sales', icon: '📈' },
  { name: 'Customers', path: '/admin/customers', icon: '👥' },
  { name: 'Enquiries', path: '/admin/enquiries', icon: '💬' },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar (lg and above) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-black/70 border-r border-white/10 p-6 flex-col gap-2 overflow-y-auto">
        <div className="mb-6 px-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Administration</span>
          <h2 className="text-xl font-bold text-white tracking-wide">Control Center</h2>
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 font-bold' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile / Tablet Horizontal Navigation (< lg) */}
      <div className="lg:hidden w-full bg-black/80 border-b border-white/10 p-3 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-2 min-w-max">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
