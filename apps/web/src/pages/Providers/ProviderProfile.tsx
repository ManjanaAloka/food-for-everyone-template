import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useState } from 'react';

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`text-xl ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-400'}`}>★</span>
        ))}
      </div>
      <span className="text-white font-bold text-sm">{rating?.toFixed(1) || '0.0'} <span className="font-normal opacity-70">({count} reviews)</span></span>
    </div>
  );
}

function getUrgencyInfo(expiresAt: string) {
  const diffHours = (new Date(expiresAt).getTime() - Date.now()) / 3600000;
  if (diffHours <= 0) return { label: 'Expired', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (diffHours <= 24) return { label: 'Expiring Soon', cls: 'bg-red-600 text-white border-red-700 shadow-sm' };
  if (diffHours <= 72) return { label: 'Almost Gone', cls: 'bg-orange-500 text-white border-orange-600 shadow-sm' };
  return { label: 'Fresh Stock', cls: 'bg-green-600 text-white border-green-700 shadow-sm' };
}

export function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  const { data: providerData, isLoading: provLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: async () => (await api.get(`/providers/${id}`)).data
  });

  const { data: listingsData, isLoading: listLoading } = useQuery({
    queryKey: ['provider-listings', id],
    queryFn: async () => (await api.get(`/listings?providerId=${id}`)).data
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['provider-reviews', id],
    queryFn: async () => (await api.get(`/reviews/provider/${id}`)).data
  });

  if (provLoading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50">
      <div className="animate-pulse space-y-6 w-full max-w-5xl px-6">
        <div className="h-64 bg-gray-200 rounded-[2rem]" />
        <div className="h-10 bg-gray-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  const provider = providerData?.provider;
  if (!provider) return (
    <div className="min-h-screen pt-20 flex items-center justify-center text-center bg-gray-50">
      <div className="animate-in fade-in zoom-in duration-500">
        <div className="text-8xl mb-6">🏪</div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Provider not found</h2>
        <p className="text-gray-500 mb-8 max-w-md">This business profile might be unavailable or the link is incorrect.</p>
        <Link to="/browse" className="px-8 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/30">
          Explore All Food
        </Link>
      </div>
    </div>
  );

  const listings = listingsData?.listings || [];
  const reviews = reviewsData?.reviews || [];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Premium Hero Section */}
      <div className="relative pt-24 pb-12 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/40 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 animate-blob" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-200/40 blur-[100px] rounded-full translate-y-1/4 -translate-x-1/4 animate-blob animation-delay-2000" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="bg-gradient-to-br from-gray-900 to-green-950 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
            {/* Texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative">
              {/* Profile Icon */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-6xl md:text-7xl flex-shrink-0 border border-white/20 shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
                🏪
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 justify-center md:justify-start">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight">{provider.businessName}</h1>
                  <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest self-center md:self-auto">
                    Verified Partner
                  </span>
                </div>
                
                <div className="space-y-3 mb-8">
                  <p className="text-xl text-green-100/80 font-medium flex items-center gap-2 justify-center md:justify-start">
                    <span className="text-2xl">📍</span> {provider.city || 'Sri Lanka'}
                  </p>
                  {provider.address && (
                    <p className="text-sm text-white/60 max-w-xl mx-auto md:mx-0">{provider.address}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <StarRating rating={provider.ratingAvg} count={provider.ratingCount} />
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <span className="text-2xl">📦</span>
                    <span className="text-white font-bold text-sm">{listings.length} <span className="font-normal opacity-70">Active Items</span></span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 w-72 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-4 text-center">Contact & Info</h3>
                <div className="space-y-4">
                  {provider.user?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">📞</div>
                      <div className="text-[10px]"><div className="font-bold text-white">Phone</div><div className="opacity-80 text-white/80">{provider.user.phone}</div></div>
                    </div>
                  )}
                  {provider.user?.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">✉️</div>
                      <div className="text-[10px] w-40 truncate"><div className="font-bold text-white">Email</div><div className="opacity-80 text-white/80 truncate">{provider.user.email}</div></div>
                    </div>
                  )}
                  {provider.address && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">📍</div>
                      <div className="text-[10px] w-40"><div className="font-bold text-white">Location</div><div className="opacity-80 text-white/80 leading-tight">{provider.address}</div></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2 mt-2 border-t border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">🚚</div>
                    <div className="text-[10px]"><div className="font-bold text-white">Delivery</div><div className="opacity-80 text-white/80">Pick-up only</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mb-10 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'listings' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Available Food ({listings.length})
            {activeTab === 'listings' && <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'reviews' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Reviews ({reviews.length})
            {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-full" />}
          </button>
        </div>

        {activeTab === 'listings' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {listLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-white rounded-3xl h-80 shadow-sm" />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-sm border border-gray-100">
                <div className="text-9xl mb-8">🍲</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No active listings</h3>
                <p className="text-gray-500">Check back later for fresh surplus food from this provider.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {listings.map((l: any) => {
                  const urgency = getUrgencyInfo(l.expiresAt);
                  const discPct = Math.round((1 - Number(l.discountPrice)/Number(l.unitPrice)) * 100);
                  const imgs: string[] = Array.isArray(l.images) ? l.images : l.images ? JSON.parse(l.images) : [];
                  
                  return (
                    <Link 
                      key={l.id} 
                      to={`/listings/${l.id}`}
                      className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 group"
                    >
                      <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                        {imgs[0] ? (
                          <img src={imgs[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <span className="text-6xl group-hover:scale-125 transition-transform duration-700">🥗</span>
                        )}
                        
                        {/* Status Tags */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {urgency && (
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${urgency.cls}`}>
                              {urgency.label}
                            </span>
                          )}
                          {discPct > 0 && (
                            <span className="bg-white/90 backdrop-blur-md text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                              -{discPct}% OFF
                            </span>
                          )}
                        </div>
                        
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
                            Stock: {l.qtyAvailable}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors truncate mb-2">{l.title}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-green-600">LKR {Number(l.discountPrice).toFixed(0)}</span>
                          {discPct > 0 && (
                            <span className="text-sm text-gray-400 line-through font-medium">LKR {Number(l.unitPrice).toFixed(0)}</span>
                          )}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{l.category}</span>
                          <span className="text-green-600 font-bold text-sm group-hover:translate-x-1 transition-transform">View Details →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-sm border border-gray-100">
                <div className="text-9xl mb-8">⭐</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500">Be the first to review this provider after your first order!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-50 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center text-xl font-black text-green-700 shadow-inner">
                          {r.reviewer?.name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{r.reviewer?.name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-400 font-medium">{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 bg-gray-50 px-3 py-2 rounded-xl">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`text-2xl ${i <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed text-lg italic">"{r.comment}"</p>
                    
                    {r.providerResponse && (
                      <div className="mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50 relative">
                        <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          Business Response
                        </div>
                        <p className="text-blue-800 font-medium">
                          {r.providerResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
