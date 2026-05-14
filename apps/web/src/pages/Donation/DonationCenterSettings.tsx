import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { MapPicker } from '../../components/MapPicker';

type DonationCenterSettingsForm = {
  name: string;
  address: string;
  description: string;
  image: string;
  phone: string;
  lat?: number;
  lng?: number;
};

export function DonationCenterSettingsPage() {
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['centerMe'],
    queryFn: async () => (await api.get('/donation-centers/me')).data
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<DonationCenterSettingsForm>();
  const watchedAddress = watch('address');
  const watchedImage = watch('image');

  useEffect(() => {
    if (data?.center) {
      reset({
        name: data.center.name || '',
        address: data.center.address || '',
        description: data.center.description || '',
        image: data.center.image || '',
        phone: data.center.phone || '',
        lat: data.center.lat,
        lng: data.center.lng
      });
    }
  }, [data, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData);
      setValue('image', res.data.url);
      toast.success('Profile image uploaded!');
    } catch (err: any) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const updateProfile = useMutation({
    mutationFn: async (formData: DonationCenterSettingsForm) => {
      return api.patch('/donation-centers/me', formData);
    },
    onSuccess: () => {
      toast.success('Center profile updated successfully!');
      qc.invalidateQueries({ queryKey: ['centerMe'] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update details');
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Center Settings</h1>
        
        <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm">🏢</span>
              Center Information
            </h2>

            <div className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-100 shadow-sm bg-gray-50">
                    {watchedImage ? (
                      <img src={watchedImage} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-700 shadow-lg transition-all">
                    <span className="text-sm">📸</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Center Logo</h4>
                  <p className="text-xs text-gray-500 mt-1">This will be shown on all your food requests and public profile.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Center Name</label>
                  <input 
                    {...register('name', { required: 'Center name is required' })} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                    placeholder="e.g. Hope Foundation Colombo"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description / Mission</label>
                  <textarea 
                    {...register('description')} 
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none" 
                    placeholder="Tell the community about your center's mission..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input 
                    {...register('phone')} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                    placeholder="e.g. +94 77 123 4567"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Physical Address</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const addr = watchedAddress;
                        if (addr) {
                          setValue('address', addr); // Trigger geocode in MapPicker via address prop
                          toast.info('Syncing map to address...');
                        }
                      }}
                      className="text-[10px] font-black text-orange-600 hover:underline uppercase tracking-widest"
                    >
                      📍 Sync Map to Address
                    </button>
                  </div>
                  <input 
                    {...register('address', { required: 'Address is required' })} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                    placeholder="Search or enter full address"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1 font-bold">{errors.address.message}</p>}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-gray-700">Location on Map</label>
                    <span className="text-[10px] font-medium text-gray-400">Click map to pick coordinates</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                    <MapPicker 
                      address={watchedAddress}
                      initialLat={data?.center?.lat}
                      initialLng={data?.center?.lng}
                      onLocationSelect={(lat, lng) => { 
                        setValue('lat', lat as any); 
                        setValue('lng', lng as any); 
                      }} 
                      onAddressSelect={(loc) => { 
                        if (loc.address) setValue('address', loc.address, { shouldValidate: true }); 
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    Note: Pinning your exact location helps donors find you easily for food deliveries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={updateProfile.isPending}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              {updateProfile.isPending ? '⏳ Saving...' : '✅ Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
