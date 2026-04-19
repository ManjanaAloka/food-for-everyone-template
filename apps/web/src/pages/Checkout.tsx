import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../state/cart';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { AutoSubmitForm } from '../components/AutoSubmitForm';
import { useTranslation } from 'react-i18next';

type Form = { type: 'PERSONAL' | 'DONATION'; fulfillmentMode: 'PICKUP' | 'DELIVERY'; paymentMethod: 'ONLINE' | 'COD'; donationCenterId?: string; scheduledTime?: string; addressLine?: string; city?: string; };
const LS_ORDERS = 'ffe_my_orders';

export function CheckoutPage() {
  const { t } = useTranslation();
  const { items, setQty, remove, clear, subtotal } = useCart();
  const [session, setSession] = useState<{ method: 'POST'|'GET'; url: string; fields: Record<string,string> } | null>(null);

  const centersQ = useQuery({ queryKey: ['centers'], queryFn: async () => (await api.get('/donation-centers')).data, enabled: true });

  const { register, handleSubmit, watch } = useForm<Form>({ defaultValues: { type: 'PERSONAL', fulfillmentMode: 'PICKUP', paymentMethod: 'ONLINE' } });
  const type = watch('type');

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
            scheduledTime: v.scheduledTime,
            addressLine: v.fulfillmentMode === 'DELIVERY' ? v.addressLine : undefined,
            city: v.fulfillmentMode === 'DELIVERY' ? v.city : undefined
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
            alert('Order placed with Cash on Delivery.');
            clear();
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="PICKUP" {...register('fulfillmentMode')} className="text-green-600 focus:ring-green-500" />
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
                      <span className="text-gray-700">Cash on Delivery</span>
                    </label>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Scheduled Time (Optional)</label>
                    <input 
                      type="datetime-local"
                      {...register('scheduledTime')} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address (for delivery)</label>
                    <input 
                      {...register('addressLine')} 
                      placeholder="Street address" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City (for delivery)</label>
                    <input 
                      {...register('city')} 
                      placeholder="City" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    />
                  </div>
                </div>

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
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>LKR {subtotal.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">💡 Delivery fee (if any) will be applied by provider.</p>
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
