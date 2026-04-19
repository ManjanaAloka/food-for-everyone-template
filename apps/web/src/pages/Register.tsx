import { useForm } from 'react-hook-form';
import { useAuth } from '../state/auth';
import { Link, useNavigate } from 'react-router-dom';

type Form = { name: string; email: string; phone?: string; password: string; role: 'CUSTOMER' | 'PROVIDER' | 'DONATION_CENTER'; businessName?: string; centerName?: string; };

export function RegisterPage() {
  const { register: doRegister } = useAuth();
  const { register: formRegister, handleSubmit, watch } = useForm<Form>({ defaultValues: { role: 'CUSTOMER' } });
  const nav = useNavigate();
  const role = watch('role');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">🍽️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Us Today!</h1>
            <p className="text-gray-600">Start making a difference in your community</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(async (v) => { await doRegister(v); alert('Registered. If Provider or Donation Center, wait for admin approval.'); nav('/login'); })} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                {...formRegister('name', { required: true })} 
                placeholder="John Doe" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                {...formRegister('email', { required: true })} 
                type="email"
                placeholder="you@example.com" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
              <input 
                {...formRegister('phone')} 
                placeholder="+94 71 234 5678" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                {...formRegister('password', { required: true })} 
                placeholder="••••••••" 
                type="password" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <select 
                {...formRegister('role', { required: true })} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="CUSTOMER">👥 Customer - I want to order food</option>
                <option value="PROVIDER">🏪 Service Provider - I have surplus food</option>
                <option value="DONATION_CENTER">❤️ Donation Center - I help communities</option>
              </select>
            </div>

            {role === 'PROVIDER' && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input 
                  {...formRegister('businessName', { required: true })} 
                  placeholder="Your business name" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
                />
              </div>
            )}

            {role === 'DONATION_CENTER' && (
              <div className="animate-fadeInUp">
                <label className="block text-sm font-medium text-gray-700 mb-2">Center Name</label>
                <input 
                  {...formRegister('centerName', { required: true })} 
                  placeholder="Your center name" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
                />
              </div>
            )}

            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Register
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
