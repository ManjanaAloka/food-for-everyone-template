import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../state/auth';
import { useCart } from '../state/cart';
import { useState } from 'react';
import { AdminLogoutModal } from './AdminLogoutModal';
import { NotificationsDropdown } from './NotificationsDropdown';

export function ModernNavbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-md">
              <span className="text-2xl">🍽️</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Food for Everyone
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user?.role === 'ADMIN' ? (
              <>
                <NavLink to="/admin">Dashboard</NavLink>
                <NavLink to="/admin/reviews">Reviews</NavLink>
              </>
            ) : user?.role === 'PROVIDER' ? (
              <>
                <NavLink to="/browse">Browse Food</NavLink>
                <NavLink to="/provider/listings/new">New Listing</NavLink>
                <NavLink to="/provider/dashboard">My Listings</NavLink>
              </>
            ) : user?.role === 'DONATION_CENTER' ? (
              <>
                <NavLink to="/dashboard/center">Center Dashboard</NavLink>
                <NavLink to="/give-back">Give Back</NavLink>
                <NavLink to="/browse">Browse Food</NavLink>

              </>
            ) : (
              <>
                <NavLink to="/browse">Browse Food</NavLink>
                <NavLink to="/donation-centers">Donation Centers</NavLink>
                <NavLink to="/give-back">Give Back</NavLink>
                <NavLink to="/impact">Impact</NavLink>
                <NavLink to="/providers">Providers</NavLink>

              </>
            )}
          </div>

          {/* Right Side - Cart, Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart - Only for Customers */}
            {user?.role === 'CUSTOMER' && (
              <Link 
                to="/checkout" 
                className="relative px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">🛒</span>
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {items.length}
                  </span>
                )}
              </Link>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium text-gray-800">{user.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full">
                    {user.role}
                  </span>
                </div>
                <NotificationsDropdown />
                {user.role !== 'ADMIN' && (
                  <>
                    <Link 
                      to="/orders" 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                    >
                      My Orders
                    </Link>
                    <Link 
                      to="/profile" 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                    >
                      Profile
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    if (user?.role === 'ADMIN') {
                      setShowLogoutModal(true);
                    } else {
                      logout().then(() => nav('/'));
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
          >
            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            <MobileNavLink to="/browse" onClick={() => setMobileMenuOpen(false)}>
              Browse Food
            </MobileNavLink>
            
            {user?.role === 'PROVIDER' ? (
              <>
                <MobileNavLink to="/provider/listings/new" onClick={() => setMobileMenuOpen(false)}>
                  New Listing
                </MobileNavLink>
                <MobileNavLink to="/provider/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  My Listings
                </MobileNavLink>
              </>
            ) : user?.role === 'DONATION_CENTER' ? (
              <>
                <MobileNavLink to="/dashboard/center" onClick={() => setMobileMenuOpen(false)}>
                  Center Dashboard
                </MobileNavLink>
                <MobileNavLink to="/give-back" onClick={() => setMobileMenuOpen(false)}>
                  Give Back
                </MobileNavLink>

              </>
            ) : user?.role !== 'ADMIN' && (
              <>
                <MobileNavLink to="/donation-centers" onClick={() => setMobileMenuOpen(false)}>
                  Donation Centers
                </MobileNavLink>
                <MobileNavLink to="/give-back" onClick={() => setMobileMenuOpen(false)}>
                  Give Back
                </MobileNavLink>
                <MobileNavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </MobileNavLink>

                <MobileNavLink to="/impact" onClick={() => setMobileMenuOpen(false)}>
                  Impact
                </MobileNavLink>
                <MobileNavLink to="/providers" onClick={() => setMobileMenuOpen(false)}>
                  Providers
                </MobileNavLink>

              </>
            )}
            
            {!user && (
              <>
                <MobileNavLink to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </MobileNavLink>
                <MobileNavLink to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Admin Logout Modal */}
      <AdminLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async (password) => {
          try {
            await logout(password);
            setShowLogoutModal(false);
            nav('/');
          } catch (error: any) {
            alert(error.message || 'Incorrect password');
          }
        }}
      />
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive 
          ? 'text-green-700 bg-green-50 border border-green-100 shadow-sm' 
          : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
      }`}
    >
      {children}
    </Link>
  );
}


function MobileNavLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors duration-200"
    >
      {children}
    </Link>
  );
}
