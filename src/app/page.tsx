'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  ArrowUpRight, AlertCircle, RefreshCw, Layers, DollarSign, CheckCircle, 
  XCircle, Users, Activity, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30'); // '7', '14', '30'
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

  // Color constants for charts
  const colors = {
    primary: '#71717a', // Indigo
    success: '#10b981', // Emerald
    failed: '#ef4444', // Rose
    warning: '#f59e0b', // Amber
    neutral: '#94a3b8', // Slate
    purple: '#d4d4d8', // Violet
  };

  const paymentMethodColors: { [key: string]: string } = {
    UPI: '#52525b',
    CARD: '#10b981',
    NETBANKING: '#ef4444',
    WALLET: '#f59e0b',
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 text-zinc-400">
        <RefreshCw className="w-10 h-10 animate-spin text-zinc-400 mb-4" />
        <p className="text-sm font-medium">Assembling payment intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 p-6">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Failed to Load Dashboard</h3>
        <p className="text-zinc-400 text-sm text-center max-w-md mb-6">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg hover:bg-zinc-700 text-sm font-medium transition-colors"
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
      <header className="px-8 py-6 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Growth Dashboard</h1>
          <p className="text-xs text-zinc-400">Deterministic transaction diagnostics and real-time growth analytics.</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time range */}
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          {/* Payment method */}
          <div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Cards</option>
              <option value="NETBANKING">Netbanking</option>
              <option value="WALLET">Wallets</option>
            </select>
          </div>

          {/* Customer segment */}
          <div>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Segments</option>
              <option value="SMB">SMB Customers</option>
              <option value="Mid-Market">Mid-Market Customers</option>
              <option value="Enterprise">Enterprise Customers</option>
            </select>
          </div>

          <button 
            onClick={fetchDashboardData}
            className="p-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:text-white transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Analytics Summary KPI Cards */}
      <section className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {/* Total attempted volume */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400">Total Volume</span>
            <DollarSign className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-white">₹{summary.totalVolume.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">{summary.transactionCount.toLocaleString()} transactions</p>
          </div>
        </div>

        {/* Realized Volume */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400">Successful GMV</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-emerald-400">₹{summary.successfulVolume.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">{summary.successfulCount.toLocaleString()} successful</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400">Success Rate</span>
            <Activity className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">{summary.successRate}%</h3>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-zinc-600 h-1.5 rounded-full" 
                style={{ width: `${summary.successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Failed Volume */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400">Failed Volume</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-rose-400">₹{summary.failedVolume.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">{summary.failedCount.toLocaleString()} failures</p>
          </div>
        </div>

        {/* ATV */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-400">Avg Ticket Size</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold text-white">₹{summary.averageTransactionValue.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Median: ₹{summary.medianTransactionValue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Potential Revenue Opportunity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-600/5 rounded-full blur-xl group-hover:bg-zinc-700 hover:text-white/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-zinc-200">Revenue Opportunity</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          </div>
          <div className="mt-4 z-10">
            <h3 className="text-lg font-extrabold text-zinc-200">₹{summary.potentialRevenueOpportunity.toLocaleString('en-IN')}</h3>
            <Link 
              href="/opportunities" 
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-zinc-200 mt-2 transition-colors"
            >
              Analyze Leakage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Realized Volume Area Chart (2 columns wide) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:col-span-2 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">Realized GMV & Success Rate Trend</h3>
              <p className="text-[10px] text-zinc-500">Daily breakdown of successful checkout transactions.</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={9} 
                  tickLine={false}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                />
                <YAxis yAxisId="left" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={9} tickLine={false} domain={[50, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937' }}
                  labelStyle={{ color: '#fff', fontSize: 10 }}
                  itemStyle={{ fontSize: 10 }}
                />
                <Area yAxisId="left" type="monotone" dataKey="volume" name="GMV (₹)" stroke={colors.primary} fillOpacity={1} fill="url(#colorGmv)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate (%)" stroke={colors.success} strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Reason Breakdown (List / Progress Bar format) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Failure Reasons Breakdown</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Distribution of transactional failure error states.</p>
            
            {failureReasons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                <CheckCircle className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-xs">No transaction failures recorded.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {failureReasons.slice(0, 5).map((f: any, idx: number) => {
                  let badgeColor = 'bg-zinc-800 text-zinc-400';
                  if (f.reason === 'BANK_DEGRADED') badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                  if (f.reason === 'INSUFFICIENT_FUNDS') badgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                  if (f.reason === 'USER_ABORTED') badgeColor = 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';

                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-zinc-300 font-mono">{f.reason}</span>
                        <span className="text-[10px] text-zinc-500">{f.count.toLocaleString()} ({f.percentage}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${
                            f.reason === 'BANK_DEGRADED' ? 'bg-rose-500' :
                            f.reason === 'INSUFFICIENT_FUNDS' ? 'bg-amber-500' :
                            'bg-zinc-500'
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
          
          <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Critical errors: <b>BANK_DEGRADED</b></span>
            <Link href="/agent" className="text-zinc-300 font-medium hover:underline">Ask AI to investigate</Link>
          </div>
        </div>
      </section>

      {/* Hourly and Payment Method Grid */}
      <section className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly success rates (UPI Peak degradation) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-white">Hourly Success Rate Distribution</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Success performance by hour of day (0-23) — highlights evening drops.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyPerformance} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" fontSize={9} tickLine={false} tickFormatter={(val) => `${val}h`} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[60, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937' }}
                  labelFormatter={(val) => `Hour: ${val}:00`}
                  itemStyle={{ fontSize: 10 }}
                />
                <Line type="monotone" dataKey="successRate" name="Success Rate (%)" stroke={colors.purple} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method success rates bar chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-white">Performance by Payment Method</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Success rate percentage and transaction volume breakdown.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethods} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="method" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2937' }}
                  itemStyle={{ fontSize: 10 }}
                />
                <Bar dataKey="successRate" name="Success Rate (%)" fill={colors.primary} radius={[4, 4, 0, 0]}>
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
