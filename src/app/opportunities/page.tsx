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
      <header className="px-8 py-6 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Detected Growth Opportunities</h1>
          <p className="text-xs text-zinc-400">Rule-based analytical scans highlighting payment inefficiencies and revenue leakage.</p>
        </div>
        
        <button 
          onClick={fetchOpportunities}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-scan Database
        </button>
      </header>

      {/* Filter panel */}
      <section className="px-8 py-4 bg-zinc-900/50 border-b border-zinc-800/80 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span>Filter Opportunities:</span>
        </div>

        {/* Severity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Severity</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DETECTED">Detected</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACTIONED">Actioned / Approved</option>
          </select>
        </div>
      </section>

      {/* Main List */}
      <section className="p-8 flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400 mr-2" />
            <span className="text-xs">Running rules-based diagnostic checks...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-6 text-center text-zinc-400 max-w-lg mx-auto">
            <p className="text-sm mb-4">{error}</p>
            <button onClick={fetchOpportunities} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">Retry</button>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-12 text-center text-zinc-500 max-w-md mx-auto">
            <CheckCircle2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h4 className="text-white font-semibold text-sm mb-1">No Active Opportunities</h4>
            <p className="text-xs">Your payment configurations are working within normal baseline success ranges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOpportunities.map((o) => {
              const recommendation = o.recommendations[0];
              const isHigh = o.severity === 'HIGH';
              const isActioned = o.status === 'ACTIONED';
              
              return (
                <div 
                  key={o.id}
                  className={`bg-zinc-900 border rounded-xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-zinc-700 hover:shadow-2xl ${
                    isActioned ? 'border-zinc-800/50 opacity-75' :
                    isHigh ? 'border-rose-950/40 hover:border-rose-900/60' : 'border-zinc-800'
                  }`}
                >
                  <div>
                    {/* Header: Status and badges */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {/* Severity badge */}
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                          o.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          o.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {o.severity} SEVERITY
                        </span>
                        
                        {/* Priority badge */}
                        <span className="text-[9px] px-2 py-0.5 rounded font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {o.priority} PRIORITY
                        </span>
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActioned ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                        o.status === 'INVESTIGATING' ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 animate-pulse' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                      }`}>
                        {o.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white mb-2">{o.title}</h3>
                    
                    {/* Finding Summary */}
                    {recommendation && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                        {recommendation.finding}
                      </p>
                    )}

                    {/* Metrics Box */}
                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 mb-6">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono font-medium tracking-wider">Revenue leak (Est.)</span>
                        <span className={`text-sm font-bold ${isHigh && !isActioned ? 'text-rose-400' : 'text-zinc-200'}`}>
                          ₹{o.estimatedValue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono font-medium tracking-wider">Affected orders</span>
                        <span className="text-sm font-bold text-zinc-200">
                          {o.affectedCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
                    <span className="text-[9px] text-zinc-500 font-mono">
                      Detected: {new Date(o.timestamp).toLocaleDateString()}
                    </span>

                    {recommendation ? (
                      <Link 
                        href={`/recommendations/${recommendation.id}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all px-3.5 py-1.8 rounded-lg ${
                          isActioned 
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
                            : 'bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 hover:text-white hover:shadow-lg hover:shadow-zinc-950/20'
                        }`}
                      >
                        {isActioned ? 'Review Action' : 'View AI Recommendation'} <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link 
                        href="/agent"
                        className="inline-flex items-center gap-1 text-xs font-bold text-zinc-200 hover:underline"
                      >
                        Investigate with AI Agent <ArrowRight className="w-3.5 h-3.5" />
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
