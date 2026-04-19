import { Routes, Route } from 'react-router-dom';
import { ModernNavbar } from './components/ModernNavbar';
import { Protected, RoleGate } from './components/Protected';
import { HomePage } from './pages/Home';
import { ListingsPage } from './pages/Listings';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { CheckoutPage } from './pages/Checkout';
import { CheckoutSuccessPage } from './pages/CheckoutSuccess';
import { CheckoutCancelPage } from './pages/CheckoutCancel';
import { ProvidersDirectoryPage } from './pages/Providers/ProvidersDirectory';
import { DonationCentersPage } from './pages/Donation/DonationCenters';
import { ListingCreatePage } from './pages/Provider/ListingCreate';
import { ListingEditPage } from './pages/Provider/ListingEdit';
import { ApprovalsPage } from './pages/Admin/Approvals';
import { AdminDashboardPage } from './pages/Admin/Dashboard';
import { AdminUsersPage } from './pages/Admin/Users';
import { AdminListingsPage } from './pages/Admin/Listings';
import { PublicImpactPage } from './pages/Reports/PublicImpact';
import { MyOrdersPage } from './pages/Orders/MyOrders';
import { OrderDetailPage } from './pages/Orders/OrderDetail';
import { ProviderDashboardPage } from './pages/Provider/Dashboard';
import { ReviewModerationPage } from './pages/Admin/ReviewModeration';

export default function App() {
  return (
    <div className="min-h-full">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><ListingsPage /></div></>} />
        <Route path="/login" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><LoginPage /></div></>} />
        <Route path="/register" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20"><RegisterPage /></div></>} />

        <Route path="/checkout" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><CheckoutPage /></Protected></div></>} />
        <Route path="/checkout/success" element={<><ModernNavbar /><CheckoutSuccessPage /></>} />
        <Route path="/checkout/cancel" element={<><ModernNavbar /><CheckoutCancelPage /></>} />
        <Route path="/orders" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><MyOrdersPage /></Protected></div></>} />
        <Route path="/orders/:id" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><OrderDetailPage /></Protected></div></>} />

        <Route path="/donation-centers" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><DonationCentersPage /></div></>} />
        <Route path="/impact" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><PublicImpactPage /></div></>} />
        <Route path="/providers" element={<><ModernNavbar /><ProvidersDirectoryPage /></>} />

        <Route path="/provider/listings/new" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><RoleGate roles={['PROVIDER']}><ListingCreatePage /></RoleGate></Protected></div></>} />
        <Route path="/provider/listings/:id/edit" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><RoleGate roles={['PROVIDER']}><ListingEditPage /></RoleGate></Protected></div></>} />
        <Route path="/provider/dashboard" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><RoleGate roles={['PROVIDER']}><ProviderDashboardPage /></RoleGate></Protected></div></>} />

        <Route path="/admin" element={<><ModernNavbar /><Protected><RoleGate roles={['ADMIN']}><AdminDashboardPage /></RoleGate></Protected></>} />
        <Route path="/admin/users" element={<><ModernNavbar /><Protected><RoleGate roles={['ADMIN']}><AdminUsersPage /></RoleGate></Protected></>} />
        <Route path="/admin/listings" element={<><ModernNavbar /><Protected><RoleGate roles={['ADMIN']}><AdminListingsPage /></RoleGate></Protected></>} />
        <Route path="/admin/approvals" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><RoleGate roles={['ADMIN']}><ApprovalsPage /></RoleGate></Protected></div></>} />
        <Route path="/admin/reviews" element={<><ModernNavbar /><div className="max-w-6xl mx-auto p-4 pt-20\"><Protected><RoleGate roles={['ADMIN']}><ReviewModerationPage /></RoleGate></Protected></div></>} />
      </Routes>
    </div>
  );
}
