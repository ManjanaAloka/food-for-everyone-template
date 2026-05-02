import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function ProvidersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const providersQ = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await api.get('/providers');
      return res.data;
    }
  });

  const providers = providersQ.data?.providers || [];
  
  // Get unique cities for filter + some defaults for better UX
  const defaultCities = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Matara', 'Mawanella', 'Negombo', 'Ratnapura'];
  const cities = [...new Set([...defaultCities, ...providers.map((p: any) => p.city).filter(Boolean)])].sort();

  // Filter providers
  const filteredProviders = providers.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      p.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = !filterCity || p.city === filterCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-block bg-blue-100 rounded-full px-4 sm:px-6 py-2 mb-3 sm:mb-4">
            <span className="text-blue-700 font-semibold text-xs sm:text-sm">🏪 Service Providers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Browse Local Providers</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl">
            Discover restaurants, bakeries, and grocery stores in your area fighting food waste.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Filter by City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                {cities.map((city: string) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="text-2xl sm:text-3xl mb-2">🏪</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{providers.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Active Providers</div>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="text-2xl sm:text-3xl mb-2">🌍</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{cities.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Cities Covered</div>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all">
            <div className="text-2xl sm:text-3xl mb-2">⭐</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">4.8/5</div>
            <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
          </div>
        </div>

        {/* Providers Grid */}
        {providersQ.isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading providers...</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🔍</div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No providers found</h2>
            <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProviders.map((provider: any) => (
              <div
                key={provider.userId}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Provider Header */}
                <div className="p-4 sm:p-6 text-center border-b border-gray-200">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl sm:text-3xl">🏪</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {provider.businessName}
                  </h3>
                </div>

                {/* Provider Details */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Rating */}
                  {provider.ratingAvg > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-yellow-500 text-lg sm:text-xl">⭐</span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">
                        {provider.ratingAvg.toFixed(1)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600">
                        ({provider.ratingCount} reviews)
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {provider.address && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-gray-400 mt-0.5 sm:mt-1 text-sm">📍</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-700 break-words">{provider.address}</p>
                        {provider.city && (
                          <p className="text-xs text-gray-500 mt-1">{provider.city}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {provider.user?.email && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-gray-400 text-sm">✉️</span>
                      <a 
                        href={`mailto:${provider.user.email}`}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {provider.user.email}
                      </a>
                    </div>
                  )}

                  {/* Phone */}
                  {provider.user?.phone && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-gray-400 text-sm">📞</span>
                      <a 
                        href={`tel:${provider.user.phone}`}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {provider.user.phone}
                      </a>
                    </div>
                  )}

                  {/* Business Registration */}
                  {provider.brNo && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-gray-400 text-sm">🏬</span>
                      <span className="text-xs text-gray-600">BR: {provider.brNo}</span>
                    </div>
                  )}

                  {/* Verified Badge */}
                  {provider.verifiedAt && (
                    <div className="flex justify-center pt-2">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <span>✔️</span>
                        <span>Verified Business</span>
                      </div>
                    </div>
                  )}

                  {/* View Listings Button */}
                  <div className="pt-3 sm:pt-4">
                    <a
                      href={`/browse?provider=${provider.userId}`}
                      className="block w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-semibold text-center rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      View Available Food
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
