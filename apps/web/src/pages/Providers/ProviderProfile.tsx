import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`text-xl ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-gray-600 text-sm">({count} reviews)</span>
    </div>
  );
}

function getUrgencyInfo(expiresAt: string) {
  const diffHours = (new Date(expiresAt).getTime() - Date.now()) / 3600000;
  if (diffHours <= 0) return null;
  if (diffHours <= 24) return { label: 'Expiring Soon 🔴', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (diffHours <= 72) return { label: 'Almost Gone 🟠', cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  return null;
}

export function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();

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
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  const provider = providerData?.provider;
  if (!provider) return (
    <div className="min-h-screen pt-20 flex items-center justify-center text-center">
      <div>
        <div className="text-5xl mb-3">🏪</div>
        <p className="text-gray-500">Provider not found</p>
        <Link to="/providers" className="text-green-600 hover:underline mt-2 block">← All Providers</Link>
      </div>
    </div>
  );

  const listings = listingsData?.listings || [];
  const reviews = reviewsData?.reviews || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {/* Provider Hero Banner */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0 shadow-lg">
              🏪
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold mb-1">{provider.businessName}</h1>
              {provider.city && (
                <p className="text-green-100 flex items-center gap-1 justify-center sm:justify-start">
                  <span>📍</span><span>{provider.city}</span>
                </p>
              )}
              {provider.address && (
                <p className="text-green-200 text-sm mt-1">{provider.address}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{provider.ratingAvg?.toFixed(1) || '—'}</div>
                  <div className="text-xs text-green-100">Rating</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{provider.ratingCount || 0}</div>
                  <div className="text-xs text-green-100">Reviews</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{listings.length}</div>
                  <div className="text-xs text-green-100">Active Listings</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Listings */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🛒 Available Now</h2>
          {listLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-xl h-52 border border-gray-100" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">🈳</div>
              <p className="text-gray-500">No active listings right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listings.map((l: any) => {
                const urgency = getUrgencyInfo(l.expiresAt);
                const discPct = Math.round((1 - Number(l.discountPrice)/Number(l.unitPrice)) * 100);
                const imgs: string[] = Array.isArray(l.images) ? l.images : l.images ? JSON.parse(l.images) : [];
                return (
                  <Link key={l.id} to={`/listings/${l.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group"
                  >
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {imgs[0] ? (
                        <img src={imgs[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-5xl">🍱</span>
                      )}
                      {urgency && (
                        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full border ${urgency.cls}`}>
                          {urgency.label}
                        </span>
                      )}
                      {discPct > 0 && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discPct}%</span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-gray-900 truncate">{l.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-green-600 font-bold">LKR {Number(l.discountPrice).toFixed(0)}</span>
                        {discPct > 0 && <span className="text-gray-400 line-through text-sm">LKR {Number(l.unitPrice).toFixed(0)}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Stock: {l.qtyAvailable}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ⭐ Customer Reviews
          </h2>
          {provider.ratingCount > 0 && (
            <div className="mb-4">
              <StarRating rating={provider.ratingAvg} count={provider.ratingCount} />
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500">No approved reviews yet. Complete an order to leave one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                        {r.reviewer?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{r.reviewer?.name || 'Anonymous'}</div>
                        <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={`text-lg ${i <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  {r.providerResponse && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-700 mb-1">🏪 Provider Response:</div>
                      <p className="text-xs text-blue-600">{r.providerResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
