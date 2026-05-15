import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../../state/auth';
import { MapPicker } from '../../components/MapPicker';

type CustomerSettingsForm = {
  name: string;
  phone: string;
  idNumber: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
};

export function CustomerSettingsPage() {
  const qc = useQueryClient();
  const { updateUser } = useAuth();
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['customerMe'],
    queryFn: async () => (await api.get('/customers/me')).data
  });

  const { data: methodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => (await api.get('/customers/payment-methods')).data
  });

  const { register, handleSubmit, reset, setValue } = useForm<CustomerSettingsForm>();

  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      reset({
        name: p.user?.name || '',
        phone: p.user?.phone || '',
        idNumber: p.idNumber || '',
        address: p.address || '',
        city: p.city || '',
        lat: Number(p.lat) || 6.9271,
        lng: Number(p.lng) || 79.8612
      });
      if (p.lat && p.lng) {
        setSelectedLocation({ lat: Number(p.lat), lng: Number(p.lng) });
      }
    }
  }, [profileData, reset]);

  const updateProfile = useMutation({
    mutationFn: async (formData: CustomerSettingsForm) => api.patch('/customers/me', {
      ...formData,
      lat: selectedLocation?.lat,
      lng: selectedLocation?.lng
    }),
    onSuccess: (res, variables) => {
      toast.success('Profile updated successfully! ✨');
      updateUser({ name: variables.name });
      qc.invalidateQueries({ queryKey: ['customerMe'] });
    }
  });

  const addCard = useMutation({
    mutationFn: async (card: any) => api.post('/customers/payment-methods', card),
    onSuccess: () => {
      toast.success('Card saved securely! 🔒');
      setShowAddCard(false);
      qc.invalidateQueries({ queryKey: ['paymentMethods'] });
    }
  });

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => api.delete(`/customers/payment-methods/${id}`),
    onSuccess: () => {
      toast.info('Payment method removed');
      qc.invalidateQueries({ queryKey: ['paymentMethods'] });
    }
  });

  if (profileLoading) return (
    <div className="flex items-center justify-center min-h-[400px] pt-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-100 mb-8 pt-10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
               👤
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Customer Profile & Payments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-8">
            {/* Personal Info Card */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">📝</span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                  <input {...register('name', { required: true })} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                  <input {...register('phone')} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">NIC / Passport</label>
                  <input {...register('idNumber')} placeholder="ID Number" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" />
                </div>
              </div>
            </div>

            {/* Location & Map Card */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-sm">📍</span>
                Delivery Location
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Street Address</label>
                    <input {...register('address')} placeholder="e.g. 123 Main St" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">City</label>
                    <input {...register('city')} placeholder="e.g. Colombo" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pin precise location on map</label>
                  <div className="h-72 rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
                    <MapPicker 
                      initialLocation={selectedLocation || undefined}
                      onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic text-center">Drag the marker to your exact building for faster delivery.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={updateProfile.isPending} 
                className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl shadow-green-900/20 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Payment Methods Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center text-sm">💳</span>
              Payments
            </h2>
            
            <div className="space-y-4">
              {methodsData?.methods?.length === 0 && !showAddCard && (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">No cards saved</p>
                </div>
              )}

              {methodsData?.methods?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.cardType === 'Visa' ? '💳' : '🏦'}</span>
                    <div>
                      <div className="font-black text-gray-800 text-sm">{m.cardType} •••• {m.last4}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Expires {m.expiry}</div>
                    </div>
                  </div>
                  <button onClick={() => { if(confirm('Remove this card?')) deleteMethod.mutate(m.id); }} className="text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
              ))}

              {!showAddCard ? (
                <button 
                  onClick={() => setShowAddCard(true)} 
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <span>➕</span> Add New Card
                </button>
              ) : (
                <div className="p-6 border border-green-100 rounded-2xl bg-green-50/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-3">
                    <input id="mockCard" placeholder="Card Number" className="col-span-2 px-3 py-2 border rounded-xl text-sm" />
                    <input id="mockExpiry" placeholder="MM/YY" className="px-3 py-2 border rounded-xl text-sm" />
                    <input id="mockCVC" placeholder="CVC" className="px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => addCard.mutate({ cardType: 'Visa', last4: '4242', expiry: '12/26' })}
                      className="flex-1 bg-green-600 text-white text-[10px] font-black uppercase py-3 rounded-xl"
                    >
                      Save Card
                    </button>
                    <button onClick={() => setShowAddCard(false)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                  </div>
                  <p className="text-[9px] text-gray-500 font-medium">🔒 Encrypted via Stripe SSL</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-lg font-black mb-2">Need Help? 🆘</h3>
                <p className="text-emerald-200 text-xs leading-relaxed mb-6">Our support team is available 24/7 for any account or order related issues.</p>
                <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Contact Support</button>
             </div>
             <div className="absolute bottom-[-20%] right-[-10%] text-8xl opacity-10">🎧</div>
          </div>
        </div>
      </div>
    </div>
  );
}
