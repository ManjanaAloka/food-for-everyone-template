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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingProviders'] });
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Provider approved!');
    } 
  });

  const approveCenter = useMutation({ 
    mutationFn: async (userId: string) => api.post(`/admin/centers/${userId}/approve`, {}), 
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
                    <div className="text-xs text-gray-500">Provider ID: {p.userId.slice(-8)}</div>
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
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No pending providers.</td></tr>
              )
            ) : (
              centersQ.data?.centers?.length ? centersQ.data.centers.map((c: any) => (
                <tr key={c.userId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">Center ID: {c.userId.slice(-8)}</div>
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
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No pending centers.</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}