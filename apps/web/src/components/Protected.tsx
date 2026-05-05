import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth';

export function Protected({ children }: any) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}
export function RoleGate({ roles, children }: { roles: string[]; children: any }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-2xl border-2 border-red-100 text-center animate-fadeIn">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
        <p className="text-red-600 mb-6">Sorry, you don't have permission to view this page.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }
  return children;
}