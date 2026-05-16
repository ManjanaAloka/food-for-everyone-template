import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { IoRestaurantOutline, IoEarthOutline, IoCashOutline, IoHeartOutline, IoBagHandleOutline, IoLeafOutline } from 'react-icons/io5';
import { HiHand } from 'react-icons/hi';

export function CustomerDashboardPage() {
  const { user } = useAuth();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({ 
    queryKey: ['customerStats'], 
    queryFn: async () => (await api.get('/reports/customer')).data
  });

  // Fetch recent orders
  const ordersQ = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => (await api.get('/orders/me', { params: { limit: 5 } })).data
  });

  // Fetch recent donations
  const donationsQ = useQuery({
    queryKey: ['recentDonations'],
    queryFn: async () => (await api.get('/donations/my/history')).data
  });

  const isLoading = statsLoading || ordersQ.isLoading || donationsQ.isLoading;

  const combinedActivity = useMemo(() => {
    const orders = (ordersQ.data?.orders || []).map((o: any) => ({ ...o, activityType: 'ORDER' }));
    const donations = (donationsQ.data?.donations || []).map((d: any) => ({ ...d, activityType: 'DONATION' }));
    
    return [...orders, ...donations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [ordersQ.data, donationsQ.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const impactCards = [
    { label: 'Meals Saved', value: stats?.ordersCount || 0, icon: <IoRestaurantOutline />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Food Saved', value: `${stats?.foodSavedKg || 0} kg`, icon: <IoEarthOutline />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Money Saved', value: `LKR ${stats?.moneySaved?.toLocaleString() || 0}`, icon: <IoCashOutline />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Donations', value: `LKR ${stats?.totalDonationsAmount?.toLocaleString() || 0}`, icon: <IoHeartOutline />, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-800 rounded-[40px] p-10 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            Ayubowan, {user?.name}! <HiHand className="text-green-300 animate-bounce" />
          </h1>
          <p className="text-green-100 font-medium opacity-90 max-w-lg">
            You're making a real difference. Every meal you rescue helps reduce food waste and feed our community.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/browse" className="bg-white text-green-700 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-50 transition-all">
              Rescue Food
            </Link>
            <Link to="/give-back" className="bg-green-500/30 backdrop-blur-md text-white border border-white/20 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500/40 transition-all">
              Donate Now
            </Link>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {impactCards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-900/5 transition-all">
            <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner`}>
              {card.icon}
            </div>
            <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-900">Recent Activity</h2>
            <Link to="/orders" className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {combinedActivity.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No activity yet</p>
              </div>
            ) : (
              combinedActivity.map((act: any) => {
                const isOrder = act.activityType === 'ORDER';
                const linkTo = isOrder ? `/orders/${act.id}` : `/give-back`;
                const title = isOrder ? (act.items?.[0]?.listing?.title || 'Food Order') : (act.donationRequest?.title || 'Monetary Donation');
                const icon = isOrder ? <IoBagHandleOutline className="text-green-600" /> : <IoHeartOutline className="text-green-600" />;
                const status = isOrder ? act.status : 'DONATED';
                const statusColor = isOrder 
                  ? (act.status === 'DELIVERED' || act.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600')
                  : 'bg-pink-100 text-pink-600';

                return (
                  <Link 
                    key={act.id} 
                    to={linkTo}
                    className="flex items-center justify-between p-6 rounded-3xl border border-gray-50 hover:bg-gray-50/50 hover:border-green-100 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {icon}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 line-clamp-1">{title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(act.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">LKR {Number(act.amount || act.total).toLocaleString()}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor}`}>
                        {status}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Environmental Impact Box */}
        <div className="bg-emerald-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 text-green-400 border border-green-500/20">
              <IoLeafOutline />
            </div>
            <h2 className="text-2xl font-black mb-4">Planet Impact</h2>
            <p className="text-emerald-200 text-sm leading-relaxed mb-8">
              By rescuing surplus food, you've prevented approximately <strong className="text-white text-lg">{stats?.co2eAvoidedKg || 0}kg</strong> of CO2 equivalent from being released into the atmosphere.
            </p>
            <div className="p-6 bg-emerald-800/50 backdrop-blur-md rounded-3xl border border-emerald-700/50">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Sustainability Tier</p>
               <p className="text-xl font-black italic">Eco Hero Level 1</p>
            </div>
          </div>
          
          <div className="absolute bottom-[-10%] right-[-10%] text-9xl opacity-10 text-green-400">
            <IoEarthOutline />
          </div>
        </div>
      </div>
    </div>
  );
}
