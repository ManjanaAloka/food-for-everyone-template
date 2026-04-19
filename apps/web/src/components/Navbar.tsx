import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { useCart } from '../state/cart';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const nav = useNavigate();

  return (
    <div className="bg-green-700 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold">{t('common.appName')}</Link>
          <Link to="/donation-centers" className="hover:underline">{t('common.donationCenters')}</Link>
          <Link to="/impact" className="hover:underline">{t('common.impact')}</Link>
          {user?.role === 'PROVIDER' && <>
            <Link to="/provider/listings/new" className="hover:underline">{t('common.newListing')}</Link>
            <Link to="/provider/dashboard" className="hover:underline">{t('common.providerDashboard')}</Link>
          </>}
          {user?.role === 'ADMIN' && <>
            <Link to="/admin/approvals" className="hover:underline">{t('common.admin')}</Link>
            <Link to="/admin/reviews" className="hover:underline">{t('common.adminReviews')}</Link>
          </>}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/checkout" className="hover:underline">{t('common.cart')} ({items.length})</Link>
          <LanguageSwitcher />
          {user ? (
            <>
              <span className="text-sm opacity-90">{user.name} â€¢ {user.role}</span>
              <Link to="/orders" className="hover:underline">{t('common.myOrders')}</Link>
              <button className="bg-white text-green-700 px-3 py-1 rounded" onClick={() => { logout().then(()=> nav('/')); }}>
                {t('common.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">{t('common.login')}</Link>
              <Link to="/register" className="hover:underline">{t('common.register')}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}