import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../state/auth';
import React, { useState, useEffect } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../env';

export function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [providerStatus, setProviderStatus] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { data, isLoading } = useQuery({ 
    queryKey: ['order', id], 
    queryFn: async () => (await api.get(`/orders/${id}`)).data, 
    enabled: !!id 
  });

  // ... (rest of the state logic remains same)
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

  const deliveryCoords = o.lat && o.lng ? { lat: Number(o.lat), lng: Number(o.lng) } : null;

  return (
    <div>
      <div className="flex justify-between items-start mb-2 print:hidden">
        <h1 className="text-xl font-semibold">Order OR_{o.orderNumber}</h1>

        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all print:hidden"
        >
          <span>📥</span> Download Receipt
        </button>
      </div>

      <div className="text-xs sm:text-sm mb-6 flex flex-wrap gap-x-6 gap-y-2 text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-gray-100 print:hidden">
        <div><span className="font-medium text-gray-900">📅 Ordered At:</span> {new Date(o.createdAt).toLocaleString()}</div>
        <div><span className="font-medium text-gray-900">Status:</span> <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span></div>
        <div><span className="font-medium text-gray-900">Type:</span> {o.type}</div>
        <div><span className="font-medium text-gray-900">Mode:</span> {o.fulfillmentMode}</div>
        <div>
          <span className="font-medium text-gray-900">Payment:</span> {o.paymentMethod || 'ONLINE'} 
          {o.paymentMethod === 'COD' && o.status === 'DELIVERED' && <span className="ml-1 text-green-600 font-semibold">(Collected)</span>}
          {o.paymentMethod === 'COD' && o.status !== 'DELIVERED' && <span className="ml-1 text-orange-600 font-semibold">(To Collect)</span>}
          {o.paymentMethod === 'ONLINE' && ['PAID', 'PENDING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status) && <span className="ml-1 text-green-600 font-semibold">(Paid)</span>}
          {o.paymentMethod === 'ONLINE' && ['AWAITING_PAYMENT', 'CREATED', 'RESERVED'].includes(o.status) && (
            <span className="ml-1 text-orange-600 font-semibold">(Pending)</span>
          )}
        </div>
      </div>
      {/* Customer / Donation Center Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:hidden">
        {/* Fulfillment Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            📍 Fulfillment Info
          </h3>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Method:</span>
              <span className="font-bold text-gray-900 tracking-wide uppercase">{o.fulfillmentMode}</span>
            </div>
            {o.addressLine && (
              <div className="text-sm">
                <div className="flex justify-between items-center mb-1">
                   <span className="text-gray-500">Delivery Address:</span>
                   {deliveryCoords && (
                     <a 
                       href={`https://www.google.com/maps/dir/?api=1&destination=${deliveryCoords.lat},${deliveryCoords.lng}`}
                       target="_blank"
                       rel="noreferrer"
                       className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                     >
                       🧭 Open in Maps
                     </a>
                   )}
                </div>
                <p className="font-bold text-gray-900 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {o.addressLine}, {o.city}
                </p>
              </div>
            )}
            
            {/* Delivery Destination Map for Provider */}
            {user?.role === 'PROVIDER' && o.fulfillmentMode === 'DELIVERY' && deliveryCoords && isLoaded && (
               <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-48 relative group">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={deliveryCoords}
                    zoom={15}
                    options={{ disableDefaultUI: true, zoomControl: false }}
                  >
                    <MarkerF position={deliveryCoords} />
                  </GoogleMap>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
               </div>
            )}

            {o.scheduledTime && (
              <div className="flex justify-between text-sm bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                <span className="text-gray-500">Scheduled Time:</span>
                <span className="font-bold text-green-700 tracking-tight">{new Date(o.scheduledTime).toLocaleString()}</span>
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

      <div className="space-y-3 mb-6 print:hidden">
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
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl shadow-green-900/5 border border-slate-100 print:hidden overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-green-600" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Fulfillment Workflow</h3>
                  <p className="text-sm text-slate-500 font-medium italic">Complete each step to finalize the order</p>
                </div>
              </div>

              {/* Visual Stepper */}
              <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {(() => {
                  const steps = o.fulfillmentMode === 'PICKUP' 
                    ? ['PENDING', 'READY_FOR_PICKUP', 'DELIVERED']
                    : ['PENDING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  
                  const currentIndex = steps.indexOf(o.status);
                  
                  return steps.map((step, idx) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center min-w-[100px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                          idx < currentIndex ? 'bg-green-600 text-white' : 
                          idx === currentIndex ? 'bg-green-100 text-green-700 ring-4 ring-green-50' : 
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {idx < currentIndex ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${
                          idx <= currentIndex ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {step.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`h-[2px] w-12 mb-6 ${idx < currentIndex ? 'bg-green-600' : 'bg-slate-100'}`} />
                      )}
                    </React.Fragment>
                  ));
                })()}
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[280px]">
              {o.status === 'DELIVERED' ? (
                <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
                  <span className="text-3xl block mb-2">🎉</span>
                  <p className="text-green-800 font-black uppercase tracking-widest text-sm">Order Completed</p>
                </div>
              ) : o.status === 'CANCELED' ? (
                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
                  <span className="text-3xl block mb-2">❌</span>
                  <p className="text-red-800 font-black uppercase tracking-widest text-sm">Order Canceled</p>
                </div>
              ) : (
                <>
                  {/* Dynamic Primary Action Button */}
                  {(() => {
                    let nextStatus = '';
                    let label = '';
                    let icon = '';
                    
                    if (o.status === 'PENDING' || o.status === 'PAID') {
                      nextStatus = o.fulfillmentMode === 'PICKUP' ? 'READY_FOR_PICKUP' : 'READY_FOR_DELIVERY';
                      label = o.fulfillmentMode === 'PICKUP' ? 'Mark as Ready for Pickup' : 'Mark as Ready for Delivery';
                      icon = '📦';
                    } else if (o.status === 'READY_FOR_PICKUP') {
                      nextStatus = 'DELIVERED';
                      label = 'Confirm Customer Handover';
                      icon = '🤝';
                    } else if (o.status === 'READY_FOR_DELIVERY') {
                      nextStatus = 'OUT_FOR_DELIVERY';
                      label = 'Mark as Dispatched';
                      icon = '🚚';
                    } else if (o.status === 'OUT_FOR_DELIVERY') {
                      nextStatus = 'DELIVERED';
                      label = 'Confirm Delivery Success';
                      icon = '✅';
                    }

                    if (!nextStatus) return null;

                    return (
                      <button 
                        onClick={() => {
                          if (window.confirm(`Advance order to ${nextStatus.replace(/_/g, ' ')}?`)) {
                            updateStatus.mutate(nextStatus);
                          }
                        }}
                        disabled={updateStatus.isPending}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider"
                      >
                        <span className="text-xl">{icon}</span>
                        {updateStatus.isPending ? 'Processing...' : label}
                      </button>
                    );
                  })()}

                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        updateStatus.mutate('CANCELED');
                      }
                    }}
                    className="w-full bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 font-black py-3 px-6 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em]"
                  >
                    Cancel Order
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Special Reminders */}
          {o.paymentMethod === 'COD' && o.status !== 'DELIVERED' && (
            <div className="mt-8 flex items-center gap-4 bg-orange-50 border border-orange-100 p-5 rounded-2xl">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">💵</div>
              <p className="text-sm font-bold text-orange-800">
                <span className="block text-[10px] uppercase tracking-widest opacity-60 mb-0.5">Cash on Delivery Reminder</span>
                Ensure you collect <span className="text-lg">LKR {Number(o.total).toFixed(2)}</span> during handover.
              </p>
            </div>
          )}
        </div>
      )}

      {user?.role === 'DONATION_CENTER' && o.type === 'DONATION' && o.status !== 'DELIVERED' && (
        <div className="border rounded p-3 print:hidden">
          <div className="font-medium mb-2">Confirm receipt</div>
          <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={()=>confirmReceived.mutate()}>Mark as Delivered</button>
        </div>
      )}

      {/* Customer Cancellation Section - Only allowed within 30 mins and if NOT paid yet */}
      {user?.role === 'CUSTOMER' && o.buyerId === user.id && !['PAID', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'].includes(o.status) && (
        (() => {
          const createdAt = new Date(o.createdAt).getTime();
          const now = new Date().getTime();
          const minsPassed = (now - createdAt) / (1000 * 60);
          
          if (minsPassed <= 30) {
            return (
              <div className="mt-4 p-4 border border-red-100 bg-red-50 rounded-xl print:hidden">
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


        <div className="border rounded p-4 mt-4 print:hidden">
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
      
      {/* Professional Branded Receipt (Visible ONLY during print) */}
      <div className="hidden print:block p-8 bg-white text-gray-900 font-sans max-w-4xl mx-auto border-2 border-gray-100 rounded-2xl print-receipt-container">
        {/* Receipt Header */}
        <div className="flex justify-between items-start border-b-4 border-green-600 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl">🍽️</div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Food for Everyone</h1>
            </div>
            <p className="text-gray-500 font-medium tracking-wide">Official Payment & Fulfillment Receipt</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-gray-200 uppercase mb-2">RECEIPT</h2>
            <div className="text-sm font-bold text-gray-500">
              <p>NO: <span className="text-green-600">OR_{o.orderNumber?.toString().padStart(4, '0')}</span></p>
              <p>DATE: {new Date(o.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recipient Details</h3>
            <div className="space-y-1 text-sm">
              <p className="text-lg font-bold text-gray-900">{o.buyer?.name || o.donationCenter?.name}</p>
              <p className="text-gray-600">{o.buyer?.email || o.donationCenter?.user?.email}</p>
              <p className="text-gray-600">{o.buyer?.phone || o.donationCenter?.user?.phone}</p>
              {o.addressLine && (
                <p className="mt-2 text-gray-900 font-medium italic border-l-2 border-green-200 pl-3">
                  {o.addressLine}, {o.city}
                </p>
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-right">Order Summary</h3>
            <div className="space-y-2 text-sm text-right">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-green-700 uppercase">{o.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-bold text-gray-900 uppercase">{o.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method:</span>
                <span className="font-bold text-gray-900 uppercase">{o.fulfillmentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="font-bold text-gray-900 uppercase">{o.paymentMethod || 'ONLINE'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Item Description</th>
                <th className="py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                <th className="py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                <th className="py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {o.items.map((it: any) => (
                <tr key={it.id}>
                  <td className="py-5">
                    <p className="font-bold text-gray-900 text-lg">{it.listing?.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Product ID: {it.listingId}</p>
                  </td>
                  <td className="py-5 text-center font-bold text-gray-900 text-lg">{it.qty}</td>
                  <td className="py-5 text-right text-gray-500 font-medium">LKR {Number(it.unitPrice).toFixed(2)}</td>
                  <td className="py-5 text-right font-black text-gray-900 text-lg">LKR {(it.qty * Number(it.unitPrice)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-bold">LKR {Number(o.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Service Fee</span>
              <span className="font-bold">LKR 0.00</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-900">
              <span className="text-xl font-black uppercase text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-green-700">LKR {Number(o.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-100">
          <p className="text-xl font-bold text-gray-900 mb-2 italic">"Thank you for being part of the movement!"</p>
          <p className="text-sm text-gray-400 mb-6">Sustainable food sharing for everyone, everywhere.</p>
          
          <div className="flex justify-center gap-8 grayscale opacity-50">
            <div className="text-[10px] font-black uppercase tracking-widest">Environmentally Conscious</div>
            <div className="text-[10px] font-black uppercase tracking-widest">Zero Waste Initiative</div>
            <div className="text-[10px] font-black uppercase tracking-widest">Community Driven</div>
          </div>
        </div>
      </div>

      {/* Global Print Styles to Hide UI */}
      <style>{`
        @media print {
          /* Hide everything by default */
          body {
            visibility: hidden;
            background: white !important;
          }

          /* Show only the receipt container and its content */
          .print-receipt-container, 
          .print-receipt-container * {
            visibility: visible !important;
          }

          /* Position the receipt at the very top of the printed page */
          .print-receipt-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }

          /* Completely remove extra UI elements from the layout flow */
          nav, footer, .print\\:hidden, button, select, .alert-box {
            display: none !important;
          }

          /* Reset common layout wrappers to avoid extra white space */
          .max-w-6xl, .p-4, .pt-20, .mb-6, .mb-2 {
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
