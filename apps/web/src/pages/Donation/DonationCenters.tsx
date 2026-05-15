import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useAuth } from '../../state/auth';
import { Link } from 'react-router-dom';

export function DonationCentersPage() {
  const { user } = useAuth();
  const centers = useQuery({ queryKey: ['centers'], queryFn: async () => (await api.get('/donation-centers')).data });
  const requests = useQuery({ queryKey: ['requests'], queryFn: async () => (await api.get('/donation-centers/requests')).data });
  const stories = useQuery({ queryKey: ['global-stories'], queryFn: async () => (await api.get('/public/latest-stories')).data });
  const [activeTab, setActiveTab] = useState<'centers' | 'requests' | 'stories'>('centers');

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-orange-100 rounded-full px-6 py-2 mb-4">
            <span className="text-orange-700 font-semibold text-sm">❤️ Giving Back</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Donation Centers</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Connect with local donation centers and help ensure surplus food reaches those in need.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('centers')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'centers'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🏥 Donation Centers
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Active Requests
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'stories'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📸 Community Impact
          </button>
        </div>

        {/* Centers Tab */}
        {activeTab === 'centers' && (
          <div>
            {centers.isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 mt-4">Loading centers...</p>
              </div>
            ) : centers.data?.centers?.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">🏥</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No centers yet</h2>
                <p className="text-gray-600">Check back soon for donation centers in your area.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centers.data?.centers?.map((c: any) => (
                  <Link
                    key={c.userId}
                    to={`/donation-centers/${c.userId}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all group block"
                  >
                    {/* Center Icon */}
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-3xl">{c.image ? <img src={c.image} className="w-full h-full object-cover rounded-2xl" /> : '🏥'}</span>
                    </div>

                    {/* Center Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">{c.name}</h3>

                    {/* Address */}
                    {c.address && (
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-gray-400 mt-1">📍</span>
                        <p className="text-sm text-gray-600 line-clamp-1">{c.address}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">View Impact →</span>
                      {c.verifiedAt && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          <span>✓ Verified</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {requests.isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 mt-4">Loading requests...</p>
              </div>
            ) : requests.data?.requests?.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No active requests</h2>
                <p className="text-gray-600">There are no donation requests at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requests.data?.requests?.map((r: any) => {
                  const displayTarget = Math.max(1, r.targetQty);
                  const progress = Math.min(100, (r.fulfilledQty / displayTarget) * 100);
                  const isComplete = r.fulfilledQty >= displayTarget;

                  const expiryDate = r.closesAt ? new Date(r.closesAt) : (r.listing?.expiresAt ? new Date(r.listing.expiresAt) : null);
                  const isExpiringSoon = expiryDate && !isComplete && (expiryDate.getTime() - new Date().getTime()) < (24 * 60 * 60 * 1000) && (expiryDate.getTime() > new Date().getTime());

                  return (
                    <div
                      key={r.id}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Top Status Row */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                             r.status === 'OPEN' 
                               ? 'bg-green-50 text-green-600 border-green-100' 
                               : 'bg-blue-50 text-blue-600 border-blue-100'
                           }`}>
                             {r.status}
                           </span>
                           {isExpiringSoon && (
                              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md bg-red-50 text-red-600 border border-red-100 animate-pulse flex items-center gap-1">
                                ⚠️ Expiring
                              </span>
                           )}
                           {isComplete && <span className="text-sm">✅</span>}
                        </div>
                        {r.listing && (
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            Linked: {r.listing.title}
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-green-600 transition-colors leading-tight">
                        {r.title.replace('Fundraising for:', 'Request for:') || `Donation Need: ${r.listing?.title}`}
                      </h3>
                      {r.description && (
                        <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed italic">
                          "{r.description}"
                        </p>
                      )}

                      {/* Premium Progress Bar */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                            {progress.toFixed(0)}% Contribution
                          </span>
                          <span className="text-sm font-black text-gray-800">
                            {r.fulfilledQty} <span className="text-gray-400 font-medium">/ {r.targetQty} Items</span>
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${
                              isComplete ? 'bg-gradient-to-r from-green-400 to-emerald-600' : 'bg-gradient-to-r from-orange-400 to-red-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        {r.center && (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-sm">
                              {r.center.image ? <img src={r.center.image} className="w-full h-full object-cover rounded-lg" /> : '🏥'}
                            </div>
                            <span className="text-xs font-bold text-gray-600">{r.center.name}</span>
                          </div>
                        )}
                        <Link 
                          to={`/listings/${r.listingId}?mode=donate`}
                          className="text-xs font-black text-green-600 hover:underline uppercase tracking-widest"
                        >
                          Help Now →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stories Tab */}
        {activeTab === 'stories' && (
          <div>
            {stories.isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-gray-600 mt-4">Loading impact stories...</p>
              </div>
            ) : stories.data?.activities?.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📸</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No stories yet</h2>
                <p className="text-gray-600">Donation centers haven't shared any activities yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {stories.data?.activities?.map((a: any) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">
                          {a.center.image ? <img src={a.center.image} className="w-full h-full object-cover rounded-full" alt="" /> : '🏥'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-none mb-1">{a.center.name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Link 
                        to={`/donation-centers/${a.center.userId}`}
                        className="text-xs font-bold text-orange-600 hover:underline"
                      >
                        Visit Center →
                      </Link>
                    </div>
                    <div className="p-6">
                      {a.request && (
                        <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold border border-orange-100 uppercase tracking-widest">
                          <span>🤝</span> {a.request.title.replace('Fundraising for:', '')}
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{a.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">{a.content}</p>
                    </div>
                    <div className="mt-auto border-t border-gray-50">
                       <CentersImageGrid images={a.images || []} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        {user?.role !== 'DONATION_CENTER' && (
          <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-3">🤝 Help Make a Difference</h2>
              <p className="text-orange-100 mb-6">
                When you donate food through our platform, you're helping fight hunger in your community while reducing food waste.
              </p>
              <a
                href="/browse"
                className="inline-block px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
              >
                Browse Food to Donate
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CentersImageGrid({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  
  if (images.length === 1) {
    return <img src={images[0]} className="w-full h-64 object-cover" alt="Story" />;
  }
  
  return (
    <div className="grid grid-cols-2 gap-0.5 h-64">
      <img src={images[0]} className="w-full h-full object-cover" alt="Story" />
      <div className="relative h-full">
        <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="Story" />
        {images.length > 2 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
            +{images.length - 2}
          </div>
        )}
      </div>
    </div>
  );
}
