import { useEffect, useState } from 'react';
import { subscribeToEnquiries, updateEnquiry, deleteEnquiry } from '../../api/firestoreService';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function EnquiryManagement() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const [notification, setNotification] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot = null;
    let unsubscribeAuth = null;

    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsubscribeSnapshot = subscribeToEnquiries((data, err) => {
            if (err) {
              setError('Unable to load enquiries.');
              setLoading(false);
            } else {
              setEnquiries(data);
              setLoading(false);
              setError(null);
            }
          });
        } else {
          setLoading(false);
          setError('You do not have permission to view enquiries.');
        }
      });
    } else {
      setLoading(false);
      setError('Authentication not initialized.');
    }

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const changeStatus = async (id, currentStatus) => {
    const statuses = ['New', 'Contacted', 'Resolved'];
    const normalized = (currentStatus || 'New').toLowerCase();
    const currentIndex = statuses.findIndex(s => s.toLowerCase() === normalized);
    const nextIndex = (currentIndex >= 0 ? currentIndex + 1 : 1) % statuses.length;
    await updateEnquiry(id, { status: statuses[nextIndex] });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    
    try {
      await deleteEnquiry(deleteConfirmId);
      setNotification({ type: 'success', message: 'Enquiry deleted successfully.' });
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        setNotification({ type: 'error', message: 'You do not have permission to delete this enquiry.' });
      } else {
        setNotification({ type: 'error', message: 'Unable to delete enquiry. Please try again.' });
      }
    }
    
    setIsDeleting(false);
    setDeleteConfirmId(null);
  };

  const handleWhatsAppReply = (enq) => {
    if (!enq.phone) {
      setNotification({ type: 'error', message: 'Customer phone number is unavailable.' });
      return;
    }

    let cleanedNumber = enq.phone.replace(/\D/g, '');

    if (cleanedNumber.startsWith('0') && cleanedNumber.length === 11) {
      cleanedNumber = cleanedNumber.substring(1);
    }
    
    if (cleanedNumber.length < 10) {
      setNotification({ type: 'error', message: 'Invalid customer phone number.' });
      return;
    }

    if (cleanedNumber.length === 10) {
      cleanedNumber = '91' + cleanedNumber;
    }

    let message = `Hello ${enq.name || enq.customerName || 'Customer'},\n\nThank you for contacting Rasheed Tyres Planet.\n\nRegarding your enquiry:\n"${enq.message || ''}"\n\nWe will be happy to assist you with your tyre enquiry.\n\nRegards,\nRasheed Tyres Planet`;

    if (enq.productName) {
      message += `\n\nProduct:\n${enq.productName}\n\nBrand:\n${enq.brand || 'N/A'}\n\nSKU:\n${enq.sku || 'N/A'}`;
    }

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const filteredEnquiries = enquiries.filter(enq => {
    if (filter !== 'All') {
      const currentStatus = (enq.status || 'New').toLowerCase();
      if (currentStatus !== filter.toLowerCase()) return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (enq.name || enq.customerName || '').toLowerCase().includes(term);
      const matchEmail = (enq.email || '').toLowerCase().includes(term);
      const matchPhone = (enq.phone || '').toLowerCase().includes(term);
      const matchProduct = (enq.productName || '').toLowerCase().includes(term);
      const matchMsg = (enq.message || '').toLowerCase().includes(term);
      return matchName || matchEmail || matchPhone || matchProduct || matchMsg;
    }
    
    return true;
  });

  if (loading) return <p className="text-white/70">Loading enquiries...</p>;

  return (
    <div className="w-full space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider leading-tight">Customer Enquiries</h2>
          <p className="text-sm text-white/50 mt-1">Manage inbound messages from customers.</p>
        </div>
      </div>
      
      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap bg-white/5 rounded-lg p-1 border border-white/10">
          {['All', 'New', 'Contacted', 'Resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                filter === status ? 'bg-primary text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-red-400 font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {notification && (
            <div className={`p-4 rounded-xl border font-semibold ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              {notification.message}
            </div>
          )}

          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Search name, email, phone, or product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEnquiries.map((enq) => (
              <div key={enq._id} className="rounded-3xl border border-white/10 bg-black/60 p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{enq.name || enq.customerName || 'Anonymous'}</h3>
                        {enq.source && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                            {enq.source === 'website_chatbot' ? 'Website Chatbot' : enq.source}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mb-1">{enq.createdAt ? new Date(enq.createdAt).toLocaleString() : ''}</p>
                      <p className="text-sm font-mono text-white/70">{enq.phone || 'No phone'}</p>
                      <p className="text-sm text-white/70">{enq.email || ''}</p>
                    </div>
                    <button 
                      onClick={() => changeStatus(enq._id, enq.status)}
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition hover:scale-105 ${
                        enq.status?.toUpperCase() === 'RESOLVED' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 
                        enq.status?.toUpperCase() === 'CONTACTED' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 
                        'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {enq.status || 'New'}
                    </button>
                  </div>

                  {enq.productName && (
                    <div className="mb-4 rounded-lg bg-white/5 p-3 border border-white/5">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Product Enquiry</p>
                      <p className="text-sm font-semibold text-white truncate">{enq.productName}</p>
                      <p className="text-xs text-white/50">SKU: {enq.sku || 'N/A'} | Brand: {enq.brand || 'N/A'}</p>
                    </div>
                  )}

                  <div className="bg-white/5 p-4 rounded-xl text-white/80 text-sm mb-4 whitespace-pre-wrap leading-relaxed border border-white/5">
                    {enq.message}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleWhatsAppReply(enq)}
                    className="flex-1 rounded-xl bg-green-500/10 px-3 py-2 text-[11px] sm:text-xs font-semibold text-green-500 transition hover:bg-green-500 hover:text-white border border-green-500/20 whitespace-nowrap min-w-[120px]"
                  >
                    Reply on WhatsApp
                  </button>
                  <button
                    onClick={() => changeStatus(enq._id, enq.status)}
                    className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-[11px] sm:text-xs font-semibold text-white transition hover:bg-white/10 whitespace-nowrap min-w-[120px]"
                  >
                    Mark as {enq.status === 'New' ? 'Contacted' : enq.status === 'Contacted' ? 'Resolved' : 'New'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(enq._id)}
                    className="rounded-xl bg-red-500/10 px-4 py-2 text-[11px] sm:text-xs font-semibold text-red-500 transition hover:bg-red-500 hover:text-white whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {enquiries.length === 0 && !searchTerm && (
              <div className="col-span-full py-16 text-center bg-black/40 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-2">NO ENQUIRIES YET</h3>
                <p className="text-white/50">Customer enquiries submitted through the website will appear here.</p>
              </div>
            )}
            
            {enquiries.length > 0 && filteredEnquiries.length === 0 && (
              <div className="col-span-full py-12 text-center text-white/50">
                No enquiries match your search or filter criteria.
              </div>
            )}
          </div>

          {/* CUSTOM CONFIRMATION DIALOG */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                <p className="text-white/70 mb-6">Are you sure you want to delete this enquiry? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    disabled={isDeleting}
                    className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
