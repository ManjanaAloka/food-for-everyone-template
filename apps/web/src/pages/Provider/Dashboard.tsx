import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ProviderDashboardPage() {
  const qc = useQueryClient();

  const statsQ = useQuery({ queryKey: ['providerStats'], queryFn: async () => (await api.get('/providers/me/stats')).data });
  const listingsQ = useQuery({ queryKey: ['myListings'], queryFn: async () => (await api.get('/providers/me/listings')).data });
  const ordersQ = useQuery({ queryKey: ['myOrdersProvider'], queryFn: async () => (await api.get('/providers/me/orders', { params: { limit: 5 } })).data });

  const hideListing = useMutation({ mutationFn: async (id: string) => api.delete(`/listings/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }) });
  const unhideListing = useMutation({ mutationFn: async (id: string) => api.patch(`/listings/${id}`, { status: 'ACTIVE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }) });

  const stats = statsQ.data?.stats || {
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalEarnings: 0, pendingEarnings: 0, codEarnings: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
              <span className="text-green-700 font-semibold text-sm">🏪 Provider Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
            <p className="text-xl text-gray-600">Manage your sales, listings, and profile</p>
          </div>
          <Link 
            to="/profile" 
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span>⚙️</span> Edit Bank/Profile Details
          </Link>
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
              <div className="space-y-4">
                {listingsQ.data?.listings?.length ? listingsQ.data.listings.map((l: any) => (
                  <div key={l.id} className="border border-gray-200 rounded-xl p-5 hover:border-green-300 transition-colors bg-gray-50/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-900">{l.title}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                            l.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}>{l.status}</span>
                          <span className="text-sm font-medium text-gray-700 border border-gray-300 rounded-md px-2 py-0.5 bg-white">LKR {Number(l.discountPrice).toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-3 flex gap-4">
                          <span>📦 Qty: {l.qtyAvailable}</span>
                          <span>⏰ Expires: {new Date(l.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {l.images && l.images.length > 0 && (
                        <img src={l.images[0]} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <Link 
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-all flex-1 text-center" 
                        to={`/provider/listings/${l.id}/edit`}
                      >
                        Edit
                      </Link>
                      <Link 
                        className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 font-medium text-sm rounded-lg hover:bg-green-100 transition-all flex-1 text-center flex items-center justify-center gap-2" 
                        to={`/provider/listings/${l.id}/orders`}
                      >
                        <span>📦</span> Orders
                      </Link>
                      {l.status === 'HIDDEN'
                        ? <button className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-all flex-1" onClick={()=>unhideListing.mutate(l.id)}>Activate</button>
                        : <button className="px-4 py-2 bg-gray-800 text-white font-medium text-sm rounded-lg hover:bg-gray-900 transition-all flex-1" onClick={()=>hideListing.mutate(l.id)}>Hide</button>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <div className="text-4xl mb-3">🍲</div>
                    <p className="text-gray-600 font-medium">No listings active</p>
                    <p className="text-sm text-gray-500 mt-1">Create a listing to start selling.</p>
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
    </div>
  );
}