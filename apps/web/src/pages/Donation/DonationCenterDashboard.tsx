import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const isComplete = pct >= 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Raised: LKR {raised.toFixed(0)}</span>
        <span className="font-semibold text-gray-700">Target: LKR {target.toFixed(0)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{pct.toFixed(0)}%</div>
    </div>
  );
}

function CreateRequestModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    listingId: '',
    closesAt: ''
  });

  const { data: listingsData } = useQuery({
    queryKey: ['active-listings-mini'],
    queryFn: async () => (await api.get('/listings')).data
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/donations', {
        title: form.title,
        description: form.description || undefined,
        targetAmount: Number(form.targetAmount),
        listingId: form.listingId || undefined,
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-900">📝 Create Donation Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Rice and vegetables for 50 children"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to Food Listing (Optional)</label>
            <select
              value={form.listingId}
              onChange={e => {
                const lid = e.target.value;
                const listing = listingsData?.listings?.find((l: any) => l.id === lid);
                setForm({
                  ...form,
                  listingId: lid,
                  title: listing ? `Fundraising for: ${listing.title}` : form.title,
                  targetAmount: listing ? String(Number(listing.discountPrice) * 10) : form.targetAmount
                });
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">No specific listing (General fundraising)</option>
              {listingsData?.listings?.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.title} (LKR {Number(l.discountPrice).toFixed(0)}/unit)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Tell donors why this is needed..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target (LKR) *</label>
              <input
                type="number"
                value={form.targetAmount}
                onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="e.g., 5000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
              <input
                type="date"
                value={form.closesAt}
                onChange={e => setForm({ ...form, closesAt: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => create()}
            disabled={!form.title || !form.targetAmount || isPending}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
          >
            {isPending ? '⏳ Creating...' : '✅ Create Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DonationCenterDashboardPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'INCOMING'>('REQUESTS');
  const qc = useQueryClient();

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['center-requests'],
    queryFn: async () => (await api.get('/donations/center/my-requests')).data
  });

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['center-activities', user?.sub],
    queryFn: async () => (await api.get(`/activities/center/${user?.sub}`)).data,
    enabled: !!user?.sub
  });

  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['center-incoming-orders'],
    queryFn: async () => (await api.get('/orders/center')).data,
    enabled: !!user?.sub
  });

  const confirmReceived = useMutation({
    mutationFn: async (orderId: string) => api.post(`/orders/${orderId}/confirm-received`),
    onSuccess: () => {
      toast.success('Confirmed receipt of food!');
      qc.invalidateQueries({ queryKey: ['center-incoming-orders'] });
    }
  });

  const requests = requestsData?.requests || [];
  const incomingOrders = incomingData?.orders || [];
  const activities = activitiesData?.activities || [];
  const [editingActivity, setEditingActivity] = useState<any>(null);
  
  const stats = [
    { label: 'Active Requests', value: requests.filter((r: any) => r.status === 'OPEN').length, icon: '📋' },
    { label: 'Requests Fulfilled', value: requests.filter((r: any) => r.status === 'FULFILLED').length, icon: '✅' },
    { label: 'Total Raised', value: `LKR ${requests.reduce((s: number, r: any) => s + Number(r.raisedAmount), 0).toFixed(0)}`, icon: '💰' },
    { label: 'Items Received', value: incomingOrders.filter((o: any) => o.status === 'DELIVERED').length, icon: '📦' },
  ];

  const shareToFB = (activity: any) => {
    const url = `${window.location.origin}/donation-centers/${user?.sub}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(activity.title + ': ' + activity.content.slice(0, 100))}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {showModal && <CreateRequestModal onClose={() => setShowModal(false)} />}
      <ActivityFormModal 
        isOpen={activeTab === 'POST_ACTIVITY' || !!editingActivity} 
        onClose={() => {
          setActiveTab('ACTIVITIES');
          setEditingActivity(null);
        }} 
        editingActivity={editingActivity}
      />

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏥 Donation Center Dashboard</h1>
            <p className="text-gray-500">Manage your requests and track incoming food donations.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('POST_ACTIVITY')}
              className="px-6 py-3 bg-white text-orange-600 border border-orange-200 font-bold rounded-xl shadow-sm hover:bg-orange-50 transition-all"
            >
              + Share Story
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition-all"
            >
              + New Request
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'REQUESTS' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Fundraising ({requests.length})
          </button>
          <button 
            onClick={() => setActiveTab('INCOMING')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'INCOMING' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Incoming Food ({incomingOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('ACTIVITIES')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'ACTIVITIES' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Impact Stories ({activities.length})
          </button>
        </div>

        {activeTab === 'REQUESTS' ? (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900">No requests yet</h3>
                <p className="text-gray-500">Create a fundraising request to start receiving help.</p>
              </div>
            ) : (
              requests.map((r: any) => (
                <div key={r.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{r.title}</h3>
                      <p className="text-sm text-gray-500">{r.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {r.status}
                    </span>
                  </div>
                  <ProgressBar raised={Number(r.raisedAmount)} target={Number(r.targetAmount)} />
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'INCOMING' ? (
          <div className="space-y-4">
            {incomingOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-900">No incoming food yet</h3>
                <p className="text-gray-500">Food donations from community members will appear here.</p>
              </div>
            ) : (
              incomingOrders.map((o: any) => (
                <div key={o.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Order #{o.id.slice(-6)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-gray-900 font-bold">
                      {o.items.map((it: any) => `${it.qty}x ${it.listing.title}`).join(', ')}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      From: <span className="font-medium text-gray-700">{o.buyer.name}</span> · {new Date(o.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {o.status !== 'DELIVERED' && (
                    <button 
                      onClick={() => confirmReceived.mutate(o.id)}
                      disabled={confirmReceived.isPending}
                      className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                    >
                      {confirmReceived.isPending ? '⏳ Confirming...' : '✅ Confirm Received'}
                    </button>
                  )}
                  {o.status === 'DELIVERED' && (
                    <div className="text-green-600 font-bold flex items-center gap-2">
                      <span>✓ Received & Verified</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
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
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => shareToFB(a)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Share to Facebook"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setEditingActivity(a)}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit story"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Delete this story?')) {
                              api.delete(`/activities/${a.id}`).then(() => qc.invalidateQueries({ queryKey: ['center-activities'] }));
                            }
                          }}
                          className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete story"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 mb-1">{a.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{a.content}</p>
                    </div>

                    {/* Image Grid */}
                    <div className="mt-auto border-t border-gray-100">
                      <ImageGrid images={a.images || []} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

function ActivityFormModal({ isOpen, onClose, editingActivity }: { isOpen: boolean; onClose: () => void; editingActivity?: any }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<{title: string, content: string, images: string[]}>({ title: '', content: '', images: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update form when editingActivity changes or modal opens
  useEffect(() => {
    if (editingActivity) {
      setForm({
        title: editingActivity.title,
        content: editingActivity.content,
        images: editingActivity.images || []
      });
    } else {
      setForm({ title: '', content: '', images: [] });
    }
  }, [editingActivity, isOpen]);

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
      toast.success(editingActivity ? '✅ Story updated!' : '🎉 Story shared!');
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
          <h3 className="text-xl font-bold text-gray-900">{editingActivity ? '✏️ Edit Story' : '📸 Share Story'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

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
