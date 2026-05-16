import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  IoBusinessOutline, 
  IoSearchOutline, 
  IoRestaurantOutline, 
  IoTrashOutline 
} from 'react-icons/io5';

export function AdminListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'hidden' | 'expired' | 'out_of_stock'>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'expiry' | 'stock'>('newest');
  
  // Date Range State
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

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

  // Get unique providers for the dropdown
  const providerList = useMemo(() => {
    const map = new Map();
    listings.forEach((l: any) => {
      if (l.provider) {
        map.set(l.provider.userId, l.provider.businessName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [listings]);
  
  const filteredListings = useMemo(() => {
    return listings.filter((l: any) => {
      const isExpired = new Date(l.expiresAt) < new Date();
      const isOutOfStock = l.qtyAvailable <= 0;
      
      // Provider Filter
      if (selectedProvider !== 'all' && l.providerId !== selectedProvider) return false;

      // Date Range Filter (on expiry date)
      if (dateRange.start || dateRange.end) {
        const expiryDate = new Date(l.expiresAt);
        if (dateRange.start && expiryDate < new Date(dateRange.start)) return false;
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59);
            if (expiryDate > end) return false;
        }
      }

      if (filter === 'active') return l.status === 'ACTIVE' && !isExpired && !isOutOfStock;
      if (filter === 'hidden') return l.status === 'HIDDEN';
      if (filter === 'expired') return isExpired;
      if (filter === 'out_of_stock') return isOutOfStock;
      
      return true;
    }).sort((a: any, b: any) => {
      if (sortBy === 'expiry') return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      if (sortBy === 'stock') return a.qtyAvailable - b.qtyAvailable;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [listings, filter, selectedProvider, sortBy, dateRange]);

  const setExpiryPreset = (days: number) => {
    const start = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange({ start, end });
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-[40px] shadow-xl shadow-green-900/5 border border-gray-100 p-8 md:p-12">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Inventory Control</h1>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
               <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Provider</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">
                      <IoBusinessOutline />
                    </span>
                    <select 
                      value={selectedProvider}
                      onChange={e => setSelectedProvider(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 appearance-none transition-all cursor-pointer"
                    >
                      <option value="all">All Providers</option>
                      {providerList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Expiry Date Range</label>
                  <div className="flex gap-2">
                    <input 
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="flex-1 px-4 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold text-sm outline-none focus:ring-4 focus:ring-green-500/10"
                    />
                    <input 
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="flex-1 px-4 py-4 bg-gray-50 border border-gray-100 rounded-3xl font-bold text-sm outline-none focus:ring-4 focus:ring-green-500/10"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(['all', 'active', 'hidden', 'expired', 'out_of_stock'] as const).map(f => {
            const count = listings.filter((l: any) => {
              const isExp = new Date(l.expiresAt) < new Date();
              const isOos = l.qtyAvailable <= 0;
              if (f === 'all') return true;
              if (f === 'active') return l.status === 'ACTIVE' && !isExp && !isOos;
              if (f === 'hidden') return l.status === 'HIDDEN';
              if (f === 'expired') return isExp;
              if (f === 'out_of_stock') return isOos;
              return false;
            }).length;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${
                  filter === f
                    ? 'bg-green-600 text-white shadow-2xl shadow-green-200 translate-y-[-2px]'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                {f.replace('_', ' ')} <span className={`ml-2 px-2 py-0.5 rounded-lg ${filter === f ? 'bg-green-500' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {listingsQ.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse bg-gray-100 h-[500px] rounded-[40px]" />)}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-[40px] shadow-sm border-2 border-dashed border-gray-100 p-32 text-center">
          <div className="text-9xl mb-8 opacity-20 flex justify-center"><IoSearchOutline /></div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">No items found</h2>
          <p className="text-gray-400 font-medium text-lg">Try adjusting your filters or search terms.</p>
          <button onClick={() => {setFilter('all'); setSelectedProvider('all'); setDateRange({start:'', end:''})}} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all">Reset All Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing: any) => {
            const isExpired = new Date(listing.expiresAt) < new Date();
            const isOutOfStock = listing.qtyAvailable <= 0;
            
            return (
              <div
                key={listing.id}
                className="group bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-700 flex flex-col h-full"
              >
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-green-50 to-emerald-50 text-green-300"><IoRestaurantOutline /></div>
                  )}
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl backdrop-blur-md ${
                      isExpired ? 'bg-red-600/90 text-white' :
                      isOutOfStock ? 'bg-orange-600/90 text-white' :
                      listing.status === 'ACTIVE' ? 'bg-green-600/90 text-white' : 'bg-gray-600/90 text-white'
                    }`}>
                      {isExpired ? 'Expired' : isOutOfStock ? 'Out of Stock' : listing.status}
                    </span>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex-1 mb-8">
                    <h3 className="font-black text-2xl text-gray-900 tracking-tighter leading-tight group-hover:text-green-600 transition-colors mb-2">{listing.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{listing.provider?.businessName || 'Unknown Provider'}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                        <p className={`text-xl font-black ${isOutOfStock ? 'text-red-500' : 'text-gray-900'}`}>{listing.qtyAvailable} <span className="text-xs">pcs</span></p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry</p>
                        <p className={`text-sm font-black ${isExpired ? 'text-red-500' : 'text-gray-900'}`}>{new Date(listing.expiresAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-baseline gap-2">
                         <span className="text-3xl font-black text-green-600">LKR {Number(listing.discountPrice).toFixed(0)}</span>
                         <span className="text-sm text-gray-300 line-through font-bold">LKR {Number(listing.unitPrice).toFixed(0)}</span>
                       </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleStatus.mutate({ id: listing.id, status: listing.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' })}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl ${listing.status === 'ACTIVE' ? 'bg-gray-900 text-white hover:bg-black' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {listing.status === 'ACTIVE' ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Delete this listing forever?')) deleteListing.mutate(listing.id) }}
                        className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-100 flex items-center justify-center text-xl shadow-sm"
                      >
                        <span className="flex items-center justify-center"><IoTrashOutline className="mr-1" /> Delete</span>
                      </button>
                    </div>
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
