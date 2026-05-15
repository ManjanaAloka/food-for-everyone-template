import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];

export function ProviderAnalyticsPage() {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [viewMode, setViewMode] = useState<'summary' | 'charts'>('summary');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const analyticsQ = useQuery({
    queryKey: ['providerAnalytics', dateRange, selectedListingId],
    queryFn: async () => (await api.get('/reports/provider', { 
      params: { ...dateRange, listingId: selectedListingId || undefined } 
    })).data
  });

  const data = analyticsQ.data;
  const selectedItemName = data?.topSellingItems?.find((i: any) => i.id === selectedListingId)?.title;

  const soldCount = data?.totalItemsSold || 0;
  const limit = 50;
  const progress = Math.min((soldCount / limit) * 100, 100);
  const isOverLimit = soldCount >= limit;

  return (
    <div className="space-y-8 pb-10">
       {/* Header with Toggle */}
       <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 flex flex-col xl:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Business Intelligence</h1>
              {selectedListingId && (
                <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  Filtered by: {selectedItemName || 'Item'}
                  <button onClick={() => setSelectedListingId(null)} className="hover:text-orange-800">✕</button>
                </span>
              )}
            </div>
            <p className="text-gray-500 font-medium">Deep insights into your sales performance</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-2 rounded-[28px] border border-gray-100">
             <button 
               onClick={() => setViewMode('summary')}
               className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-white text-green-600 shadow-xl shadow-green-900/5' : 'text-gray-400 hover:text-gray-600'}`}
             >
               📋 Summary
             </button>
             <button 
               onClick={() => setViewMode('charts')}
               className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'charts' ? 'bg-white text-blue-600 shadow-xl shadow-blue-900/5' : 'text-gray-400 hover:text-gray-600'}`}
             >
               📊 Chart Mode
             </button>
          </div>

          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Range</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={dateRange.from}
                  onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-4 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-green-500/10"
                />
                <input 
                  type="date" 
                  value={dateRange.to}
                  onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-4 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-green-500/10"
                />
              </div>
            </div>
            <button 
              onClick={() => { setDateRange({ from: '', to: '' }); setSelectedListingId(null); }}
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all h-[46px]"
            >
              Reset
            </button>
          </div>
       </div>

       {analyticsQ.isLoading ? (
          <div className="p-20 text-center animate-pulse">
            <p className="text-2xl font-black text-gray-200 uppercase tracking-[0.4em]">Loading Intelligence...</p>
          </div>
       ) : (
         <>
           {/* Tier Status & Commission Card */}
           <div className={`p-8 rounded-[40px] border transition-all ${isOverLimit ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                 <div className="space-y-2 text-center lg:text-left">
                    <h3 className={`text-xl font-black ${isOverLimit ? 'text-orange-900' : 'text-emerald-900'}`}>
                       {isOverLimit ? '🚀 Professional Tier' : '🌟 Free Tier'}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 max-w-md">
                       {isOverLimit 
                         ? 'You have exceeded 50 sales! A 2% commission now applies to support the platform.' 
                         : `Sell ${limit - soldCount} more items for free before the 2% platform commission starts.`}
                    </p>
                 </div>
                 
                 <div className="flex-1 w-full max-w-lg space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                       <span>{soldCount} items sold</span>
                       <span>Tier Limit: {limit}</span>
                    </div>
                    <div className="h-4 bg-white rounded-full overflow-hidden border border-gray-100 p-1">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${isOverLimit ? 'bg-orange-500' : 'bg-emerald-500'}`}
                         style={{ width: `${progress}%` }}
                       ></div>
                    </div>
                 </div>

                 <div className="bg-white px-8 py-6 rounded-[32px] shadow-sm border border-gray-100 text-center min-w-[200px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission Paid</p>
                    <p className="text-2xl font-black text-gray-900">LKR {data?.totalCommission?.toLocaleString()}</p>
                 </div>
              </div>
           </div>

           {/* Summary Stats */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Revenue', value: `LKR ${data?.totalRevenue?.toLocaleString()}`, color: 'text-green-600', icon: '💰' },
                { label: 'Orders', value: data?.ordersCount, color: 'text-blue-600', icon: '📦' },
                { label: 'Food Saved', value: `${data?.foodSavedKg} kg`, color: 'text-emerald-600', icon: '🌍' },
                { label: 'Donations', value: data?.donationCount, color: 'text-indigo-600', icon: '🤝' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                   </div>
                   <p className={`text-3xl font-black ${stat.color}`}>{stat.value || 0}</p>
                </div>
              ))}
           </div>

           {viewMode === 'summary' ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Items Table */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">Top Products</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Click to deep filter</p>
                   </div>
                   <div className="space-y-4">
                      {data?.topSellingItems?.map((item: any, i: number) => (
                         <div 
                           key={i} 
                           onClick={() => setSelectedListingId(item.id)}
                           className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer group ${selectedListingId === item.id ? 'bg-orange-50 border-orange-200 shadow-lg' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-green-900/5'}`}
                         >
                            <div>
                              <p className="font-black text-gray-900 group-hover:text-green-600 transition-colors">{item.title}</p>
                              <p className="text-[10px] font-bold text-orange-500 uppercase">Peak: {item.peakDay}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-gray-900">{item.qty} units</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">LKR {item.revenue?.toLocaleString()}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Location Distribution */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                   <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">Popular Locations</h3>
                   <div className="space-y-6 pt-4">
                      {data?.topLocations?.map((loc: any, i: number) => (
                         <div key={i} className="space-y-2">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-600">
                               <span>{loc.city}</span>
                               <span>{loc.count} orders</span>
                            </div>
                            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(loc.count / (data.ordersCount || 1)) * 100}%` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : (
             /* Chart Mode View */
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Main Revenue Chart */}
                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-green-900/5">
                   <h3 className="text-2xl font-black text-gray-900 mb-12 flex items-center gap-3">
                     <span className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-xl">📈</span>
                     {selectedListingId ? `Revenue Trend: ${selectedItemName}` : 'Store-wide Revenue Performance'}
                   </h3>
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.salesByDay}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#9CA3AF'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#9CA3AF'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                            itemStyle={{ fontWeight: 900, color: '#10B981' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
           )}
         </>
       )}
    </div>
  );
}
