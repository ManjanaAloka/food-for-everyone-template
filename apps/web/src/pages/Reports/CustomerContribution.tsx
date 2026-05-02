import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';

export function CustomerContributionPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ 
    queryKey: ['customerReport'], 
    queryFn: async () => (await api.get('/reports/customer')).data 
  });

  if (isLoading) return <div className="p-8 text-center">Loading your contribution...</div>;

  const stats = [
    { label: 'Orders Completed', value: data?.ordersCount || 0, icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Food Saved (kg)', value: data?.foodSavedKg || 0, icon: '🍽️', color: 'bg-green-50 text-green-600' },
    { label: 'CO2e Avoided (kg)', value: data?.co2eAvoidedKg || 0, icon: '🌱', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Money Saved (LKR)', value: data?.moneySaved || 0, icon: '💰', color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">My Contribution 🌍</h1>
        <p className="text-green-100 opacity-90">Thank you, {user?.name}, for being a sustainability hero!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-inner`}>
              {s.icon}
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">{s.value}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>✨</span> Environmental Impact
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            By rescuing surplus food, you've prevented approximately <strong>{data?.co2eAvoidedKg}kg</strong> of CO2 equivalent from entering the atmosphere. That's like planting several trees!
          </p>
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
             <p className="text-sm text-green-800 font-medium italic">
               "Small acts, when multiplied by millions of people, can transform the world."
             </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>❤️</span> Social Impact
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            You've participated in <strong>{data?.donationCount || 0}</strong> donation-based transactions, helping ensure food security in your community.
          </p>
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
             <p className="text-sm text-orange-800 font-medium">
               Your support helps local businesses stay sustainable while helping those in need.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
