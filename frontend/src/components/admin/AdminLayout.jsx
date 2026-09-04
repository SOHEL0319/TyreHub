import Navbar from '../Navbar';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#111111] flex flex-col font-sans">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex flex-1 pt-[80px] px-3 sm:px-6">
        <div className="flex flex-col lg:flex-row w-full rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 my-6 overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto bg-black/40 p-4 sm:p-6 lg:p-8 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
