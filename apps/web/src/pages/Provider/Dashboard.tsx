import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function ProviderDashboardPage() {
  const qc = useQueryClient();
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'OUT_OF_STOCK' | 'EXPIRED' | 'HIDDEN'>('ACTIVE');

  const statsQ = useQuery({ 
    queryKey: ['providerStats', startDate, endDate], 
    queryFn: async () => (await api.get('/providers/me/stats', { 
      params: { from: startDate, to: endDate } 
    })).data 
  });
  const listingsQ = useQuery({ queryKey: ['myListings'], queryFn: async () => (await api.get('/providers/me/listings')).data });
  const ordersQ = useQuery({ queryKey: ['myOrdersProvider'], queryFn: async () => (await api.get('/providers/me/orders', { params: { limit: 5 } })).data });

  const hideListing = useMutation({ mutationFn: async (id: string) => api.delete(`/listings/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }) });
  const unhideListing = useMutation({ mutationFn: async (id: string) => api.patch(`/listings/${id}`, { status: 'ACTIVE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }) });

  const stats = statsQ.data?.stats || {
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalEarnings: 0, pendingEarnings: 0, codEarnings: 0
  };

  const allListings = listingsQ.data?.listings || [];
  const now = new Date();

  const filteredListings = allListings.filter((l: any) => {
    const isExpired = new Date(l.expiresAt) < now;
    const isOutOfStock = l.qtyAvailable <= 0;

    if (activeTab === 'EXPIRED') return isExpired;
    if (activeTab === 'OUT_OF_STOCK') return isOutOfStock && !isExpired;
    if (activeTab === 'HIDDEN') return l.status === 'HIDDEN' && !isExpired && !isOutOfStock;
    // Default Active: Not expired, has stock, and not hidden
    return l.status === 'ACTIVE' && !isExpired && !isOutOfStock;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
              <span className="text-green-700 font-semibold text-sm">🏪 Provider Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
            <div className="flex items-center gap-3">
              <p className="text-xl text-gray-600">Manage your sales, listings, and profile</p>
              {(startDate || endDate) && (
                <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-bold animate-in fade-in zoom-in duration-300">
                  <span>📅 {startDate || '...'} to {endDate || 'Today'}</span>
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:text-orange-900">✕</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowDateModal(true)}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
            >
              <span>📅</span> Set Date Range
            </button>
            <Link 
              to="/profile" 
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <span>⚙️</span> Edit Bank/Profile Details
            </Link>
          </div>
        </div>

        {/* Business Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-green-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900">LKR {stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Pending (To be paid/delivered)</p>
            <p className="text-3xl font-bold text-gray-900">LKR {stats.pendingEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Cash on Delivery (Collected)</p>
            <p className="text-3xl font-bold text-gray-900">LKR {stats.codEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Active Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders} <span className="text-lg text-gray-400 font-normal">/ {stats.totalOrders} total</span></p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Listings Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span>🍽️</span> Manage Listings</h2>
                <Link 
                  to="/provider/listings/new" 
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  + New Listing
                </Link>
              </div>

              {/* Tabs System */}
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-1">
                {[
                  { id: 'ACTIVE', label: 'Active', color: 'green' },
                  { id: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'orange' },
                  { id: 'EXPIRED', label: 'Expired', color: 'red' },
                  { id: 'HIDDEN', label: 'Hidden', color: 'gray' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-all border-b-2 ${
                      activeTab === tab.id 
                        ? `text-${tab.color}-600 border-${tab.color}-600 bg-${tab.color}-50` 
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                      {allListings.filter((l: any) => {
                        const isExpired = new Date(l.expiresAt) < now;
                        const isOutOfStock = l.qtyAvailable <= 0;
                        if (tab.id === 'EXPIRED') return isExpired;
                        if (tab.id === 'OUT_OF_STOCK') return isOutOfStock && !isExpired;
                        if (tab.id === 'HIDDEN') return l.status === 'HIDDEN' && !isExpired && !isOutOfStock;
                        return l.status === 'ACTIVE' && !isExpired && !isOutOfStock;
                      }).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredListings.length ? filteredListings.map((l: any) => {
                  const isExpired = new Date(l.expiresAt) < now;
                  const isOutOfStock = l.qtyAvailable <= 0;

                  return (
                    <div key={l.id} className={`border rounded-xl p-5 transition-colors bg-gray-50/50 ${
                      isExpired ? 'border-red-200' : isOutOfStock ? 'border-orange-200' : 'border-gray-200 hover:border-green-300'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-900">{l.title}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {isExpired ? (
                              <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-md bg-red-600 text-white shadow-sm">EXPIRED</span>
                            ) : isOutOfStock ? (
                              <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-md bg-orange-500 text-white shadow-sm">OUT OF STOCK</span>
                            ) : (
                              <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md ${
                                l.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                              }`}>{l.status}</span>
                            )}
                            <span className="text-sm font-bold text-gray-700 border border-gray-200 rounded-md px-2 py-0.5 bg-white shadow-sm">LKR {Number(l.discountPrice).toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-3 flex flex-wrap gap-x-4 gap-y-1">
                            <span className={`flex items-center gap-1 font-medium ${isOutOfStock ? 'text-orange-600 font-bold' : ''}`}>
                              📦 Qty: {l.qtyAvailable}
                            </span>
                            <span className={`flex items-center gap-1 font-medium ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                              ⏰ {isExpired ? 'Expired' : 'Expires'}: {new Date(l.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {l.images && l.images.length > 0 && (
                          <img src={l.images[0]} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <Link 
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-50 transition-all flex-1 text-center shadow-sm" 
                          to={`/provider/listings/${l.id}/edit`}
                        >
                          Edit
                        </Link>
                        <Link 
                          className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 font-bold text-xs rounded-lg hover:bg-green-100 transition-all flex-1 text-center flex items-center justify-center gap-2 shadow-sm" 
                          to={`/provider/listings/${l.id}/orders`}
                        >
                          Orders
                        </Link>
                        {l.status === 'HIDDEN'
                          ? <button className="px-4 py-2 bg-green-600 text-white font-bold text-xs rounded-lg hover:bg-green-700 transition-all flex-1 shadow-sm" onClick={()=>unhideListing.mutate(l.id)}>Activate</button>
                          : <button className="px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-lg hover:bg-gray-900 transition-all flex-1 shadow-sm" onClick={()=>hideListing.mutate(l.id)}>Hide</button>}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <div className="text-4xl mb-3">🍲</div>
                    <p className="text-gray-600 font-medium">No {activeTab.toLowerCase().replace('_', ' ')} listings</p>
                    {activeTab === 'ACTIVE' && <p className="text-sm text-gray-500 mt-1">Create a listing to start selling.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Column: Orders */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span>📦</span> Recent Orders</h2>
                <Link to="/orders" className="text-sm text-green-600 font-medium hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {ordersQ.data?.orders?.length ? ordersQ.data.orders.map((o: any) => (
                  <Link key={o.id} to={`/orders/${o.id}`} className="block border border-gray-200 rounded-xl p-4 hover:border-green-400 transition-colors group bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#{o.id.slice(-6)}</span>
                      </div>
                      <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                        o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        o.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{o.status}</span>
                    </div>
                    <div className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">LKR {Number(o.total).toFixed(2)}</div>
                    <div className="text-xs font-medium text-gray-500 mt-2 flex justify-between">
                      <span className="flex items-center gap-1">💳 {o.paymentMethod || 'Online'}</span>
                      <span className="flex items-center gap-1">🚚 {o.fulfillmentMode}</span>
                    </div>
                  </Link>
                )) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">No recent orders</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl p-8 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>📅</span> Select Date Range
              </h2>
              <button onClick={() => setShowDateModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setShowDateModal(false); }}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowDateModal(false)}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg"
                >
                  Apply Filter
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center mt-6 uppercase font-bold tracking-widest">
              Filter stats by transaction date
            </p>
          </div>
        </div>
      )}
    </div>
  );
}