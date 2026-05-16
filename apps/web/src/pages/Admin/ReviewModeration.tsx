import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  IoSearchOutline, IoStar, IoRefreshOutline, 
  IoTrashOutline, IoChatbubbleOutline 
} from 'react-icons/io5';

export function ReviewModerationPage() {
  const qc = useQueryClient();
  const [moderationTab, setModerationTab] = useState<'SITE' | 'PROVIDER'>('SITE');
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const siteReviewsQ = useQuery({ 
    queryKey: ['adminSiteReviews'], 
    queryFn: async () => (await api.get('/site-reviews/all')).data,
    enabled: moderationTab === 'SITE'
  });

  const providerReviewsQ = useQuery({ 
    queryKey: ['adminProviderReviews'], 
    queryFn: async () => (await api.get('/reviews/all')).data,
    enabled: moderationTab === 'PROVIDER'
  });
  
  const currentReviews = moderationTab === 'SITE' ? siteReviewsQ.data?.reviews : providerReviewsQ.data?.reviews;

  const filteredReviews = currentReviews?.filter((r: any) => {
    const statusMatch = r.status === status;
    const ratingMatch = ratingFilter === 'ALL' || r.rating.toString() === ratingFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const name = (r.user?.name || r.reviewer?.name || '').toLowerCase();
    const comment = (r.comment || '').toLowerCase();
    const providerId = (r.providerId || '').toLowerCase();
    
    const searchMatch = !searchQuery || 
      name.includes(searchLower) || 
      comment.includes(searchLower) || 
      providerId.includes(searchLower);

    return statusMatch && ratingMatch && searchMatch;
  }) || [];

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: string }) => {
      const endpoint = moderationTab === 'SITE' ? `/site-reviews/${id}/status` : `/reviews/${id}/status`;
      return api.patch(endpoint, { status: newStatus });
    },
    onSuccess: () => {
      toast.success('Review status updated');
      qc.invalidateQueries({ queryKey: [moderationTab === 'SITE' ? 'adminSiteReviews' : 'adminProviderReviews'] });
    }
  });

  const remove = useMutation({
    mutationFn: async (review: any) => {
      const isRejected = review.status === 'REJECTED';
      const newStatus = isRejected ? 'APPROVED' : 'REJECTED';
      
      if (moderationTab === 'SITE') {
        // For site reviews, we might want to delete or toggle status. 
        // Based on previous code, site reviews have a status patch too.
        return api.patch(`/site-reviews/${review.id}/status`, { status: newStatus });
      }
      return api.patch(`/reviews/${review.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      toast.success('Review updated');
      qc.invalidateQueries({ queryKey: [moderationTab === 'SITE' ? 'adminSiteReviews' : 'adminProviderReviews'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Moderation</h1>
          <p className="text-gray-500">Manage all types of feedback on the platform</p>
        </div>
        
        <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
          <button 
            onClick={() => setModerationTab('SITE')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${moderationTab === 'SITE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span>Site Reviews</span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${moderationTab === 'SITE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
              {siteReviewsQ.data?.reviews?.length || 0}
            </span>
          </button>
          <button 
            onClick={() => setModerationTab('PROVIDER')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${moderationTab === 'PROVIDER' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span>Provider Reviews</span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${moderationTab === 'PROVIDER' ? 'bg-white text-green-700' : 'bg-gray-200 text-gray-500'}`}>
              {providerReviewsQ.data?.reviews?.length || 0}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center">
          <div className="flex-1 w-full lg:max-w-md relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              <IoSearchOutline />
            </span>
            <input 
              type="text"
              placeholder={`Search by ${moderationTab === 'SITE' ? 'customer' : 'provider ID, name'} or keyword...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-sm font-medium"
            />
          </div>

          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 shrink-0 overflow-x-auto max-w-full">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(s => {
              const count = currentReviews?.filter((r: any) => r.status === s).length || 0;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 md:px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${status === s ? 'bg-white text-green-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${status === s ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
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
                 {r} <IoStar className="inline mb-0.5 text-sm" />
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredReviews.length ? filteredReviews.map((r: any) => (
            <div key={r.id} className="group border border-gray-100 rounded-[32px] p-6 md:p-8 hover:border-green-200 hover:bg-green-50/5 transition-all bg-white shadow-sm hover:shadow-xl hover:shadow-green-100/20 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex items-center gap-4 min-w-[240px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm shrink-0 ${moderationTab === 'SITE' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700' : 'bg-gradient-to-br from-green-100 to-green-200 text-green-700'}`}>
                  {r.user?.name?.charAt(0) || r.reviewer?.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1">{r.user?.name || r.reviewer?.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                  {moderationTab === 'PROVIDER' && (
                    <p className="text-[9px] text-indigo-500 font-bold mt-1">Provider ID: {r.providerId?.slice(-6).toUpperCase()}</p>
                  )}
                </div>
                <div className="md:hidden ml-auto flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-black text-xs">
                  {r.rating} <span className="text-sm">Stars <IoStar className="inline mb-1" /></span>
                </div>
              </div>
              
              <div className="flex-1 text-gray-600 leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-50 italic text-sm w-full">
                "{r.comment || 'No comment provided'}"
                {moderationTab === 'PROVIDER' && r.order?.items && (
                  <div className="mt-3 flex flex-wrap gap-1 not-italic">
                    {r.order.items.map((it: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-white text-[9px] font-bold rounded border border-gray-100">{it.listing.title}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-w-[180px] w-full md:w-auto">
                <div className="hidden md:flex items-center justify-center gap-1 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-black text-sm mb-1">
                  {r.rating} Stars ⭐
                </div>
                
                <div className="flex gap-2">
                  {status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'APPROVED' })}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-green-100 transition-all text-[10px] uppercase tracking-wider"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: r.id, newStatus: 'REJECTED' })}
                        className="flex-1 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 px-4 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {status !== 'PENDING' && (
                    <button
                      onClick={() => { if(confirm(`${r.status === 'REJECTED' ? 'Restore' : 'Hide'} this ${moderationTab === 'SITE' ? 'site' : 'provider'} review?`)) remove.mutate(r) }}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 ${r.status === 'REJECTED' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      {r.status === 'REJECTED' ? <span className="flex justify-center items-center gap-2"><IoRefreshOutline /> Restore Review</span> : <span className="flex justify-center items-center gap-2"><IoTrashOutline /> Hide Review</span>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
              <span className="text-6xl mb-4 flex justify-center text-gray-300"><IoChatbubbleOutline /></span>
              <p className="text-gray-500 font-bold">No site reviews found for this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}