import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export function MyOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => (await api.get('/orders')).data
  });

  if (isLoading) return <div className="pt-20 text-center">Loading...</div>;

  const orders = data?.orders || [];

  if (!orders.length) {
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
            {orders.map((o: any) => {
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
                      <div className="text-xs text-gray-400 font-mono mb-1">OR_{o.orderNumber}</div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${
                          o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                          o.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {o.status}
                        </span>
                        <span className="text-sm text-gray-500">LKR {Number(o.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold text-sm flex items-center gap-1">
                    Details <span className="text-lg">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
