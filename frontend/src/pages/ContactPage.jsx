import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { addEnquiry } from '../api/firestoreService';
import { serverTimestamp } from 'firebase/firestore';

export default function ContactPage() {
  const location = useLocation();
  const product = location.state?.product;

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm((prev) => ({
        ...prev,
        message: `I am interested in this tyre.\n\nProduct: ${product.name}\nBrand: ${product.brand}\nSKU: ${product.sku}`
      }));
    }
  }, [product]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (!name || !email || !phone || !message) {
      setError('All fields are required.');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);

    try {
      const enquiryData = {
        name,
        email,
        phone,
        message,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      if (product) {
        enquiryData.productName = product.name;
        enquiryData.productId = product._id;
        enquiryData.sku = product.sku;
        enquiryData.brand = product.brand;
      }

      // Save to Firestore
      await addEnquiry(enquiryData);
      
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', message: '' });

      // Build WhatsApp message
      const text = `TyreHub Customer Enquiry\n\nName: ${name}\nPhone: ${phone}\n\nMessage:\n${message}\n\nPlease contact me regarding my tyre enquiry.`;
      const encodedText = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/9182736329?text=${encodedText}`;

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Error submitting enquiry:', err);
      setError('Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
          <h1 className="text-3xl font-semibold text-white">Contact Rasheed Tyres Planet</h1>
          <p className="mt-4 text-white/75">Reach out for tyre enquiries, service booking, or stock availability.</p>
          <div className="mt-8 space-y-5 text-white/75">
            <div>
              <h2 className="font-semibold text-white">Phone</h2>
              <p>+91 98765 43210</p>
            </div>
            <div>
              <h2 className="font-semibold text-white">Email</h2>
              <p>rasheedtyresplanet@gmail.com</p>
            </div>
            <div>
              <h2 className="font-semibold text-white">Address</h2>
              <p>Bridgestone Rasheed Tyres Planet, KG Rd, Vaddla Peta, Atmakur, Andhra Pradesh 518422</p>
            </div>
          </div>
          <div className="mt-8 rounded-3xl bg-black/70 p-6">
            <h2 className="font-semibold text-white">WhatsApp</h2>
            <p className="mt-2 text-white/70">Chat with us directly for fast support.</p>
            <a href="https://wa.me/9182736329" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white">
              Open WhatsApp
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
          <h2 className="text-2xl font-semibold text-white">{product ? 'Enquire About Product' : 'Customer Enquiry'}</h2>
          
          {product && (
            <div className="mt-4 rounded-xl bg-white/5 p-4 border border-white/10">
              <p className="text-sm font-semibold text-white">{product.name}</p>
              <p className="text-xs text-white/50">SKU: {product.sku}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {error && <p className="text-red-400 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
            {success && <p className="text-green-400 font-medium bg-green-500/10 p-3 rounded-xl border border-green-500/20">Enquiry submitted successfully. Opening WhatsApp...</p>}
            
            <label className="block text-sm text-white/80">
              Name *
              <input name="name" value={form.name} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" type="text" placeholder="Your Name" />
            </label>
            <label className="block text-sm text-white/80">
              Email *
              <input name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" type="email" placeholder="Your Email Address" />
            </label>
            <label className="block text-sm text-white/80">
              Phone *
              <input name="phone" value={form.phone} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" type="tel" placeholder="Mobile Number" />
            </label>
            <label className="block text-sm text-white/80">
              Message *
              <textarea name="message" value={form.message} onChange={handleChange} required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-primary" rows="5" placeholder="Your message"></textarea>
            </label>
            <button type="submit" disabled={loading} className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:bg-white uppercase tracking-wider disabled:opacity-50">
              {loading ? 'SUBMITTING...' : 'SEND ENQUIRY ON WHATSAPP'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
