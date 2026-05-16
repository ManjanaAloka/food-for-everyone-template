import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../state/auth';
import { 
  IoShieldOutline, IoCloseOutline, IoCheckmarkOutline, 
  IoAddOutline, IoTrashOutline, IoPersonOutline, IoBulbOutline 
} from 'react-icons/io5';

type AdminForm = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'SYSTEM_ADMIN' | 'MANAGER';
  allowedTabs: string[];
};

const AVAILABLE_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'approvals', label: 'Approvals', icon: '⏳' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'listings', label: 'Listings', icon: '🍽️' },
  { id: 'audit', label: 'Audit Log', icon: '📜' },
];

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdminForm>({
    defaultValues: { role: 'ADMIN', allowedTabs: ['overview'] }
  });

  const selectedTabs = watch('allowedTabs') || [];

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: AdminForm) => api.post('/admin/users', {
      ...data,
      permissions: { allowedTabs: data.allowedTabs }
    }),
    onSuccess: () => {
      toast.success('Administrative user created successfully');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create admin')
  });

  const toggleTab = (id: string) => {
    if (selectedTabs.includes(id)) {
      setValue('allowedTabs', selectedTabs.filter(t => t !== id));
    } else {
      setValue('allowedTabs', [...selectedTabs, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fadeInUp max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><IoShieldOutline className="text-blue-500" /> Create New Admin</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl"><IoCloseOutline /></button>
        </div>
        
        <form onSubmit={handleSubmit((d) => create(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input 
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="e.g. John Doe"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input 
                {...register('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="admin@freshsave.com"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password"
                {...register('password', { required: 'Password is required', minLength: 6 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Administrative Role</label>
            <select 
              {...register('role')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none bg-white"
            >
              <option value="ADMIN">Normal Admin</option>
              <option value="SYSTEM_ADMIN">Super Admin (System)</option>
              <option value="MANAGER">Content Manager</option>
            </select>
          </div>

          {watch('role') !== 'SYSTEM_ADMIN' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Allowed Access Tabs</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TABS.map(tab => (
                  <div 
                    key={tab.id}
                    onClick={() => toggleTab(tab.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedTabs.includes(tab.id) 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                      selectedTabs.includes(tab.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                    }`}>
                      {selectedTabs.includes(tab.id) && <span className="text-lg"><IoCheckmarkOutline /></span>}
                    </div>
                    <span className="text-xs font-bold">{tab.icon} {tab.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SYSTEM_ADMIN';
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const usersQ = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/admin/users')).data
  });

  const { mutate: deleteAdmin, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('Admin user removed successfully');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to delete')
  });

  const admins = usersQ.data?.users?.filter((u: any) => 
    ['ADMIN', 'SYSTEM_ADMIN', 'MANAGER'].includes(u.role)
  ) || [];

  return (
    <div className="space-y-6">
      {showModal && <CreateAdminModal onClose={() => setShowModal(false)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-500 text-sm">Control administrative access and tab permissions</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2 self-start"
          >
            <span className="flex items-center gap-1"><IoAddOutline /> Add New Admin</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg"><IoShieldOutline /></span>
            Administrative Team
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white">
                <th className="px-8 py-4">Administrator</th>
                <th className="px-8 py-4">Role</th>
                <th className="px-8 py-4">Tab Access</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usersQ.isLoading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6 bg-gray-50/20" />
                  </tr>
                ))
              ) : admins.length > 0 ? (
                admins.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-xl flex items-center justify-center font-bold shadow-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        u.role === 'SYSTEM_ADMIN' ? 'bg-indigo-100 text-indigo-600' :
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {u.role === 'SYSTEM_ADMIN' ? (
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                          Full Access
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {(u.permissions?.allowedTabs || []).length > 0 ? (
                             u.permissions.allowedTabs.map((t: string) => (
                               <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase border border-gray-200">
                                 {t}
                               </span>
                             ))
                          ) : (
                             <span className="text-xs text-gray-400 italic">No tabs assigned</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {isSuperAdmin && u.id !== user?.id ? (
                        <button 
                          onClick={() => { if(confirm(`Remove admin access for ${u.name}?`)) deleteAdmin(u.id) }}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                        >
                          <span className="flex items-center gap-1"><IoTrashOutline /> Remove</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 italic">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="text-4xl mb-2 flex justify-center text-gray-300"><IoPersonOutline /></div>
                    <p className="text-gray-500 font-bold">No administrative users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <span className="text-2xl flex items-center justify-center text-yellow-500"><IoBulbOutline /></span>
        <div>
          <h4 className="font-bold text-blue-900 text-sm mb-1">Super Admin Exclusive</h4>
          <p className="text-blue-700 text-xs leading-relaxed">
            Only Super Admins can manage other administrators and delete accounts. 
            Granular permissions allow you to restrict specific tabs for Normal Admins and Managers to maintain system security.
          </p>
        </div>
      </div>
    </div>
  );
}
