'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  ArrowUpRight, AlertCircle, RefreshCw, Activity, TrendingUp,
  ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

// Custom Human-made Monospace Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 shadow-2xl font-mono text-[10px]">
        <p className="text-zinc-500 mb-2 border-b border-zinc-850 pb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ color: p.color }} className="font-semibold py-0.5">
            {p.name}: {p.name.includes('Rate') ? `${p.value}%` : `₹${Math.round(p.value).toLocaleString('en-IN')}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [segment, setSegment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - parseInt(timeRange, 10));

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', start.toISOString().split('T')[0]);
      queryParams.append('endDate', now.toISOString().split('T')[0]);
      if (paymentMethod) queryParams.append('paymentMethod', paymentMethod);
      if (segment) queryParams.append('customerSegment', segment);

      const res = await fetch(`/api/dashboard?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve dashboard analytics');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, paymentMethod, segment]);

  // Premium silver and warm-gold design colors
  const colors = {
    primary: '#f59e0b', // Amber-Gold
    success: '#10b981', // Sage Emerald
    failed: '#f43f5e',  // Rust Tomato
    purple: '#a1a1aa',  // Matte Silver
    neutral: '#27272a',
  };

  const paymentMethodColors: { [key: string]: string } = {
    UPI: '#a1a1aa', // Silver
    CARD: '#71717a', // Slate
    NETBANKING: '#52525b', // Dark Slate
    WALLET: '#27272a', // Charcoal
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mb-3" />
        <p className="text-xs font-mono tracking-wider">LOADING PAYMENT DATASTREAM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 p-6">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Failed to Load Dashboard</h3>
        <p className="text-zinc-500 text-xs text-center max-w-sm mb-6">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:border-zinc-700 text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, paymentMethods, failureReasons, hourlyPerformance, dailyTrend } = data;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header Panel */}
      <header className="px-8 py-7 bg-zinc-900/40 border-b border-zinc-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Payments Health Overview</h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">DETERMINISTIC ANALYTICS FEED • MERCHANT DEMO PLATFORM</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono"
            >
              <option value="7">Last 7d</option>
              <option value="14">Last 14d</option>
              <option value="30">Last 30d</option>
            </select>
          </div>

          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono"
            >
              <option value="">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Cards</option>
              <option value="NETBANKING">Netbanking</option>
              <option value="WALLET">Wallets</option>
            </select>
          </div>

          <div>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono"
            >
              <option value="">All Segments</option>
              <option value="SMB">SMB</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <button 
            onClick={fetchDashboardData}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg hover:text-white transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Analytics Summary - Top Border Plates (Vercel Style) */}
      <section className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        {/* Total attempted volume */}
        <div className="bg-zinc-900/50 border border-zinc-900 border-t-2 border-t-zinc-600 rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Attempted GMV</span>
          <div className="mt-3">
            <h3 className="text-base font-bold text-white tracking-tight">₹{summary.totalVolume.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">{summary.transactionCount.toLocaleString()} orders</p>
          </div>
        </div>

        {/* Realized Volume */}
        <div className="bg-zinc-900/50 border border-zinc-900 border-t-2 border-t-emerald-500 rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Successful GMV</span>
          <div className="mt-3">
            <h3 className="text-base font-bold text-emerald-400 tracking-tight">₹{summary.successfulVolume.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">{summary.successfulCount.toLocaleString()} successful</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-zinc-900/50 border border-zinc-900 border-t-2 border-t-zinc-400 rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Success Rate</span>
          <div className="mt-3">
            <h3 className="text-xl font-black text-white tracking-tighter">{summary.successRate}%</h3>
            <div className="w-full bg-zinc-850 rounded-full h-1 mt-2.5 overflow-hidden">
              <div 
                className="bg-zinc-400 h-1 rounded-full" 
                style={{ width: `${summary.successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Failed Volume */}
        <div className="bg-zinc-900/50 border border-zinc-900 border-t-2 border-t-rose-500 rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Failed Volume</span>
          <div className="mt-3">
            <h3 className="text-base font-bold text-rose-400 tracking-tight">₹{summary.failedVolume.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">{summary.failedCount.toLocaleString()} failures</p>
          </div>
        </div>

        {/* ATV */}
        <div className="bg-zinc-900/50 border border-zinc-900 border-t-2 border-t-zinc-700 rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Avg Order Value</span>
          <div className="mt-3">
            <h3 className="text-base font-bold text-white tracking-tight">₹{summary.averageTransactionValue.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">Median: ₹{summary.medianTransactionValue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Potential Revenue Opportunity (Gold Glowing Plate) */}
        <div className="border border-amber-500/10 bg-amber-500/[0.02] rounded-lg p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Revenue leak</span>
          <div className="mt-3 z-10">
            <h3 className="text-base font-extrabold text-amber-500 tracking-tight">₹{summary.potentialRevenueOpportunity.toLocaleString('en-IN')}</h3>
            <Link 
              href="/opportunities" 
              className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-amber-400 hover:text-amber-300 mt-2 transition-colors uppercase tracking-wider"
            >
              Analyze Opportunity <ArrowUpRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realized Volume Area Chart (2 columns wide) */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 lg:col-span-2 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white">Daily Realized Volume & Performance</h3>
            <p className="text-[9px] font-mono text-zinc-500 mt-0.5">MONITORING REVENUE VELOCITY AND TRANSACTION GATEWAY DYNAMICS</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={8} 
                  fontFamily="monospace"
                  tickLine={false}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                />
                <YAxis yAxisId="left" stroke="#475569" fontSize={8} fontFamily="monospace" tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={8} fontFamily="monospace" tickLine={false} domain={[50, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="volume" name="GMV (₹)" stroke={colors.primary} fillOpacity={1} fill="url(#gmvGradient)" strokeWidth={1.5} />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate (%)" stroke={colors.purple} strokeWidth={1.5} dot={false} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', paddingTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Reason Breakdown (Handcrafted Progress Bars) */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Transactional Failure Distribution</h3>
            <p className="text-[9px] font-mono text-zinc-500 mb-6 uppercase">Root failure reasons aggregated across filters</p>
            
            {failureReasons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-700">
                <ShieldCheck className="w-8 h-8 text-zinc-800 mb-2" />
                <p className="text-[10px] font-mono uppercase">All gateways are operating healthy.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {failureReasons.slice(0, 5).map((f: any, idx: number) => {
                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-zinc-300 font-mono text-[10px]">{f.reason}</span>
                        <span className="text-[9px] font-mono text-zinc-500">{f.count.toLocaleString()} ({f.percentage}%)</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                        <div 
                          className={`h-1 rounded-full ${
                            f.reason === 'BANK_DEGRADED' ? 'bg-rose-500' :
                            f.reason === 'INSUFFICIENT_FUNDS' ? 'bg-zinc-400' :
                            'bg-zinc-700'
                          }`}
                          style={{ width: `${f.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span>Primary error: <b className="text-rose-400">BANK_DEGRADED</b></span>
            <Link href="/agent" className="text-amber-500 font-semibold hover:underline flex items-center gap-0.5">
              Run Diagnostics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hourly and Payment Method Grid */}
      <section className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly success rates (UPI Peak degradation) */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 shadow-sm flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-white">Hourly Success Rate Distribution</h3>
            <p className="text-[9px] font-mono text-zinc-500 mb-6 uppercase">Detects recurrent bank node congestion spikes</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyPerformance} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" fontSize={8} fontFamily="monospace" tickLine={false} tickFormatter={(val) => `${val}h`} />
                <YAxis stroke="#475569" fontSize={8} fontFamily="monospace" tickLine={false} domain={[60, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="successRate" name="Success Rate (%)" stroke={colors.primary} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method success rates bar chart */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 shadow-sm flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-white">Performance by Payment Method</h3>
            <p className="text-[9px] font-mono text-zinc-500 mb-6 uppercase">Successful conversion rate by checkout method</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethods} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="method" stroke="#475569" fontSize={8} fontFamily="monospace" tickLine={false} />
                <YAxis stroke="#475569" fontSize={8} fontFamily="monospace" tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="successRate" name="Success Rate (%)" fill={colors.primary} radius={[2, 2, 0, 0]} barSize={32}>
                  {paymentMethods.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={paymentMethodColors[entry.method] || colors.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
