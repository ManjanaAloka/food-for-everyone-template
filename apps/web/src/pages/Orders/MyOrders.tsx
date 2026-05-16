import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useState, useRef } from 'react';
import { useAuth } from '../../state/auth';
import html2canvas from 'html2canvas';
import { IoBagHandleOutline, IoHeartOutline } from 'react-icons/io5';


export function MyOrdersPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 8;
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'DONATION'>('PERSONAL');
  const isDonationAccount = user?.role === 'DONATION_CENTER';
  const isProvider = user?.role === 'PROVIDER';

  const downloadStory = async () => {
    if (!storyRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(storyRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `impact-story-${selectedDonation?.id?.slice(0, 6)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => (await api.get('/orders')).data
  });

  const { data: donationsData, isLoading: donationsLoading } = useQuery({
    queryKey: ['myDonations'],
    queryFn: async () => (await api.get('/donations/my/history')).data
  });

  if (ordersLoading || donationsLoading) return <div className="pt-20 text-center">Loading history...</div>;

  const orders = ordersData?.orders || [];
  
  // Calculate active counts
  const activeStatuses = ['PAID', 'PENDING', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'];
  const personalActiveCount = orders.filter((o: any) => 
    (o.type === 'PERSONAL' || o.type === 'REGULAR') && activeStatuses.includes(o.status)
  ).length;
  const donationActiveCount = orders.filter((o: any) => 
    (o.type === 'DONATION' || o.isDonationOnly) && activeStatuses.includes(o.status)
  ).length;
  const donations = (donationsData?.donations || []).map((d: any) => ({
    ...d,
    isDonationOnly: true,
    total: d.amount,
    provider: d.donationRequest?.listing?.provider,
    items: [{ listing: { title: d.donationRequest.title, images: [] } }]
  }));

  const allTransactions = [...orders, ...donations].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredTransactions = allTransactions.filter(t => {
    if (isDonationAccount) return true; // Show all for center
    if (activeTab === 'PERSONAL') return t.type === 'PERSONAL';
    return t.type === 'DONATION' || t.isDonationOnly;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  if (!allTransactions.length) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600">You haven't placed any orders yet.</p>
            <Link to="/browse" className="inline-block mt-6 px-6 py-2 bg-green-600 text-white rounded-lg font-bold">Browse Food</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 mb-4 ${
            isDonationAccount || activeTab === 'DONATION' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'
          }`}>
            <span className="text-lg">
              {isDonationAccount || activeTab === 'DONATION' ? <IoHeartOutline /> : <IoBagHandleOutline />}
            </span>
            <span className="font-black text-[10px] uppercase tracking-widest">
              {isDonationAccount || activeTab === 'DONATION' ? 'My Impact Donations' : 'My Personal Orders'}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">
            {isDonationAccount || activeTab === 'DONATION' ? 'Donation History' : 'Order History'}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {isDonationAccount || activeTab === 'DONATION'
              ? 'Review your contributions and the lives you have touched' 
              : 'Keep track of your recent food orders and their delivery status'}
          </p>
        </div>

        {!isDonationAccount && (
          <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => { setActiveTab('PERSONAL'); setCurrentPage(1); }}
              className={`flex-1 py-4 px-6 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 relative ${
                activeTab === 'PERSONAL' 
                  ? 'bg-green-600 text-white shadow-xl shadow-green-100' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <IoBagHandleOutline className="text-xl" /> Order History
              {personalActiveCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-lg animate-pulse">
                  {personalActiveCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('DONATION'); setCurrentPage(1); }}
              className={`flex-1 py-4 px-6 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 relative ${
                activeTab === 'DONATION' 
                  ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <IoHeartOutline className="text-xl" /> Donation History
              {donationActiveCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-lg animate-pulse">
                  {donationActiveCount}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {currentItems.map((o: any) => {
              if (o.isDonationOnly || o.type === 'DONATION') {
                const isCartDonation = o.type === 'DONATION';
                const title = isCartDonation 
                  ? o.items.map((it: any) => it.listing?.title).join(', ')
                  : o.donationRequest?.title;
                const itemsCount = isCartDonation
                  ? o.items.reduce((acc: number, it: any) => acc + (it.qty || 0), 0)
                  : Math.max(1, Math.round(Number(o.amount) / (Number(o.donationRequest?.listing?.discountPrice) || 150)));

                // Get real product image
                const donationFirstItem = o.items?.[0];
                const donationListing = donationFirstItem?.listing || o.donationRequest?.listing;
                const donationImages = donationListing?.images
                  ? (typeof donationListing.images === 'string' ? JSON.parse(donationListing.images) : donationListing.images)
                  : [];
                const donationImage = donationImages[0];

                // Status color
                const statusColor = 
                  o.status === 'DELIVERED' || o.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' :
                  o.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                  o.status === 'PAID' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700';

                return (
                  <div
                    key={o.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-orange-100 rounded-xl hover:shadow-md transition-all hover:border-orange-300 bg-white gap-4 cursor-pointer"
                    onClick={() => {
                      if (user?.role === 'PROVIDER' || user?.role === 'DONATION_CENTER') {
                        nav(`/orders/${o.id}`);
                        return;
                      }
                      if (isCartDonation) {
                        setSelectedDonation({ ...o, amount: o.total, donationRequest: { title, listing: { discountPrice: o.items[0]?.unitPrice || 150 } } });
                      } else {
                        setSelectedDonation(o);
                      }
                    }}
                  >
                    {/* Left: Image + Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-orange-100 flex-shrink-0 bg-orange-50">
                        {donationImage ? (
                          <img src={donationImage} alt={title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">💝</div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 line-clamp-1">{title}</div>
                        <div className="text-xs text-orange-500 font-bold font-mono mb-1">
                          {isCartDonation
                            ? `O-${o.orderNumber?.toString().padStart(4, '0') || '—'}`
                            : `D-${o.donationNumber?.toString().padStart(4, '0') || '—'}`
                          }
                          <span className="text-gray-400 ml-2 font-sans font-normal">
                            {new Date(o.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${statusColor}`}>
                            {o.status}
                          </span>
                          <span className="text-sm text-orange-700 font-black flex items-center gap-1">
                            💝 {itemsCount} Items Donated
                          </span>
                          <span className="text-sm text-gray-500 font-medium">
                            LKR {Number(o.total || o.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Provider */}
                    {o.provider?.businessName && (
                      <div className="hidden md:flex flex-1 items-center justify-center">
                        <div className="px-3 py-1 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-2">
                          <span className="text-orange-400 text-sm">🏪</span>
                          <span className="text-[11px] text-orange-700 font-black uppercase tracking-wider">{o.provider.businessName}</span>
                        </div>
                      </div>
                    )}

                    {/* Right: Action */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-orange-100" onClick={e => e.stopPropagation()}>
                      {user?.role === 'PROVIDER' || user?.role === 'DONATION_CENTER' ? (
                        <button onClick={() => nav(`/orders/${o.id}`)} className="text-orange-600 font-bold text-sm flex items-center gap-1 hover:underline">
                          {user?.role === 'PROVIDER' ? 'View Order' : 'View Receipt'} <span className="text-lg">→</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (isCartDonation) {
                              setSelectedDonation({ ...o, amount: o.total, donationRequest: { title, listing: { discountPrice: o.items[0]?.unitPrice || 150 } } });
                            } else {
                              setSelectedDonation(o);
                            }
                          }}
                          className="text-orange-600 font-bold text-sm flex items-center gap-1 hover:underline"
                        >
                          View Impact <span className="text-lg">→</span>
                        </button>
                      )}
                      <div className="text-[10px] text-orange-300 font-medium italic">Thank You! ❤️</div>
                    </div>
                  </div>
                );
              }

              const firstItem = o.items[0];
              const listing = firstItem?.listing;
              const images = listing?.images ? (typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images) : [];
              const mainImage = images[0] || 'https://via.placeholder.com/150?text=No+Image';

              return (
                <div
                  key={o.id}
                  onClick={() => nav(`/orders/${o.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-green-500 bg-white gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={mainImage} alt={listing?.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 line-clamp-1">
                        {o.items.length > 1 ? `${listing?.title} + ${o.items.length - 1} more` : listing?.title}
                      </div>
                      <div className="text-xs text-green-600 font-bold font-mono mb-1">
                        O-{o.orderNumber?.toString().padStart(4, '0') || '—'}
                        <span className="text-gray-400 ml-2 font-sans font-normal">
                          {new Date(o.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${
                          o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          o.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {o.status}
                        </span>
                          <div className="flex items-center gap-3">
                             <span className="text-sm text-green-700 font-black flex items-center gap-1">
                               📦 {o.items.reduce((acc: number, it: any) => acc + (it.qty || 0), 0)} Items
                             </span>
                             <span className="text-sm text-gray-500 font-medium">LKR {Number(o.total).toFixed(2)}</span>
                          </div>
                      </div>
                    </div>
                  </div>

                  {o.provider?.businessName && (
                    <div className="hidden md:flex flex-1 items-center justify-center">
                      <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                        <span className="text-slate-400 text-sm">🏪</span>
                        <span className="text-[11px] text-slate-600 font-black uppercase tracking-wider">{o.provider.businessName}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <div className="text-green-600 font-bold text-sm flex items-center gap-1">
                      Details <span className="text-lg">→</span>
                    </div>
                    {o.status === 'DELIVERED' && !o.review && o.buyerId === user?.id && (
                      <Link
                        to={`/orders/${o.id}/review`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        ⭐ Rate & Review
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    currentPage === i + 1
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Donation Story Card Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">

            {/* Story Card - this gets captured by html2canvas */}
            <div
              ref={storyRef}
              className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl"
              style={{ aspectRatio: '9/16', background: 'linear-gradient(145deg, #f97316 0%, #fb923c 25%, #fbbf24 60%, #fde68a 100%)' }}
            >
              {/* Background Blobs */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between px-8 py-12 text-white text-center">

                {/* Top badge */}
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2">
                  <span className="text-xs font-black uppercase tracking-widest">🌍 Food for Everyone</span>
                </div>

                {/* Hero section */}
                <div className="space-y-4">
                  <div className="text-7xl">💝</div>
                  <div className="space-y-1">
                    <p className="text-white/70 text-sm font-bold uppercase tracking-[0.2em]">I just donated</p>
                    <div className="text-5xl font-black drop-shadow-lg">
                      LKR {Number(selectedDonation.amount).toFixed(0)}
                    </div>
                    <p className="text-white/80 text-base font-medium">to {selectedDonation.donationRequest.title}</p>
                  </div>
                </div>

                {/* Impact Stats */}
                <div className="w-full bg-white/15 border border-white/20 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">My Impact</p>
                  <div className="flex justify-around">
                    <div className="text-center">
                      <div className="text-3xl font-black">{(selectedDonation.amount / (selectedDonation.donationRequest.listing?.discountPrice || 150) * 2.5).toFixed(0)}</div>
                      <div className="text-[10px] font-bold uppercase text-white/60 tracking-wider mt-1">🍽 Meals</div>
                    </div>
                    <div className="w-px bg-white/20" />
                    <div className="text-center">
                      <div className="text-3xl font-black">{(selectedDonation.amount / (selectedDonation.donationRequest.listing?.discountPrice || 150) * 1.2).toFixed(1)}kg</div>
                      <div className="text-[10px] font-bold uppercase text-white/60 tracking-wider mt-1">🌱 CO2 Saved</div>
                    </div>
                    <div className="w-px bg-white/20" />
                    <div className="text-center">
                      <div className="text-3xl font-black">{(selectedDonation.amount / (selectedDonation.donationRequest.listing?.discountPrice || 150)).toFixed(0)}</div>
                      <div className="text-[10px] font-bold uppercase text-white/60 tracking-wider mt-1">📦 Items</div>
                    </div>
                  </div>
                </div>

                {/* Bottom tagline */}
                <div className="space-y-2">
                  <p className="text-white/90 text-sm font-semibold italic">"Together, no one goes hungry."</p>
                  <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
                    foodforeveryone.lk · {new Date(selectedDonation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={downloadStory}
                disabled={downloading}
                className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {downloading ? '⏳ Saving...' : '⬇️ Download Story'}
              </button>
              <button
                onClick={() => setSelectedDonation(null)}
                className="px-5 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-sm border border-white/20 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
