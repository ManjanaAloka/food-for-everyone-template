import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ReviewModerationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<'PENDING'|'APPROVED'|'REJECTED'>('PENDING');
  const [ratingFilter, setRatingFilter] = useState<'ALL'|'HIGH'|'LOW'>('ALL');

  const reviewsQ = useQuery({ queryKey: ['adminReviews', status], queryFn: async () => (await api.get('/admin/reviews', { params: { status } })).data });
  
  const filteredReviews = reviewsQ.data?.reviews?.filter((r: any) => {
    if (ratingFilter === 'ALL') return true;
    if (ratingFilter === 'HIGH') return [3, 4, 5].includes(r.rating);
    if (ratingFilter === 'LOW') return [1, 2].includes(r.rating);
    return true;
  }) || [];

  const approve = useMutation({ mutationFn: async (id: string) => api.post(`/admin/reviews/${id}/approve`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['adminReviews', status] }) });
  const reject = useMutation({ mutationFn: async (id: string) => api.post(`/admin/reviews/${id}/reject`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['adminReviews', status] }) });

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
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

          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            <button
              onClick={() => setRatingFilter('ALL')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${ratingFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All Ratings
            </button>
            <button
              onClick={() => setRatingFilter('HIGH')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${ratingFilter === 'HIGH' ? 'bg-white text-green-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              5,4,3 ⭐
            </button>
            <button
              onClick={() => setRatingFilter('LOW')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${ratingFilter === 'LOW' ? 'bg-white text-red-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              2,1 ⭐
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReviews.length ? filteredReviews.map((r: any) => (
            <div key={r.id} className="group border-2 border-gray-50 rounded-2xl p-6 hover:border-green-200 hover:bg-green-50/10 transition-all bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-2xl text-gray-900">{r.rating}</span>
                    <span className="text-yellow-400 text-xl">⭐</span>
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                  ID: {r.id.slice(-6)}
                </div>
              </div>
              <div className="text-gray-600 leading-relaxed mb-6 bg-gray-50 p-4 rounded-xl italic">
                "{r.comment || 'No comment provided'}"
              </div>
              {status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => approve.mutate(r.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-100 transition-all transform hover:scale-[1.02]"
                  >
                    ✓ Approve Review
                  </button>
                  <button
                    onClick={() => reject.mutate(r.id)}
                    className="flex-1 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-500 font-bold">No {status.toLowerCase()} reviews to moderate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}