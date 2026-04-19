import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function ApprovalsPage() {
  const qc = useQueryClient();
  const providersQ = useQuery({ queryKey: ['pendingProviders'], queryFn: async () => (await api.get('/admin/pending/providers')).data });
  const centersQ = useQuery({ queryKey: ['pendingCenters'], queryFn: async () => (await api.get('/admin/pending/centers')).data });

  const approveProvider = useMutation({ mutationFn: async (userId: string) => api.post(`/admin/providers/${userId}/approve`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingProviders'] }) });
  const approveCenter = useMutation({ mutationFn: async (userId: string) => api.post(`/admin/centers/${userId}/approve`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingCenters'] }) });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Pending Service Providers</h2>
        <div className="space-y-2">
          {providersQ.data?.providers?.length ? providersQ.data.providers.map((p: any) => (
            <div key={p.userId} className="border rounded p-3 flex items-center justify-between">
              <div><div className="font-medium">{p.businessName}</div><div className="text-xs">{p.user.email}</div></div>
              <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={()=>approveProvider.mutate(p.userId)}>Approve</button>
            </div>
          )) : <div>No pending providers.</div>}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Pending Donation Centers</h2>
        <div className="space-y-2">
          {centersQ.data?.centers?.length ? centersQ.data.centers.map((c: any) => (
            <div key={c.userId} className="border rounded p-3 flex items-center justify-between">
              <div><div className="font-medium">{c.name}</div><div className="text-xs">{c.user.email}</div></div>
              <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={()=>approveCenter.mutate(c.userId)}>Approve</button>
            </div>
          )) : <div>No pending centers.</div>}
        </div>
      </div>
    </div>
  );
}