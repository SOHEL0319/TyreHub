import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0c0c0c] pt-14 pb-8 text-sm text-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div>
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-[0.18em] text-white">
              <span className="text-red-500 text-2xl">⚡</span>
              <span>Tyre<span className="text-red-500">Hub</span></span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              Bridgestone Rasheed Tyres Planet is your trusted multi-brand tyre specialist in Atmakur, offering genuine tyres, professional wheel services, and customer care.
            </p>
            <div className="mt-6">
              <a
                href="https://wa.me/9182736329"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:brightness-110"
              >
                <span>💬</span> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/" className="hover:text-red-400 transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-red-400 transition">About Us</Link></li>
              <li><Link to="/services" className="hover:text-red-400 transition">Our Services</Link></li>
              <li><Link to="/tyres" className="hover:text-red-400 transition">Tyre Catalog</Link></li>
              <li><Link to="/contact" className="hover:text-red-400 transition">Contact & Enquiries</Link></li>
              <li><Link to="/login" className="hover:text-red-400 transition">Staff / Admin Login</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Tyre Categories</h3>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/category/Bike" className="hover:text-red-400 transition">Bike Tyres</Link></li>
              <li><Link to="/category/Car" className="hover:text-red-400 transition">Car Tyres</Link></li>
              <li><Link to="/category/Auto" className="hover:text-red-400 transition">Auto Tyres</Link></li>
              <li><Link to="/category/Lorry" className="hover:text-red-400 transition">Lorry & Truck Tyres</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Store Location</h3>
            <div className="space-y-3 text-xs text-white/60">
              <p className="leading-relaxed">
                <span className="font-semibold text-white">Bridgestone Rasheed Tyres Planet</span><br />
                KG Rd, Vaddla Peta, Atmakur,<br />
                Andhra Pradesh 518422
              </p>
              <p>📞 Phone: <span className="text-white">+91 98765 43210</span></p>
              <p>💬 WhatsApp: <span className="text-white">+91 9182736329</span></p>
              <p>📧 Email: <span className="text-white">rasheedtyresplanet@gmail.com</span></p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-white/40">
          <p>© 2026 Rasheed Tyres Planet. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 items-center">
            <span>GSTIN: 37AEAPA8856L1Z7</span>
            <span>•</span>
            <span>Authorized Tyre Dealer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
