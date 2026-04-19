import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const usersQ = useQuery({
    queryKey: ['adminUsers'],
    refetchInterval: 5000, // Auto-refresh
    queryFn: async () => (await api.get('/admin/users')).data
  });

  const filteredUsers = usersQ.data?.users?.filter((u: any) => 
    roleFilter === 'ALL' || u.role === roleFilter
  ) || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'PROVIDER': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'DONATION_CENTER': return 'bg-gradient-to-r from-pink-500 to-pink-600';
      case 'CUSTOMER': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return '🛡️';
      case 'PROVIDER': return '🏪';
      case 'DONATION_CENTER': return '❤️';
      case 'CUSTOMER': return '👤';
      default: return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-6 font-medium transition-colors"
        >
          <span className="text-xl">←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Manage Users</h1>
          <p className="text-gray-600">View and manage all registered users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div 
            onClick={() => setRoleFilter('ALL')}
            className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${roleFilter === 'ALL' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-2xl font-bold text-gray-900">{usersQ.data?.users?.length || 0}</div>
            <div className="text-sm text-gray-600">All Users</div>
          </div>

          <div 
            onClick={() => setRoleFilter('CUSTOMER')}
            className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${roleFilter === 'CUSTOMER' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl mb-1">👤</div>
            <div className="text-2xl font-bold text-green-600">{usersQ.data?.users?.filter((u: any) => u.role === 'CUSTOMER').length || 0}</div>
            <div className="text-sm text-gray-600">Customers</div>
          </div>

          <div 
            onClick={() => setRoleFilter('PROVIDER')}
            className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${roleFilter === 'PROVIDER' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl mb-1">🏪</div>
            <div className="text-2xl font-bold text-blue-600">{usersQ.data?.users?.filter((u: any) => u.role === 'PROVIDER').length || 0}</div>
            <div className="text-sm text-gray-600">Providers</div>
          </div>

          <div 
            onClick={() => setRoleFilter('DONATION_CENTER')}
            className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${roleFilter === 'DONATION_CENTER' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl mb-1">❤️</div>
            <div className="text-2xl font-bold text-pink-600">{usersQ.data?.users?.filter((u: any) => u.role === 'DONATION_CENTER').length || 0}</div>
            <div className="text-sm text-gray-600">Centers</div>
          </div>

          <div 
            onClick={() => setRoleFilter('ADMIN')}
            className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${roleFilter === 'ADMIN' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl mb-1">🛡️</div>
            <div className="text-2xl font-bold text-purple-600">{usersQ.data?.users?.filter((u: any) => u.role === 'ADMIN').length || 0}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {roleFilter === 'ALL' ? 'All Users' : `${roleFilter.replace('_', ' ')} Users`} ({filteredUsers.length})
            </h2>
          </div>

          <div className="space-y-3">
            {usersQ.isLoading ? (
              <div className="text-center py-12 text-gray-500">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center text-2xl">
                        {getRoleIcon(user.role)}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">📞 {user.phone}</div>
                        )}
                      </div>

                      {/* Role Badge */}
                      <div className={`${getRoleBadgeColor(user.role)} text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-md`}>
                        {user.role.replace('_', ' ')}
                      </div>

                      {/* Status */}
                      <div className="text-sm">
                        {user.approved ? (
                          <span className="text-green-600 font-semibold">✓ Approved</span>
                        ) : (
                          <span className="text-orange-600 font-semibold">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(user.serviceProvider || user.donationCenter) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {user.serviceProvider && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Business:</span> {user.serviceProvider.businessName}
                        </div>
                      )}
                      {user.donationCenter && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Center:</span> {user.donationCenter.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <span className="text-6xl mb-4 block">👥</span>
                <p className="text-gray-600">No {roleFilter.toLowerCase()} users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
