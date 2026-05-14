import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { NotificationsDropdown } from './NotificationsDropdown';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    // CUSTOMER Links
    { label: 'Overview', path: '/dashboard', icon: '📊', roles: ['CUSTOMER'] },
    { label: 'Browse Food', path: '/browse', icon: '🍽️', roles: ['CUSTOMER'] },
    { label: 'My Orders', path: '/orders', icon: '🛍️', roles: ['CUSTOMER'] },
    { label: 'Contributions', path: '/reports/mine', icon: '🌱', roles: ['CUSTOMER'] },
    
    // PROVIDER Links
    { label: 'Overview', path: '/provider/dashboard', icon: '📈', roles: ['PROVIDER'] },
    { label: 'My Listings', path: '/browse', icon: '📦', roles: ['PROVIDER'] }, // Or specific provider listing page
    { label: 'Add Listing', path: '/provider/listings/new', icon: '➕', roles: ['PROVIDER'] },
    
    // DONATION_CENTER Links
    { label: 'Overview', path: '/dashboard/center', icon: '🏢', roles: ['DONATION_CENTER'] },
    { label: 'All Centers', path: '/donation-centers', icon: '🏥', roles: ['DONATION_CENTER'] },
    
    // Common
    { label: 'Profile', path: '/profile', icon: '👤', roles: ['CUSTOMER', 'PROVIDER', 'DONATION_CENTER'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role as any));

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-40">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 group-hover:rotate-12 transition-transform">
              <span className="text-white text-xl font-bold">FS</span>
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">FreshSave</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 mb-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu</p>
          </div>
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-green-600 text-white shadow-xl shadow-green-100 translate-x-2'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`text-xl ${isActive ? 'scale-110' : 'opacity-70'}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-800 capitalize">
                {filteredMenu.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h2>
           </div>

           <div className="flex items-center gap-6">
              <NotificationsDropdown />
              
              <div className="h-10 w-[1px] bg-slate-200" />

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Link to="/profile" className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl shadow-inner hover:scale-105 transition-transform border-2 border-white">
                  {user?.role === 'PROVIDER' ? '🏪' : user?.role === 'DONATION_CENTER' ? '❤️' : '👤'}
                </Link>
              </div>
           </div>
        </header>

        <main className="flex-1 p-8">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
