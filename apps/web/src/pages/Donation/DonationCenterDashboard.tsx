import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const isComplete = pct >= 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Raised: LKR {raised.toFixed(0)}</span>
        <span className="font-semibold text-gray-700">Target: LKR {target.toFixed(0)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}%</div>
    </div>
  );
}

function CreateRequestModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    listingId: '',
    closesAt: ''
  });

  const { data: listingsData } = useQuery({
    queryKey: ['active-listings-mini'],
    queryFn: async () => (await api.get('/listings')).data
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/donations', {
        title: form.title,
        description: form.description || undefined,
        targetAmount: Number(form.targetAmount),
        listingId: form.listingId || undefined,
        closesAt: form.closesAt || undefined
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Donation request created!');
      queryClient.invalidateQueries({ queryKey: ['center-requests'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create request')
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-900">📝 Create Donation Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Rice and vegetables for 50 children"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to Food Listing (Optional)</label>
            <select
              value={form.listingId}
              onChange={e => {
                const lid = e.target.value;
                const listing = listingsData?.listings?.find((l: any) => l.id === lid);
                setForm({
                  ...form,
                  listingId: lid,
                  title: listing ? `Fundraising for: ${listing.title}` : form.title,
                  targetAmount: listing ? String(Number(listing.discountPrice) * 10) : form.targetAmount
                });
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">No specific listing (General fundraising)</option>
              {listingsData?.listings?.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.title} (LKR {Number(l.discountPrice).toFixed(0)}/unit)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Tell donors why this is needed..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target (LKR) *</label>
              <input
                type="number"
                value={form.targetAmount}
                onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="e.g., 5000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
              <input
                type="date"
                value={form.closesAt}
                onChange={e => setForm({ ...form, closesAt: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => create()}
            disabled={!form.title || !form.targetAmount || isPending}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
          >
            {isPending ? '⏳ Creating...' : '✅ Create Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DonationCenterDashboardPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'INCOMING'>('REQUESTS');
  const qc = useQueryClient();

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['center-requests'],
    queryFn: async () => (await api.get('/donations/center/my-requests')).data
  });

  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['center-incoming-orders'],
    queryFn: async () => (await api.get('/orders/center')).data
  });

  const confirmReceived = useMutation({
    mutationFn: async (orderId: string) => api.post(`/orders/${orderId}/confirm-received`),
    onSuccess: () => {
      toast.success('Confirmed receipt of food!');
      qc.invalidateQueries({ queryKey: ['center-incoming-orders'] });
    }
  });

  const requests = requestsData?.requests || [];
  const incomingOrders = incomingData?.orders || [];
  
  const stats = [
    { label: 'Active Requests', value: requests.filter((r: any) => r.status === 'OPEN').length, icon: '📋' },
    { label: 'Pending Deliveries', value: incomingOrders.filter((o: any) => o.status !== 'DELIVERED').length, icon: '🚚' },
    { label: 'Total Raised', value: `LKR ${requests.reduce((s: number, r: any) => s + Number(r.raisedAmount), 0).toFixed(0)}`, icon: '💰' },
    { label: 'Items Received', value: incomingOrders.filter((o: any) => o.status === 'DELIVERED').length, icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {showModal && <CreateRequestModal onClose={() => setShowModal(false)} />}

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏥 Donation Center Dashboard</h1>
            <p className="text-gray-500">Manage your requests and track incoming food donations.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-all"
          >
            + New Request
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map(s => (
            <div key={s.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'REQUESTS' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            My Fundraising Requests ({requests.length})
          </button>
          <button 
            onClick={() => setActiveTab('INCOMING')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'INCOMING' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Incoming Food Donations ({incomingOrders.length})
          </button>
        </div>

        {activeTab === 'REQUESTS' ? (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900">No requests yet</h3>
                <p className="text-gray-500">Create a fundraising request to start receiving help.</p>
              </div>
            ) : (
              requests.map((r: any) => (
                <div key={r.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{r.title}</h3>
                      <p className="text-sm text-gray-500">{r.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {r.status}
                    </span>
                  </div>
                  <ProgressBar raised={Number(r.raisedAmount)} target={Number(r.targetAmount)} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {incomingOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-900">No incoming food yet</h3>
                <p className="text-gray-500">Food donations from community members will appear here.</p>
              </div>
            ) : (
              incomingOrders.map((o: any) => (
                <div key={o.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Order #{o.id.slice(-6)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-gray-900 font-bold">
                      {o.items.map((it: any) => `${it.qty}x ${it.listing.title}`).join(', ')}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      From: <span className="font-medium text-gray-700">{o.buyer.name}</span> · {new Date(o.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {o.status !== 'DELIVERED' && (
                    <button 
                      onClick={() => confirmReceived.mutate(o.id)}
                      disabled={confirmReceived.isPending}
                      className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                    >
                      {confirmReceived.isPending ? '⏳ Confirming...' : '✅ Confirm Received'}
                    </button>
                  )}
                  {o.status === 'DELIVERED' && (
                    <div className="text-green-600 font-bold flex items-center gap-2">
                      <span>✓ Received & Verified</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
