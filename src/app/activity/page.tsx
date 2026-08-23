'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, Terminal, Award, HelpCircle, RefreshCw, AlertCircle,
  Clock, CheckCircle2, XCircle, Brain, Eye
} from 'lucide-react';

export default function Activity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/activity');
      if (!res.ok) {
        throw new Error('Failed to retrieve activity log');
      }
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950/20">
      {/* Header */}
      <header className="px-8 py-6 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log & Audit Trail</h1>
          <p className="text-xs text-zinc-400">Verifiable logging of AI copilot queries, tool executions, and merchant actions.</p>
        </div>

        <button 
          onClick={fetchActivity}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded-lg hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
        </button>
      </header>

      {/* Main List */}
      <section className="p-8 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400 mr-2" />
            <span className="text-xs">Loading activity logs...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-6 text-center text-zinc-400 max-w-md mx-auto">
            <p className="text-sm mb-4">{error}</p>
            <button onClick={fetchActivity} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">Retry</button>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-12 text-center text-zinc-500 max-w-md mx-auto">
            <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h4 className="text-white font-semibold text-sm mb-1">No Activity Logged</h4>
            <p className="text-xs">Once you run queries in the AI Agent or approve recommendations, the logs will populate here.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-zinc-800 pl-6 ml-4 space-y-8">
            {activities.map((a, idx) => {
              const isAction = a.type === 'MERCHANT_ACTION';
              const isApproved = a.meta?.actionType === 'APPROVED';
              
              return (
                <div key={a.id} className="relative">
                  {/* Bullet indicator icon */}
                  <span className={`absolute -left-[35px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border ${
                    isAction
                      ? isApproved 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-950 text-rose-400 border-rose-500/30'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-850'
                  }`}>
                    {isAction ? (
                      isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Brain className="w-3.5 h-3.5" />
                    )}
                  </span>

                  {/* Log Content Card */}
                  <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-5 shadow-lg">
                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono mb-2">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {new Date(a.timestamp).toLocaleString()}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white mb-1.5">{a.title}</h3>
                    
                    {/* Description */}
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {a.description}
                    </p>

                    {/* Action Meta Details */}
                    {isAction && (
                      <div className="text-[10px] text-zinc-400 bg-zinc-950 rounded-lg p-2.5 border border-zinc-850">
                        <span className="font-semibold block mb-0.5 text-zinc-500">Merchant Response Feedback:</span>
                        "{a.meta.feedback}"
                      </div>
                    )}

                    {/* Agent Run Meta Details */}
                    {!isAction && a.meta.toolCalls && a.meta.toolCalls.length > 0 && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-zinc-850">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Tools Executed:</span>
                        <div className="flex flex-wrap gap-2">
                          {a.meta.toolCalls.map((tc: any, tcIdx: number) => (
                            <span 
                              key={tcIdx}
                              className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800"
                              title={`Input Params: ${JSON.stringify(tc.params)}`}
                            >
                              <Terminal className="w-2.5 h-2.5 text-zinc-300" /> {tc.toolName}
                            </span>
                          ))}
                        </div>
                      </div>
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
