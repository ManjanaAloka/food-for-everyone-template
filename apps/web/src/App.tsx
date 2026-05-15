import { Routes, Route } from 'react-router-dom';
import { ModernNavbar } from './components/ModernNavbar';
import { Protected, RoleGate } from './components/Protected';
import { HomePage } from './pages/Home';
import { ListingsPage } from './pages/Listings';
import { ListingDetailPage } from './pages/Listings/ListingDetail';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { CheckoutPage } from './pages/Checkout';
import { CheckoutSuccessPage } from './pages/CheckoutSuccess';
import { CheckoutCancelPage } from './pages/CheckoutCancel';
import { ProvidersDirectoryPage } from './pages/Providers/ProvidersDirectory';
import { ProviderProfilePage } from './pages/Providers/ProviderProfile';
import { DonationCentersPage } from './pages/Donation/DonationCenters';
import { GiveBackPage } from './pages/Donation/GiveBack';
import { DonationCenterDashboardPage } from './pages/Donation/DonationCenterDashboard';
import { DonationCenterProfilePage } from './pages/Donation/DonationCenterProfile';
import { ListingCreatePage } from './pages/Provider/ListingCreate';
import { ListingEditPage } from './pages/Provider/ListingEdit';
import { ApprovalsPage } from './pages/Admin/Approvals';
import { AdminDashboardPage } from './pages/Admin/Dashboard';
import { AdminUsersPage } from './pages/Admin/Users';
import { AdminListingsPage } from './pages/Admin/Listings';
import { PublicImpactPage } from './pages/Reports/PublicImpact';
import { CustomerDashboardPage } from './pages/Customer/Dashboard';
import { MyOrdersPage } from './pages/Orders/MyOrders';
import { OrderDetailPage } from './pages/Orders/OrderDetail';
import { OrderReviewPage } from './pages/Orders/OrderReview';
import { ProviderDashboardPage } from './pages/Provider/Dashboard';
import { ListingOrdersPage } from './pages/Provider/ListingOrders';
import { ReviewModerationPage } from './pages/Admin/ReviewModeration';
import { AdminAuditLogPage } from './pages/Admin/AuditLog';
import { AdminSettingsPage } from './pages/Admin/Settings';
import { ProviderReviewsPage } from './pages/Provider/Reviews';
import { AdminProfilePage } from './pages/Admin/Profile';
import { AdminLayout } from './components/AdminLayout';
import { CustomerContributionPage } from './pages/Reports/CustomerContribution';
import { ProfilePage } from './pages/Profile';
import { UserLayout } from './components/UserLayout';
import { ProviderAnalyticsPage } from './pages/Provider/Analytics';
import { ProviderSettingsPage } from './pages/Provider/Settings';
import { CustomerAnalyticsPage } from './pages/Customer/Analytics';
import { CustomerSettingsPage } from './pages/Customer/Settings';
import { DonationCenterSettingsPage } from './pages/Donation/DonationCenterSettings';

export default function App() {
  return (
    <div className="min-h-full">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><ListingsPage /></div></>} />
        <Route path="/listings/:id" element={<><ModernNavbar /><ListingDetailPage /></>} />
        <Route path="/login" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><LoginPage /></div></>} />
        <Route path="/register" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><RegisterPage /></div></>} />
        <Route path="/checkout/success" element={<><ModernNavbar /><CheckoutSuccessPage /></>} />
        <Route path="/checkout/cancel" element={<><ModernNavbar /><CheckoutCancelPage /></>} />
        <Route path="/donation-centers" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><DonationCentersPage /></div></>} />
        <Route path="/give-back" element={<><ModernNavbar /><GiveBackPage /></>} />
        <Route path="/impact" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><PublicImpactPage /></div></>} />
        <Route path="/donation-centers/:id" element={<><ModernNavbar /><DonationCenterProfilePage /></>} />
        <Route path="/providers" element={<><ModernNavbar /><ProvidersDirectoryPage /></>} />
        <Route path="/providers/:id" element={<><ModernNavbar /><ProviderProfilePage /></>} />

        {/* Protected User Routes (With Sidebar) */}
        <Route path="/dashboard" element={<Protected><RoleGate roles={['CUSTOMER']}><UserLayout><CustomerDashboardPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/orders" element={<Protected><RoleGate roles={['CUSTOMER', 'PROVIDER', 'DONATION_CENTER']}><UserLayout><MyOrdersPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/orders/:id" element={<Protected><RoleGate roles={['CUSTOMER', 'PROVIDER', 'DONATION_CENTER']}><UserLayout><OrderDetailPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/orders/:id/review" element={<Protected><RoleGate roles={['CUSTOMER', 'PROVIDER', 'DONATION_CENTER']}><UserLayout><OrderReviewPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/reports/mine" element={<Protected><RoleGate roles={['CUSTOMER', 'PROVIDER', 'DONATION_CENTER']}><UserLayout><CustomerContributionPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/checkout" element={<Protected><RoleGate roles={['CUSTOMER']}><UserLayout><CheckoutPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/customer/analytics" element={<Protected><RoleGate roles={['CUSTOMER']}><UserLayout><CustomerAnalyticsPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/customer/settings" element={<Protected><RoleGate roles={['CUSTOMER']}><UserLayout><CustomerSettingsPage /></UserLayout></RoleGate></Protected>} />

        {/* Provider Routes (With Sidebar) */}
        <Route path="/provider/dashboard" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ProviderDashboardPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/provider/listings/new" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ListingCreatePage /></UserLayout></RoleGate></Protected>} />
        <Route path="/provider/listings/:id/edit" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ListingEditPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/provider/listings/:id/orders" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ListingOrdersPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/provider/analytics" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ProviderAnalyticsPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/provider/reviews" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ProviderReviewsPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/provider/settings" element={<Protected><RoleGate roles={['PROVIDER']}><UserLayout><ProviderSettingsPage /></UserLayout></RoleGate></Protected>} />
        
        {/* Donation Center Routes (With Sidebar) */}
        <Route path="/dashboard/center" element={<Protected><RoleGate roles={['DONATION_CENTER']}><UserLayout><DonationCenterDashboardPage /></UserLayout></RoleGate></Protected>} />
        <Route path="/center/settings" element={<Protected><RoleGate roles={['DONATION_CENTER']}><UserLayout><DonationCenterSettingsPage /></UserLayout></RoleGate></Protected>} />
        
        {/* Common Protected */}
        <Route path="/profile" element={<Protected><UserLayout><ProfilePage /></UserLayout></Protected>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN', 'MANAGER']}><AdminLayout><AdminDashboardPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/users" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><AdminUsersPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/listings" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN', 'MANAGER']}><AdminLayout><AdminListingsPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/approvals" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><ApprovalsPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/reviews" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN', 'MANAGER']}><AdminLayout><ReviewModerationPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/audit" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><AdminAuditLogPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/profile" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN', 'MANAGER']}><AdminLayout><AdminProfilePage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/settings" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><AdminSettingsPage /></AdminLayout></RoleGate></Protected>} />
      </Routes>
    </div>
  );
}
