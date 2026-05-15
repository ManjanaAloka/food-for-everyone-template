import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
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
  const { user } = useAuth();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [banTarget, setBanTarget] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const { mutate: deleteUser } = useMutation({
    mutationFn: async (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success('User deleted successfully');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      setSelectedUser(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to delete user')
  });

  const { mutate: verifyUser } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const endpoint = role === 'PROVIDER' ? `/admin/providers/${userId}/approve` : `/admin/centers/${userId}/approve`;
      return api.post(endpoint);
    },
    onSuccess: () => {
      toast.success('User verified successfully');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to verify user')
  });

  const filteredUsers = usersQ.data?.users?.filter((u: any) =>
    roleFilter === 'ALL' || u.role === roleFilter
  ) || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'SYSTEM_ADMIN': return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      case 'MANAGER': return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'PROVIDER': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'DONATION_CENTER': return 'bg-gradient-to-r from-pink-500 to-pink-600';
      case 'CUSTOMER': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': case 'SYSTEM_ADMIN': return '🛡️';
      case 'MANAGER': return '⚙️';
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
    <div className="space-y-6">
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} />}
      
      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fadeInUp">
            <div className="flex justify-between items-start mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                {getRoleIcon(selectedUser.role)}
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
              <p className="text-gray-600">{selectedUser.email}</p>
              <div className="flex gap-2 mt-3">
                <span className={`${getRoleBadgeColor(selectedUser.role)} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                  {selectedUser.role.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedUser.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-1">User ID</div>
                <div className="text-gray-900 font-mono text-sm">{selectedUser.id}</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-1">Joined Date</div>
                <div className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex gap-3">
              {user?.role === 'SYSTEM_ADMIN' && (
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this user?')) {
                      deleteUser(selectedUser.id);
                    }
                  }}
                  className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all"
                >
                  🗑️ Delete
                </button>
              )}
              <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats/Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tabs.map(tab => (
          <div key={tab.key} onClick={() => setRoleFilter(tab.key)}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md ${roleFilter === tab.key ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
          >
            <div className="text-2xl mb-1">{tab.icon}</div>
            <div className={`text-2xl font-black ${tab.color}`}>
              {tab.key === 'ALL' ? usersQ.data?.users?.length || 0 : usersQ.data?.users?.filter((u: any) => u.role === tab.key).length || 0}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{tab.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            {roleFilter === 'ALL' ? 'All Users' : `${roleFilter.replace('_', ' ')}s`}
          </h2>
        </div>

        <div className="space-y-4">
          {usersQ.isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-24 bg-gray-50 rounded-2xl" />)}
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u: any) => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                className={`group flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${u.status === 'SUSPENDED' ? 'border-red-100 bg-red-50/30' : 'border-gray-50 hover:border-green-200 hover:bg-green-50/10 hover:shadow-xl hover:shadow-green-900/5'}`}
              >
                <div className="flex items-center gap-6 min-w-0 flex-1">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {getRoleIcon(u.role)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900 truncate text-lg">{u.name}</span>
                         {(() => {
                         const isVerified = u.providerProfile?.verifiedAt || u.donationCenterProfile?.verifiedAt;
                         if (u.status === 'SUSPENDED') return <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded">Suspended</span>;
                         if (u.status === 'PENDING') return <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-0.5 rounded animate-pulse">Pending</span>;
                         if (u.status === 'ACTIVE') {
                           if (u.role === 'CUSTOMER' || u.role === 'ADMIN' || u.role === 'SYSTEM_ADMIN') return <span className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-2 py-0.5 rounded">Active</span>;
                           return isVerified 
                             ? <span className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-2 py-0.5 rounded">Verified</span>
                             : <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Pending Verify</span>;
                         }
                         return null;
                       })()}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                       <span className="truncate">{u.email}</span>
                       <span className="w-1 h-1 bg-gray-300 rounded-full" />
                       <span className="font-bold text-gray-400 text-xs">{u.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   {u.role !== 'ADMIN' && u.role !== 'SYSTEM_ADMIN' && (
                     u.status === 'SUSPENDED' ? (
                        <button onClick={(e) => { e.stopPropagation(); unban(u.id); }} className="px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100">Restore</button>
                     ) : (
                        <div className="flex gap-2">
                           {/* Quick Verify Button */}
                           {(u.role === 'PROVIDER' || u.role === 'DONATION_CENTER') && !(u.providerProfile?.verifiedAt || u.donationCenterProfile?.verifiedAt) && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); verifyUser({ userId: u.id, role: u.role }); }} 
                               className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                             >
                               Verify Now
                             </button>
                           )}
                           <button onClick={(e) => { e.stopPropagation(); setBanTarget(u); }} className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-100">Suspend</button>
                        </div>
                     )
                   )}
                   <div className="text-gray-300 group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <span className="text-6xl mb-4 block">👻</span>
              <p className="text-gray-500 font-bold">No users match this role</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
