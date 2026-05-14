import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export function ApprovalsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PROVIDERS' | 'CENTERS'>('PROVIDERS');

  const providersQ = useQuery({ 
    queryKey: ['pendingProviders'], 
    queryFn: async () => (await api.get('/admin/pending/providers')).data 
  });
  
  const centersQ = useQuery({ 
    queryKey: ['pendingCenters'], 
    queryFn: async () => (await api.get('/admin/pending/centers')).data 
  });

  const approveProvider = useMutation({ 
    mutationFn: async (userId: string) => api.post(`/admin/providers/${userId}/approve`, {}), 
    onMutate: async (userId: string) => {
      await qc.cancelQueries({ queryKey: ['pendingProviders'] });
      const previous = qc.getQueryData(['pendingProviders']);
      qc.setQueryData(['pendingProviders'], (old: any) => ({
        ...old,
        providers: old?.providers?.filter((p: any) => p.userId !== userId)
      }));
      return { previous };
    },
    onError: (_err, _userId, context: any) => {
      qc.setQueryData(['pendingProviders'], context.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingProviders'] });
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Provider approved!');
    } 
  });

  const approveCenter = useMutation({ 
    mutationFn: async (userId: string) => api.post(`/admin/centers/${userId}/approve`, {}), 
    onMutate: async (userId: string) => {
      await qc.cancelQueries({ queryKey: ['pendingCenters'] });
      const previous = qc.getQueryData(['pendingCenters']);
      qc.setQueryData(['pendingCenters'], (old: any) => ({
        ...old,
        centers: old?.centers?.filter((c: any) => c.userId !== userId)
      }));
      return { previous };
    },
    onError: (_err, _userId, context: any) => {
      qc.setQueryData(['pendingCenters'], context.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingCenters'] });
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Donation center approved!');
    } 
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'PROVIDERS' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}
        >
          Service Providers ({providersQ.data?.providers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('CENTERS')}
          className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'CENTERS' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}
        >
          Donation Centers ({centersQ.data?.centers?.length || 0})
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Name / Business</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">BR / Reg No</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Location</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Email</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Joined Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeTab === 'PROVIDERS' ? (
              providersQ.data?.providers?.length ? providersQ.data.providers.map((p: any) => (
                <tr key={p.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{p.businessName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">ID: {p.userId.slice(-8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold border border-blue-100">
                      {p.brNo || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 max-w-[200px] truncate" title={p.address}>
                      {p.address || 'No address'}
                    </div>
                    {p.lat && p.lng && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        📍 View on Map
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => approveProvider.mutate(p.userId)}
                      disabled={approveProvider.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-100 transition-all disabled:opacity-50"
                    >
                      {approveProvider.isPending ? '...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No pending providers found.</td></tr>
              )
            ) : (
              centersQ.data?.centers?.length ? centersQ.data.centers.map((c: any) => (
                <tr key={c.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">ID: {c.userId.slice(-8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold border border-purple-100">
                      {c.registrationNo || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 max-w-[200px] truncate" title={c.address}>
                      {c.address || 'No address'}
                    </div>
                    {c.lat && c.lng && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        📍 View on Map
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => approveCenter.mutate(c.userId)}
                      disabled={approveCenter.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-100 transition-all disabled:opacity-50"
                    >
                      {approveCenter.isPending ? '...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No pending donation centers found.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}