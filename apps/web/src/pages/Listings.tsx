import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState, useEffect } from 'react';
import { useCart } from '../state/cart';
import { useAuth } from '../state/auth';
import { io } from 'socket.io-client';
import { WS_URL } from '../env';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ListingsMap } from '../components/ListingsMap';
import { IoGridOutline, IoMapOutline, IoCartOutline } from 'react-icons/io5';


function getUrgencyBadge(expiresAt: string) {
  const diffHours = (new Date(expiresAt).getTime() - Date.now()) / 3600000;
  if (diffHours <= 0) return null;
  if (diffHours <= 24) return { label: 'Expiring Soon 🔴', cls: 'bg-red-500 text-white' };
  if (diffHours <= 72) return { label: 'Almost Gone 🟠', cls: 'bg-orange-500 text-white' };
  return null;
}

export function ListingsPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('provider');
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');
  const initialRadius = searchParams.get('radius');

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [urgency, setUrgency] = useState('');
  const [sort, setSort] = useState('soonest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: Number(initialLat), lng: Number(initialLng) } : null
  );
  const [radius, setRadius] = useState<string>(initialRadius || '');
  const { add } = useCart();
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings', q, providerId, category, city, urgency, sort, userLocation, radius],
    queryFn: async () => {
      const params: any = {};
      if (q) params.q = q;
      if (providerId) params.providerId = providerId;
      if (category) params.category = category;
      if (city) params.city = city;
      if (urgency) params.urgency = urgency;
      if (sort) params.sort = sort;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        if (radius) params.radius = radius;
      }
      return (await api.get('/listings', { params })).data;
    }
  });

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket'] });
    socket.on('listing:new', () => refetch());
    socket.on('listings:refresh', () => refetch());
    return () => { socket.disconnect(); };
  }, [refetch]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 ${user ? 'pt-4' : 'pt-20'} pb-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block bg-green-100 rounded-full px-4 sm:px-6 py-2 mb-3 sm:mb-4">
                <span className="text-green-700 font-semibold text-xs sm:text-sm">🍔 Available Food</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                {providerId ? 'Browse Provider Food' : 'Browse Available Food'}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl">
                {providerId ? 'Food from this provider' : 'Discover surplus food from local businesses and save money while reducing waste'}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm self-start">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-green-600'}`}
              >
                <span className="text-lg"><IoGridOutline /></span> Grid
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-green-600'}`}
              >
                <span className="text-lg"><IoMapOutline /></span> Map
              </button>
            </div>
          </div>

          {providerId && (
            <button
              onClick={() => window.location.href = '/browse'}
              className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all"
            >
              ← View All Providers
            </button>
          )}

        {/* Search & Filters */}


        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <input 
              value={q} 
              onChange={(e)=>setQ(e.target.value)} 
              placeholder="Search food, restaurants, categories..." 
              className="w-full sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-2.5 font-medium rounded-lg transition-colors flex justify-center items-center gap-2 ${showFilters ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ⚙️ Filters {(category || city || urgency || radius) && <span className="w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">All Categories</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Bakery">Bakery</option>
                <option value="Prepared Meals">Prepared Meals</option>
                <option value="Dairy">Dairy</option>
              </select>
              
              <select 
                value={city} 
                onChange={e => setCity(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">All Locations</option>
                <option value="Colombo">Colombo</option>
                <option value="Kandy">Kandy</option>
                <option value="Galle">Galle</option>
                <option value="Jaffna">Jaffna</option>
                <option value="Matara">Matara</option>
                <option value="Mawanella">Mawanella</option>
                <option value="Negombo">Negombo</option>
                <option value="Ratnapura">Ratnapura</option>
              </select>
              
              <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
                <option value="">Any Time</option>
                <option value="expiring-soon">Expiring Soon (&lt; 24h)</option>
                <option value="almost-gone">Almost Gone (&lt; 3d)</option>
              </select>

              <select value={sort} onChange={e => setSort(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white">
                <option value="soonest">Soonest Expiry</option>
                <option value="newest">Newly Added</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">

                <button
                  onClick={() => {
                    if (userLocation) {
                      setUserLocation(null);
                      setRadius('');
                    } else {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        (err) => alert('Please enable location access to use this feature.')
                      );
                    }
                  }}
                  className={`flex-1 sm:w-48 px-4 py-3 rounded-xl font-bold text-sm transition-all border shadow-sm flex items-center justify-center gap-2 ${userLocation ? 'bg-green-600 text-white border-green-600 shadow-green-100' : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'}`}
                >
                  {userLocation ? '📍 My Location Set' : '📍 Set My Location'}
                </button>
                {userLocation && (
                  <div className="flex-[2] flex flex-col gap-2 p-3 bg-green-50/50 rounded-xl border border-green-100 shadow-inner">

                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Search Radius</span>
                      <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-black rounded-full shadow-sm">
                        {radius || '25'} km
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      step="1"
                      value={radius || '25'} 
                      onChange={e => setRadius(e.target.value)}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 hover:accent-green-700 transition-all"
                    />
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold px-1">
                      <span>1 KM</span>
                      <span>50 KM</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>


        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading delicious food...</p>
          </div>
        ) : (
          <div className="animate-fadeIn">

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data?.listings?.map((l: any) => (
                  <div key={l.id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                      {l.images?.[0] ? (
                        <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">🍲</span>
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-gray-700 shadow-lg">
                        {l.category}
                      </div>
                      {/* Discount Badge */}
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg">
                        {Math.round((1 - Number(l.discountPrice) / Number(l.unitPrice)) * 100)}% OFF
                      </div>
                    {/* Urgency Badge */}
                      {(() => { const u = getUrgencyBadge(l.expiresAt); return u ? <div className={`absolute bottom-3 left-3 ${u.cls} rounded-full px-2 py-0.5 text-xs font-bold shadow`}>{u.label}</div> : null; })()}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col gap-1 mb-2">
                        <Link to={`/listings/${l.id}`}>
                          <h3 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-1 hover:text-green-600 transition-colors">{l.title}</h3>
                        </Link>
                        {l.provider && (
                          <div className="flex items-center justify-between text-xs font-medium">
                            <Link to={`/providers/${l.providerId}`} className="text-emerald-600 hover:underline">
                              🏪 {l.provider.businessName}
                            </Link>
                            <div className="flex items-center gap-1 text-gray-500">
                              <span>⭐</span>
                              <span>{l.provider.ratingAvg?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Description */}
                      {l.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{l.description}</p>
                      )}

                      {/* Price */}
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xl sm:text-2xl font-bold text-green-600">LKR {Number(l.discountPrice).toFixed(2)}</span>
                          <span className="text-xs sm:text-sm text-gray-500 line-through">LKR {Number(l.unitPrice).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Stock & Expires */}
                      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <span>📦</span>
                          <span>{l.qtyAvailable} available</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <span>⏰</span>
                          <span>Expires: {new Date(l.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {user?.role === 'DONATION_CENTER' ? (
                          <Link
                            to={`/listings/${l.id}`}
                            className="block text-center w-full px-4 py-2.5 sm:py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-lg transition-colors border border-orange-200"
                          >
                            🏥 Request Donation
                          </Link>
                        ) : (
                          <>
                            <div className="flex flex-col gap-2">
                              <button 
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm font-bold rounded-xl hover:shadow-lg transform active:scale-95 transition-all shadow-md shadow-green-100"
                                onClick={() => {
                                  add({ listingId: l.id, title: l.title, providerId: l.providerId, price: Number(l.discountPrice), expiresAt: l.expiresAt, qtyAvailable: l.qtyAvailable }, 1);
                                  nav('/checkout');
                                }}
                              >
                                ⚡ Buy Now
                              </button>
                              <button 
                                className="w-full px-4 py-3 bg-white border-2 border-green-500 text-green-600 text-sm font-bold rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                onClick={() => {
                                  add({ listingId: l.id, title: l.title, providerId: l.providerId, price: Number(l.discountPrice), expiresAt: l.expiresAt, qtyAvailable: l.qtyAvailable }, 1);
                                  // No navigation here
                                }}
                              >
                                <IoCartOutline className="text-lg" /> Add to Cart
                              </button>
                            </div>
                             {l.donationRequests?.length > 0 && l.qtyAvailable > 0 && (
                              <Link
                                to={`/listings/${l.id}?mode=donate`}
                                className="block text-center w-full px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg transition-colors border border-green-200 text-sm"
                              >
                                🤝 Donate this item
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ListingsMap 
                listings={data?.listings || []} 
                userLocation={userLocation} 
                radius={Number(radius) || 25}
              />

            )}
          </div>

        )}
      </div>
    </div>
  );
}
