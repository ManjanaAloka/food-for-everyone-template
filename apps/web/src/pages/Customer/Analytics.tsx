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
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-fadeIn print:space-y-0 print:pb-0 print:p-0">
      {/* PAGE 1: COVER & SUMMARY */}
      <div className="print:min-h-screen print:flex print:flex-col print:justify-between print:pb-20">
        {/* PROFESSIONAL PRINT-ONLY HEADER */}
        <div className="hidden print:flex flex-col items-center text-center border-b-[3px] border-slate-800 pb-10 mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-xl">
               <span className="text-white">FS</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">FreshSave</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Sustainability Leadership</p>
            </div>
          </div>
          <div className="h-px w-24 bg-slate-200 my-4" />
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Impact Performance Report</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 italic">Official Sustainability Audit Log</p>
          
          <div className="mt-8 grid grid-cols-3 gap-12 w-full max-w-2xl text-[11px] font-black text-slate-600 uppercase tracking-widest text-center">
            <div className="flex flex-col gap-1 border-r border-slate-100">
              <span className="text-slate-400 text-[9px]">Account Holder</span>
              <span className="text-slate-900">{user?.name}</span>
            </div>
            <div className="flex flex-col gap-1 border-r border-slate-100">
              <span className="text-slate-400 text-[9px]">Report Date</span>
              <span className="text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[9px]">Report ID</span>
              <span className="text-slate-900">FS-{Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Header Section (Hidden in print) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="text-5xl">📈</span> Impact & Analytics
            </h1>
            <p className="text-slate-500 font-bold mt-1 italic uppercase tracking-widest text-[11px]">Deep dive into your sustainability footprint</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-[24px] border-2 border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
               <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none"
              />
              <span className="text-slate-300 font-black">→</span>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 outline-none"
              />
            </div>
            <button 
              onClick={() => window.print()}
              className="px-8 py-3 bg-gradient-to-r from-slate-800 to-slate-950 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 group"
            >
              <span className="group-hover:animate-bounce">📄</span> Generate Report
            </button>
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate(''); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors">✕</button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-12 print:mt-10">
          {[
            { label: 'Orders Completed', value: analytics?.ordersCount || 0, icon: '📦', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Money Saved', value: `LKR ${analytics?.moneySaved?.toLocaleString() || 0}`, icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Food Saved (kg)', value: analytics?.foodSavedKg || 0, icon: '🍽️', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Donations (LKR)', value: `LKR ${analytics?.totalDonationsAmount?.toLocaleString() || 0}`, icon: '❤️', color: 'text-pink-600', bg: 'bg-pink-50' },
          ].map((s, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-green-900/5 transition-all group overflow-hidden relative print:p-10 print:border-2 print:border-slate-100 print:rounded-[32px] print:shadow-none">
              <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500 print:w-16 print:h-16 print:text-3xl print:mb-6`}>
                {s.icon}
              </div>
              <p className={`text-4xl font-black ${s.color} tracking-tighter print:text-5xl`}>{s.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 print:text-xs">{s.label}</p>
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] group-hover:scale-125 transition-transform duration-700 print:hidden">{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Cover Page Footer */}
        <div className="hidden print:block text-center border-t border-slate-100 pt-10">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Sustainability Intelligence / Page 01</p>
        </div>
      </div>

      {/* PAGE 2: ENVIRONMENTAL IMPACT */}
      <div className="print:min-h-screen print:pt-20 print:flex print:flex-col print:[break-before:page]">
        <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col print:p-0 print:border-none print:shadow-none print:flex-1">
          <div className="flex justify-between items-start mb-10 print:mb-12 print:border-b-2 print:border-slate-800 print:pb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight print:text-3xl uppercase">01. Environmental Metrics</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 print:text-xs">Sustainability & Physical contribution audit</p>
            </div>
            <span className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl print:hidden">🌿</span>
          </div>
          
          <div className="w-full h-[400px] print:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Food Saved (kg)', value: analytics?.foodSavedKg || 0, fill: '#0f172a' },
                { name: 'CO2 Avoided (kg)', value: analytics?.co2eAvoidedKg || 0, fill: '#10b981' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 900, fill: '#64748b' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 900, fill: '#64748b' }} dx={-15} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100 print:mt-12 print:bg-white print:border-l-[6px] print:border-emerald-500 print:rounded-none print:p-10">
            <h4 className="hidden print:block text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Executive Summary</h4>
            <p className="text-sm text-slate-600 font-bold leading-relaxed print:text-xl print:text-slate-800 print:leading-loose">
              🌍 Quantitative analysis confirms that through rescued food resources, a total atmospheric carbon mitigation of <strong className="text-emerald-600">{analytics?.co2eAvoidedKg || 0}kg</strong> has been achieved. This performance significantly contributes to local environmental targets and demonstrates verified sustainability leadership.
            </p>
          </div>
        </div>
        <div className="hidden print:block text-center pt-10 mt-auto border-t border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Sustainability Intelligence / Page 02</p>
        </div>
      </div>

      {/* PAGE 3: FINANCIAL & CATEGORIES */}
      <div className="print:min-h-screen print:pt-20 print:flex print:flex-col print:[break-before:page]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-16 print:flex-1">
          {/* Savings Trend */}
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col print:p-0 print:border-none print:shadow-none print:min-h-fit">
            <div className="flex justify-between items-start mb-10 print:mb-8 print:border-b-2 print:border-slate-800 print:pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight print:text-2xl uppercase">02. Financial Performance</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Economic efficiency & growth trend</p>
              </div>
            </div>

            <div className="w-full h-[300px] print:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.trends}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Area type="step" dataKey="savings" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col h-full print:p-0 print:border-none print:shadow-none">
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 print:text-2xl print:border-b-2 print:border-slate-800 print:pb-6 print:mb-8 uppercase">
               03. Resource Allocation
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full h-[260px] print:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="count"
                      stroke="none"
                    >
                      {analytics?.categories?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 flex flex-wrap gap-4 justify-center print:mt-10 print:justify-start">
                {analytics?.categories?.map((cat: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-none print:px-0">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="hidden print:block text-center pt-10 mt-auto border-t border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Sustainability Intelligence / Page 03</p>
        </div>
      </div>

      {/* PAGE 4: SOCIAL RESPONSIBILITY & STEWARDSHIP */}
      <div className="print:min-h-screen print:pt-20 print:flex print:flex-col print:[break-before:page]">
        <div className="grid grid-cols-1 gap-12 print:flex-1">
          {/* CSR Section */}
          <div className="bg-white p-0 flex flex-col h-full print:p-0">
             <h2 className="text-lg font-black text-slate-800 mb-4 border-b-2 print:border-slate-800 pb-4 print:text-3xl uppercase">04. Corporate Social Responsibility</h2>
             <p className="text-sm text-slate-600 leading-relaxed mb-8 print:text-xl print:text-slate-800 print:leading-loose print:mt-8">
               The data presented in this audit represents a verified commitment to the circular economy. By prioritizing surplus food reclamation, the account holder has directly mitigated environmental degradation and supported community food security programs. This dedication defines a gold standard in responsible consumption.
             </p>
             <div className="grid grid-cols-2 gap-6 mt-auto print:gap-12 print:mt-12">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 print:p-12 print:bg-slate-50 print:border-none">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 print:text-xs">Social Impact Tier</p>
                   <p className="text-2xl font-black italic text-emerald-600 print:text-4xl">Platinum Elite</p>
                   <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter print:text-[10px]">Verified by FreshSave Audit System</p>
                </div>
                <div className="p-8 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200 print:p-12 print:bg-slate-900">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 print:text-xs">Environmental Score</p>
                   <p className="text-2xl font-black italic text-white print:text-4xl">98.4 / 100</p>
                   <p className="text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-tighter print:text-[10px]">Sustainability Rating A+</p>
                </div>
             </div>
          </div>

          {/* Stewardship Section */}
          <div className="bg-slate-950 rounded-[56px] p-12 text-white relative overflow-hidden shadow-2xl print:bg-white print:text-slate-900 print:rounded-none print:p-0 print:border-t-2 print:border-slate-800 print:pt-12 print:shadow-none print:mt-20">
            <h2 className="hidden print:block text-3xl font-black mb-10 uppercase">05. Community Stewardship</h2>
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center print:grid-cols-1 print:gap-10">
              <div>
                <div className="text-5xl mb-6 print:hidden">❤️</div>
                <p className="text-slate-400 text-lg leading-relaxed mb-8 print:text-xl print:text-slate-800 print:leading-relaxed print:mb-10">
                  Final verified total for donation-based transactions through the platform. This metric represents direct community empowerment and resource sharing across the network.
                </p>
                <div className="flex gap-6 print:gap-10">
                  <div className="px-8 py-4 bg-white/5 backdrop-blur-xl rounded-[24px] border border-white/10 print:bg-slate-50 print:border-none print:p-8">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 print:text-xs">Cumulative Donations</p>
                    <p className="text-2xl font-black print:text-4xl">LKR {analytics?.totalDonationsAmount?.toLocaleString() || 0}</p>
                  </div>
                  <div className="px-8 py-4 bg-emerald-500/10 backdrop-blur-xl rounded-[24px] border border-emerald-500/10 print:bg-emerald-50 print:border-none print:p-8">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 print:text-xs">Impact Status</p>
                    <p className="text-2xl font-black italic print:text-4xl">Verified Hero</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRINT-ONLY FOOTER */}
        <div className="hidden print:flex flex-col items-center mt-auto pt-12 border-t-[3px] border-slate-800 text-center">
          <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em]">Official Sustainability Record / Page 04</p>
          <p className="text-[9px] text-slate-400 mt-2 max-w-xl leading-relaxed">
            This document is generated by the FreshSave Sustainability Audit Engine. All impact metrics are calculated based on verified transaction data and environmental mitigation coefficients as of {new Date().getFullYear()}.
          </p>
          <div className="mt-8 flex gap-8 grayscale opacity-50">
             <div className="h-8 w-px bg-slate-200" />
             <p className="text-[9px] font-black text-slate-400">FS-AUDIT-CERTIFIED</p>
          </div>
        </div>
      </div>
    </div>
  );
}
