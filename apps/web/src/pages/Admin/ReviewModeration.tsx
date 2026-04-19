import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ReviewModerationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<'PENDING'|'APPROVED'|'REJECTED'>('PENDING');

  const reviewsQ = useQuery({ queryKey: ['adminReviews', status], queryFn: async () => (await api.get('/admin/reviews', { params: { status } })).data });
  const approve = useMutation({ mutationFn: async (id: string) => api.post(`/admin/reviews/${id}/approve`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['adminReviews', status] }) });
  const reject = useMutation({ mutationFn: async (id: string) => api.post(`/admin/reviews/${id}/reject`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['adminReviews', status] }) });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-6 font-medium transition-colors"
        >
          <span className="text-xl">←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⭐ Review Moderation</h1>
          <p className="text-gray-600">Approve or reject user reviews</p>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setStatus('PENDING')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${status === 'PENDING' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatus('APPROVED')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${status === 'APPROVED' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatus('REJECTED')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${status === 'REJECTED' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Rejected
            </button>
          </div>

          <div className="space-y-4">
            {reviewsQ.data?.reviews?.length ? reviewsQ.data.reviews.map((r: any) => (
              <div key={r.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg text-gray-900">Rating: {r.rating} ⭐</div>
                    <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-gray-700 mb-4">Comment: {r.comment || '-'}</div>
                {status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => approve.mutate(r.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => reject.mutate(r.id)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <span className="text-6xl mb-4 block">📭</span>
                <p className="text-gray-600">No {status.toLowerCase()} reviews</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}