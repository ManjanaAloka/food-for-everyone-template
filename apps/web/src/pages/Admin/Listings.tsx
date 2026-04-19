import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function AdminListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'hidden' | 'expired'>('all');

  const listingsQ = useQuery({
    queryKey: ['adminListings'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/listings');
        console.log('Admin listings response:', res.data);
        return res.data;
      } catch (error: any) {
        console.error('Error fetching admin listings:', error);
        throw error;
      }
    }
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'HIDDEN' }) => {
      return api.patch(`/admin/listings/${id}`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminListings'] });
      alert('✅ Listing status updated!');
    },
    onError: () => alert('❌ Failed to update listing')
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminListings'] });
      alert('✅ Listing deleted!');
    },
    onError: () => alert('❌ Failed to delete listing')
  });

  const listings = listingsQ.data?.listings || [];
  
  const filteredListings = listings.filter((l: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return l.status === 'ACTIVE';
    if (filter === 'hidden') return l.status === 'HIDDEN';
    if (filter === 'expired') return l.status === 'EXPIRED' || new Date(l.expiresAt) < new Date();
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold">🍽️ All Listings</h1>
          <p className="text-green-100 mt-1">View and manage all food listings on the platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({listings.filter((l: any) => l.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'hidden'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hidden ({listings.filter((l: any) => l.status === 'HIDDEN').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'expired'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expired ({listings.filter((l: any) => l.status === 'EXPIRED' || new Date(l.expiresAt) < new Date()).length})
            </button>
          </div>
        </div>

        {/* Error State */}
        {listingsQ.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Listings</h2>
            <p className="text-red-700">Failed to fetch listings. Please check the console for details.</p>
          </div>
        )}

        {/* Listings Grid */}
        {!listingsQ.isError && listingsQ.isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading listings...</p>
          </div>
        ) : !listingsQ.isError && filteredListings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h2>
            <p className="text-gray-600">No listings match the current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing: any) => {
              const isExpired = new Date(listing.expiresAt) < new Date();
              
              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Listing Image */}
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-6xl">🍽️</span>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.status === 'ACTIVE' && !isExpired
                            ? 'bg-green-100 text-green-700'
                            : listing.status === 'HIDDEN'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isExpired ? 'EXPIRED' : listing.status}
                      </span>
                      <span className="text-xs text-gray-500">{listing.category}</span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    {listing.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    {/* Provider Info */}
                    <div className="text-xs text-gray-500 mb-3">
                      <p>Provider: {listing.provider?.businessName || 'Unknown'}</p>
                      <p>Available: {listing.qtyAvailable} units</p>
                      <p>Expires: {new Date(listing.expiresAt).toLocaleDateString()}</p>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-500 line-through">
                        LKR {Number(listing.unitPrice).toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        LKR {Number(listing.discountPrice).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {listing.status === 'HIDDEN' ? (
                        <button
                          onClick={() => toggleStatus.mutate({ id: listing.id, status: 'ACTIVE' })}
                          disabled={toggleStatus.isPending}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Show
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStatus.mutate({ id: listing.id, status: 'HIDDEN' })}
                          disabled={toggleStatus.isPending}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          Hide
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this listing?')) {
                            deleteListing.mutate(listing.id);
                          }
                        }}
                        disabled={deleteListing.isPending}
                        className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
