import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN' || user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const menuItems = [
    { label: 'Overview', path: '/admin', icon: '📊', show: true },
    { label: 'Users', path: '/admin/users', icon: '👥', show: isSystemAdmin },
    { label: 'Approvals', path: '/admin/approvals', icon: '⏳', show: isSystemAdmin },
    { label: 'Reviews', path: '/admin/reviews', icon: '⭐', show: isManager },
    { label: 'Listings', path: '/admin/listings', icon: '🍽️', show: isManager },
    { label: 'Audit Log', path: '/admin/audit', icon: '📜', show: isSystemAdmin },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
              FreshSave Admin
            </span>
          </Link>
          <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Role</p>
            <p className="text-sm font-semibold text-gray-900">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span className="text-xl">🏠</span>
            Back to Site
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {menuItems.find(i => i.path === location.pathname)?.label || 'Admin'}
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
             </div>
             <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                🛡️
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
