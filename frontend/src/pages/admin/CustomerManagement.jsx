import { useEffect, useState } from 'react';
import { getCustomers } from '../../api/firestoreService';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          getCustomers().then(data => {
            setCustomers(data);
            setLoading(false);
          }).catch(() => setLoading(false));
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

  if (loading) return <p className="text-white/70">Loading customers...</p>;

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-white uppercase tracking-wider leading-tight">Registered Customers</h2>
      <div className="rounded-3xl border border-white/10 bg-black/60 overflow-hidden">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((customer) => (
              <tr key={customer._id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {customer.photoURL ? (
                      <img src={customer.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {customer.name?.charAt(0) || customer.email?.charAt(0)}
                      </div>
                    )}
                    <span className="text-white font-medium">{customer.name || 'No Name'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/80">{customer.email}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs ${customer.role === 'admin' ? 'bg-purple-500/15 text-purple-200' : 'bg-blue-500/15 text-blue-200'}`}>
                    {customer.role || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-6 text-center text-white/50">No customers found.</p>}
      </div>
    </div>
  );
}
