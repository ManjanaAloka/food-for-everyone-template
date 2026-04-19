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
  if (!user || !roles.includes(user.role)) return <div className="text-sm text-red-600">Access denied.</div>;
  return children;
}