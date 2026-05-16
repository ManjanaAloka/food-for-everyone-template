import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { IoCartOutline, IoDocumentTextOutline } from 'react-icons/io5';
import { api } from '../../lib/api';
import { useState, useEffect } from 'react';
import { AutoSubmitForm } from '../../components/AutoSubmitForm';
import { useCart } from '../../state/cart';
import { useAuth } from '../../state/auth';
import { toast } from 'sonner';

function getUrgencyInfo(expiresAt: string) {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours <= 0) return { label: 'Expired', color: 'bg-gray-200 text-gray-600', dot: '⚫' };
  if (diffHours <= 24) return { label: 'Expiring Soon', color: 'bg-red-100 text-red-700', dot: '🔴' };
  if (diffHours <= 72) return { label: 'Almost Gone', color: 'bg-orange-100 text-orange-700', dot: '🟠' };
  return { label: 'Fresh', color: 'bg-green-100 text-green-700', dot: '🟢' };
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 48) setTimeLeft(`${Math.floor(h / 24)}d ${h % 24}h`);
      else setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return <span className="font-mono font-bold">{timeLeft}</span>;
}

function ProgressBar({ raised, target, raisedQty, targetQty, price, requestId }: { raised: number; target: number; raisedQty?: number; targetQty?: number; price?: number; requestId?: string }) {
  const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;

  // If quantities aren't provided, estimate them from the price
  const displayRaisedQty = raisedQty || (price ? Math.floor(raised / price) : 0);
  const displayTargetQty = targetQty || (price ? Math.floor(target / price) : 0);

  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
            {pct.toFixed(0)}% Donated
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-green-600">
            {displayTargetQty > 0 ? `${displayRaisedQty} / ${displayTargetQty} Items` : `LKR ${raised.toLocaleString()} / ${target.toLocaleString()}`}
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100 relative">
        <div 
          style={{ width: `${pct}%` }} 
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
        />
      </div>
    </div>
  );
}



