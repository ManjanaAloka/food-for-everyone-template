import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../state/auth';
import { GOOGLE_MAPS_API_KEY } from '../../env';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];

export function CustomerAnalyticsPage() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: analytics, isLoading } = useQuery({ 
    queryKey: ['customerAnalytics', fromDate, toDate], 
    queryFn: async () => (await api.get('/reports/customer', { params: { from: fromDate, to: toDate } })).data
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  const stats = [
    { label: 'Orders Completed', value: analytics?.ordersCount || 0, icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'Money Saved', value: `LKR ${analytics?.moneySaved?.toLocaleString() || 0}`, icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Food Saved (kg)', value: analytics?.foodSavedKg || 0, icon: '🍽️', color: 'bg-green-50 text-green-600' },
    { label: 'CO2 Avoided (kg)', value: analytics?.co2eAvoidedKg || 0, icon: '🌿', color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span className="text-4xl">📈</span> Customer Analytics
          </h1>
          <p className="text-gray-500 font-medium">Deep dive into your food rescuing habits and environmental impact.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none"
          />
          <span className="text-gray-300 font-bold">→</span>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none"
          />
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">✕</button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-900/5 transition-all">
            <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner`}>
              {s.icon}
            </div>
            <p className="text-3xl font-black text-gray-900">{s.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Savings Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm min-h-[450px] flex flex-col">
          <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
            <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-sm">📈</span>
            Savings Trend (LKR)
          </h2>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <AreaChart data={analytics?.trends}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm min-h-[450px] flex flex-col">
          <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
             <span className="w-8 h-8 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center text-sm">🍕</span>
             Categories
          </h2>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
              <PieChart>
                <Pie
                  data={analytics?.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {analytics?.categories?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {analytics?.categories?.map((cat: any, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Heatmap Section */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
           <span className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-sm">📍</span>
           Food Rescue Heatmap
        </h2>
        {isLoaded ? (
          <div className="h-96 w-full rounded-3xl overflow-hidden border border-gray-100">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={analytics?.locations?.[0] ? { lat: analytics.locations[0].lat, lng: analytics.locations[0].lng } : { lat: 6.9271, lng: 79.8612 }}
              zoom={12}
              options={{
                styles: [{ featureType: 'all', elementType: 'all', stylers: [{ saturation: -100 }] }],
                disableDefaultUI: true,
                zoomControl: true
              }}
            >
              {analytics?.locations?.map((loc: any, idx: number) => (
                <MarkerF 
                  key={idx} 
                  position={{ lat: loc.lat, lng: loc.lng }}
                  title={loc.businessName}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                    fillColor: '#10b981',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 2,
                    anchor: { x: 12, y: 22 } as any
                  }}
                />
              ))}
            </GoogleMap>
          </div>
        ) : (
          <div className="h-96 w-full bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 font-bold uppercase text-xs tracking-widest">
            Loading Map...
          </div>
        )}
        <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
          Visualizing the impact of your orders across {analytics?.locations?.length || 0} locations.
        </p>
      </div>
    </div>
  );
}
