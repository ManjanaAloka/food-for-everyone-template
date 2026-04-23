import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { toast } from 'sonner';

type CustomerSettingsForm = {
  name: string;
  phone: string;
  idNumber: string;
  address: string;
  city: string;
};

export function CustomerSettingsPage() {
  const qc = useQueryClient();
  const [showAddCard, setShowAddCard] = useState(false);
  
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['customerMe'],
    queryFn: async () => (await api.get('/customers/me')).data
  });

  const { data: methodsData } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => (await api.get('/customers/payment-methods')).data
  });

  const { register, handleSubmit, reset } = useForm<CustomerSettingsForm>();

  useEffect(() => {
    if (profileData?.profile) {
      reset({
        name: profileData.profile.user?.name || '',
        phone: profileData.profile.user?.phone || '',
        idNumber: profileData.profile.idNumber || '',
        address: profileData.profile.address || '',
        city: profileData.profile.city || ''
      });
    }
  }, [profileData, reset]);

  const updateProfile = useMutation({
    mutationFn: async (formData: CustomerSettingsForm) => api.patch('/customers/me', formData),
    onSuccess: () => {
      toast.success('Billing profile updated!');
      qc.invalidateQueries({ queryKey: ['customerMe'] });
    }
  });

  const addCard = useMutation({
    mutationFn: async (card: any) => api.post('/customers/payment-methods', card),
    onSuccess: () => {
      toast.success('Card saved securely!');
      setShowAddCard(false);
      qc.invalidateQueries({ queryKey: ['paymentMethods'] });
    }
  });

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => api.delete(`/customers/payment-methods/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paymentMethods'] })
  });

  if (profileLoading) return <div className="p-8 text-center pt-24 text-gray-500">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🛍️ Billing Account</h1>
          <p className="text-gray-600">Manage your personal details and secure payment methods.</p>
        </div>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input {...register('name', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input {...register('phone')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIC / ID Number</label>
                  <input {...register('idNumber')} placeholder="e.g. 199512345678" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Billing Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input {...register('address')} placeholder="e.g. 123 Main St" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input {...register('city')} placeholder="e.g. Colombo" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={updateProfile.isPending} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all">
                {updateProfile.isPending ? 'Saving...' : 'Update Details'}
              </button>
            </div>
          </form>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Saved Payment Methods</h2>
            
            <div className="space-y-3">
              {methodsData?.methods?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.cardType === 'Visa' ? '💳' : '🏦'}</span>
                    <div>
                      <div className="font-bold text-gray-800">{m.cardType} ending in {m.last4}</div>
                      <div className="text-xs text-gray-500">Expires {m.expiry}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.isDefault && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">Default</span>}
                    <button onClick={() => deleteMethod.mutate(m.id)} className="text-gray-400 hover:text-red-600 transition-colors">🗑️</button>
                  </div>
                </div>
              ))}

              {!showAddCard ? (
                <button onClick={() => setShowAddCard(true)} className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2">
                  <span>➕</span> Add New Card
                </button>
              ) : (
                <div className="p-4 border border-green-100 rounded-xl bg-green-50/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="text-sm font-bold text-green-800 mb-2">Simulate Secure Card Tokenization</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input id="mockCard" placeholder="Card Number" className="col-span-2 p-2 border rounded-lg text-sm" />
                    <input id="mockExpiry" placeholder="MM/YY" className="p-2 border rounded-lg text-sm" />
                    <input id="mockCVC" placeholder="CVC" className="p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => addCard.mutate({ cardType: 'Visa', last4: '4242', expiry: '12/26' })}
                      className="flex-1 bg-green-600 text-white text-sm font-bold py-2 rounded-lg"
                    >
                      Save Card (Mock Token)
                    </button>
                    <button onClick={() => setShowAddCard(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                  </div>
                  <p className="text-[10px] text-gray-500">🔒 Real card details are never stored on our servers. They are tokenized via Stripe/PayHere.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