export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const isDonateMode = searchParams.get('mode') === 'donate';
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const { items: cart, add: addToCart } = useCart();
  const { user } = useAuth();
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [donateQty, setDonateQty] = useState(1);
  const [reqQty, setReqQty] = useState(1);
  const queryClient = useQueryClient();
  const [paymentSession, setPaymentSession] = useState<any>(null);
  const [pendingDonationId, setPendingDonationId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState({
    title: '',
    description: '',
    targetQty: '',
    closesAt: ''
  });


  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => (await api.get(`/listings/${id}`)).data
  });

  const { data: requestsData } = useQuery({
    queryKey: ['listing-donations', id],
    queryFn: async () => (await api.get(`/donations?listingId=${id}`)).data,
    enabled: !!id
  });

  const listing = data?.listing;
  const reviews = data?.reviews;

  useEffect(() => {
    if (listing) {
      setReqForm(f => ({
        ...f,
        title: `Request for: ${listing.title}`,
        description: `We are requesting ${listing.title} to help provide meals for our community.`,
        closesAt: new Date(listing.expiresAt).toISOString().split('T')[0]
      }));
    }
  }, [listing]);

  const { mutate: createRequest, isPending: isRequesting } = useMutation({
    mutationFn: async () => {
      if (!listing) throw new Error("Listing not found");
      const qty = Number(reqForm.targetQty);
      const unitPrice = Number(listing.discountPrice);
      const res = await api.post('/donations', {
        title: reqForm.title,
        description: reqForm.description || undefined,
        targetQty: qty,
        targetAmount: qty * unitPrice,
        listingId: id,
        closesAt: reqForm.closesAt || undefined
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Donation request created!');
      setShowRequestModal(false);
      queryClient.invalidateQueries({ queryKey: ['listing-donations', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to request')
  });

  const { mutate: initiateDonation, isPending: isDonating } = useMutation({
    mutationFn: async ({ reqId, amount }: { reqId: string, amount: number }) => {
      const sess = (await api.post(`/donations/${reqId}/checkout`, { amount })).data;
      console.log('Payment Session:', sess);
      
      // Store the donation ID (it's the order_id in PayHere fields)
      if (sess.fields?.order_id) {
        setPendingDonationId(sess.fields.order_id);
      }

      if (sess.method === 'GET' && sess.url) {
        window.location.href = sess.url;
      } else if (sess.fields) {
        setShowDonateModal(false);
        setPaymentSession(sess);
      } else {
        throw new Error('Invalid payment session received');
      }
    },
    onError: (err: any) => {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to initiate payment');
    }
  });

  if (isLoading) return (

    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
        <div className="h-96 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );

  if (error || !data?.listing) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Listing not found</h2>
        <Link to="/browse" className="text-green-600 hover:underline">← Back to browse</Link>
      </div>
    </div>
  );

  const images: string[] = Array.isArray(listing.images) ? listing.images : listing.images ? JSON.parse(listing.images) : [];
  const urgency = getUrgencyInfo(listing.expiresAt);
  const discountPct = Math.round((1 - Number(listing.discountPrice) / Number(listing.unitPrice)) * 100);

  const handleAddToCart = () => {
    addToCart({ 
      listingId: listing.id, 
      title: listing.title, 
      providerId: listing.providerId, 
      price: Number(listing.discountPrice), 
      expiresAt: listing.expiresAt,
      qtyAvailable: listing.qtyAvailable 
    }, qty);
    toast.success(`${listing.title} added to cart! 🛒`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-green-600">Home</Link>
          <span>/</span>
          <Link to="/browse" className="hover:text-green-600">Browse</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate">{listing.title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-square flex items-center justify-center">
              {images.length > 0 ? (
                <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-8xl">🍱</div>
              )}
              {/* Urgency badge overlay */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${urgency.color}`}>
                <span>{urgency.dot}</span>
                <span>{urgency.label}</span>
              </div>
              {discountPct > 0 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{discountPct}%
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-green-500 shadow-md' : 'border-gray-200'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="space-y-6">
            {/* Category */}
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              {listing.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>

            {/* Description */}
            {listing.description && (
              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-green-600">LKR {Number(listing.discountPrice).toFixed(2)}</span>
              {discountPct > 0 && (
                <span className="text-xl text-gray-400 line-through">LKR {Number(listing.unitPrice).toFixed(2)}</span>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{listing.qtyAvailable}</div>
                <div className="text-xs text-gray-500 mt-1">In Stock</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                <div className="text-sm font-bold text-orange-700">
                  <CountdownTimer expiresAt={listing.expiresAt} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Until Expiry</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <div className="text-2xl font-bold text-green-700">{listing.provider?.ratingAvg?.toFixed(1) || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">Provider Rating</div>
              </div>
            </div>

            {/* Qty + Add to Cart */}
            {user?.id === listing.providerId ? (
              <div className="bg-blue-50 rounded-xl p-4 text-center text-blue-700 font-medium border border-blue-200">
                🏪 This is your own listing
              </div>
            ) : listing.status === 'ACTIVE' && listing.qtyAvailable > 0 ? (
              <div className="space-y-3">
                {user?.role !== 'DONATION_CENTER' && (
                  <>
                    {!isDonateMode && (
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Quantity:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center justify-center"
                          >−</button>
                          <span className="w-12 text-center font-semibold text-lg">{qty}</span>
                          <button
                            onClick={() => setQty(prev => Math.min(Number(listing.qtyAvailable), prev + 1))}
                            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center justify-center"
                          >+</button>
                        </div>
                      </div>
                    )}
                    {!isDonateMode && (
                      <button
                        onClick={handleAddToCart}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30"
                      >
                        🛒 Add to Cart — LKR {(Number(listing.discountPrice) * qty).toFixed(2)}
                      </button>
                    )}
                    {isDonateMode ? (
                      <button
                        onClick={() => document.getElementById('donation-requests')?.scrollIntoView({ behavior: 'smooth' })}
                        className="block w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl text-center hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/30 transition-all transform hover:scale-[1.02]"
                      >
                        💝 Donate Now
                      </button>
                    ) : (
                    <button
                      onClick={() => {
                        handleAddToCart();
                        nav('/checkout');
                      }}
                      className="block w-full py-3 border-2 border-green-500 text-green-600 font-semibold rounded-xl text-center hover:bg-green-50 transition-all"
                    >
                      ⚡ Buy Now
                    </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500 font-medium">
                {listing.status === 'EXPIRED' ? '⏰ This listing has expired' : '😔 Out of stock'}
              </div>
            )}

            {/* Donation Center Actions */}
            {user?.role === 'DONATION_CENTER' && listing.status === 'ACTIVE' && listing.qtyAvailable > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-xl transition-colors border border-orange-200 flex items-center justify-center gap-2"
                >
                  <span>🏥</span> Request this for Donation
                </button>
              </div>
            )}


            {/* Provider info */}
            {listing.provider && (
              <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">🏪</div>
                  <div>
                    <div className="font-semibold text-gray-900">{listing.provider.businessName}</div>
                    {listing.provider.city && <div className="text-sm text-gray-500">📍 {listing.provider.city}</div>}
                  </div>
                </div>
                <Link
                  to={`/providers/${listing.providerId}`}
                  className="text-sm text-green-600 hover:underline font-medium"
                >
                  View Profile →
                </Link>
              </div>
            )}

            {/* Ingredients */}
            {listing.ingredients && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <h3 className="font-semibold text-amber-800 mb-1 text-sm">📋 Ingredients</h3>
                <p className="text-sm text-amber-700">{listing.ingredients}</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Donation Requests for this Listing */}
        {requestsData?.requests?.length > 0 && (
          <div id="donation-requests" className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-100 scroll-mt-20">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <span>🤝</span> Help these Donation Centers
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {requestsData.requests.map((req: any) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{req.center.name}</h3>
                      <p className="text-xs text-gray-500">📍 {req.center.address}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active Request</span>
                  </div>
                  
                  <ProgressBar 
                    raised={Number(req.raisedAmount)} 
                    target={Number(req.targetAmount)} 
                    raisedQty={req.fulfilledQty} 
                    targetQty={req.targetQty} 
                    price={Number(req.listing?.discountPrice || listing.discountPrice)}
                    requestId={req.id} 
                  />
                  
                  {user?.role !== 'DONATION_CENTER' && user?.role !== 'PROVIDER' && listing.qtyAvailable > 0 && (
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setDonateQty(1);
                        setShowDonateModal(true);
                      }}
                      className="w-full mt-2 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold rounded-xl text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-md shadow-green-500/20"
                    >
                      💝 Donate to this Center
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Reviews Section */}

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ⭐ Customer Reviews
            {listing.provider?.ratingCount > 0 && (
              <span className="ml-3 text-base font-normal text-gray-500">
                ({listing.provider.ratingCount} reviews · avg {listing.provider.ratingAvg?.toFixed(1)})
              </span>
            )}
          </h2>

          {reviews?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500">No reviews yet for this provider. Be the first!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {reviews?.map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                        {r.reviewer?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{r.reviewer?.name || 'Anonymous'}</div>
                        <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={`text-lg ${i <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mb-3">{r.comment}</p>}
                  {r.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      ✔ Verified Purchase
                    </span>
                  )}
                  {r.providerResponse && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-700 mb-1">Provider Response:</div>
                      <p className="text-xs text-blue-600">{r.providerResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRequestModal && listing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><IoDocumentTextOutline className="text-blue-600" /> Create Donation Request</h3>
                  <p className="text-sm text-slate-500 font-medium italic">Requesting: {listing.title}</p>
                </div>
                <button 
                  onClick={() => setShowRequestModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Request Title *</label>
                    <input
                      value={reqForm.title}
                      onChange={e => setReqForm({ ...reqForm, title: e.target.value })}
                      className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-800"
                      placeholder="e.g., Support our weekend soup kitchen"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      value={reqForm.description}
                      onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                      rows={3}
                      className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-800 resize-none"
                      placeholder="Tell donors why this food is needed..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Quantity *</label>
                      <input
                        type="number"
                        value={reqForm.targetQty}
                        onChange={e => setReqForm({ ...reqForm, targetQty: e.target.value })}
                        className={`w-full border-2 rounded-2xl px-5 py-3.5 focus:outline-none transition-all font-bold ${Number(reqForm.targetQty) > listing.qtyAvailable ? 'border-red-400 focus:border-red-500 bg-red-50 text-red-700' : 'border-slate-100 focus:border-orange-500 text-slate-800'}`}
                      />
                      <div className="flex justify-between items-start mt-1">
                        <p className="text-[10px] text-slate-400 font-bold italic">Max Available: {listing.qtyAvailable}</p>
                        {Number(reqForm.targetQty) > listing.qtyAvailable && (
                          <span className="text-[10px] text-red-500 font-bold">⚠️ Exceeds max limit</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Close Date</label>
                      <input
                        type="date"
                        value={reqForm.closesAt}
                        onChange={e => setReqForm({ ...reqForm, closesAt: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(listing.expiresAt).toISOString().split('T')[0]}
                        className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-orange-500 transition-all font-bold text-slate-800"
                      />
                      <p className="text-[10px] text-red-500 mt-1 font-bold italic flex items-center gap-1">
                        <span>⏰ Item Expiry:</span>
                        <span>{new Date(listing.expiresAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-700 uppercase tracking-wider italic">Total Funding Goal</span>
                      <span className="text-lg font-black text-orange-600">LKR {(Number(listing.discountPrice) * Number(reqForm.targetQty)).toFixed(2)}</span>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createRequest()}
                    disabled={!reqForm.title || !reqForm.targetQty || Number(reqForm.targetQty) > listing.qtyAvailable || isRequesting}
                    className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isRequesting ? '⏳ Creating...' : '🚀 Create Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Donation Impact Modal */}
      {showDonateModal && selectedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-0 max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header with Background */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white relative">
              <button 
                onClick={() => setShowDonateModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-2xl font-bold">Make an Impact</h3>
              <p className="text-green-100 text-sm mt-1">Supporting <strong>{selectedReq.center.name}</strong></p>
            </div>

            <div className="p-8 space-y-6">
              {/* Qty Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-widest">Select Quantity to Donate</label>
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => setDonateQty(Math.max(1, donateQty - 1))}
                    className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 hover:border-green-500 hover:text-green-600 transition-all"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <span className="text-5xl font-black text-gray-900">{donateQty}</span>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">Units</p>
                  </div>
                  <button 
                    onClick={() => {
                      const unitPrice = Number(listing.discountPrice) || 1;
                      const remainingAmt = Number(selectedReq.targetAmount) - (Number(selectedReq.raisedAmount) || 0);
                      const remainingReqQty = Math.floor(remainingAmt / unitPrice);
                      const remainingQty = Math.max(1, Math.min(listing.qtyAvailable, remainingReqQty));
                      setDonateQty(prev => Math.min(remainingQty, prev + 1));
                    }}
                    className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 hover:border-green-500 hover:text-green-600 transition-all"
                  >
                    +
                  </button>



                </div>
              </div>

              {/* Quick Picks */}
              <div className="flex gap-2 justify-center">
                {[5, 10, 20].map(v => {
                  const unitPrice = Number(listing.discountPrice) || 1;
                  const remainingAmt = Number(selectedReq.targetAmount) - (Number(selectedReq.raisedAmount) || 0);
                  const remainingReqQty = Math.floor(remainingAmt / unitPrice);
                  const remainingQty = Math.max(0, Math.min(listing.qtyAvailable, remainingReqQty));
                  const canSelect = v <= remainingQty;
                  return (
                    <button 
                      key={v}
                      onClick={() => setDonateQty(v)}
                      disabled={!canSelect}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        donateQty === v 
                          ? 'bg-green-600 text-white shadow-lg' 
                          : canSelect 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      +{v} Units
                    </button>
                  );
                })}


              </div>


              {/* Impact Message */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
                <p className="text-blue-800 text-sm font-medium italic">
                  "Your donation of {donateQty} units will provide approximately {(donateQty * 2.5).toFixed(0)} meals for families in need."
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Unit Price</span>
                  <span className="font-bold text-gray-900">LKR {Number(listing.discountPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total Donation</span>
                  <span className="font-black text-green-600 text-2xl">LKR {(donateQty * Number(listing.discountPrice)).toLocaleString()}</span>
                </div>
              </div>

              {/* Secure Payment Badges */}
              <div className="flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
              </div>

              <button 
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to make a donation');
                    nav('/login');
                    return;
                  }
                  initiateDonation({ reqId: selectedReq.id, amount: donateQty * Number(listing.discountPrice) });
                }}
                disabled={isDonating}
                className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transform hover:-translate-y-1 transition-all disabled:opacity-50 text-lg uppercase tracking-widest"
              >
                {isDonating ? 'Processing Security...' : '🔒 Secure Donation'}
              </button>
              
              <p className="text-[10px] text-center text-gray-400 uppercase tracking-tighter">
                Verified Donation · Tax Deductible Receipt will be emailed
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentSession && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">💳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting to PayHere...</h2>
          <p className="text-gray-600 mb-8 max-w-sm">Please do not close this window. You are being redirected to our secure payment gateway.</p>
          <AutoSubmitForm url={paymentSession.url} fields={paymentSession.fields} method={paymentSession.method} />
        </div>
      )}
    </div>
  );
}

