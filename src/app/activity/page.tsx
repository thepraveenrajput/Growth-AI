'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, Terminal, RefreshCw, AlertCircle, Clock, 
  CheckCircle2, XCircle, Brain
} from 'lucide-react';
import Link from 'next/link';

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

  // Helper to group activities by date (e.g. Today, Yesterday, Older)
  const getGroupedActivities = () => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const older: any[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yest = new Date();
    yest.setDate(now.getDate() - 1);
    const yestStr = yest.toDateString();

    activities.forEach(a => {
      const aDate = new Date(a.timestamp);
      const aDateStr = aDate.toDateString();
      if (aDateStr === todayStr) {
        today.push(a);
      } else if (aDateStr === yestStr) {
        yesterday.push(a);
      } else {
        older.push(a);
      }
    });

    return { today, yesterday, older };
  };

  const grouped = getGroupedActivities();

  const renderTimelineGroup = (title: string, list: any[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono border-b border-zinc-900 pb-1">
          {title}
        </h4>
        
        <div className="relative border-l border-zinc-900 pl-6 ml-3 space-y-6">
          {list.map((a) => {
            const isAction = a.type === 'MERCHANT_ACTION';
            const isApproved = a.meta?.actionType === 'APPROVED';
            const dateObj = new Date(a.timestamp);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={a.id} className="relative">
                {/* Timeline Dot Indicator */}
                <span className={`absolute -left-[30px] top-1.5 flex items-center justify-center w-2 h-2 rounded-full border ${
                  isAction
                    ? isApproved 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'bg-rose-500 border-rose-500'
                    : 'bg-zinc-800 border-zinc-700'
                }`} />

                <div className="space-y-1">
                  {/* Time + Action Type Header */}
                  <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                    <span className="font-bold text-zinc-400">{timeStr}</span>
                    <span>•</span>
                    <span>{isAction ? 'Merchant Action' : 'AI Copilot Run'}</span>
                  </div>

                  {/* Title */}
                  <h5 className="text-xs font-bold text-white tracking-tight">{a.title}</h5>
                  
                  {/* Description */}
                  <p className="text-[11px] text-zinc-450 leading-relaxed max-w-2xl">{a.description}</p>

                  {/* Merchant feedback notes */}
                  {isAction && a.meta.feedback && (
                    <div className="text-[9px] text-zinc-500 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-900 max-w-lg mt-1.5 font-mono">
                      Feedback: &quot;{a.meta.feedback}&quot;
                    </div>
                  )}

                  {/* Copilot Tool details list */}
                  {!isAction && a.meta.toolCalls && a.meta.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {a.meta.toolCalls.map((tc: any, tcIdx: number) => (
                        <span 
                          key={tcIdx}
                          className="inline-flex items-center gap-1 text-[8px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-450 border border-zinc-900"
                        >
                          <Terminal className="w-2.5 h-2.5 text-zinc-550" /> {tc.toolName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
      {/* Header */}
      <header className="px-8 py-7 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Activity Log</h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">VERIFIABLE RUNTIME AUDIT TRAIL</p>
        </div>

        <button 
          onClick={fetchActivity}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300 rounded hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH TRAIL
        </button>
      </header>

      {/* Main Timeline Workspace */}
      <section className="p-8 flex-1 max-w-3xl w-full mx-auto space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-zinc-500">
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-555 mr-2" />
            <span className="text-xs font-mono">Loading activity records...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-950/15 border border-rose-900/30 rounded p-6 text-center text-zinc-450 max-w-sm mx-auto">
            <p className="text-xs font-mono mb-4">{error}</p>
            <button onClick={fetchActivity} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-white">Retry</button>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-zinc-900/20 border border-zinc-900 rounded p-12 text-center text-zinc-500 max-w-sm mx-auto">
            <History className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
            <h4 className="text-white font-bold text-xs mb-1">No activity logged</h4>
            <p className="text-[10px] font-mono leading-relaxed mt-1">
              Once you run queries in the AI workbench or action recommendations, the logs will populate here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {renderTimelineGroup("Today", grouped.today)}
            {renderTimelineGroup("Yesterday", grouped.yesterday)}
            {renderTimelineGroup("Older Activities", grouped.older)}
          </div>
        )}
      </section>
    </div>
  );
}
