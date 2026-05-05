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
import { MyOrdersPage } from './pages/Orders/MyOrders';
import { OrderDetailPage } from './pages/Orders/OrderDetail';
import { OrderReviewPage } from './pages/Orders/OrderReview';
import { ProviderDashboardPage } from './pages/Provider/Dashboard';
import { ListingOrdersPage } from './pages/Provider/ListingOrders';
import { ReviewModerationPage } from './pages/Admin/ReviewModeration';
import { AdminAuditLogPage } from './pages/Admin/AuditLog';
import { AdminLayout } from './components/AdminLayout';
import { ProviderSettingsPage } from './pages/Provider/Settings';
import { CustomerSettingsPage } from './pages/Customer/Settings';
import { CustomerContributionPage } from './pages/Reports/CustomerContribution';
import { ProfilePage } from './pages/Profile';



export default function App() {
  return (
    <div className="min-h-full">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><ListingsPage /></div></>} />
        <Route path="/listings/:id" element={<><ModernNavbar /><ListingDetailPage /></>} />
        <Route path="/login" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><LoginPage /></div></>} />
        <Route path="/register" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><RegisterPage /></div></>} />

        <Route path="/checkout" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><CheckoutPage /></Protected></div></>} />
        <Route path="/checkout/success" element={<><ModernNavbar /><CheckoutSuccessPage /></>} />
        <Route path="/checkout/cancel" element={<><ModernNavbar /><CheckoutCancelPage /></>} />
        <Route path="/orders" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><MyOrdersPage /></Protected></div></>} />
        <Route path="/orders/:id" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><OrderDetailPage /></Protected></div></>} />
        <Route path="/orders/:id/review" element={<><ModernNavbar /><Protected><OrderReviewPage /></Protected></>} />

        <Route path="/donation-centers" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><DonationCentersPage /></div></>} />
        <Route path="/give-back" element={<><ModernNavbar /><GiveBackPage /></>} />
        <Route path="/impact" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><PublicImpactPage /></div></>} />
        <Route path="/donation-centers/:id" element={<><ModernNavbar /><DonationCenterProfilePage /></>} />
        <Route path="/providers" element={<><ModernNavbar /><ProvidersDirectoryPage /></>} />
        <Route path="/providers/:id" element={<><ModernNavbar /><ProviderProfilePage /></>} />
        <Route path="/reports/mine" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><CustomerContributionPage /></Protected></div></>} />

        <Route path="/provider/listings/new" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><RoleGate roles={['PROVIDER']}><ListingCreatePage /></RoleGate></Protected></div></>} />
        <Route path="/provider/listings/:id/edit" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><RoleGate roles={['PROVIDER']}><ListingEditPage /></RoleGate></Protected></div></>} />
        <Route path="/provider/dashboard" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><RoleGate roles={['PROVIDER']}><ProviderDashboardPage /></RoleGate></Protected></div></>} />
        <Route path="/provider/listings/:id/orders" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><Protected><RoleGate roles={['PROVIDER']}><ListingOrdersPage /></RoleGate></Protected></div></>} />
        <Route path="/profile" element={<><ModernNavbar /><Protected><ProfilePage /></Protected></>} />



        <Route path="/dashboard/center" element={<><ModernNavbar /><Protected><RoleGate roles={['DONATION_CENTER']}><DonationCenterDashboardPage /></RoleGate></Protected></>} />

        <Route path="/admin" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN', 'MANAGER']}><AdminLayout><AdminDashboardPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/users" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><AdminUsersPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/listings" element={<Protected><RoleGate roles={['ADMIN', 'MANAGER']}><AdminLayout><AdminListingsPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/approvals" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><ApprovalsPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/reviews" element={<Protected><RoleGate roles={['ADMIN', 'MANAGER']}><AdminLayout><ReviewModerationPage /></AdminLayout></RoleGate></Protected>} />
        <Route path="/admin/audit" element={<Protected><RoleGate roles={['ADMIN', 'SYSTEM_ADMIN']}><AdminLayout><AdminAuditLogPage /></AdminLayout></RoleGate></Protected>} />
      </Routes>
    </div>
  );
}

