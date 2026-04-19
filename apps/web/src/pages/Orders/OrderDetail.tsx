import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../state/auth';
import { useState } from 'react';

export function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [providerStatus, setProviderStatus] = useState('PREPARING');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['order', id], queryFn: async () => (await api.get(`/orders/${id}`)).data, enabled: !!id });
  const updateStatus = useMutation({ mutationFn: async (status: string) => api.patch(`/orders/${id}/status`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }) });
  const confirmReceived = useMutation({ mutationFn: async () => api.post(`/orders/${id}/confirm-received`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }) });
  
  const submitReview = useMutation({
    mutationFn: async () => api.post('/reviews', { orderId: id, rating, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      alert('✅ Review submitted successfully!');
      setShowReviewForm(false);
      setRating(5);
      setComment('');
    },
    onError: (error: any) => {
      alert('❌ ' + (error.response?.data?.error || 'Failed to submit review'));
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.order) return <div>Not found.</div>;
  const o = data.order;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Order {o.id}</h1>
      <div className="text-sm mb-4">Status: <span className="font-medium">{o.status}</span> â€¢ Type: {o.type} â€¢ Mode: {o.fulfillmentMode}</div>
      <div className="mb-3">
        {o.items.map((it: any) => (
          <div key={it.id} className="flex justify-between border-b py-2">
            <div>{it.qty} x {it.listingId}</div>
            <div>LKR {(Number(it.unitPrice) * it.qty).toFixed(2)}</div>
          </div>
        ))}
      </div>
      {user?.role === 'PROVIDER' && (
        <div className="border rounded p-3 mb-3">
          <div className="font-medium mb-2">Update fulfillment status</div>
          <select value={providerStatus} onChange={(e)=>setProviderStatus(e.target.value)} className="border p-2">
            <option value="PREPARING">PREPARING</option>
            {o.fulfillmentMode === 'PICKUP' ? <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option> : <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>}
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
          <button className="ml-2 bg-green-700 text-white px-3 py-1 rounded" onClick={()=>updateStatus.mutate(providerStatus)}>Update</button>
        </div>
      )}
      {user?.role === 'DONATION_CENTER' && o.type === 'DONATION' && o.status !== 'DELIVERED' && (
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Confirm receipt</div>
          <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={()=>confirmReceived.mutate()}>Mark as Delivered</button>
        </div>
      )}
      
      {/* Review Section for Customers */}
      {user?.role === 'CUSTOMER' && o.status === 'DELIVERED' && (
        <div className="border rounded p-4 mt-4">
          {o.review ? (
            // Show existing review
            <div>
              <div className="font-semibold mb-2 flex items-center gap-2">
                <span>Your Review</span>
                <span className="text-yellow-500">{'⭐'.repeat(o.review.rating)}</span>
              </div>
              {o.review.comment && <p className="text-sm text-gray-700 mb-2">{o.review.comment}</p>}
              <p className="text-xs text-gray-500">Status: {o.review.status}</p>
              {o.review.providerResponse && (
                <div className="mt-3 bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Provider Response:</p>
                  <p className="text-sm text-gray-600">{o.review.providerResponse}</p>
                </div>
              )}
            </div>
          ) : showReviewForm ? (
            // Review form
            <div>
              <h3 className="font-semibold mb-3">Rate Your Experience</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl transition-transform hover:scale-110"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => submitReview.mutate()}
                  disabled={submitReview.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Show review button
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              ⭐ Write a Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
