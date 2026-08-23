'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Check, X, ShieldAlert, FileText, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function RecommendationDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<{ [key: string]: boolean }>({});

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommendations/${id}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve recommendation details');
      }
      const json = await res.json();
      setData(json);
      setFeedbackText(json.recommendation.feedbackMessage || '');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleAction = async (actionType: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommendations/${id}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to ${actionType} recommendation`);
      }
      
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleArticle = (artId: string) => {
    setExpandedArticles(prev => ({
      ...prev,
      [artId]: !prev[artId]
    }));
  };

  const formatLakhs = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 text-zinc-400">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-550 mb-2" />
        <p className="text-[10px] font-mono tracking-wider">LOADING INVESTIGATION FILE...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 p-6">
        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
        <h3 className="text-xs font-bold text-white mb-1">Error Loading Investigation</h3>
        <p className="text-zinc-550 text-[10px] mb-4">{error || 'Record not found'}</p>
        <Link 
          href="/opportunities"
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[11px] text-white rounded"
        >
          Back to Opportunities
        </Link>
      </div>
    );
  }

  const { recommendation, relevantArticles } = data;
  const isApproved = recommendation.status === 'APPROVED';
  const isRejected = recommendation.status === 'REJECTED';
  const isActioned = isApproved || isRejected;

  // Visual highlights for evening hours
  const isEvening = recommendation.finding.toLowerCase().includes('upi') || recommendation.finding.toLowerCase().includes('evening');

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
      
      {/* Top Header */}
      <header className="px-8 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4 flex-shrink-0">
        <button 
          onClick={() => router.back()}
          className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-500">OPPORTUNITY INVESTIGATION</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold border ${
              recommendation.opportunity.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
              'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {recommendation.opportunity.severity} PRIORITY
            </span>
          </div>
          <h1 className="text-sm font-bold text-white tracking-tight mt-0.5">{recommendation.opportunity.title}</h1>
        </div>
      </header>

      {/* Main Workspace Split Layout (Section 14 Structure) */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl w-full mx-auto">
        
        {/* Left Column: What happened & Evidence */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: What happened? */}
          <div className="space-y-2 border-b border-zinc-900 pb-5">
            <h3 className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest font-mono">WHAT HAPPENED</h3>
            <p className="text-xs text-zinc-350 leading-relaxed font-mono">
              {recommendation.finding}
            </p>
          </div>

          {/* Section 2: Evidence (Visually dominant hourly blocks) */}
          <div className="space-y-3 border-b border-zinc-900 pb-5">
            <h3 className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest font-mono">EVIDENCE</h3>
            
            {isEvening ? (
              <div className="grid grid-cols-3 gap-4 max-w-md font-mono text-xs">
                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-center">
                  <span className="text-[8px] text-zinc-500 block mb-1 uppercase">7:00 PM</span>
                  <span className="font-bold text-rose-450">84.1% SR</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-center border-rose-500/20">
                  <span className="text-[8px] text-zinc-500 block mb-1 uppercase">8:00 PM</span>
                  <span className="font-bold text-rose-400">82.7% SR</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-center">
                  <span className="text-[8px] text-zinc-500 block mb-1 uppercase">9:00 PM</span>
                  <span className="font-bold text-rose-450">85.3% SR</span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs font-mono max-w-md flex justify-between items-center">
                <span>Method Success rate:</span>
                <span className="font-bold text-rose-400">74.5% (Netbanking)</span>
              </div>
            )}

            <div className="text-[10px] font-mono text-zinc-450 bg-zinc-950 p-4 rounded border border-zinc-900 leading-normal">
              {recommendation.evidence}
            </div>
          </div>

          {/* Section 3: Recommended Action */}
          <div className="space-y-3 border-b border-zinc-900 pb-5">
            <h3 className="text-[10px] font-bold text-zinc-555 uppercase tracking-widest font-mono">RECOMMENDED ACTION</h3>
            <p className="text-xs text-zinc-350 leading-relaxed">
              {recommendation.recommendedAction}
            </p>
            <p className="text-[10px] text-zinc-550 italic leading-relaxed">
              Likely root cause: {recommendation.likelyCause}
            </p>
          </div>

          {/* Section 4: Supporting RAG Reference Documents */}
          {relevantArticles && relevantArticles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest font-mono text-zinc-500">Reference documentation</h3>
              
              <div className="space-y-2">
                {relevantArticles.map((art: any) => {
                  const isExpanded = !!expandedArticles[art.id];
                  return (
                    <div key={art.id} className="border border-zinc-900 rounded bg-zinc-950 overflow-hidden">
                      <button
                        onClick={() => toggleArticle(art.id)}
                        className="w-full px-4 py-2 bg-zinc-900/40 flex justify-between items-center text-[11px] font-bold text-zinc-300 hover:bg-zinc-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded font-mono uppercase">
                            {art.category}
                          </span>
                          {art.title}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-550" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-550" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 border-t border-zinc-900 text-[10px] text-zinc-450 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-950/20">
                          {art.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Impact details and actions */}
        <div className="space-y-6">
          
          {/* Status Display Card */}
          {isActioned && (
            <div className={`border rounded p-5 shadow-sm flex items-start gap-3 ${
              isApproved 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
            }`}>
              <div className="font-mono text-[10px]">
                <h4 className="font-bold text-white uppercase font-bold">ACTION {recommendation.status}</h4>
                <p className="text-zinc-550 mt-1 leading-normal">
                  Approved playbooks are queued for API hot-routing triggers in staging.
                </p>
              </div>
            </div>
          )}

          {/* Impact Overview Card (Visually dominant) */}
          <div className="border border-amber-500/10 bg-amber-500/[0.01] rounded-lg p-6 shadow-sm space-y-6">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block mb-1">Affected payments</span>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {formatLakhs(recommendation.opportunity.estimatedValue)}
              </h3>
              <p className="text-[8px] text-zinc-500 font-mono mt-0.5">Attempted volume leak</p>
            </div>

            <div className="pt-4 border-t border-zinc-900">
              <span className="text-[9px] text-amber-500 uppercase tracking-widest font-mono block mb-1 font-semibold">ESTIMATED IMPACT</span>
              <h3 className="text-xl font-black text-amber-500 tracking-tight">
                {formatLakhs(recommendation.estimatedOpportunity)}
              </h3>
              <p className="text-[9px] text-zinc-500 font-mono mt-1">Based on historical transaction patterns.</p>
            </div>

            <div className="pt-4 border-t border-zinc-900">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block mb-2 font-semibold">Confidence Level</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-200 font-mono">{recommendation.confidence}%</span>
                <div className="flex-1 bg-zinc-950 h-1.5 rounded-full border border-zinc-900 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${recommendation.confidence}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action form panel */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded p-6 space-y-4">
            <h4 className="text-[10px] font-bold text-white font-mono uppercase tracking-wider">Execute Resolution</h4>
            
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-semibold font-mono font-bold">Response Feedback message</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Submit notes or explanation..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-750 h-24 resize-none font-mono"
                disabled={isActioned || submitting}
              />
            </div>

            {!isActioned && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleAction('reject')}
                  className="py-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-450 hover:text-rose-400 rounded text-xs font-bold font-mono transition-all"
                  disabled={submitting}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="py-1.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-750 text-white rounded text-xs font-bold font-mono transition-all"
                  disabled={submitting}
                >
                  Approve recommendation
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Inline fallback loader helper
const RefreshCw = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
  </svg>
);
