import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../state/auth';
import { useState, useEffect } from 'react';


export function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [providerStatus, setProviderStatus] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({ 
    queryKey: ['order', id], 
    queryFn: async () => (await api.get(`/orders/${id}`)).data, 
    enabled: !!id 
  });

  // Initialize status state when data is loaded
  useEffect(() => {
    if (data?.order?.status) {
      setProviderStatus(data.order.status);
    }
  }, [data]);

  const updateStatus = useMutation({ 
    mutationFn: async (status: string) => api.patch(`/orders/${id}/status`, { status }), 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      alert('✅ Status updated successfully!');
    },
    onError: (err: any) => {
      alert('❌ Failed: ' + (err.response?.data?.error || err.message));
    }
  });

  const confirmReceived = useMutation({ mutationFn: async () => api.post(`/orders/${id}/confirm-received`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }) });
  const cancelOrder = useMutation({
    mutationFn: async () => api.post(`/orders/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      alert('✅ Order canceled successfully');
    },
    onError: (err: any) => alert('❌ ' + (err.response?.data?.error || 'Failed to cancel order'))
  });

  
  const submitReview = useMutation({
    mutationFn: async () => {
      if (o.review) {
        return api.patch(`/reviews/${o.review.id}`, { rating, comment });
      }
      return api.post('/reviews', { orderId: id, rating, comment });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      alert(o.review ? '✅ Review updated successfully!' : '✅ Review submitted successfully!');
      setShowReviewForm(false);
    },
    onError: (error: any) => {
      alert('❌ ' + (error.response?.data?.error || 'Failed to process review'));
    }
  });


  if (isLoading) return <div>Loading...</div>;
  if (!data?.order) return <div>Not found.</div>;
  const o = data.order;

  return (
    <div>
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-xl font-semibold">Order OR_{o.orderNumber}</h1>

        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all print:hidden"
        >
          <span>📥</span> Download Receipt
        </button>
      </div>

      <div className="text-sm mb-4 flex gap-4 text-gray-600">
        <div><span className="font-medium text-gray-900">Status:</span> <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span></div>
        <div><span className="font-medium text-gray-900">Type:</span> {o.type}</div>
        <div><span className="font-medium text-gray-900">Mode:</span> {o.fulfillmentMode}</div>
        <div>
          <span className="font-medium text-gray-900">Payment:</span> {o.paymentMethod || 'ONLINE'} 
          {o.paymentMethod === 'COD' && o.status === 'DELIVERED' && <span className="ml-1 text-green-600 font-semibold">(Collected)</span>}
          {o.paymentMethod === 'COD' && o.status !== 'DELIVERED' && <span className="ml-1 text-orange-600 font-semibold">(To Collect)</span>}
          {o.paymentMethod === 'ONLINE' && ['PAID', 'PENDING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status) && <span className="ml-1 text-green-600 font-semibold">(Paid)</span>}
          {o.paymentMethod === 'ONLINE' && ['AWAITING_PAYMENT', 'CREATED', 'RESERVED'].includes(o.status) && (
            <>
              <span className="ml-1 text-orange-600 font-semibold">(Pending)</span>
              <button 
                onClick={async () => {
                  if (window.confirm('DEBUG: Simulate payment success?')) {
                    try {
                      await api.post('/payments/simulate-success', { orderId: o.id });
                      qc.invalidateQueries({ queryKey: ['order', id] });
                      alert('✅ Payment simulated successfully!');
                    } catch (err: any) {
                      alert('❌ Failed: ' + (err.response?.data?.error || err.message));
                    }
                  }
                }}
                className="ml-3 px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded hover:bg-black transition-colors"
              >
                🛠 Simulate Pay
              </button>
            </>
          )}
        </div>
      </div>
      {/* Customer / Donation Center Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Fulfillment Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            📍 Fulfillment Info
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Method:</span>
              <span className="font-bold text-gray-900">{o.fulfillmentMode}</span>
            </div>
            {o.addressLine && (
              <div className="text-sm">
                <span className="text-gray-500 block mb-1">Delivery Address:</span>
                <p className="font-bold text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {o.addressLine}, {o.city}
                </p>
              </div>
            )}
            {o.scheduledTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Scheduled:</span>
                <span className="font-bold text-green-700">{new Date(o.scheduledTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            👤 Recipient Details
          </h3>
          {o.type === 'DONATION' && o.donationCenter ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Center:</span>
                <span className="font-bold text-emerald-700">{o.donationCenter.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Contact:</span>
                <span className="font-bold text-gray-900">{o.donationCenter.user.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone:</span>
                <a href={`tel:${o.donationCenter.user.phone}`} className="font-bold text-blue-600 hover:underline">{o.donationCenter.user.phone}</a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-900">{o.buyer?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone:</span>
                <a href={`tel:${o.buyer?.phone}`} className="font-bold text-blue-600 hover:underline">{o.buyer?.phone}</a>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="font-bold text-gray-900">{o.buyer?.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">📦 Ordered Items</h3>
        {o.items.map((it: any) => {
          const l = it.listing;
          const images = l?.images ? (typeof l.images === 'string' ? JSON.parse(l.images) : l.images) : [];
          const mainImage = images[0] || 'https://via.placeholder.com/150?text=No+Image';

          return (
            <div key={it.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={mainImage} alt={l?.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">{l?.title || it.listingId}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-bold">Qty: {it.qty}</span>
                  <span className="text-xs text-green-700 font-bold">LKR {Number(it.unitPrice).toFixed(2)} / unit</span>
                </div>
                <div className="text-sm font-black text-emerald-700 mt-1">Total: LKR {(Number(it.unitPrice) * it.qty).toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {user?.role === 'PROVIDER' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 shadow-sm border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white text-xl">⚙️</div>
            <div>
              <h3 className="font-black text-gray-900">Update Order Status</h3>
              <p className="text-xs text-gray-500">Move the order through the fulfillment process</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={providerStatus} 
              onChange={(e)=>setProviderStatus(e.target.value)} 
              className="flex-1 bg-white border-2 border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 font-bold text-gray-700 transition-all appearance-none"
            >
              <option value="PENDING">🕒 PENDING</option>
              {o.fulfillmentMode === 'PICKUP' ? (
                <option value="READY_FOR_PICKUP">✅ READY FOR PICKUP</option>
              ) : (
                <>
                  <option value="READY_FOR_DELIVERY">📦 READY FOR DELIVERY</option>
                  <option value="OUT_FOR_DELIVERY">🚚 OUT FOR DELIVERY</option>
                </>
              )}
              <option value="DELIVERED">🎉 DELIVERED</option>
              <option value="CANCELED">❌ CANCELED</option>
            </select>
            
            <button 
              className="bg-green-600 hover:bg-green-700 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-green-500/30 active:scale-95 disabled:opacity-50" 
              onClick={()=>updateStatus.mutate(providerStatus)}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'PROCESSING...' : 'UPDATE NOW'}
            </button>
          </div>

          {o.paymentMethod === 'COD' && providerStatus === 'DELIVERED' && (
            <div className="mt-4 flex items-center gap-3 bg-orange-100 text-orange-800 p-3 rounded-lg border border-orange-200 text-sm font-bold animate-pulse">
              <span>⚠️</span>
              Confirm you have collected LKR {Number(o.total).toFixed(2)} in cash.
            </div>
          )}
        </div>
      )}

      {user?.role === 'DONATION_CENTER' && o.type === 'DONATION' && o.status !== 'DELIVERED' && (
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Confirm receipt</div>
          <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={()=>confirmReceived.mutate()}>Mark as Delivered</button>
        </div>
      )}

      {/* Customer Cancellation Section */}
      {user?.role === 'CUSTOMER' && o.buyerId === user.id && o.status !== 'CANCELED' && o.status !== 'DELIVERED' && (
        (() => {
          const createdAt = new Date(o.createdAt).getTime();
          const now = new Date().getTime();
          const minsPassed = (now - createdAt) / (1000 * 60);
          
          if (minsPassed <= 30) {
            return (
              <div className="mt-4 p-4 border border-red-100 bg-red-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-red-800">Need to cancel?</h3>
                    <p className="text-xs text-red-600">You have {Math.ceil(30 - minsPassed)} minutes left to cancel this order.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                        cancelOrder.mutate();
                      }
                    }}
                    disabled={cancelOrder.isPending}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    {cancelOrder.isPending ? 'Canceling...' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()
      )}

      
      {/* Review Section for Customers and Donation Centers */}
      {(user?.role === 'CUSTOMER' || user?.role === 'DONATION_CENTER') && ['AWAITING_PAYMENT', 'RESERVED', 'PAID', 'PENDING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status) && (


        <div className="border rounded p-4 mt-4">
          {o.review ? (
            // Show existing review
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold flex items-center gap-2">
                  <span>Your Review</span>
                  <span className="text-yellow-500">{'⭐'.repeat(o.review.rating)}</span>
                </div>
                <button 
                  onClick={() => {
                    setRating(o.review.rating);
                    setComment(o.review.comment || '');
                    setShowReviewForm(true);
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold transition-all"
                >
                  ✏️ Edit Review
                </button>
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
      
      {/* Print-only Receipt Header (Hidden in UI) */}
      <div className="hidden print:block mb-8">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">FOOD FOR EVERYONE</h1>
          <p className="text-sm text-gray-500">Official Payment Receipt</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-1">Order Details</p>
            <p>ID: OR_{o.orderNumber}</p>

            <p>Date: {new Date(o.createdAt).toLocaleString()}</p>
            <p>Status: {o.status}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-1">Payment Info</p>
            <p>Method: {o.paymentMethod || 'ONLINE'}</p>
            <p>Total: LKR {Number(o.total).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

