import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { io as socketIO } from 'socket.io-client';

function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">Raised</span>
        <span className="font-semibold text-gray-900">LKR {raised.toFixed(0)} / {target.toFixed(0)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-500 mt-0.5">{pct.toFixed(0)}% funded</div>
    </div>
  );
}

function DonateModal({ request, onClose }: { request: any; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const presets = [100, 250, 500, 1000];
  const { user } = useAuth();

  const { mutate: donate, isPending } = useMutation({
    mutationFn: async (amt: number) => {
      const res = await api.post(`/donations/${request.id}/checkout`, { amount: amt });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || 'Failed to process donation');
    }
  });

  if (!user) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h3 className="text-xl font-bold mb-2">Login Required</h3>
        <p className="text-gray-600 mb-4">Please login to make a donation.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          <a href="/login" className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-center">Login</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">❤️ Make a Donation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-gray-600 text-sm mb-4">Supporting: <strong>{request.title}</strong></p>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Quick amounts:</div>
          <div className="grid grid-cols-4 gap-2">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                className={`py-2 rounded-lg text-sm font-semibold border transition-all ${amount === String(p) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300 text-gray-700'}`}
              >
                LKR {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom amount (LKR)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount..."
            min="10"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => donate(Number(amount))}
            disabled={!amount || Number(amount) < 10 || isPending}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? '⏳ Processing...' : `💳 Donate LKR ${amount || '—'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GiveBackPage() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [liveData, setLiveData] = useState<Record<string, { raised: number; donorCount: number }>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['donation-requests'],
    queryFn: async () => (await api.get('/donations')).data
  });

  // Socket.io: real-time donation progress
  useEffect(() => {
    const socket = socketIO(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000');
    socket.on('donation:progress', ({ requestId, raisedAmount, donorCount }: any) => {
      setLiveData(prev => ({ ...prev, [requestId]: { raised: raisedAmount, donorCount } }));
    });
    socket.on('donation:fulfilled', ({ requestId }: any) => {
      toast.success('🎉 A donation request has been fully funded!');
      queryClient.invalidateQueries({ queryKey: ['donation-requests'] });
    });
    return () => { socket.disconnect(); };
  }, [queryClient]);

  const requests = data?.requests || [];
  const openRequests = requests.filter((r: any) => r.status === 'OPEN');
  const fulfilledRequests = requests.filter((r: any) => r.status === 'FULFILLED');

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {selectedRequest && (
        <DonateModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-5 py-2 rounded-full text-sm font-semibold mb-4">
            ❤️ Give Back
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Help Feed a Community
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Donation centers post requests for food. Your contribution helps purchase and deliver meals to those who need it most.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-orange-600">{openRequests.length}</div>
            <div className="text-sm text-gray-500 mt-1">Active Requests</div>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{fulfilledRequests.length}</div>
            <div className="text-sm text-gray-500 mt-1">Requests Fulfilled</div>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">
              {requests.reduce((s: number, r: any) => s + Number(r.raisedAmount || 0), 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">LKR Raised Total</div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-64 border border-gray-100" />
            ))}
          </div>
        )}

        {/* Active Requests */}
        {!isLoading && openRequests.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No active donation requests</h2>
            <p className="text-gray-500">Check back soon — donation centers will post new requests!</p>
          </div>
        )}

        {openRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5">🔴 Active Requests</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {openRequests.map((r: any) => {
                const live = liveData[r.id];
                const raised = live?.raised ?? Number(r.raisedAmount);
                const donors = live?.donorCount ?? r.donorCount;
                const target = Number(r.targetAmount);
                const daysLeft = r.closesAt
                  ? Math.max(0, Math.ceil((new Date(r.closesAt).getTime() - Date.now()) / 86400000))
                  : null;

                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6">
                    {/* Center name */}
                    {r.center && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🏥</span>
                        <span className="text-sm font-medium text-gray-600">{r.center.name}</span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{r.title}</h3>
                    {r.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{r.description}</p>}

                    {/* Linked listing */}
                    {r.listing && (
                      <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
                        <span className="text-2xl">🛒</span>
                        <div>
                          <div className="text-sm font-semibold text-green-800">{r.listing.title}</div>
                          <div className="text-xs text-green-600">LKR {Number(r.listing.discountPrice).toFixed(0)} per unit</div>
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <ProgressBar raised={raised} target={target} />
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-5">
                      <span>👥 {donors} donor{donors !== 1 ? 's' : ''}</span>
                      {daysLeft !== null && <span>⏳ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>}
                    </div>

                    <button
                      onClick={() => setSelectedRequest(r)}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-md shadow-orange-200"
                    >
                      ❤️ Donate Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fulfilled Requests */}
        {fulfilledRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5">✅ Recently Fulfilled</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {fulfilledRequests.slice(0, 6).map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl border border-green-100 p-5 opacity-80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Fulfilled</span>
                    <span className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{r.title}</h4>
                  {r.center && <p className="text-xs text-gray-500">by {r.center.name}</p>}
                  <div className="mt-3 text-sm text-green-700 font-semibold">
                    LKR {Number(r.raisedAmount).toFixed(0)} raised by {r.donorCount} donors
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Are you a donation center?</h2>
          <p className="text-orange-100 mb-4">Register your organization and start posting food requests to the community.</p>
          <a href="/register" className="inline-block bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-all">
            Register as Donation Center →
          </a>
        </div>
      </div>
    </div>
  );
}
