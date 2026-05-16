import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  IoStorefrontOutline, IoCalendarOutline, IoSettingsOutline, 
  IoRestaurantOutline, IoCubeOutline, IoTimeOutline, 
  IoCloseOutline, IoReceiptOutline, IoCardOutline, IoCarOutline
} from 'react-icons/io5';

export function ProviderDashboardPage() {
  const qc = useQueryClient();
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'OUT_OF_STOCK' | 'EXPIRED' | 'HIDDEN'>('ACTIVE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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
    if (selectedCategory !== 'ALL' && l.category !== selectedCategory) return false;
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
              <span className="text-green-700 font-semibold text-sm flex items-center gap-2"><IoStorefrontOutline /> Provider Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
            <div className="flex items-center gap-3">
              <p className="text-xl text-gray-600">Manage your sales, listings, and profile</p>
              {(startDate || endDate) && (
                <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-bold animate-in fade-in zoom-in duration-300">
                  <span className="flex items-center gap-1"><IoCalendarOutline /> {startDate || '...'} to {endDate || 'Today'}</span>
                  <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:text-orange-900"><IoCloseOutline /></button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowDateModal(true)}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
            >
              <IoCalendarOutline /> Set Date Range
            </button>
            <Link 
              to="/profile" 
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <IoSettingsOutline /> Edit Bank/Profile Details
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
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span><IoRestaurantOutline /></span> Manage Listings</h2>
                <Link 
                  to="/provider/listings/new" 
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  + New Listing
                </Link>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-gray-100 pb-4">
                {/* Tabs System */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: 'ACTIVE', label: 'Active', color: 'green' },
                    { id: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'orange' },
                    { id: 'EXPIRED', label: 'Expired', color: 'red' },
                    { id: 'HIDDEN', label: 'Hidden', color: 'gray' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                        activeTab === tab.id 
                          ? `text-${tab.color}-600 border-${tab.color}-600 bg-${tab.color}-50` 
                          : 'text-gray-400 border-transparent hover:text-gray-600'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                        {allListings.filter((l: any) => {
                          if (selectedCategory !== 'ALL' && l.category !== selectedCategory) return false;
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

                {/* Category Filter */}
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none hover:bg-white transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Produce">Produce</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Prepared Meals">Prepared Meals</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-6">
                {filteredListings.length ? filteredListings.map((l: any) => {
                  const isExpired = new Date(l.expiresAt) < now;
                  const isOutOfStock = l.qtyAvailable <= 0;

                  return (
                    <div key={l.id} className={`group border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-white ${
                      isExpired ? 'border-red-200 shadow-red-50' : isOutOfStock ? 'border-orange-200 shadow-orange-50' : 'border-gray-200 hover:border-green-300 shadow-sm hover:-translate-y-1'
                    }`}>
                      <div className="flex flex-col sm:flex-row h-full">
                        {/* Image Section */}
                        <div className="sm:w-48 h-48 sm:h-auto relative bg-gray-100 shrink-0">
                          {l.images && l.images.length > 0 ? (
                            <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300"><IoRestaurantOutline /></div>
                          )}
                          {/* Badges on Image */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {isExpired ? (
                              <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-red-600 text-white shadow-md">EXPIRED</span>
                            ) : isOutOfStock ? (
                              <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-orange-500 text-white shadow-md">OUT OF STOCK</span>
                            ) : (
                              <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-md ${
                                l.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'
                              }`}>{l.status}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Content Section */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 block bg-green-50 w-fit px-2 py-0.5 rounded-md border border-green-100">{l.category}</span>
                                <h3 className="font-bold text-xl text-gray-900 leading-tight group-hover:text-green-700 transition-colors">{l.title}</h3>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-black text-gray-900">LKR {Number(l.discountPrice).toFixed(2)}</div>
                                {l.unitPrice > l.discountPrice && (
                                  <div className="text-sm font-medium text-gray-400 line-through">LKR {Number(l.unitPrice).toFixed(2)}</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${isOutOfStock ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                <IoCubeOutline /> {l.qtyAvailable} Left
                              </span>
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${isExpired ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
                                <IoTimeOutline /> {isExpired ? 'Expired' : 'Expires'}: {new Date(l.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions Row */}
                          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                            <Link 
                              to={`/provider/listings/${l.id}/edit`}
                              className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-center" 
                            >
                              Edit
                            </Link>
                            <Link 
                              to={`/provider/listings/${l.id}/orders`}
                              className="flex-1 px-4 py-2.5 bg-green-50 border-2 border-green-100 text-green-700 font-bold text-sm rounded-xl hover:bg-green-100 hover:border-green-200 transition-all text-center flex items-center justify-center gap-2" 
                            >
                              Orders
                            </Link>
                            {l.status === 'HIDDEN' ? (
                              <button onClick={()=>unhideListing.mutate(l.id)} className="flex-1 px-4 py-2.5 bg-gray-800 text-white font-bold text-sm rounded-xl hover:bg-gray-900 transition-all text-center shadow-md shadow-gray-200">
                                Activate
                              </button>
                            ) : (
                              <button onClick={()=>hideListing.mutate(l.id)} className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 border-2 border-transparent transition-all text-center">
                                Hide
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                    <div className="text-5xl mb-4 opacity-50 text-emerald-500 flex justify-center"><IoRestaurantOutline /></div>
                    <p className="text-gray-900 font-bold text-xl mb-1">No {selectedCategory !== 'ALL' ? selectedCategory : activeTab.toLowerCase().replace('_', ' ')} listings found</p>
                    {activeTab === 'ACTIVE' && <p className="text-gray-500">Create a new listing to start selling to the community.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Column: Orders */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span><IoCubeOutline /></span> Recent Orders</h2>
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
                      <span className="flex items-center gap-1"><IoCardOutline /> {o.paymentMethod || 'Online'}</span>
                      <span className="flex items-center gap-1"><IoCarOutline /> {o.fulfillmentMode}</span>
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
                <span><IoCalendarOutline /></span> Select Date Range
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