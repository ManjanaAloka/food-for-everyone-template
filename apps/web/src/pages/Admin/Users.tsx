import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

function BanModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const qc = useQueryClient();
  const { mutate: ban, isPending } = useMutation({
    mutationFn: async () => api.post(`/admin/users/${user.id}/ban`, { reason }),
    onSuccess: () => {
      toast.success(`User ${user.name} has been suspended`);
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to ban user')
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-red-600 mb-2">⛔ Suspend User</h3>
        <p className="text-gray-600 mb-4 text-sm">Suspending <strong>{user.name}</strong> will prevent them from logging in.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for suspension (required)"
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => ban()}
            disabled={!reason.trim() || isPending}
            className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Suspending...' : 'Suspend'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [banTarget, setBanTarget] = useState<any>(null);

  const usersQ = useQuery({
    queryKey: ['adminUsers'],
    refetchInterval: 5000,
    queryFn: async () => (await api.get('/admin/users')).data
  });

  const { mutate: unban } = useMutation({
    mutationFn: async (userId: string) => api.post(`/admin/users/${userId}/unban`),
    onSuccess: () => {
      toast.success('User account restored');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
    }
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

  const tabs = [
    { key: 'ALL', label: 'All Users', icon: '📊', color: 'text-gray-900' },
    { key: 'CUSTOMER', label: 'Customers', icon: '👤', color: 'text-green-600' },
    { key: 'PROVIDER', label: 'Providers', icon: '🏪', color: 'text-blue-600' },
    { key: 'DONATION_CENTER', label: 'Centers', icon: '❤️', color: 'text-pink-600' },
    { key: 'ADMIN', label: 'Admins', icon: '🛡️', color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} />}
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-6 font-medium transition-colors">
          <span className="text-xl">←</span><span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Manage Users</h1>
          <p className="text-gray-600">View, filter, suspend and restore user accounts</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {tabs.map(tab => (
            <div key={tab.key} onClick={() => setRoleFilter(tab.key)}
              className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${roleFilter === tab.key ? 'ring-2 ring-green-500' : ''}`}
            >
              <div className="text-2xl mb-1">{tab.icon}</div>
              <div className={`text-2xl font-bold ${tab.color}`}>
                {tab.key === 'ALL' ? usersQ.data?.users?.length || 0 : usersQ.data?.users?.filter((u: any) => u.role === tab.key).length || 0}
              </div>
              <div className="text-sm text-gray-600">{tab.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {roleFilter === 'ALL' ? 'All Users' : `${roleFilter.replace('_', ' ')} Users`} ({filteredUsers.length})
          </h2>

          <div className="space-y-3">
            {usersQ.isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />)}
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => (
                <div key={user.id} className={`border-2 rounded-xl p-5 transition-all ${user.status === 'SUSPENDED' ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                          {user.name}
                          {user.status === 'SUSPENDED' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⛔ Suspended</span>}
                          {user.status === 'PENDING' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⏳ Pending</span>}
                          {user.status === 'ACTIVE' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Active</span>}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{user.email}</div>
                        {user.providerProfile && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            🏪 {user.providerProfile.businessName} · ⭐ {user.providerProfile.ratingAvg?.toFixed(1)} ({user.providerProfile.ratingCount})
                          </div>
                        )}
                        {user.donationCenterProfile && (
                          <div className="text-xs text-gray-500 mt-0.5">🏥 {user.donationCenterProfile.name}</div>
                        )}
                      </div>

                      <div className={`${getRoleBadgeColor(user.role)} text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-md flex-shrink-0`}>
                        {user.role.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      {user.role !== 'ADMIN' && (
                        user.status === 'SUSPENDED' ? (
                          <button onClick={() => unban(user.id)}
                            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                          >✅ Restore</button>
                        ) : (
                          <button onClick={() => setBanTarget(user)}
                            className="px-3 py-1.5 text-xs bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition"
                          >⛔ Suspend</button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <span className="text-5xl mb-4 block">👥</span>
                <p className="text-gray-600">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
