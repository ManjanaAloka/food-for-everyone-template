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
    const statusMatch = r.status === status;
    const ratingMatch = ratingFilter === 'ALL' || r.rating.toString() === ratingFilter;
    return statusMatch && ratingMatch;
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
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 overflow-x-auto max-w-full">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${status === s ? 'bg-white text-green-600 shadow-lg shadow-green-100/50 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
             <button 
                onClick={() => setRatingFilter('ALL')}
                className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${ratingFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
             >
               All
             </button>
             {['5', '4', '3', '2', '1'].map(r => (
               <button
                 key={r}
                 onClick={() => setRatingFilter(r as any)}
                 className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${ratingFilter === r ? 'bg-white text-orange-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {r} ⭐
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredReviews.length ? filteredReviews.map((r: any) => (
            <div key={r.id} className="group border border-gray-100 rounded-[32px] p-8 hover:border-green-200 hover:bg-green-50/5 transition-all bg-white shadow-sm hover:shadow-2xl hover:shadow-green-100/20 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-100">
                    {r.reviewer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{r.reviewer.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer ID: {r.reviewerId.slice(-6)}</p>
                  </div>
                </div>
                <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-2xl font-black text-lg flex items-center gap-1 shadow-inner">
                  {r.rating} <span className="text-sm">⭐</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-tighter">Ordered Items:</div>
                <div className="flex flex-wrap gap-1 mb-6">
                  {r.order?.items?.map((item: any, i: number) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200">
                      {item.listing.title}
                    </span>
                  ))}
                </div>

                <div className="text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-sm mb-8 relative">
                  <span className="absolute -top-3 -left-1 text-4xl text-gray-200 font-serif">"</span>
                  {r.comment || 'No comment provided'}
                  <span className="absolute -bottom-6 -right-1 text-4xl text-gray-200 font-serif">"</span>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                {status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'APPROVED' })}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 transition-all transform hover:-translate-y-1"
                    >
                      ✓ Approve to Public
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'REJECTED' })}
                      className="flex-1 bg-white border-2 border-red-50 text-red-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      ✕ Hide Review
                    </button>
                  </>
                )}
                {status === 'APPROVED' && (
                  <div className="w-full flex items-center justify-between text-xs font-bold text-green-600 bg-green-50 px-6 py-4 rounded-2xl border border-green-100">
                    <span>✨ Currently visible on your profile</span>
                    <button 
                      onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'REJECTED' })}
                      className="text-red-400 hover:text-red-600 underline"
                    >
                      Hide
                    </button>
                  </div>
                )}
                {status === 'REJECTED' && (
                  <button 
                    onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'APPROVED' })}
                    className="w-full text-xs font-bold text-gray-400 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 hover:text-green-600 transition-all"
                  >
                    🔄 This review is hidden. Click to Restore.
                  </button>
                )}
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
