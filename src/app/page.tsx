'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { 
  ArrowUpRight, AlertCircle, RefreshCw, ChevronRight, 
  ShieldCheck, TrendingUp, Info, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

// Custom Fintech Monospace Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded p-2.5 shadow-xl font-mono text-[9px]">
        <p className="text-zinc-500 mb-1 pb-1 border-b border-zinc-850">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ color: p.color }} className="font-bold">
            {p.name}: {p.name.includes('Rate') ? `${p.value}%` : `₹${Math.round(p.value).toLocaleString('en-IN')}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Lakhs Formatting helper
const formatLakhs = (val: number) => {
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L`;
  }
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30');
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
  }, [timeRange]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 text-zinc-400">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-550 mb-2" />
        <p className="text-[10px] font-mono tracking-wider">RETRIEVING DASHBOARD METRICS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 p-6">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
        <h3 className="text-xs font-bold text-white mb-1">Failed to load payment analytics</h3>
        <p className="text-zinc-550 text-[10px] text-center max-w-sm mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[11px] text-white rounded hover:border-zinc-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, paymentMethods, failureReasons, hourlyPerformance, dailyTrend } = data;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
      {/* Workspace Header */}
      <div className="px-8 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Overview</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Merchant payment performance</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-750 font-mono"
          >
            <option value="30">Last 30 days</option>
            <option value="14">Last 14 days</option>
            <option value="7">Last 7 days</option>
          </select>
          <button 
            onClick={fetchDashboardData}
            className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WHAT NEEDS YOUR ATTENTION */}
      <section className="px-8 py-3">
        <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider font-mono text-zinc-400">What needs your attention</h3>
        <div className="bg-zinc-900 border border-zinc-800/85 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[8px] px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded font-mono font-bold tracking-wider uppercase">
                HIGH PRIORITY
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">• Yesterday</span>
            </div>
            <h4 className="text-sm font-bold text-white leading-normal">
              Payment success rate dropped during evening hours
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-mono text-[10px] text-zinc-400">
              <div>
                <span className="text-[8px] text-zinc-550 block uppercase">Success rate</span>
                <span className="font-bold text-rose-400">94.2% → 87.8%</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-550 block uppercase">Affected method</span>
                <span className="font-bold text-zinc-200">UPI</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-550 block uppercase">Affected volume</span>
                <span className="font-bold text-zinc-200">₹84,200</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/agent?query=Why+did+my+payment+success+rate+fall+yesterday"
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded text-xs font-bold transition-all duration-150"
            >
              [Investigate]
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Stats Section - Human-crafted Clean Cards */}
      <section className="px-8 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 flex flex-col justify-between h-28">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider">Payment Volume</span>
          <div className="mt-2">
            <div className="text-lg font-bold text-white tracking-tight">{formatLakhs(summary.totalVolume)}</div>
            <div className="text-[9px] font-mono text-emerald-500 mt-1 flex items-center gap-0.5">
              ↑ 8.2% vs prev
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 flex flex-col justify-between h-28">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider">Success Rate</span>
          <div className="mt-2">
            <div className="text-lg font-bold text-white tracking-tight">{summary.successRate}%</div>
            <div className="text-[9px] font-mono text-rose-500 mt-1 flex items-center gap-0.5">
              ↓ 2.4% vs prev
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 flex flex-col justify-between h-28">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider">Successful Payments</span>
          <div className="mt-2">
            <div className="text-lg font-bold text-white tracking-tight">
              {summary.successfulCount.toLocaleString()}
            </div>
            <p className="text-[8px] text-zinc-500 font-mono mt-1 uppercase">Settled Transactions</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 flex flex-col justify-between h-28">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider">Failed Payments</span>
          <div className="mt-2">
            <div className="text-lg font-bold text-rose-450 tracking-tight">
              {summary.failedCount.toLocaleString()}
            </div>
            <p className="text-[8px] text-zinc-500 font-mono mt-1 uppercase">Declined Transactions</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 flex flex-col justify-between h-28">
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider">Avg Transaction</span>
          <div className="mt-2">
            <div className="text-lg font-bold text-white tracking-tight">₹{summary.averageTransactionValue.toFixed(0)}</div>
            <p className="text-[8px] text-zinc-500 font-mono mt-1 uppercase">Ticket Size (ATV)</p>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded p-4 flex flex-col justify-between h-28">
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-semibold">Revenue Opportunity</span>
          <div className="mt-2">
            <div className="text-lg font-extrabold text-amber-500 tracking-tight">{formatLakhs(summary.potentialRevenueOpportunity)}</div>
            <Link href="/opportunities" className="text-[8px] text-amber-500 font-bold font-mono mt-1 block uppercase hover:underline">
              View Leaks →
            </Link>
          </div>
        </div>
      </section>

      {/* Insights Banner */}
      <section className="px-8 py-2">
        <div className="border border-zinc-900 bg-zinc-900/10 rounded p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-400">
            <span className="text-white font-bold">Health check:</span> Success rate is currently at {summary.successRate}%. The decline is concentrated primarily between 7 PM and 10 PM. Check your <Link href="/opportunities" className="text-amber-500 hover:underline">Opportunities tab</Link> to apply routing fixes.
          </div>
        </div>
      </section>

      {/* Main Charts & Analytics Workspace */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Realized Volume line chart (2 Columns wide) */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 lg:col-span-2 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Revenue & Success Rate Velocity</h3>
            <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">30 Day Realized volume against conversion health</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.12}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={8} 
                  fontFamily="monospace"
                  tickLine={false}
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                  }}
                />
                <YAxis yAxisId="left" stroke="#52525b" fontSize={8} fontFamily="monospace" tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={8} fontFamily="monospace" tickLine={false} domain={[60, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="volume" name="GMV (₹)" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#gmvGradient)" />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate (%)" stroke="#a1a1aa" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right side: Payment Methods Horizontal Progress list */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-1">Method Performance</h3>
            <p className="text-[9px] text-zinc-500 font-mono uppercase mb-6">Checkout success rate and volume share</p>

            <div className="space-y-5">
              {paymentMethods.map((pm: any) => {
                const isUnderperforming = pm.successRate < 80;
                return (
                  <div key={pm.method} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold text-zinc-300">{pm.method}</span>
                      <div className="space-x-2">
                        <span className="text-zinc-550">({pm.count.toLocaleString()} txs)</span>
                        <span className={`font-bold ${isUnderperforming ? 'text-rose-400' : 'text-zinc-100'}`}>
                          {pm.successRate}%
                        </span>
                      </div>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className={`h-2 rounded-full ${
                          isUnderperforming ? 'bg-rose-500' : 'bg-zinc-400'
                        }`}
                        style={{ width: `${pm.successRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 mt-6 flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span>Primary leak: <b className="text-rose-400 font-mono">NETBANKING Underperformance</b></span>
          </div>
        </div>
      </section>

      {/* Bottom section: Failure reasons and Hourly breakdown */}
      <section className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failure Reasons list */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-1">Failure Reason Rankings</h3>
            <p className="text-[9px] text-zinc-500 font-mono uppercase mb-6">Distribution of transaction errors</p>

            <div className="divide-y divide-zinc-900">
              {failureReasons.slice(0, 5).map((f: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 text-xs">
                  <span className="font-mono text-zinc-300">{f.reason}</span>
                  <div className="text-right font-mono text-[10px] space-x-3">
                    <span className="text-zinc-500">{f.count.toLocaleString()} attempts</span>
                    <span className="font-bold text-zinc-200">{f.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Trend Line chart */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Hourly Performance Distribution</h3>
            <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Highlights cyclical evening transaction dips</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hour" stroke="#52525b" fontSize={8} fontFamily="monospace" tickLine={false} tickFormatter={(val) => `${val}h`} />
                <YAxis stroke="#52525b" fontSize={8} fontFamily="monospace" tickLine={false} domain={[60, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="successRate" name="Success Rate (%)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
