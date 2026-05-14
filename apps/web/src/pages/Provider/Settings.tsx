import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { MapPicker } from '../../components/MapPicker';
import { useAuth } from '../../state/auth';


type ProviderSettingsForm = {
  businessName: string;
  brNo: string;
  tin: string;
  phone: string;
  address: string;
  city: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  lat?: number;
  lng?: number;
};


export function ProviderSettingsPage() {
  const qc = useQueryClient();
  const { updateUser } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['providerMe'],
    queryFn: async () => (await api.get('/providers/me')).data
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProviderSettingsForm>();
  const watchedAddress = watch('address');



  // Reset form when data loads
  useEffect(() => {
    if (data?.provider) {
      const pd = data.provider.deliveryOptions?.payoutDetails || {};
      reset({
        businessName: data.provider.businessName || '',
        brNo: data.provider.brNo || '',
        tin: data.provider.tin || '',
        phone: data.provider.user?.phone || '',
        address: data.provider.address || '',
        city: data.provider.city || '',
        bankName: pd.bankName || '',
        accountName: pd.accountName || '',
        accountNumber: pd.accountNumber || '',
        branchCode: pd.branchCode || '',
        lat: data.provider.lat || undefined,
        lng: data.provider.lng || undefined,
      });
    }
  }, [data, reset]);

  const updateProfile = useMutation({
    mutationFn: async (formData: ProviderSettingsForm) => {
      const payload = {
        businessName: formData.businessName,
        brNo: formData.brNo,
        tin: formData.tin,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng,
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
    onSuccess: (res, variables) => {
      toast.success('Profile and payment details updated!');
      updateUser({ name: variables.businessName });
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register('businessName', { required: 'Business name is required' })} 
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${errors.businessName ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BR Number <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register('brNo', { required: 'BR Number is required' })} 
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${errors.brNo ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errors.brNo && <p className="text-red-500 text-xs mt-1">{errors.brNo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number</label>
                <input {...register('tin')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input {...register('phone')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. 0771234567" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input 
                  {...register('address', { required: 'Address is required' })} 
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${errors.address ? 'border-red-500' : 'border-gray-300'}`} 
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div className="hidden">
                <input {...register('city')} />
              </div>


              <div className="col-span-2 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Location on Map <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <MapPicker 
                    address={watchedAddress}
                    initialLat={data?.provider?.lat}
                    initialLng={data?.provider?.lng}
                    onLocationSelect={(lat, lng) => { 
                      setValue('lat', lat as any); 
                      setValue('lng', lng as any); 
                    }} 
                    onAddressSelect={(loc) => { 
                      if (loc.address) setValue('address', loc.address, { shouldValidate: true }); 
                      if (loc.city) setValue('city', loc.city, { shouldValidate: true }); 
                    }}
                  />
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-green-600 shadow-sm border border-green-100">
                      LIVE SYNC ACTIVE 🛰️
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">
                  Tip: Typing your address will auto-pin the map, or click the map to auto-fill the address.
                </p>
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
