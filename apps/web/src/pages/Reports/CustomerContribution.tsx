import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

export function CustomerContributionPage() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, refetch } = useQuery({ 
    queryKey: ['customerReport', fromDate, toDate], 
    queryFn: async () => (await api.get('/reports/customer', { params: { from: fromDate, to: toDate } })).data 
  });

  if (isLoading) return <div className="p-8 text-center">Loading your contribution...</div>;

  const stats = [
    { label: 'Orders Completed', value: data?.ordersCount || 0, icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Food Saved (kg)', value: data?.foodSavedKg || 0, icon: '🍽️', color: 'bg-green-50 text-green-600' },
    { label: 'Total Donations (LKR)', value: data?.totalDonationsAmount || 0, icon: '💝', color: 'bg-pink-50 text-pink-600' },
    { label: 'Money Saved (LKR)', value: data?.moneySaved || 0, icon: '💰', color: 'bg-yellow-50 text-yellow-600' },
  ];

  const financialData = [
    { name: 'Total Donations', amount: data?.totalDonationsAmount || 0, fill: '#ec4899' },
    { name: 'Money Saved', amount: data?.moneySaved || 0, fill: '#f59e0b' },
  ];

  const physicalData = [
    { name: 'Food Saved (kg)', value: data?.foodSavedKg || 0, fill: '#10b981' },
    { name: 'CO2e Avoided (kg)', value: data?.co2eAvoidedKg || 0, fill: '#14b8a6' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn mb-20">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl print:shadow-none">
        <h1 className="text-3xl font-bold mb-2">My Contribution 🌍</h1>
        <p className="text-green-100 opacity-90">Thank you, {user?.name}, for being a sustainability hero!</p>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-end gap-4 print:hidden">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">From Date</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">To Date</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => { setFromDate(''); setToDate(''); }}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
        >
          Reset
        </button>
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span>📥</span> Download Report (PDF)
        </button>
      </div>

      {/* Print-only Report Header */}
      <div className="hidden print:block mb-10 text-center border-b pb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">FOOD FOR EVERYONE</h1>
        <h2 className="text-xl font-semibold text-gray-600 uppercase tracking-widest">Sustainability Impact Report</h2>
        <p className="text-sm text-gray-500 mt-4">Report for: <span className="font-bold text-gray-900">{user?.name}</span></p>
        {(fromDate || toDate) && <p className="text-sm text-gray-500">Period: {fromDate || 'Start'} to {toDate || 'Today'}</p>}
        <p className="text-xs text-gray-400 mt-1">Generated on {new Date().toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow print:border-gray-300">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-inner print:hidden`}>
              {s.icon}
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">{s.value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-8 print:mt-10">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm print:border-gray-300">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>📊</span> Financial Contribution (LKR)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm print:border-gray-300">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>📈</span> Impact Metrics (kg)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 print:grid-cols-1 print:mt-10">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm print:border-gray-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>✨</span> Environmental Impact
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            By rescuing surplus food, you've prevented approximately <strong>{data?.co2eAvoidedKg}kg</strong> of CO2 equivalent from entering the atmosphere. That's like planting several trees!
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm print:border-gray-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>❤️</span> Social Impact
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            You've participated in <strong>{data?.donationCount || 0}</strong> donation-based transactions, helping ensure food security in your community.
          </p>
        </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-20 pt-8 border-t text-center">
        <p className="text-sm font-bold text-green-700">Together, we are making a difference.</p>
        <p className="text-xs text-gray-400 mt-1">www.foodforeveryone.lk</p>
      </div>
    </div>
  );
}
