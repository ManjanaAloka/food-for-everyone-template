import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { io as socketIO } from 'socket.io-client';
import { Link } from 'react-router-dom';

function ProgressBar({ fulfilledQty, targetQty }: { fulfilledQty: number; targetQty: number }) {
  const displayTarget = Math.max(1, targetQty);
  const pct = Math.min(100, (fulfilledQty / displayTarget) * 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wider">
            {pct.toFixed(0)}% Donated
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-gray-800">
            {fulfilledQty} / {targetQty} Items
          </span>
        </div>
      </div>
      
      <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


export function GiveBackPage() {
  const [liveData, setLiveData] = useState<Record<string, { raised: number; donorCount: number; fulfilledQty: number }>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['donation-requests'],
    queryFn: async () => (await api.get('/donations')).data
  });

  // Socket.io: real-time donation progress
  useEffect(() => {
    const socket = socketIO(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000');
    socket.on('donation:progress', ({ requestId, raisedAmount, donorCount, fulfilledQty }: any) => {
      setLiveData(prev => ({ ...prev, [requestId]: { raised: raisedAmount, donorCount, fulfilledQty } }));
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-5 py-2 rounded-full text-sm font-semibold mb-4">
            🤝 Community Support
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Active Donation Requests
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Review specific food items requested by local donation centers. Help them reach their goals by contributing directly to these requests.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{openRequests.length}</div>
            <div className="text-sm text-gray-500 mt-1">Pending Requests</div>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-emerald-600">{fulfilledRequests.length}</div>
            <div className="text-sm text-gray-500 mt-1">Requests Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-blue-600">
              {requests.reduce((s: number, r: any) => s + Number(r.fulfilledQty || 0), 0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Units Contributed</div>
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
            <h2 className="text-xl font-bold text-gray-900 mb-5">🔴 Current Needs</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {openRequests.map((r: any) => {
                const live = liveData[r.id];
                const donors = live?.donorCount ?? r.donorCount;
                const daysLeft = r.closesAt
                  ? Math.max(0, Math.ceil((new Date(r.closesAt).getTime() - Date.now()) / 86400000))
                  : null;

                return (
                  <div key={r.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                    <div className="p-8 space-y-6">
                      {/* Header with Center Badge */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            {r.center?.image ? <img src={r.center.image} className="w-full h-full object-cover rounded-xl" /> : <span className="text-xl">🏥</span>}
                          </div>
                          <div>
                            <Link 
                              to={`/donation-centers/${r.centerId}`}
                              className="font-bold text-gray-900 hover:text-green-600 transition-colors"
                            >
                              {r.center?.name}
                            </Link>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">📍 {r.center?.city || 'Local Area'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-emerald-100">
                            Active Request
                          </span>
                          {daysLeft !== null && daysLeft <= 1 && (
                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-red-100 animate-pulse flex items-center gap-1">
                              <span>⚠️</span> Expiring Soon
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Request Content */}
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                          {r.title.replace('Fundraising for:', 'Request for:')}
                        </h3>
                        {r.description && <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{r.description}</p>}
                      </div>

                      {/* Linked listing */}
                      {r.listing && (
                        <div className="flex items-center gap-4 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 group-hover:bg-emerald-50 transition-colors">
                          <div className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm">🍱</div>
                          <div>
                            <div className="text-sm font-black text-emerald-900">{r.listing.title}</div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                              Available: {r.listing.qtyAvailable} Units
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress Section */}
                      <ProgressBar fulfilledQty={live?.fulfilledQty ?? r.fulfilledQty} targetQty={r.targetQty} />

                      {/* Meta & Button */}
                      <div className="pt-4 space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                          <span className="flex items-center gap-1.5">👥 {donors} Contributors</span>
                          <span className="flex items-center gap-1.5">⏳ {daysLeft !== null ? `${daysLeft} Days Left` : 'Ongoing'}</span>
                        </div>

                        <Link
                          to={`/listings/${r.listingId}?mode=donate`}
                          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-black rounded-2xl shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 text-sm uppercase tracking-widest"
                        >
                          💝 Help Fulfil Request
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fulfilled Requests */}
        {fulfilledRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5">✅ Recently Completed</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {fulfilledRequests.slice(0, 6).map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl border border-green-100 p-5 opacity-80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Completed</span>
                    <span className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{r.title.replace('Fundraising for:', 'Request for:')}</h4>
                  {r.center && <p className="text-xs text-gray-500">by {r.center.name}</p>}
                  <div className="mt-3 text-sm text-green-700 font-semibold">
                    {r.fulfilledQty} units provided by community members
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Are you a donation center?</h2>
          <p className="text-green-50 mb-4">Register your organization and start posting food requests to the community.</p>
          <Link to="/register" className="inline-block bg-white text-green-600 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-all">
            Register as Donation Center →
          </Link>
        </div>
      </div>
    </div>
  );
}
