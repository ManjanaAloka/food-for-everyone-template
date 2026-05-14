import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function PasswordForceModal({ onClose }: { onClose: () => void }) {
  const { updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully');
      updateUser({ forcePasswordChange: false });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">🚨</div>
          <h3 className="text-3xl font-black text-gray-900 mb-2">Security Action</h3>
          <p className="text-gray-500">Your account was created by an administrator. For your security, you must change your temporary password.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Current Temporary Password</label>
            <input 
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Secure Password</label>
            <input 
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex gap-4 mt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
            >
              Remind me later
            </button>
            <button 
              type="submit"
              disabled={isPending}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              {isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showForceModal, setShowForceModal] = useState(user?.forcePasswordChange || false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN';
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const menuItems = [
    { id: 'overview', label: 'Overview', path: '/admin', icon: '📊', show: true },
    { id: 'users', label: 'Users', path: '/admin/users', icon: '👥', show: true },
    { id: 'approvals', label: 'Approvals', path: '/admin/approvals', icon: '⏳', show: true },
    { id: 'reviews', label: 'Reviews', path: '/admin/reviews', icon: '⭐', show: true },
    { id: 'listings', label: 'Listings', path: '/admin/listings', icon: '🍽️', show: true },
    { id: 'audit', label: 'Audit Log', path: '/admin/audit', icon: '📜', show: isSystemAdmin },
    { id: 'profile', label: 'My Profile', path: '/admin/profile', icon: '👤', show: true },
    { id: 'settings', label: 'Settings', path: '/admin/settings', icon: '⚙️', show: isSystemAdmin },
  ];

  const allowedTabs = (user?.permissions as any)?.allowedTabs || [];
  const filteredMenu = menuItems.filter(item => {
    if (!item.show) return false;
    if (user?.role === 'SYSTEM_ADMIN') return true;
    if (allowedTabs.length === 0) return true; // Default access if not set
    return allowedTabs.includes(item.id);
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {showForceModal && <PasswordForceModal onClose={() => setShowForceModal(false)} />}
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/admin" className="text-xl font-extrabold text-green-600 tracking-tight">
            FreshSave <span className="text-gray-800">Admin</span>
          </Link>
        </div>

        <div className="p-4">
          <div className="bg-green-50 rounded-xl p-3 border border-green-100/50">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">ROLE</p>
            <p className="text-sm font-semibold text-gray-900">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
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

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <span className="text-xl">🏠</span>
            Back to Site
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <span className="text-xl">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {menuItems.find(i => i.path === location.pathname)?.label || 'Admin'}
            </h2>
            {user?.forcePasswordChange && (
               <div 
                 onClick={() => setShowForceModal(true)}
                 className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-red-100 transition-all border border-red-100 animate-pulse"
               >
                 <span className="text-xs">⚠️</span> Security Alert
               </div>
             )}
          </div>
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
