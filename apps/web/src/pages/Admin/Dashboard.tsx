import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';

export function AdminDashboardPage() {
  const qc = useQueryClient();
  const { accessToken } = useAuth();

  // Fetch all data
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

  // Approve mutations
  const approveProvider = useMutation({
    mutationFn: async (userId: string) => api.post(`/admin/providers/${userId}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingProviders'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      alert('✅ Provider approved successfully!');
    },
    onError: () => alert('❌ Failed to approve provider')
  });

  const approveCenter = useMutation({
    mutationFn: async (userId: string) => api.post(`/admin/centers/${userId}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingCenters'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      alert('✅ Donation center approved successfully!');
    },
    onError: () => alert('❌ Failed to approve center')
  });

  const pendingProviders = providersQ.data?.providers?.length || 0;
  const pendingCenters = centersQ.data?.centers?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold">🛡️ Admin Dashboard</h1>
          <p className="text-green-100 mt-1">Manage platform users and approvals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statsQ.isLoading ? '...' : statsQ.data?.totalUsers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Total Listings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Listings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statsQ.isLoading ? '...' : statsQ.data?.totalListings || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {statsQ.isLoading ? '...' : statsQ.data?.totalOrders || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {pendingProviders + pendingCenters}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {(pendingProviders > 0 || pendingCenters > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⏳ Pending Approvals</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Service Providers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🏪</span>
                  <span>Service Providers ({pendingProviders})</span>
                </h3>
                {providersQ.isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : providersQ.data?.providers?.length > 0 ? (
                  <div className="space-y-3">
                    {providersQ.data.providers.map((p: any) => (
                      <div
                        key={p.userId}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{p.businessName}</p>
                            <p className="text-sm text-gray-600">{p.user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">User: {p.user.name}</p>
                          </div>
                          <button
                            onClick={() => approveProvider.mutate(p.userId)}
                            disabled={approveProvider.isPending}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No pending providers</p>
                )}
              </div>

              {/* Donation Centers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🏥</span>
                  <span>Donation Centers ({pendingCenters})</span>
                </h3>
                {centersQ.isLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : centersQ.data?.centers?.length > 0 ? (
                  <div className="space-y-3">
                    {centersQ.data.centers.map((c: any) => (
                      <div
                        key={c.userId}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            <p className="text-sm text-gray-600">{c.user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">User: {c.user.name}</p>
                          </div>
                          <button
                            onClick={() => approveCenter.mutate(c.userId)}
                            disabled={approveCenter.isPending}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No pending centers</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-green-700">Manage Users</p>
                <p className="text-xs text-gray-500">View all users</p>
              </div>
            </a>

            <a
              href="/admin/reviews"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-green-700">Moderate Reviews</p>
                <p className="text-xs text-gray-500">
                  {statsQ.data?.pendingReviews || 0} pending
                </p>
              </div>
            </a>

            <a
              href="/admin/listings"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-green-700">View Listings</p>
                <p className="text-xs text-gray-500">Manage all food listings</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
