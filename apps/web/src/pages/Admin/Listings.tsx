import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export function AdminListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'hidden' | 'expired'>('all');

  const listingsQ = useQuery({
    queryKey: ['adminListings'],
    queryFn: async () => (await api.get('/admin/listings')).data
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'HIDDEN' }) => {
      return api.patch(`/admin/listings/${id}`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminListings'] });
      toast.success('Listing status updated!');
    },
    onError: () => toast.error('Failed to update listing')
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/listings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminListings'] });
      toast.success('Listing deleted!');
    },
    onError: () => toast.error('Failed to delete listing')
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
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'hidden', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filter === f
                  ? 'bg-green-600 text-white shadow-lg shadow-green-100'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({
                f === 'all' ? listings.length : 
                f === 'active' ? listings.filter((l: any) => l.status === 'ACTIVE').length :
                f === 'hidden' ? listings.filter((l: any) => l.status === 'HIDDEN').length :
                listings.filter((l: any) => l.status === 'EXPIRED' || new Date(l.expiresAt) < new Date()).length
              })
            </button>
          ))}
        </div>
      </div>

      {listingsQ.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Listings</h2>
          <p className="text-red-700">Please try refreshing the page or contact support.</p>
        </div>
      ) : listingsQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse bg-gray-100 h-96 rounded-3xl" />)}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center">
          <div className="text-8xl mb-6">🍽️</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">No listings found</h2>
          <p className="text-gray-500">No items match the current filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing: any) => {
            const isExpired = new Date(listing.expiresAt) < new Date();
            
            return (
              <div
                key={listing.id}
                className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-green-900/5 transition-all duration-500 transform hover:-translate-y-1"
              >
                <div className="relative h-56 bg-gray-50 overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-green-50 to-emerald-50">🍽️</div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg ${
                      listing.status === 'ACTIVE' && !isExpired ? 'bg-green-600 text-white' : 
                      listing.status === 'HIDDEN' ? 'bg-gray-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {isExpired ? 'EXPIRED' : listing.status}
                    </span>
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-gray-700 rounded-full shadow-lg">
                      {listing.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-black text-xl text-gray-900 mb-2 truncate group-hover:text-green-600 transition-colors">{listing.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10 italic">
                    {listing.description || 'No description provided'}
                  </p>

                  <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest">Provider</span>
                      <span className="font-bold text-gray-900">{listing.provider?.businessName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest">Available</span>
                      <span className="font-bold text-gray-900">{listing.qtyAvailable} units</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest">Expires</span>
                      <span className="font-bold text-red-600">{new Date(listing.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-green-600">LKR {Number(listing.discountPrice).toFixed(0)}</span>
                        <span className="text-xs text-gray-400 line-through">LKR {Number(listing.unitPrice).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {listing.status === 'HIDDEN' ? (
                      <button
                        onClick={() => toggleStatus.mutate({ id: listing.id, status: 'ACTIVE' })}
                        disabled={toggleStatus.isPending}
                        className="flex-1 py-3 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-100"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus.mutate({ id: listing.id, status: 'HIDDEN' })}
                        disabled={toggleStatus.isPending}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
                      >
                        Hide
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Permanently delete this listing?')) {
                          deleteListing.mutate(listing.id);
                        }
                      }}
                      disabled={deleteListing.isPending}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
