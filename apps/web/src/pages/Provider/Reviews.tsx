import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProviderReviewsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');

  const reviewsQ = useQuery({ 
    queryKey: ['providerReviews', status], 
    queryFn: async () => (await api.get('/reviews/my-reviews')).data 
  });
  
  const filteredReviews = reviewsQ.data?.reviews?.filter((r: any) => {
    // Show everything except rejected ones, or show all if you want
    const ratingMatch = ratingFilter === 'ALL' || r.rating.toString() === ratingFilter;
    return ratingMatch;
  }) || [];

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => {
      return api.patch(`/reviews/${id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      toast.success('Review updated');
      qc.invalidateQueries({ queryKey: ['providerReviews'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Customer Feedback</h1>
          <p className="text-gray-500">Manage reviews received from your customers</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4">
          <div className="text-right">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reviews</p>
             <p className="text-xl font-black text-gray-900">{reviewsQ.data?.reviews?.length || 0}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">⭐</div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-start lg:items-center">
          <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
             <button 
                onClick={() => setRatingFilter('ALL')}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${ratingFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
             >
               All Ratings
             </button>
             {['5', '4', '3', '2', '1'].map(r => (
               <button
                 key={r}
                 onClick={() => setRatingFilter(r as any)}
                 className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${ratingFilter === r ? 'bg-white text-orange-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {r} ⭐
               </button>
             ))}
          </div>
          <div className="lg:ml-auto text-xs font-bold text-slate-400 italic">
            * All reviews are now automatically approved to public view.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {filteredReviews.length ? filteredReviews.map((r: any) => (
            <div key={r.id} className="group border border-gray-100 rounded-[32px] p-6 md:p-8 hover:border-green-200 hover:bg-green-50/5 transition-all bg-white shadow-sm hover:shadow-2xl hover:shadow-green-100/20 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex items-center gap-4 min-w-[240px]">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-100 shrink-0">
                  {r.reviewer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">{r.reviewer.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID: {r.orderId.slice(-6).toUpperCase()}</p>
                </div>
                <div className="md:hidden ml-auto bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-black text-sm">
                  {r.rating} ⭐
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordered:</span>
                  <div className="flex flex-wrap gap-1">
                    {r.order?.items?.map((item: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black border border-slate-200">
                        {item.listing.title}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-gray-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 italic text-sm relative">
                  "{r.comment || 'No comment provided'}"
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[180px] w-full md:w-auto">
                <div className="flex items-center justify-center gap-2 bg-orange-50 text-orange-600 px-4 py-4 rounded-2xl font-black text-xl shadow-inner border border-orange-100/50">
                  {r.rating} <span className="text-sm">Stars ⭐</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Feedback Verified</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-32 bg-gray-50 rounded-[60px] border-4 border-dashed border-gray-100">
              <span className="text-8xl mb-6 block">🍂</span>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No {status.toLowerCase()} reviews</h3>
              <p className="text-gray-400 font-medium">Try changing the filters to see other feedback</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
