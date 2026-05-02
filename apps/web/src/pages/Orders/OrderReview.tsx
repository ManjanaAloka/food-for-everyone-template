import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function OrderReviewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data.order
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/orders/${id}/review`, { rating, comment });
    },
    onSuccess: () => {
      toast.success('Review published successfully!');
      qc.invalidateQueries({ queryKey: ['myOrders'] });
      nav('/orders');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to publish review');
    }
  });

  if (isLoading) return <div className="pt-20 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 text-center text-white">
            <h1 className="text-3xl font-bold mb-2">Rate Your Experience</h1>
            <p className="text-yellow-50">Order #O-{order?.orderNumber?.toString().padStart(4, '0')}</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Stars */}
            <div className="text-center">
              <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Rating</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`text-4xl transition-all transform hover:scale-110 ${
                      s <= rating ? 'grayscale-0' : 'grayscale opacity-30'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <div className="mt-2 font-bold text-gray-900">
                {rating === 5 ? 'Excellent! 😍' : rating === 4 ? 'Very Good! 😊' : rating === 3 ? 'Good! 🙂' : rating === 2 ? 'Fair! 😐' : 'Poor! ☹️'}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Feedback</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you liked or how we can improve..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all outline-none resize-none"
              />
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {mutation.isPending ? 'Publishing...' : 'Publish Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
