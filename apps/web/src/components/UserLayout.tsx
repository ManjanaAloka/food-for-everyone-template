import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { useCart } from '../state/cart';
import { NotificationsDropdown } from './NotificationsDropdown';
import { 
  IoGridOutline, IoTrendingUpOutline, IoBusinessOutline, IoRestaurantOutline, 
  IoAddCircleOutline, IoBagHandleOutline, IoStarOutline, IoPersonOutline, 
  IoEarthOutline, IoLogOutOutline, IoCartOutline, IoStorefrontOutline, IoHeartOutline 
} from 'react-icons/io5';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { user, logout } = useAuth();
  const { items: cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    // 1. Dashboards / Overviews
    { label: 'Overview', path: '/dashboard', icon: <IoGridOutline />, roles: ['CUSTOMER'] },
    { label: 'Overview', path: '/provider/dashboard', icon: <IoTrendingUpOutline />, roles: ['PROVIDER'] },
    { label: 'Overview', path: '/dashboard/center', icon: <IoBusinessOutline />, roles: ['DONATION_CENTER'] },

    // 2. Primary Actions
    { label: 'Browse Food', path: '/browse', icon: <IoRestaurantOutline />, roles: ['CUSTOMER'] },
    { label: 'Add Listing', path: '/provider/listings/new', icon: <IoAddCircleOutline />, roles: ['PROVIDER'] },

    // 3. Transactions & Impact
    { label: 'My Orders', path: '/orders', icon: <IoBagHandleOutline />, roles: ['CUSTOMER', 'PROVIDER', 'DONATION_CENTER'] },
    { label: 'Reviews', path: '/provider/reviews', icon: <IoStarOutline />, roles: ['PROVIDER'] },
    
    // 4. Analytics & Settings
    { label: 'Analytics', path: '/customer/analytics', icon: <IoTrendingUpOutline />, roles: ['CUSTOMER', 'DONATION_CENTER'] },
    { label: 'Analytics', path: '/provider/analytics', icon: <IoTrendingUpOutline />, roles: ['PROVIDER'] },
    { label: 'My Profile', path: '/profile', icon: <IoPersonOutline />, roles: ['CUSTOMER', 'PROVIDER', 'DONATION_CENTER'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role as any));

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] print:block print:bg-white">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-40 print:hidden">
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

        <div className="p-6 border-t border-slate-100 space-y-3">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform"><IoEarthOutline /></span>
            Back to Site
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform"><IoLogOutOutline /></span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 flex items-center justify-between print:hidden">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-800 capitalize">
                {filteredMenu.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h2>
           </div>

           <div className="flex items-center gap-6">
              <Link 
                to="/cart"
                className="relative w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all border border-slate-100"
              >
                <span className="text-xl"><IoCartOutline /></span>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              <NotificationsDropdown />
              
              <div className="h-8 w-[1px] bg-slate-200" />

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Link to="/profile" className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl shadow-inner hover:scale-105 transition-transform border-2 border-white text-slate-600">
                  {user?.role === 'PROVIDER' ? <IoStorefrontOutline /> : user?.role === 'DONATION_CENTER' ? <IoHeartOutline /> : <IoPersonOutline />}
                </Link>
              </div>
           </div>
        </header>

        <main className="flex-1 p-8 print:p-0">
           <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
