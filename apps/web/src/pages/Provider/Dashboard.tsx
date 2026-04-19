import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ProviderDashboardPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const listingsQ = useQuery({ queryKey: ['myListings'], queryFn: async () => (await api.get('/providers/me/listings')).data });
  const ordersQ = useQuery({ queryKey: ['myOrdersProvider'], queryFn: async () => (await api.get('/providers/me/orders', { params: { limit: 10 } })).data });

  const hideListing = useMutation({ mutationFn: async (id: string) => api.delete(`/listings/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }) });
  const unhideListing = useMutation({ mutationFn: async (id: string) => api.patch(`/listings/${id}`, { status: 'ACTIVE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['myListings'] }) });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <div className="inline-block bg-green-100 rounded-full px-6 py-2 mb-4">
            <span className="text-green-700 font-semibold text-sm">🏪 Provider Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Provider Dashboard</h1>
          <p className="text-xl text-gray-600">Manage your listings and orders</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Listings Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Listings</h2>
              <Link 
                to="/provider/listings/new" 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transition-all"
              >
                + New Listing
              </Link>
            </div>
            <div className="space-y-3">
              {listingsQ.data?.listings?.length ? listingsQ.data.listings.map((l: any) => (
                <div key={l.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{l.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          l.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>{l.status}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Qty: {l.qtyAvailable} • Expires: {new Date(l.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all" 
                      to={`/provider/listings/${l.id}/edit`}
                    >
                      Edit
                    </Link>
                    {l.status === 'HIDDEN'
                      ? <button className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-all" onClick={()=>unhideListing.mutate(l.id)}>Show</button>
                      : <button className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-all" onClick={()=>hideListing.mutate(l.id)}>Hide</button>}
                    <Link className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all" to={`/orders?listing=${l.id}`}>Orders</Link>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🍲</div>
                  <p>No listings yet. Create your first listing!</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Orders</h2>
            <div className="space-y-3">
              {ordersQ.data?.orders?.length ? ordersQ.data.orders.map((o: any) => (
                <div key={o.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{o.id}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                          o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{o.status}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {o.type} • {o.fulfillmentMode} • LKR {Number(o.total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Link 
                    className="inline-block px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all" 
                    to={`/orders/${o.id}`}
                  >
                    View Details
                  </Link>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No orders yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}