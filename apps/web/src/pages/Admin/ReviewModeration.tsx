import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export function ReviewModerationPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');

  const reviewsQ = useQuery({ 
    queryKey: ['adminSiteReviews', status], 
    queryFn: async () => (await api.get('/site-reviews/all')).data 
  });
  
  const filteredReviews = reviewsQ.data?.reviews?.filter((r: any) => {
    const statusMatch = r.status === status;
    const ratingMatch = ratingFilter === 'ALL' || r.rating.toString() === ratingFilter;
    return statusMatch && ratingMatch;
  }) || [];

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => {
      return api.patch(`/site-reviews/${id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      toast.success('Review status updated');
      qc.invalidateQueries({ queryKey: ['adminSiteReviews'] });
    }
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/site-reviews/${id}`),
    onSuccess: () => {
      toast.success('Review deleted');
      qc.invalidateQueries({ queryKey: ['adminSiteReviews'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Site Feedback Moderation</h1>
          <p className="text-gray-500">Approve or reject general platform reviews from users</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 shrink-0">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${status === s ? 'bg-white text-green-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
             <button 
                onClick={() => setRatingFilter('ALL')}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${ratingFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
             >
               All Stars
             </button>
             {['5', '4', '3', '2', '1'].map(r => (
               <button
                 key={r}
                 onClick={() => setRatingFilter(r as any)}
                 className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${ratingFilter === r ? 'bg-white text-orange-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {r} ⭐
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.length ? filteredReviews.map((r: any) => (
            <div key={r.id} className="group border border-gray-100 rounded-[32px] p-8 hover:border-green-200 hover:bg-green-50/5 transition-all bg-white shadow-sm hover:shadow-xl hover:shadow-green-100/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 text-green-700 rounded-2xl flex items-center justify-center font-black shadow-sm">
                    {r.user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-none mb-1">{r.user.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-black text-sm">
                  {r.rating} ⭐
                </div>
              </div>
              
              <div className="text-gray-600 leading-relaxed mb-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-50 italic text-sm">
                "{r.comment || 'No comment provided'}"
              </div>

              <div className="flex gap-3">
                {status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'APPROVED' })}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-green-100 transition-all text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'REJECTED' })}
                      className="flex-1 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 px-4 py-3 rounded-xl font-bold transition-all text-xs"
                    >
                      Reject
                    </button>
                  </>
                )}
                {status !== 'PENDING' && (
                  <button
                    onClick={() => { if(confirm('Delete this site review?')) remove.mutate(r.id) }}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-3 rounded-xl font-bold transition-all text-xs"
                  >
                    🗑️ Delete Review
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
              <span className="text-6xl mb-4 block">💬</span>
              <p className="text-gray-500 font-bold">No site reviews found for this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}