import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  IoHandRightOutline, IoBarChartOutline, IoPeopleOutline, 
  IoRestaurantOutline, IoCubeOutline, IoHourglassOutline, 
  IoFlashOutline, IoStarOutline, IoPersonOutline, IoPlanetOutline 
} from 'react-icons/io5';

export function AdminDashboardPage() {
  const { accessToken, user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const statsQ = useQuery({
    queryKey: ['adminStats'],
    enabled: !!accessToken,
    queryFn: async () => {
      const [listings, users, orders, reviews] = await Promise.all([
        api.get('/listings'),
        api.get('/admin/users'),
        api.get('/admin/orders'),
        api.get('/admin/reviews')
      ]);
      return {
        totalListings: listings.data.listings?.length || 0,
        totalUsers: users.data.users?.length || 0,
        totalOrders: orders.data.orders?.length || 0,
        pendingReviews: reviews.data.reviews?.filter((r: any) => r.status === 'PENDING').length || 0,
        rawListings: listings.data.listings || [],
        rawUsers: users.data.users || [],
        rawOrders: orders.data.orders || [],
        rawReviews: reviews.data.reviews || []
      };
    }
  });

  const providersQ = useQuery({
    queryKey: ['pendingProviders'],
    enabled: !!accessToken,
    queryFn: async () => (await api.get('/admin/pending/providers')).data
  });

  const centersQ = useQuery({
    queryKey: ['pendingCenters'],
    enabled: !!accessToken,
    queryFn: async () => (await api.get('/admin/pending/centers')).data
  });

  const pendingCount = (providersQ.data?.providers?.length || 0) + (centersQ.data?.centers?.length || 0);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const data = statsQ.data;
      if (!data) throw new Error('Data not loaded');

      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;

      const totalRevenue = data.rawOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const userRoles = data.rawUsers.reduce((acc: any, u: any) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>FreshSave System Report - ${new Date().toLocaleDateString()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1a202c; line-height: 1.5; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #059669; margin-bottom: 4px; }
            .title { font-size: 32px; font-weight: 800; color: #111827; }
            .date { color: #6b7280; font-size: 14px; }
            .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; rounded: 12px; }
            .card-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            .card-val { font-size: 24px; font-weight: 800; color: #0f172a; }
            .section { margin-bottom: 40px; }
            .section-title { font-size: 18px; font-weight: 700; border-left: 4px solid #10b981; padding-left: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { text-align: left; background: #f1f5f9; padding: 12px; font-weight: 700; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">Print to PDF</button>
          </div>
          
          <div class="header">
            <div class="logo">FreshSave Platform</div>
            <div class="title">System Performance Report</div>
            <div class="date">Generated on ${new Date().toLocaleString()}</div>
          </div>

          <div class="grid">
            <div class="card"><div class="card-label">Total Users</div><div class="card-val">${data.totalUsers}</div></div>
            <div class="card"><div class="card-label">Platform Listings</div><div class="card-val">${data.totalListings}</div></div>
            <div class="card"><div class="card-label">Total Orders</div><div class="card-val">${data.totalOrders}</div></div>
            <div class="card"><div class="card-label">Gross Revenue</div><div class="card-val">LKR ${totalRevenue.toLocaleString()}</div></div>
          </div>

          <div class="section">
            <div class="section-title">User Demographics</div>
            <div style="display: flex; gap: 40px;">
              ${Object.entries(userRoles).map(([role, count]) => `
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; flex: 1;">
                  <div style="font-size: 10px; font-weight: bold; color: #3b82f6;">${role}</div>
                  <div style="font-size: 20px; font-weight: 900;">${count}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Recent Transactions (Last 20)</div>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Fulfillment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${data.rawOrders.slice(0, 20).map((o: any) => `
                  <tr>
                    <td>#${o.id.slice(-8).toUpperCase()}</td>
                    <td>${o.customer?.name || 'Guest'}</td>
                    <td>LKR ${o.totalAmount?.toLocaleString()}</td>
                    <td>${o.fulfillmentMode}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Platform Inventory Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Provider</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                ${data.rawListings.slice(0, 15).map((l: any) => `
                  <tr>
                    <td>${l.title}</td>
                    <td>${l.provider?.businessName || '-'}</td>
                    <td>LKR ${l.discountPrice}</td>
                    <td>${l.qtyAvailable} units</td>
                    <td>${new Date(l.expiresAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Confidential System Report - For Administrative Use Only - &copy; ${new Date().getFullYear()} FreshSave
          </div>
        </body>
        </html>
      `;

      reportWindow.document.write(html);
      reportWindow.document.close();
      toast.success('System report generated successfully!');
    } catch (err) {
      toast.error('Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Welcome back, {user?.name}! <IoHandRightOutline className="text-yellow-300" /></h1>
          <p className="text-green-100">Here's what's happening on the FreshSave platform today.</p>
        </div>
        <button 
          onClick={generateReport}
          disabled={isGenerating || statsQ.isLoading}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap"
        >
          {isGenerating ? <><IoHourglassOutline /> Generating...</> : <><IoBarChartOutline /> Generate System Report</>}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl text-blue-600"><IoPeopleOutline /></div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Users</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{statsQ.isLoading ? '...' : statsQ.data?.totalUsers || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Registered accounts</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl text-green-600"><IoRestaurantOutline /></div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Listings</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{statsQ.isLoading ? '...' : statsQ.data?.totalListings || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Active food items</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl text-purple-600"><IoCubeOutline /></div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Orders</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{statsQ.isLoading ? '...' : statsQ.data?.totalOrders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Completed transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl text-orange-600"><IoHourglassOutline /></div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Pending</span>
          </div>
          <p className="text-3xl font-black text-orange-600">{pendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions / Shortcuts */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><IoFlashOutline className="text-yellow-500" /> Management Shortcuts</h2>
          <div className="grid grid-cols-2 gap-4">
            {user?.role !== 'MANAGER' && (
              <Link 
                to="/admin/approvals" 
                className={`p-4 rounded-2xl border transition-all group relative overflow-hidden ${
                  pendingCount > 0 
                    ? 'bg-orange-100 border-orange-400 animate-alert shadow-lg' 
                    : 'bg-orange-50 border-orange-100 hover:shadow-md'
                }`}
              >
                {pendingCount > 0 && (
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </div>
                )}
                <div className={`text-2xl mb-2 flex justify-center text-orange-600 ${pendingCount > 0 ? 'animate-bounce' : ''}`}><IoHourglassOutline /></div>
                <p className={`font-bold ${pendingCount > 0 ? 'text-orange-900' : 'text-gray-900'}`}>Approvals</p>
                <p className={`text-xs ${pendingCount > 0 ? 'text-orange-600 font-black' : 'text-gray-500'}`}>{pendingCount} pending</p>
              </Link>
            )}
            <Link to="/admin/reviews" className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 hover:shadow-md transition-all">
              <div className="text-2xl mb-2 flex justify-center text-yellow-500"><IoStarOutline /></div>
              <p className="font-bold text-gray-900">Reviews</p>
              <p className="text-xs text-gray-500">{statsQ.data?.pendingReviews || 0} pending</p>
            </Link>
            {user?.role !== 'MANAGER' && (
              <Link to="/admin/users" className="p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:shadow-md transition-all">
                <div className="text-2xl mb-2 flex justify-center text-blue-600"><IoPersonOutline /></div>
                <p className="font-bold text-gray-900">User Base</p>
                <p className="text-xs text-gray-500">Manage accounts</p>
              </Link>
            )}
            <Link to="/admin/listings" className="p-4 bg-green-50 rounded-2xl border border-green-100 hover:shadow-md transition-all">
              <div className="text-2xl mb-2 flex justify-center text-green-600"><IoRestaurantOutline /></div>
              <p className="font-bold text-gray-900">Listings</p>
              <p className="text-xs text-gray-500">Platform inventory</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity / System Status */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
           <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><IoPlanetOutline className="text-blue-500" /> System Status</h2>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">API Server</span>
                 </div>
                 <span className="text-xs font-bold text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">Database</span>
                 </div>
                 <span className="text-xs font-bold text-green-600">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">Storage Bucket</span>
                 </div>
                 <span className="text-xs font-bold text-green-600">Connected</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const style = `
  @keyframes alert-pulse {
    0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
    100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
  }
  .animate-alert {
    animation: alert-pulse 2s infinite;
  }
`;

if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.innerHTML = style;
  document.head.appendChild(s);
}
