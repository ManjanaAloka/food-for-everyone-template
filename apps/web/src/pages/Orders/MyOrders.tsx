import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useAuth } from '../../state/auth';


export function MyOrdersPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const itemsPerPage = 5;

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => (await api.get('/orders')).data
  });
  
  const { data: donationsData, isLoading: donationsLoading } = useQuery({
    queryKey: ['myDonations'],
    queryFn: async () => (await api.get('/donations/my/history')).data
  });
  
  if (ordersLoading || donationsLoading) return <div className="pt-20 text-center">Loading history...</div>;

  const orders = ordersData?.orders || [];
  const donations = (donationsData?.donations || []).map((d: any) => ({
    ...d,
    isDonationOnly: true,
    total: d.amount,
    items: [{ listing: { title: d.donationRequest.title, images: [] } }]
  }));

  const allTransactions = [...orders, ...donations].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = allTransactions.slice(startIndex, startIndex + itemsPerPage);

  if (!allTransactions.length) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600">You haven't placed any orders yet.</p>
            <Link to="/browse" className="inline-block mt-6 px-6 py-2 bg-green-600 text-white rounded-lg font-bold">Browse Food</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
            <span className="text-green-700 font-semibold text-sm">📦 My Orders</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order History</h1>
          <p className="text-xl text-gray-600">View your recent orders and track their status</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {currentItems.map((o: any) => {
              if (o.isDonationOnly) {
                return (
                  <div 
                    key={o.id} 
                    className="flex items-center justify-between p-4 border border-pink-100 rounded-xl bg-pink-50/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center text-3xl flex-shrink-0">
                        💝
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 line-clamp-1">
                          Donated to: {o.donationRequest.title}
                        </div>
                        <div className="text-xs text-pink-600 font-bold mb-1">Impact Donation</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 font-bold rounded-full uppercase bg-pink-600 text-white">
                            {o.status}
                          </span>
                          <span className="text-sm text-pink-700 font-black">
                            {(o.amount / 150).toFixed(0)} Items Donated
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => setSelectedDonation(o)}
                        className="text-pink-600 font-bold text-sm flex items-center gap-1 hover:underline"
                      >
                        View Impact <span className="text-lg">→</span>
                      </button>
                      <div className="text-[10px] text-pink-400 font-medium italic">
                        Thank You! ❤️
                      </div>
                    </div>
                  </div>

                );
              }

              const firstItem = o.items[0];
              const listing = firstItem?.listing;
              const images = listing?.images ? (typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images) : [];
              const mainImage = images[0] || 'https://via.placeholder.com/150?text=No+Image';

              return (
                <Link 
                  key={o.id} 
                  to={`/orders/${o.id}`}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-green-500 bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={mainImage} alt={listing?.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 line-clamp-1">
                        {o.items.length > 1 ? `${listing?.title} + ${o.items.length - 1} more` : listing?.title}
                      </div>
                      <div className="text-xs text-green-600 font-bold font-mono mb-1">O-{o.orderNumber?.toString().padStart(4, '0') || '—'}</div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${
                          o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                          o.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {o.status}
                        </span>
                        {o.type === 'DONATION' ? (
                          <span className="text-sm text-pink-700 font-black flex items-center gap-1">
                            📦 {o.items.reduce((acc: number, it: any) => acc + (it.qty || 0), 0)} Items
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">LKR {Number(o.total).toFixed(2)}</span>
                        )}
                      </div>

                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-green-600 font-bold text-sm flex items-center gap-1">
                      Details <span className="text-lg">→</span>
                    </div>
                    {o.status === 'DELIVERED' && !o.review && o.buyerId === user?.id && (
                      <Link 
                        to={`/orders/${o.id}/review`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        ⭐ Rate & Review
                      </Link>
                    )}

                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    currentPage === i + 1
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Donation Thank You Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Header with Sparkles */}
            <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 p-10 text-white text-center relative overflow-hidden">
              {/* Decorative floating hearts/circles */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 text-4xl animate-bounce">💖</div>
                <div className="absolute bottom-10 right-10 text-2xl animate-pulse">✨</div>
                <div className="absolute top-1/2 left-1/4 text-xl">⭐</div>
              </div>

              <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl border border-white/30 animate-pulse">
                💝
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">You're a Hero!</h2>
              <p className="text-pink-100 text-sm font-medium uppercase tracking-widest">Official Impact Certificate</p>
            </div>

            {/* Content */}
            <div className="p-10 text-center space-y-6">
              <div className="space-y-1">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-tighter">Your Contribution</p>
                <div className="text-4xl font-black text-gray-900">LKR {Number(selectedDonation.amount).toFixed(2)}</div>
              </div>

              <div className="bg-pink-50 rounded-3xl p-6 border border-pink-100">
                <p className="text-gray-600 text-sm italic leading-relaxed">
                  "Your generous donation to <strong>{selectedDonation.donationRequest.title}</strong> is providing essential meals to families in need. Together, we are building a world where no one goes hungry."
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-xl font-black text-gray-900">{(selectedDonation.amount / 150 * 2.5).toFixed(0)}</div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Meals Provided</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xl font-black text-gray-900">{(selectedDonation.amount / 150 * 1.2).toFixed(1)}kg</div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">CO2 Prevented</p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>📥</span> Download Certificate
                </button>
                <button 
                  onClick={() => setSelectedDonation(null)}
                  className="w-full py-4 bg-pink-100 text-pink-600 font-bold rounded-2xl hover:bg-pink-200 transition-all"
                >
                  Close
                </button>
              </div>

              <p className="text-[10px] text-gray-300 font-medium">Verified by Food for Everyone Community</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

