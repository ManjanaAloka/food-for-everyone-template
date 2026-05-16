import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useParams, Link } from 'react-router-dom';
import { IoCubeOutline, IoCardOutline, IoCalendarOutline } from 'react-icons/io5';

export function ListingOrdersPage() {
  const { id } = useParams<{ id: string }>();

  const { data: listingData } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => (await api.get(`/listings/${id}`)).data
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['listing-orders', id],
    queryFn: async () => (await api.get(`/providers/me/listings/${id}/orders`)).data
  });

  const orders = ordersData?.orders || [];
  const listing = listingData?.listing;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-gray-500">
          <Link to="/provider/dashboard" className="hover:text-green-600 transition-colors">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Listing Orders</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders for Listing</h1>
              <p className="text-xl text-green-600 font-semibold">{listing?.title || 'Loading...'}</p>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span className="bg-gray-100 px-3 py-1 rounded-full">Total Orders: {orders.length}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">Active: {orders.filter((o:any) => o.status !== 'DELIVERED' && o.status !== 'CANCELED').length}</span>
              </div>
            </div>
            {listing?.images?.[0] && (
              <img src={listing.images[0]} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-500 mt-4 font-medium">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 border-dashed">
              <div className="text-5xl mb-4 flex justify-center text-gray-300"><IoCubeOutline /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500">Orders for this listing will appear here.</p>
            </div>
          ) : (
            orders.map((o: any) => (
              <Link 
                key={o.id} 
                to={`/orders/${o.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:border-green-400 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">
                        O-{o.id.slice(-4).toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        o.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-0.5">Customer</p>
                        <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{o.buyer?.name || 'Anonymous'}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 mx-2" />
                      <div>
                        <p className="text-sm text-gray-500 mb-0.5">Items Ordered</p>
                        <p className="font-bold text-gray-900">
                          {o.items.find((it:any) => it.listingId === id)?.qty || 1} Units
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 text-right">
                    <div className="text-2xl font-black text-gray-900">LKR {Number(o.total).toLocaleString()}</div>
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-3">
                      <span className="flex items-center gap-1"><IoCardOutline /> {o.paymentMethod || 'Online'}</span>
                      <span className="flex items-center gap-1"><IoCalendarOutline /> {new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
