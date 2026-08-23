'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, DollarSign, CheckCircle2, TrendingUp, Filter,
  ArrowRight, RefreshCw, ChevronRight, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/opportunities');
      if (!res.ok) {
        throw new Error('Failed to retrieve growth opportunities');
      }
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter((o) => {
    const matchesSeverity = severityFilter === 'ALL' || o.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="px-8 py-7 bg-zinc-900/40 border-b border-zinc-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Growth Opportunities</h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">RULE-BASED TRANSACTION SCANNER</p>
        </div>
        
        <button 
          onClick={fetchOpportunities}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 rounded-lg hover:text-white transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> RUN SCANNER
        </button>
      </header>

      {/* Filter panel */}
      <section className="px-8 py-3.5 bg-zinc-950 border-b border-zinc-900/80 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
          <Filter className="w-3 h-3" />
          <span>Filters:</span>
        </div>

        {/* Severity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-semibold">Severity</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-700"
          >
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-semibold">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-700"
          >
            <option value="ALL">All</option>
            <option value="DETECTED">Detected</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACTIONED">Actioned</option>
          </select>
        </div>
      </section>

      {/* Main List */}
      <section className="p-8 flex-1 max-w-5xl w-full mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-zinc-500">
            <RefreshCw className="w-5 h-5 animate-spin text-zinc-500 mr-2" />
            <span className="text-xs font-mono">Running diagnostics...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-5 text-center text-zinc-400 max-w-sm mx-auto">
            <p className="text-xs font-mono mb-4">{error}</p>
            <button onClick={fetchOpportunities} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white">Retry</button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-10 text-center text-zinc-600 max-w-sm mx-auto">
            <CheckCircle2 className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
            <h4 className="text-white font-bold text-xs mb-1">No Opportunities Found</h4>
            <p className="text-[10px] leading-relaxed">Your payment systems are executing in perfect bounds.</p>
          </div>
        ) : (
          <div className="border border-zinc-900 rounded-lg bg-zinc-900/20 overflow-hidden divide-y divide-zinc-900">
            {filteredOpportunities.map((o) => {
              const recommendation = o.recommendations[0];
              const isHigh = o.severity === 'HIGH';
              const isActioned = o.status === 'ACTIONED';
              
              return (
                <div 
                  key={o.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 transition-colors duration-150 hover:bg-zinc-900/30 ${
                    isActioned ? 'opacity-50' : ''
                  }`}
                >
                  {/* Left block: Title, Details */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                        o.severity === 'HIGH' ? 'bg-rose-500/5 text-rose-400 border-rose-500/10' :
                        o.severity === 'MEDIUM' ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {o.severity}
                      </span>
                      <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        isActioned ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' :
                        'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {o.status}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(o.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white tracking-tight">{o.title}</h3>
                    {recommendation && (
                      <p className="text-[10px] text-zinc-400 leading-normal line-clamp-1">
                        {recommendation.finding}
                      </p>
                    )}
                  </div>

                  {/* Right block: Metrics and Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {/* Metrics values */}
                    <div className="flex gap-4 font-mono text-right text-[10px]">
                      <div>
                        <span className="text-[8px] text-zinc-500 block uppercase">Leak (Est)</span>
                        <span className={`font-bold ${isHigh && !isActioned ? 'text-rose-400' : 'text-zinc-200'}`}>
                          ₹{o.estimatedValue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 block uppercase">Affected</span>
                        <span className="font-bold text-zinc-300">
                          {o.affectedCount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* View Button */}
                    {recommendation && (
                      <Link 
                        href={`/recommendations/${recommendation.id}`}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded transition-all ${
                          isActioned 
                            ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' 
                            : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white shadow-sm'
                        }`}
                      >
                        {isActioned ? 'Review' : 'View Action'} <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
