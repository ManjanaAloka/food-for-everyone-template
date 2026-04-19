import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState, useEffect } from 'react';
import { useCart } from '../state/cart';
import { io } from 'socket.io-client';
import { WS_URL } from '../env';
import { useSearchParams } from 'react-router-dom';

export function ListingsPage() {
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('provider');
  const [q, setQ] = useState('');
  const { add } = useCart();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings', q, providerId],
    queryFn: async () => {
      const params: any = {};
      if (q) params.q = q;
      if (providerId) params.providerId = providerId;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-block bg-green-100 rounded-full px-4 sm:px-6 py-2 mb-3 sm:mb-4">
            <span className="text-green-700 font-semibold text-xs sm:text-sm">🍔 Available Food</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {providerId ? 'Browse Provider Food' : 'Browse Available Food'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl">
            {providerId ? 'Food from this provider' : 'Discover surplus food from local businesses and save money while reducing waste'}
          </p>
          {providerId && (
            <button
              onClick={() => window.location.href = '/browse'}
              className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all"
            >
              ← View All Providers
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input 
              value={q} 
              onChange={(e)=>setQ(e.target.value)} 
              placeholder="Search food, restaurants, categories..." 
              className="w-full sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
            />
            <button 
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
              onClick={()=>refetch()}
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading delicious food...</p>
          </div>
        ) : (
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
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3 line-clamp-2">{l.title}</h3>
                  
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

                  {/* Add to Cart Button */}
                  <button 
                    className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm sm:text-base font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
                    onClick={() => add({ listingId: l.id, title: l.title, providerId: l.providerId, price: Number(l.discountPrice), expiresAt: l.expiresAt }, 1)}
                  >
                    🛍️ Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && data?.listings?.length === 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No food available</h3>
            <p className="text-gray-600">Check back soon for new listings!</p>
          </div>
        )}
      </div>
    </div>
  );
}
