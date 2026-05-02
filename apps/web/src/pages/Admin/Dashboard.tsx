import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  const { accessToken, user } = useAuth();

  const statsQ = useQuery({
    queryKey: ['adminStats'],
    enabled: !!accessToken,
    queryFn: async () => {
      const [listings, users, orders, reviews] = await Promise.all([
        api.get('/listings'),
        api.get('/admin/users'),
        api.get('/admin/orders'),
        api.get('/admin/reviews')
      ]);
      return {
        totalListings: listings.data.listings?.length || 0,
        totalUsers: users.data.users?.length || 0,
        totalOrders: orders.data.orders?.length || 0,
        pendingReviews: reviews.data.reviews?.filter((r: any) => r.status === 'PENDING').length || 0
      };
    }
  });

  const providersQ = useQuery({
    queryKey: ['pendingProviders'],
    enabled: !!accessToken,
    queryFn: async () => (await api.get('/admin/pending/providers')).data
  });

  const centersQ = useQuery({
    queryKey: ['pendingCenters'],
    enabled: !!accessToken,
    queryFn: async () => (await api.get('/admin/pending/centers')).data
  });

  const pendingCount = (providersQ.data?.providers?.length || 0) + (centersQ.data?.centers?.length || 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-green-100">Here's what's happening on the FreshSave platform today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Users</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{statsQ.isLoading ? '...' : statsQ.data?.totalUsers || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Registered accounts</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">🍽️</div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Listings</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{statsQ.isLoading ? '...' : statsQ.data?.totalListings || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Active food items</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">📦</div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Orders</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{statsQ.isLoading ? '...' : statsQ.data?.totalOrders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Completed transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">⏳</div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Pending</span>
          </div>
          <p className="text-3xl font-black text-orange-600">{pendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions / Shortcuts */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">⚡ Management Shortcuts</h2>
          <div className="grid grid-cols-2 gap-4">
            {user?.role !== 'MANAGER' && (
              <Link to="/admin/approvals" className="p-4 bg-orange-50 rounded-2xl border border-orange-100 hover:shadow-md transition-all group">
                <div className="text-2xl mb-2">⏳</div>
                <p className="font-bold text-gray-900">Approvals</p>
                <p className="text-xs text-gray-500">{pendingCount} pending</p>
              </Link>
            )}
            <Link to="/admin/reviews" className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 hover:shadow-md transition-all">
              <div className="text-2xl mb-2">⭐</div>
              <p className="font-bold text-gray-900">Reviews</p>
              <p className="text-xs text-gray-500">{statsQ.data?.pendingReviews || 0} pending</p>
            </Link>
            {user?.role !== 'MANAGER' && (
              <Link to="/admin/users" className="p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:shadow-md transition-all">
                <div className="text-2xl mb-2">👤</div>
                <p className="font-bold text-gray-900">User Base</p>
                <p className="text-xs text-gray-500">Manage accounts</p>
              </Link>
            )}
            <Link to="/admin/listings" className="p-4 bg-green-50 rounded-2xl border border-green-100 hover:shadow-md transition-all">
              <div className="text-2xl mb-2">🍽️</div>
              <p className="font-bold text-gray-900">Listings</p>
              <p className="text-xs text-gray-500">Platform inventory</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity / System Status */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
           <h2 className="text-xl font-bold text-gray-900 mb-6">🛰️ System Status</h2>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">API Server</span>
                 </div>
                 <span className="text-xs font-bold text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">Database</span>
                 </div>
                 <span className="text-xs font-bold text-green-600">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">Storage Bucket</span>
                 </div>
                 <span className="text-xs font-bold text-green-600">Connected</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
