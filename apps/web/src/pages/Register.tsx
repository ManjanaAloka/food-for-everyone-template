import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../state/auth';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPicker } from '../components/MapPicker';

type Form = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'DONATION_CENTER';
  
  // Customer specific
  address?: string;
  city?: string;
  
  // Provider specific
  businessName?: string;
  brNo?: string;
  openHours?: string;
  businessType?: string;
  contactPerson?: string;
  
  // Donation Center specific
  centerName?: string;
  centerType?: string;
  beneficiariesCount?: number;

  // Location
  lat?: number;
  lng?: number;
};

export function RegisterPage() {
  const { register: doRegister } = useAuth();
  const { register: formRegister, handleSubmit, watch, setValue, formState: { errors } } = useForm<Form>({ 
    defaultValues: { role: 'CUSTOMER' } 
  });
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const selectedRole = watch('role');
  const watchedAddress = watch('address');
  
  const onLocationSelect = useCallback((lat: number, lng: number) => { 
    setValue('lat', lat); 
    setValue('lng', lng); 
  }, [setValue]);

  const onAddressSelect = useCallback((data: { address?: string; city: string }) => { 
    if (data.address) setValue('address', data.address); 
    if (data.city) setValue('city', data.city); 
  }, [setValue]);

  const onSubmit = async (v: Form) => {
    try {
      await doRegister(v);
      toast.success('Registration successful!');
      if (v.role !== 'CUSTOMER') {
        toast.info('Your account is pending admin approval.');
      }
      nav('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      const details = err.response?.data?.details;
      toast.error(details ? `${msg}: ${details}` : msg);
      
      const fieldErrors = err.response?.data?.details?.fieldErrors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        // If it's a Zod error, flatten it to a readable string
        const fieldErrors = details.fieldErrors || {};
        const errorList = Object.entries(fieldErrors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join(' | ');
        toast.error(`${msg}: ${errorList}`);
      } else {
        toast.error(msg);
      }
    }
  };

  const ErrorSpan = ({ message }: { message?: string }) => (
    message ? <span className="text-red-500 text-[10px] mt-1 block font-bold uppercase tracking-tighter">⚠️ {message}</span> : null
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform -rotate-6">
            <span className="text-3xl text-white">🥗</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Join FreshSave</h1>
          <p className="text-gray-600">Together, let's reduce food waste in Sri Lanka</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-100">
            <div 
              className="h-full bg-green-500 transition-all duration-500" 
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>

          <div className="p-8 md:p-12">
            {step === 1 ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
                  <p className="text-gray-500">Select how you want to participate in our mission</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Card */}
                  <div 
                    onClick={() => { setValue('role', 'CUSTOMER'); setStep(2); }}
                    className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${selectedRole === 'CUSTOMER' ? 'border-green-500 bg-green-50 shadow-lg ring-4 ring-green-100' : 'border-gray-200 hover:border-green-300'}`}
                  >
                    <div className="text-4xl mb-4 group-hover:animate-bounce">👥</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Customer</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">I want to browse and buy surplus food at great prices.</p>
                  </div>

                  {/* Provider Card */}
                  <div 
                    onClick={() => { setValue('role', 'PROVIDER'); setStep(2); }}
                    className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${selectedRole === 'PROVIDER' ? 'border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="text-4xl mb-4 group-hover:animate-bounce">🏪</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Provider</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">I have surplus food and want to list items for sale.</p>
                  </div>

                  {/* Donation Center Card */}
                  <div 
                    onClick={() => { setValue('role', 'DONATION_CENTER'); setStep(2); }}
                    className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${selectedRole === 'DONATION_CENTER' ? 'border-pink-500 bg-pink-50 shadow-lg ring-4 ring-pink-100' : 'border-gray-200 hover:border-pink-300'}`}
                  >
                    <div className="text-4xl mb-4 group-hover:animate-bounce">❤️</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">NGO/Center</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">I represent a center in need of food donations.</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                   <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">← Back</button>
                   <div>
                     <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
                     <p className="text-sm text-gray-500">Joining as a <span className="font-bold text-green-600">{selectedRole.replace('_', ' ')}</span></p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Full Name / Contact Person <span className="text-red-500 ml-1">*</span></label>
                        <input {...formRegister('name', { required: 'Name is required' })} placeholder="Full Name" className={`register-input ${errors.name ? 'border-red-500 bg-red-50' : ''}`} />
                        <ErrorSpan message={errors.name?.message} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email Address <span className="text-red-500 ml-1">*</span></label>
                        <input {...formRegister('email', { 
                          required: 'Email is required',
                          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                        })} type="email" placeholder="you@email.com" className={`register-input ${errors.email ? 'border-red-500 bg-red-50' : ''}`} />
                        <ErrorSpan message={errors.email?.message} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number <span className="text-red-500 ml-1">*</span></label>
                        <input {...formRegister('phone', { 
                           required: 'Phone is required',
                           pattern: { value: /^\+?94\d{9}$/, message: 'Use format +94771234567' }
                        })} placeholder="+94 77 XXXXXXX" className={`register-input ${errors.phone ? 'border-red-500 bg-red-50' : ''}`} />
                        <ErrorSpan message={errors.phone?.message} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Password <span className="text-red-500 ml-1">*</span></label>
                        <input {...formRegister('password', { 
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Min 8 characters' }
                        })} type="password" placeholder="••••••••" className={`register-input ${errors.password ? 'border-red-500 bg-red-50' : ''}`} />
                        <ErrorSpan message={errors.password?.message} />
                      </div>
                    </div>
                  </div>

                  {/* Customer Specific */}
                  {selectedRole === 'CUSTOMER' && (
                    <div className="md:col-span-2 space-y-4 animate-fadeInUp">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Location Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Residential Address <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('address', { required: 'Address is required' })} placeholder="123 Street Name" className={`register-input ${errors.address ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.address?.message} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-2">Location on Map <span className="text-red-500 ml-1">*</span></label>
                          <MapPicker 
                            address={watchedAddress}
                            onLocationSelect={onLocationSelect} 
                            onAddressSelect={onAddressSelect}
                          />
                          {(!watch('lat') || !watch('lng')) && <span className="text-amber-600 text-[10px] mt-1 block font-bold">⚠️ Please pin your location on the map</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Provider Specific */}
                  {selectedRole === 'PROVIDER' && (
                    <div className="md:col-span-2 space-y-4 animate-fadeInUp">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Business Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Business Name <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('businessName', { required: 'Business name is required' })} placeholder="Company Name" className={`register-input ${errors.businessName ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.businessName?.message} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Business Reg No (BR) <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('brNo', { required: 'BR No is required' })} placeholder="BR-XXXXXXX" className={`register-input ${errors.brNo ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.brNo?.message} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Business Type</label>
                          <select {...formRegister('businessType')} className="register-input">
                             <option value="Bakery">Bakery</option>
                             <option value="Supermarket">Supermarket</option>
                             <option value="Cafe">Cafe / Restaurant</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Open Hours</label>
                          <input {...formRegister('openHours')} placeholder="8:00 AM - 10:00 PM" className="register-input" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Business Address <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('address', { required: 'Address is required' })} placeholder="Business Address" className={`register-input ${errors.address ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.address?.message} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-2">Business Location <span className="text-red-500 ml-1">*</span></label>
                          <MapPicker 
                            address={watchedAddress}
                            onLocationSelect={onLocationSelect} 
                            onAddressSelect={onAddressSelect}
                          />
                          {(!watch('lat') || !watch('lng')) && <span className="text-amber-600 text-[10px] mt-1 block font-bold uppercase">⚠️ Pin your business location</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Donation Center Specific */}
                  {selectedRole === 'DONATION_CENTER' && (
                    <div className="md:col-span-2 space-y-4 animate-fadeInUp">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Center Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">D.C. Name <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('centerName', { required: 'Center name is required' })} placeholder="Organization Name" className={`register-input ${errors.centerName ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.centerName?.message} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Center Type</label>
                          <select {...formRegister('centerType')} className="register-input">
                             <option value="Elderly Home">Elderly Home</option>
                             <option value="Childcare">Childcare</option>
                             <option value="NGO">NGO / Community Center</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Registration Number <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('brNo', { required: 'Reg No is required' })} placeholder="NGO-XXXXXX" className={`register-input ${errors.brNo ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.brNo?.message} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Beneficiaries Count</label>
                          <input {...formRegister('beneficiariesCount', { valueAsNumber: true })} type="number" placeholder="Number of people" className="register-input" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Location Address <span className="text-red-500 ml-1">*</span></label>
                          <input {...formRegister('address', { required: 'Address is required' })} placeholder="Center Address" className={`register-input ${errors.address ? 'border-red-500 bg-red-50' : ''}`} />
                          <ErrorSpan message={errors.address?.message} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-2">Center Location <span className="text-red-500 ml-1">*</span></label>
                          <MapPicker 
                            address={watchedAddress}
                            onLocationSelect={onLocationSelect} 
                            onAddressSelect={onAddressSelect}
                          />
                          {(!watch('lat') || !watch('lng')) && <span className="text-amber-600 text-[10px] mt-1 block font-bold uppercase">⚠️ Pin the center location</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t">
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:shadow-green-500/20 transform hover:scale-[1.02] active:scale-95 transition-all text-lg uppercase tracking-widest">
                    Create My Account
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4">By clicking Register, you agree to our Terms and Conditions</p>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">Already a member? <Link to="/login" className="text-green-600 hover:text-green-700 font-bold underline decoration-2 underline-offset-4">Login here</Link></p>
        </div>
      </div>

      <style>{`
        .register-input { width: 100%; padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 1rem; font-size: 0.875rem; transition: all 0.2s; outline: none; }
        .register-input:focus { border-color: #10b981; background: #f0fdf4; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
}
