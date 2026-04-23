import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { toast } from 'sonner';

type ProviderSettingsForm = {
  businessName: string;
  brNo: string;
  tin: string;
  address: string;
  city: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
};

export function ProviderSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['providerMe'],
    queryFn: async () => (await api.get('/providers/me')).data
  });

  const { register, handleSubmit, reset } = useForm<ProviderSettingsForm>();

  // Reset form when data loads
  useEffect(() => {
    if (data?.provider) {
      const payoutDetails = data.provider.deliveryOptions?.payoutDetails || {};
      reset({
        businessName: data.provider.businessName || '',
        brNo: data.provider.brNo || '',
        tin: data.provider.tin || '',
        address: data.provider.address || '',
        city: data.provider.city || '',
        bankName: payoutDetails.bankName || '',
        accountName: payoutDetails.accountName || '',
        accountNumber: payoutDetails.accountNumber || '',
        branchCode: payoutDetails.branchCode || ''
      });
    }
  }, [data, reset]);

  const updateProfile = useMutation({
    mutationFn: async (formData: ProviderSettingsForm) => {
      const payload = {
        businessName: formData.businessName,
        brNo: formData.brNo,
        tin: formData.tin,
        address: formData.address,
        city: formData.city,
        // We temporarily store payout details in deliveryOptions for now
        deliveryOptions: {
          ...(data?.provider?.deliveryOptions || {}),
          payoutDetails: {
            bankName: formData.bankName,
            accountName: formData.accountName,
            accountNumber: formData.accountNumber,
            branchCode: formData.branchCode
          }
        }
      };
      return api.patch('/providers/me', payload);
    },
    onSuccess: () => {
      toast.success('Profile and payment details updated!');
      qc.invalidateQueries({ queryKey: ['providerMe'] });
    },
    onError: () => toast.error('Failed to update details')
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Provider Settings</h1>
        
        <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-8">
          
          {/* Business Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input {...register('businessName', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BR Number</label>
                <input {...register('brNo')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number</label>
                <input {...register('tin')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input {...register('address')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input {...register('city')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payout Details (Bank Account)</h2>
            <p className="text-sm text-gray-500 mb-4">Where should we send your earnings for online orders?</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input {...register('bankName')} placeholder="e.g. Commercial Bank" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input {...register('accountName')} placeholder="e.g. John Doe" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input {...register('accountNumber')} placeholder="0012345678" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch / Branch Code</label>
                <input {...register('branchCode')} placeholder="e.g. Colombo 03" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={updateProfile.isPending}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
