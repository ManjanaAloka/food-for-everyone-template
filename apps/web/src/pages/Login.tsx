import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../state/auth';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string }>();
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [isPending, setIsPending] = useState(false);
  
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const { user } = await login(values.email, values.password);
      toast.success(`Welcome back, ${user?.name}!`);

      const intendedPath = loc.state?.from?.pathname;
      if (user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN') {
        nav('/admin/users');
      } else if (user?.role === 'PROVIDER') {
        nav('/provider/dashboard');
      } else if (user?.role === 'DONATION_CENTER') {
        nav('/dashboard/center');
      } else {
        if (intendedPath && !intendedPath.startsWith('/provider') && !intendedPath.startsWith('/admin')) {
          nav(intendedPath);
        } else {
          nav('/');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      if (msg === 'Awaiting admin approval') {
        setIsPending(true);
      } else {
        toast.error(msg || 'Login failed. Please check your credentials.');
      }
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center py-12 px-4 animate-fadeIn">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 border border-green-100 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <span className="text-5xl">⏳</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg animate-bounce">
              <span className="text-xs font-black">PENDING</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-gray-900 leading-tight">Account Under Review!</h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Thanks for joining <span className="text-green-600 font-bold">FreshSave</span>. 
              Our admin team is currently reviewing your registration details.
            </p>
          </div>

          <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-6 rounded-3xl">
            <p className="text-amber-800 text-sm font-bold">
              🚀 We usually approve business profiles within 24 hours. Keep an eye on your email!
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button 
              onClick={() => setIsPending(false)}
              className="w-full bg-gray-900 text-white font-black px-6 py-4 rounded-2xl shadow-xl hover:bg-black transition-all transform hover:scale-[1.02] active:scale-95"
            >
              BACK TO LOGIN
            </button>
            <Link 
              to="/" 
              className="text-gray-400 hover:text-green-600 font-bold text-sm transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 space-y-8 border border-white/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <span className="text-4xl">🥗</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Welcome Back!</h1>
            <p className="text-gray-500 font-medium">Login to continue saving food</p>
          </div>

          <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })} 
                type="email"
                placeholder="you@example.com" 
                className={`w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-green-200'}`} 
              />
              {errors.email && <span className="text-red-500 text-[10px] ml-2 block font-black uppercase tracking-tighter">⚠️ {errors.email.message}</span>}
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                {...register('password', { required: 'Password is required' })} 
                placeholder="••••••••" 
                type="password" 
                className={`w-full px-5 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-green-500/10 transition-all outline-none font-medium ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-green-200'}`} 
              />
              {errors.password && <span className="text-red-500 text-[10px] ml-2 block font-black uppercase tracking-tighter">⚠️ {errors.password.message}</span>}
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black px-6 py-4 rounded-2xl shadow-xl hover:shadow-green-500/20 transform hover:scale-[1.02] active:scale-95 transition-all duration-300 uppercase tracking-widest text-sm mt-4">
              Login to Account
            </button>
          </form>

          <div className="text-center pt-6 border-t border-gray-100">
            <p className="text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-black underline decoration-2 underline-offset-4">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
