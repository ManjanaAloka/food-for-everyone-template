import { useForm } from 'react-hook-form';
import { useAuth } from '../state/auth';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;
  
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const { user } = await login(values.email, values.password);
      
      // Success feedback
      toast.success(`Welcome back, ${user?.name}!`);

      // Role-based redirection
      const intendedPath = loc.state?.from?.pathname;
      
      if (user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN') {
        nav('/admin/users');
      } else if (user?.role === 'PROVIDER') {
        nav('/provider/dashboard');
      } else if (user?.role === 'DONATION_CENTER') {
        nav('/dashboard/center');
      } else {
        // Customers or others
        if (intendedPath && !intendedPath.startsWith('/provider') && !intendedPath.startsWith('/admin')) {
          nav(intendedPath);
        } else {
          nav('/');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    }
  };
  
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Login to continue saving food</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                {...register('email', { required: true })} 
                type="email"
                placeholder="you@example.com" 
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                {...register('password', { required: true })} 
                placeholder="••••••••" 
                type="password" 
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
              />
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Login
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
