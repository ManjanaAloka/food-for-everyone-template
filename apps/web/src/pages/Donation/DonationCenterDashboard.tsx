import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useCart } from '../../state/cart';
import { 
  IoBusinessOutline, IoClipboardOutline, IoCheckmarkCircleOutline, 
  IoCashOutline, IoCubeOutline, IoFlameOutline, IoAddCircleOutline, 
  IoDocumentTextOutline, IoFastFoodOutline, IoCreateOutline, IoCameraOutline,
  IoTimeOutline
} from 'react-icons/io5';

function ProgressBar({ raised, target, fulfilledQty, targetQty }: { raised: number; target: number; fulfilledQty?: number; targetQty?: number }) {
  const displayTargetQty = Math.max(1, targetQty || 0);
  const displayTargetAmount = Math.max(1, target || 0);
  
  const pct = targetQty && targetQty > 0 
    ? Math.min(100, ((fulfilledQty || 0) / displayTargetQty) * 100) 
    : (target > 0 ? Math.min(100, (raised / displayTargetAmount) * 100) : 0);
  
  const isComplete = pct >= 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-bold">Collected: {fulfilledQty || 0} Units</span>
        <span className="font-semibold text-gray-700">Needed: {displayTargetQty} Units</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-[10px] text-gray-400 mt-0.5 font-bold">{pct.toFixed(0)}% Fulfilled</div>
    </div>
  );
}


function CreateRequestModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    closesAt: ''
  });

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['active-listings-for-request'],
    queryFn: async () => (await api.get('/listings')).data
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: async () => {
      const qty = Number(form.targetAmount);
      const unitPrice = Number(selectedListing?.discountPrice || 0);
      const res = await api.post('/donations', {
        title: form.title,
        description: form.description || undefined,
        targetQty: qty,
        targetAmount: qty * unitPrice,
        listingId: selectedListing?.id,
        closesAt: form.closesAt || undefined
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Donation request created!');
      queryClient.invalidateQueries({ queryKey: ['center-requests'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create request')
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-3xl shadow-2xl transition-all duration-500 overflow-hidden ${selectedListing ? 'max-w-lg w-full' : 'max-w-5xl w-full'}`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="text-2xl font-black text-slate-800">
                 {selectedListing ? <span className="flex items-center gap-2"><IoDocumentTextOutline /> Complete Your Request</span> : <span className="flex items-center gap-2"><IoFastFoodOutline /> Select Food to Request</span>}
               </h3>
               <p className="text-sm text-slate-500 font-medium">
                 {selectedListing ? `Requesting: ${selectedListing.title}` : 'Choose an available food item from local providers'}
               </p>
             </div>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">×</button>
          </div>

          {!selectedListing ? (
            /* Step 1: Grid Selection */
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="bg-slate-100 h-64 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      const filteredList = listingsData?.listings?.filter((l: any) => 
                        l.status === 'ACTIVE' && 
                        l.qtyAvailable > 0 && 
                        new Date(l.expiresAt) > new Date()
                      ) || [];

                      if (filteredList.length === 0 && !isLoading) {
                        return (
                          <div className="col-span-3 py-12 text-center">
                            <p className="text-slate-400 font-bold italic">No food available at the moment.</p>
                          </div>
                        );
                      }

                      return filteredList.map((l: any) => {
                        const itemImages: string[] = Array.isArray(l.images) ? l.images : (typeof l.images === 'string' && l.images.startsWith('[') ? JSON.parse(l.images) : [l.images]);
                        const displayImg = itemImages[0] || 'https://via.placeholder.com/400x300?text=No+Image';

                        return (
                          <div key={l.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-green-500 transition-all group flex flex-col h-full">
                             <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                                <img src={displayImg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             </div>
                             <h4 className="font-bold text-slate-800 mb-1">{l.title}</h4>
                             <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                               <IoCubeOutline className="text-sm" /> {l.qtyAvailable} Available
                             </div>
                             <button
                               onClick={() => {
                                 setSelectedListing(l);
                                 setForm(f => ({ ...f, title: `Request for: ${l.title}`, targetAmount: '' }));
                               }}
                               className="mt-auto w-full py-2.5 bg-orange-50 text-orange-600 font-black text-xs rounded-xl border border-orange-100 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                             >
                               <IoDocumentTextOutline className="text-lg" /> Request Donation
                             </button>
                          </div>
                        );
                      });
                    })()}
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Form Completion */
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100 mb-6">
                 <img 
                   src={(() => {
                     const itemImages: string[] = Array.isArray(selectedListing.images) ? selectedListing.images : (typeof selectedListing.images === 'string' && selectedListing.images.startsWith('[') ? JSON.parse(selectedListing.images) : [selectedListing.images]);
                     return itemImages[0] || 'https://via.placeholder.com/400x300?text=No+Image';
                   })()} 
                   className="w-16 h-16 rounded-xl object-cover" 
                 />
                 <div>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Selected Item</p>
                    <h4 className="font-bold text-slate-800">{selectedListing.title}</h4>
                    <p className="text-xs text-slate-500">at {selectedListing.provider?.name}</p>
                 </div>
                 <button 
                  onClick={() => setSelectedListing(null)}
                  className="ml-auto text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest"
                 >
                   Change
                 </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Request Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Rice and vegetables for 50 children"
                    className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-green-500 transition-all font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Tell donors why this is needed..."
                    className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-green-500 transition-all font-bold text-slate-800 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Quantity *</label>
                    <input
                      type="number"
                      value={form.targetAmount}
                      onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                      placeholder="e.g., 50"
                      max={selectedListing.qtyAvailable}
                      className={`w-full border-2 rounded-2xl px-5 py-3.5 focus:outline-none transition-all font-bold ${Number(form.targetAmount) > selectedListing.qtyAvailable ? 'border-red-400 focus:border-red-500 bg-red-50 text-red-700' : 'border-slate-100 focus:border-green-500 text-slate-800'}`}
                    />
                    <div className="flex justify-between items-start mt-1">
                      <p className="text-[10px] text-slate-400 font-bold">Max: {selectedListing.qtyAvailable}</p>
                      {Number(form.targetAmount) > selectedListing.qtyAvailable && (
                        <span className="text-[10px] text-red-500 font-bold">⚠️ Exceeds max limit</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Close Date</label>
                    <input
                      type="date"
                      value={form.closesAt}
                      onChange={e => setForm({ ...form, closesAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(selectedListing.expiresAt).toISOString().split('T')[0]}
                      className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-green-500 transition-all font-bold text-slate-800"
                    />
                    <p className="text-[10px] text-red-500 mt-1 font-bold italic flex items-center gap-1">
                      <IoTimeOutline className="text-sm" /><span>Item Expiry:</span>
                      <span>{new Date(selectedListing.expiresAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={onClose} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => create()}
                  disabled={!form.title || !form.targetAmount || Number(form.targetAmount) > selectedListing.qtyAvailable || isPending}
                  className="flex-[2] py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isPending ? '⏳ Creating...' : '✅ Create Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DonationCenterDashboardPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [creatingStoryFor, setCreatingStoryFor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'ACTIVITIES' | 'POST_ACTIVITY'>('REQUESTS');
  const qc = useQueryClient();
  const { items: cartItems } = useCart();

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['center-requests'],
    queryFn: async () => (await api.get('/donations/center/my-requests')).data
  });

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['center-activities', user?.id],
    queryFn: async () => (await api.get(`/activities/center/${user?.id}`)).data,
    enabled: !!user?.id
  });

  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['center-incoming-orders'],
    queryFn: async () => (await api.get('/orders/center')).data,
    enabled: !!user?.id
  });

  const confirmReceived = useMutation({
    mutationFn: async (orderId: string) => api.post(`/orders/${orderId}/confirm-received`),
    onSuccess: () => {
      toast.success('Confirmed receipt of food!');
      qc.invalidateQueries({ queryKey: ['center-incoming-orders'] });
    }
  });

  const requests = (requestsData?.requests || []).sort((a: any, b: any) => {
    if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
    if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const incomingOrders = incomingData?.orders || [];
  const activities = activitiesData?.activities || [];
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  const stats = [
    { label: 'Active Requests', value: requests.filter((r: any) => r.status === 'OPEN').length, icon: <IoClipboardOutline /> },
    { label: 'Requests Fulfilled', value: requests.filter((r: any) => r.status === 'FULFILLED').length, icon: <IoCheckmarkCircleOutline /> },
    { label: 'Total Raised', value: `LKR ${requests.reduce((s: number, r: any) => s + Number(r.raisedAmount), 0).toFixed(0)}`, icon: <IoCashOutline /> },
    { label: 'Items Received', value: incomingOrders.filter((o: any) => o.status === 'DELIVERED').length, icon: <IoCubeOutline /> },
  ];

  const shareToFB = (activity: any) => {
    const url = `${window.location.origin}/donation-centers/${user?.id}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(activity.title + ': ' + activity.content.slice(0, 100))}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {showModal && <CreateRequestModal onClose={() => setShowModal(false)} />}
      <ActivityFormModal 
        isOpen={activeTab === 'POST_ACTIVITY' || !!editingActivity} 
        onClose={() => {
          setActiveTab(editingActivity ? 'ACTIVITIES' : 'REQUESTS');
          setEditingActivity(null);
        }} 
        editingActivity={editingActivity}
        defaultTitle={selectedRequest ? `Success Story: ${selectedRequest.title}` : ''}
      />

      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)}
          onPostStory={() => {
            setSelectedRequest(null);
            setActiveTab('POST_ACTIVITY');
          }}
          incomingOrders={incomingOrders.filter((o: any) => o.donationRequestId === selectedRequest.id)}
          onConfirmReceived={(oid: string) => confirmReceived.mutate(oid)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="text-rose-500"><IoBusinessOutline /></span> Donation Center Dashboard
            </h1>
            <p className="text-slate-500 font-bold mt-1 italic uppercase tracking-widest text-[11px]">Manage requests and track impact</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="text-lg"><IoAddCircleOutline /></span>
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map(s => (
            <div key={s.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header with count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Food Requests ({requests.length})</h2>
          <div className="flex gap-2">
             <button 
              onClick={() => setActiveTab('REQUESTS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'REQUESTS' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}
             >
               All Requests
             </button>
             <button 
              onClick={() => setActiveTab('ACTIVITIES')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ACTIVITIES' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}
             >
               Impact Stories
             </button>
          </div>
        </div>

        {activeTab === 'ACTIVITIES' ? (
          <div className="space-y-6">
            {/* ... (Activities content stays same) */}
            {activities.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-5xl mb-4">📸</div>
                <h3 className="text-xl font-bold text-gray-900">No stories shared yet</h3>
                <p className="text-gray-500">Post updates about your activities to show donors the impact they're making.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activities.map((a: any) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => shareToFB(a)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Share to Facebook">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" /></svg>
                        </button>
                        <button onClick={() => setEditingActivity(a)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit story">✏️</button>
                        <button onClick={() => { if (confirm('Delete this story?')) api.delete(`/activities/${a.id}`).then(() => qc.invalidateQueries({ queryKey: ['center-activities'] })); }} className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete story">🗑️</button>
                      </div>
                    </div>
                    <div className="p-4">
                      {a.request && <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold border border-orange-100 uppercase tracking-tight"><span>🤝</span> {a.request.title.replace('Fundraising for:', '')}</div>}
                      <h3 className="text-base font-bold text-gray-900 mb-1">{a.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{a.content}</p>
                    </div>
                    <div className="mt-auto border-t border-gray-100">
                      <ImageGrid images={a.images || []} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Requests Section */}
            <section>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-6">
                 <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-lg"><IoFlameOutline /></span>
                 Active Requests
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {requests.filter((r: any) => r.status === 'OPEN').length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No active requests at the moment</p>
                  </div>
                ) : (
                  requests.filter((r: any) => r.status === 'OPEN').map((r: any) => (
                    <RequestCard key={r.id} r={r} onClick={() => setSelectedRequest(r)} />
                  ))
                )}
              </div>
            </section>

            {/* Completed Requests Section */}
            <section>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3 mb-6">
                 <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg"><IoCheckmarkCircleOutline /></span>
                 Completed Requests
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                {requests.filter((r: any) => r.status === 'FULFILLED').map((r: any) => (
                  <RequestCard key={r.id} r={r} onClick={() => setSelectedRequest(r)} isCompleted />
                ))}
              </div>
            </section>
          </div>
        )}

      </div>

      {/* Modals */}
      <RequestDetailModal 
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onConfirmReceived={(orderId: string) => confirmReceived.mutate(orderId)}
        onPostStory={() => { setCreatingStoryFor(selectedRequest); setSelectedRequest(null); }}
        onViewStory={(activity: any) => { setEditingActivity(activity); setSelectedRequest(null); }}
        incomingOrders={incomingOrders.filter((o: any) => o.requestId === selectedRequest?.id)}
      />

      <ActivityFormModal 
        isOpen={!!creatingStoryFor || !!editingActivity}
        onClose={() => { setCreatingStoryFor(null); setEditingActivity(null); }}
        editingActivity={editingActivity}
        defaultTitle={creatingStoryFor ? `Success Story: ${creatingStoryFor.title.replace('Fundraising for:', '')}` : ''}
        requestId={creatingStoryFor?.id || editingActivity?.requestId}
      />
    </div>
  );
}

function RequestCard({ r, onClick, isCompleted }: { r: any; onClick: () => void; isCompleted?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 ${isCompleted ? 'grayscale-[0.5]' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{r.title.replace('Fundraising for:', 'Request for:')}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{r.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-700 shadow-sm shadow-orange-100' : 'bg-green-100 text-green-700 shadow-sm shadow-green-100'}`}>
          {r.status}
        </span>
      </div>
      <ProgressBar 
        raised={Number(r.raisedAmount)} 
        target={Number(r.targetAmount)} 
        fulfilledQty={r.fulfilledQty}
        targetQty={r.targetQty}
      />

      <div className="mt-6 flex items-center justify-between">
        <div className="flex -space-x-2">
          {r.donations?.slice(0, 5).map((d: any, i: number) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-700">
              {d.customer.name[0]}
            </div>
          ))}
          {r.donations?.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
              +{r.donations.length - 5}
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-orange-600 group-hover:underline flex items-center gap-1">
          View Details <span>→</span>
        </span>
      </div>
    </div>
  );
}

function ImageGrid({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;
  
  if (images.length === 1) {
    return <img src={images[0]} className="w-full h-64 object-cover" alt="Story" />;
  }
  
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 h-64">
        {images.map((img, i) => <img key={i} src={img} className="w-full h-full object-cover" alt="Story" />)}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 h-64">
        <img src={images[0]} className="w-full h-full object-cover row-span-2" alt="Story" />
        <div className="grid grid-rows-2 gap-0.5 h-full">
          <img src={images[1]} className="w-full h-full object-cover" alt="Story" />
          <img src={images[2]} className="w-full h-full object-cover" alt="Story" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 h-64">
      <img src={images[0]} className="w-full h-full object-cover" alt="Story" />
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
        {images.slice(1, 4).map((img, i) => (
          <div key={i} className="relative h-full">
            <img src={img} className="w-full h-full object-cover" alt="Story" />
            {i === 2 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestDetailModal({ request, onClose, onPostStory, incomingOrders, onConfirmReceived, onViewStory }: any) {
  if (!request) return null;
  const listingPrice = Number(request.listing?.discountPrice) || 150;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-fadeInUp max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{request.title.replace('Fundraising for:', 'Request for:')}</h2>
            <p className="text-gray-500 text-sm">Created on {new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">×</button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Goal Progress</h3>
            <ProgressBar 
              raised={Number(request.raisedAmount)} 
              target={Number(request.targetAmount)} 
              fulfilledQty={request.fulfilledQty}
              targetQty={request.targetQty}
            />
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
               <div className="text-xs text-orange-700 font-bold mb-1 uppercase">Target Item</div>
               <div className="text-sm font-black text-gray-900">{request.listing?.title || 'General Food Donation'}</div>
               <div className="text-xs text-gray-500">LKR {listingPrice} per unit</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Contributors ({request.donations?.length || 0})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {request.donations?.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                      {d.customer.name[0]}
                    </div>
                    <div className="text-xs font-bold text-gray-700">{d.customer.name}</div>
                  </div>
                  <div className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    {Math.floor(Number(d.amount) / listingPrice)} UNITS
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="border-t border-gray-100 pt-6">
          {request.status === 'FULFILLED' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-lg font-bold text-green-800 mb-2">This request was successful!</h3>
                <p className="text-sm text-green-700 mb-4">Your community came together to provide {request.fulfilledQty} items.</p>
                
                {/* Incoming Orders for this request */}
                <div className="space-y-3">
                  {incomingOrders.map((o: any) => (
                    <div key={o.id} className="bg-white p-4 rounded-xl border border-green-100 flex justify-between items-center text-left">
                       <div>
                         <div className="text-xs font-bold text-gray-400 uppercase">Order Status</div>
                         <div className="font-black text-gray-900 uppercase text-xs">{o.status}</div>
                       </div>
                       {o.status !== 'DELIVERED' ? (
                         <button 
                           onClick={() => onConfirmReceived(o.id)}
                           className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                         >
                           Confirm Received
                         </button>
                       ) : (
                         <div className="text-green-600 font-bold text-xs flex items-center gap-1">
                           <span>✅ RECEIVED</span>
                         </div>
                       )}
                    </div>
                  ))}
                </div>

                {request.activities && request.activities.length > 0 ? (
                  <button 
                    onClick={() => onViewStory(request.activities[0])}
                    className="mt-6 w-full py-4 bg-white border-2 border-orange-500 text-orange-600 font-black rounded-2xl hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span>📸</span> View Shared Story
                  </button>
                ) : (
                  <button 
                    onClick={onPostStory}
                    className="mt-6 w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:scale-[1.02] transition-transform"
                  >
                    🚀 Post Success Story & Photos
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
              <div className="text-2xl mb-2">⏳</div>
              <h3 className="text-base font-bold text-blue-800">Still Gathering Support</h3>
              <p className="text-sm text-blue-600 mt-1 mb-6">Once the goal is reached, you'll be able to track the food and share a success story.</p>
              
              {request.fulfilledQty > 0 && (
                <div className="pt-4 border-t border-blue-100">
                  <p className="text-xs text-blue-500 mb-3 font-medium italic">You have {request.fulfilledQty} items funded so far. If you need them now, you can close the request and claim them.</p>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to close this request and claim ${request.fulfilledQty} items? This cannot be undone.`)) {
                        api.post(`/donations/${request.id}/claim`)
                          .then(() => {
                            toast.success('Request closed and food claimed!');
                            onClose();
                            window.location.reload(); // Quick refresh to update stats
                          })
                          .catch(err => toast.error(err.response?.data?.error || 'Failed to claim'));
                      }
                    }}
                    className="w-full py-3 bg-white border-2 border-blue-400 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all text-sm"
                  >
                    🔐 Close & Claim {request.fulfilledQty} Items
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityFormModal({ isOpen, onClose, editingActivity, defaultTitle, requestId }: { isOpen: boolean; onClose: () => void; editingActivity?: any; defaultTitle?: string; requestId?: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<{title: string, content: string, images: string[], requestId?: string}>({ title: '', content: '', images: [], requestId });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update form when editingActivity changes or modal opens
  useEffect(() => {
    if (editingActivity) {
      setForm({
        title: editingActivity.title,
        content: editingActivity.content,
        images: editingActivity.images || [],
        requestId: editingActivity.requestId
      });
    } else {
      setForm({ title: defaultTitle || '', content: '', images: [], requestId });
    }
  }, [editingActivity, isOpen, defaultTitle]);

  const handleFileUpload = async (file: File) => {
    if (form.images.length >= 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, images: [...prev.images, res.data.url] }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.slice(0, 5 - form.images.length).forEach(file => handleFileUpload(file));
  };

  const { mutate: post, isPending } = useMutation({
    mutationFn: async () => {
      if (editingActivity) {
        return api.patch(`/activities/${editingActivity.id}`, form);
      }
      return api.post('/activities', form);
    },
    onSuccess: () => {
      toast.success(editingActivity ? 'Story updated!' : 'Story shared!');
      qc.invalidateQueries({ queryKey: ['center-activities'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to save')
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {editingActivity ? <><IoCreateOutline /> Edit Story</> : <><IoCameraOutline /> Share Story</>}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {defaultTitle && (
          <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Related Request</div>
            <div className="text-sm font-bold text-orange-700">{defaultTitle.replace('Success Story:', '')}</div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Happy faces at our weekend lunch"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images ({form.images.length}/5)</label>
            
            {/* Image Preview Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={img} className="w-full h-full object-cover" alt="Upload" />
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {form.images.length < 5 && (
                <button
                  onClick={() => document.getElementById('multi-file-upload')?.click()}
                  className={`aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <span className="text-2xl">+</span>
                  <span className="text-[10px] font-bold text-gray-400">Add</span>
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center min-h-[100px] cursor-pointer ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'}`}
              onClick={() => { if(form.images.length < 5) document.getElementById('multi-file-upload')?.click() }}
            >
              <input
                id="multi-file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.slice(0, 5 - form.images.length).forEach(file => handleFileUpload(file));
                }}
              />
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-700">Drag & drop or click to upload</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Up to 5 images</p>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What happened?</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              rows={4}
              placeholder="Describe the activity and its impact..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => post()}
            disabled={!form.title || !form.content || isPending || isUploading}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
          >
            {isPending ? '⏳ Saving...' : '🚀 Share Story'}
          </button>
        </div>
      </div>
    </div>
  );
}
