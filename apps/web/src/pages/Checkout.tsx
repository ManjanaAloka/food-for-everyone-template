import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../state/cart';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { AutoSubmitForm } from '../components/AutoSubmitForm';
import { useTranslation } from 'react-i18next';
import { MapPicker } from '../components/MapPicker';

type Form = { type: 'PERSONAL' | 'DONATION'; fulfillmentMode: 'PICKUP' | 'DELIVERY'; paymentMethod: 'ONLINE' | 'COD'; donationCenterId?: string; scheduledTime?: string; addressLine?: string; city?: string; lat?: number; lng?: number; };
const LS_ORDERS = 'ffe_my_orders';

export function CheckoutPage() {
  const { t } = useTranslation();
  const { items, setQty, remove, clear, subtotal } = useCart();
  const [session, setSession] = useState<{ method: 'POST'|'GET'; url: string; fields: Record<string,string> } | null>(null);

  const centersQ = useQuery({ queryKey: ['centers'], queryFn: async () => (await api.get('/donation-centers')).data, enabled: true });
  const profileQ = useQuery({ queryKey: ['customerMe'], queryFn: async () => (await api.get('/customers/me')).data, enabled: true });
  const [editingAddress, setEditingAddress] = useState(false);

  const { register, handleSubmit, watch, reset, setValue } = useForm<Form>({ defaultValues: { type: 'PERSONAL', fulfillmentMode: 'PICKUP', paymentMethod: 'ONLINE' } });
  const type = watch('type');
  const fulfillmentMode = watch('fulfillmentMode');
  const donationCenterId = watch('donationCenterId');
  const paymentMethod = watch('paymentMethod');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (type === 'DONATION' && donationCenterId) {
      const center = centersQ.data?.centers?.find((c: any) => c.userId === donationCenterId);
      if (center) {
        setValue('fulfillmentMode', 'DELIVERY');
        setValue('addressLine', center.address || '');
        setValue('city', center.city || '');
        setEditingAddress(false);
      }
    }
  }, [donationCenterId, type, centersQ.data, setValue]);

  // Handle Geolocation for COD
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setValue('lat', pos.coords.latitude);
          setValue('lng', pos.coords.longitude);
          setLocating(false);
        },
        (err) => {
          console.error(err);
          setLocating(false);
          alert('Could not get location. Please allow location access or pick on map.');
        }
      );
    }
  };

  useEffect(() => {
    if (paymentMethod === 'COD' && fulfillmentMode === 'DELIVERY') {
      handleGetLocation();
    }
  }, [paymentMethod, fulfillmentMode]);

  // Delivery Fee Calculation
  const deliveryFee = fulfillmentMode === 'DELIVERY' ? 250 : 0;
  const grandTotal = subtotal + deliveryFee;

  // Pre-fill address
  useState(() => {
    if (profileQ.data?.profile) {
      const p = profileQ.data.profile;
      reset({
        type: 'PERSONAL',
        fulfillmentMode: 'PICKUP',
        paymentMethod: 'ONLINE',
        addressLine: p.address || '',
        city: p.city || ''
      });
    }
  });

  useEffect(() => {
    if (profileQ.data?.profile) {
      const p = profileQ.data.profile;
      const currentValues = watch();
      
      // If COD is selected, force profile address
      if (paymentMethod === 'COD') {
        setValue('addressLine', p.address || '');
        if (p.lat && p.lng) {
          setValue('lat', p.lat);
          setValue('lng', p.lng);
        }
      } else if (!currentValues.addressLine) {
        // Only reset if empty and switching away from COD or initial load
        setValue('addressLine', p.address || '');
        if (p.lat && p.lng) {
          setValue('lat', p.lat);
          setValue('lng', p.lng);
        }
      }
    }
  }, [profileQ.data, paymentMethod, setValue]);

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600">Add some items to your cart to checkout</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete checkout</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>

              <div className="space-y-3">
                {items.map((it) => (
                  <div key={it.listingId} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{it.title}</div>
                      <div className="text-sm text-gray-500">Expires: {new Date(it.expiresAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min={1} 
                        max={it.qtyAvailable}
                        value={it.qty} 
                        onChange={(e)=>setQty(it.listingId, Number(e.target.value))} 
                        className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      />
                      <div className="font-semibold text-gray-900 w-24 text-right">LKR {(it.price * it.qty).toFixed(2)}</div>
                      <button 
                        className="text-red-600 hover:text-red-700 font-medium text-sm" 
                        onClick={()=>remove(it.listingId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Checkout Details</h2>
              
              <form onSubmit={handleSubmit(async (v) => {
          const payload: any = {
            items: items.map(it => ({ listingId: it.listingId, qty: it.qty })),
            type: v.type, fulfillmentMode: v.fulfillmentMode, paymentMethod: v.paymentMethod,
            donationCenterId: v.type === 'DONATION' ? v.donationCenterId : undefined,
            addressLine: v.fulfillmentMode === 'DELIVERY' ? v.addressLine : undefined,
            lat: v.lat,
            lng: v.lng,
            deliveryFee
          };
          const order = await api.post('/orders', payload).then(r => r.data);
          try {
            const raw = localStorage.getItem(LS_ORDERS);
            const ids = raw ? JSON.parse(raw) as string[] : [];
            if (!ids.includes(order.orderId)) ids.unshift(order.orderId);
            localStorage.setItem(LS_ORDERS, JSON.stringify(ids.slice(0, 20)));
          } catch {}
          if (v.paymentMethod === 'ONLINE') {
            const sess = await api.post('/payments/checkout', { orderId: order.orderId }).then(r => r.data);
            // For Stripe (GET method), redirect directly
            if (sess.method === 'GET' && sess.url) {
              window.location.href = sess.url;
            } else {
              // For PayHere/WebXpay (POST method), use form submission
              setSession(sess);
            }
          } else {
            const successMsg = v.fulfillmentMode === 'PICKUP' 
              ? 'Your order has been reserved successfully!' 
              : 'Your order has been confirmed and will be delivered soon!';
            alert(successMsg);
            clear();
            window.location.href = `/orders/${order.orderId}`;
          }

              })} className="space-y-6">
                {/* Order Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="PERSONAL" {...register('type')} className="text-green-600 focus:ring-green-500" />
                      <span className="text-gray-700">Personal Use</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="DONATION" {...register('type')} className="text-green-600 focus:ring-green-500" />
                      <span className="text-gray-700">Donation</span>
                    </label>
                  </div>
                </div>

                {/* Donation Center Selection */}
                {type === 'DONATION' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Donation Center</label>
                    <select {...register('donationCenterId', { required: true })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">Select a center</option>
                      {centersQ.data?.centers?.map((c: any) => <option key={c.userId} value={c.userId}>{c.name}</option>)}
                    </select>
                    <p className="text-sm text-gray-500 mt-2">💡 Donations require Online payment.</p>
                  </div>
                )}

                {/* Fulfillment Mode */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fulfillment Mode</label>
                  <div className="flex gap-4">
                    <label className={`flex items-center gap-2 cursor-pointer ${type === 'DONATION' ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="radio" value="PICKUP" {...register('fulfillmentMode')} disabled={type === 'DONATION'} className="text-green-600 focus:ring-green-500" />
                      <span className="text-gray-700">Pickup</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="DELIVERY" {...register('fulfillmentMode')} className="text-green-600 focus:ring-green-500" />
                      <span className="text-gray-700">Delivery</span>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="ONLINE" {...register('paymentMethod')} className="text-green-600 focus:ring-green-500" />
                      <span className="text-gray-700">Online Payment</span>
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer ${type === 'DONATION' ? 'opacity-50' : ''}`}>
                      <input type="radio" value="COD" {...register('paymentMethod')} disabled={type === 'DONATION'} className="text-green-600 focus:ring-green-500" />
                      <span className="text-gray-700">{fulfillmentMode === 'PICKUP' ? 'Cash on Pickup' : 'Cash on Delivery'}</span>
                    </label>
                  </div>
                </div>



                {/* Delivery Address Section */}
                {fulfillmentMode === 'DELIVERY' && (
                  <div className="space-y-4">
                    {paymentMethod === 'COD' && !profileQ.data?.profile?.address && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                          <span>⚠️</span>
                          Please save an address in your profile to use Cash on Delivery.
                        </p>
                        <Link to="/profile" className="text-xs text-red-700 underline font-bold mt-1 block">Go to Profile →</Link>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-700">Address (for delivery) *</label>
                        {paymentMethod === 'COD' && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-bold uppercase">Locked to Profile</span>
                        )}
                      </div>
                      <input 
                        {...register('addressLine', { required: true })} 
                        placeholder="Street address" 
                        readOnly={paymentMethod === 'COD'}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${paymentMethod === 'COD' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} 
                      />
                      {paymentMethod === 'COD' && (
                        <p className="text-[10px] text-gray-500 mt-1 italic">For security, COD is only available for your registered profile address.</p>
                      )}
                    </div>
                    
                    {/* Map Picker */}
                    {paymentMethod !== 'COD' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Delivery Location</span>
                        </div>
                        
                        <MapPicker 
                          onLocationSelect={(lat, lng) => {
                            setValue('lat', lat);
                            setValue('lng', lng);
                          }}
                          onAddressSelect={(data) => {
                            if (data.address) {
                              setValue('addressLine', data.address);
                            }
                            // You can also set city here if you have a city field
                            setEditingAddress(true);
                          }}
                          initialLat={watch('lat')}
                          initialLng={watch('lng')}
                          address={watch('addressLine')}
                        />
                        
                        {watch('lat') && (
                          <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <span className="text-xs font-bold text-green-700 uppercase">Exact location pinned</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all">
                  Place Order
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">LKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery Fee</span>
                <span className="font-semibold">LKR {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>LKR {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">💡 {fulfillmentMode === 'DELIVERY' ? 'Includes standard delivery fee.' : 'No delivery fee for pickup.'}</p>
            </div>
          </div>
        </div>

        {session && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">💳</div>
            <p className="text-lg font-semibold text-gray-900 mb-3">Redirecting to payment...</p>
            <AutoSubmitForm url={session.url} fields={session.fields} method={session.method} />
          </div>
        )}
      </div>
    </div>
  );
}
