'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Check, X, Shield, DollarSign, Award, 
  HelpCircle, RefreshCw, AlertCircle, FileText, ChevronDown, ChevronUp
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

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mb-3" />
        <p className="text-xs font-mono tracking-wider">RETRIEVING RECOMMENDATION PLAYBOOK...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-zinc-950 p-6">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Error Loading Recommendation</h3>
        <p className="text-zinc-500 text-xs mb-6">{error || 'Record not found'}</p>
        <Link 
          href="/opportunities"
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:border-zinc-700 text-xs font-semibold transition-colors"
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

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="px-8 py-5 bg-zinc-900/40 border-b border-zinc-900 flex items-center gap-4 flex-shrink-0">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">AI Recommendation playbook</h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {recommendation.id.toUpperCase()}</p>
        </div>
      </header>

      {/* Main Grid */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl w-full mx-auto">
        {/* Left Column: Diagnostics and RAG articles */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Finding box */}
          <div className="bg-zinc-900/40 border border-zinc-900 border-t border-t-zinc-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono mb-2.5">Diagnostic Finding</h3>
            <p className="text-xs font-bold text-zinc-100 leading-relaxed">{recommendation.finding}</p>
          </div>

          {/* Evidence box */}
          <div className="bg-zinc-900/40 border border-zinc-900 border-t border-t-zinc-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono mb-2.5">Supporting Evidence</h3>
            <div className="text-xs text-zinc-300 font-mono bg-zinc-950 p-4 rounded border border-zinc-900/80 whitespace-pre-wrap leading-relaxed">
              {recommendation.evidence}
            </div>
          </div>

          {/* Cause and Remediation */}
          <div className="bg-zinc-900/40 border border-zinc-900 border-t border-t-zinc-700 rounded-lg p-5 shadow-sm space-y-5">
            <div>
              <h3 className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono mb-2">Likely Cause</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">{recommendation.likelyCause}</p>
            </div>
            <div className="pt-4 border-t border-zinc-850">
              <h3 className="text-[9px] font-bold text-amber-500 uppercase tracking-widest font-mono mb-2">Recommended Action</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">{recommendation.recommendedAction}</p>
            </div>
          </div>

          {/* Supporting RAG Knowledge Articles */}
          {relevantArticles && relevantArticles.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-1.8 mb-3.5 pb-2 border-b border-zinc-900">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Reference Articles (RAG Context)</h3>
              </div>
              
              <div className="space-y-3">
                {relevantArticles.map((art: any) => {
                  const isExpanded = !!expandedArticles[art.id];
                  return (
                    <div key={art.id} className="border border-zinc-900 rounded-lg bg-zinc-950/60 overflow-hidden">
                      <button
                        onClick={() => toggleArticle(art.id)}
                        className="w-full px-4 py-2.5 bg-zinc-950 flex justify-between items-center text-xs font-bold text-zinc-200 hover:bg-zinc-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono font-bold uppercase">
                            {art.category}
                          </span>
                          {art.title}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 border-t border-zinc-900 text-xs text-zinc-450 leading-relaxed bg-zinc-950 font-mono">
                          <div className="whitespace-pre-wrap">{art.content}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Impact cards and workflows */}
        <div className="space-y-6">
          
          {/* Status banner */}
          {isActioned && (
            <div className={`border rounded-lg p-5 shadow-sm flex items-start gap-3 ${
              isApproved 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
            }`}>
              {isApproved ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <div className="font-mono text-[10px]">
                <h4 className="font-bold text-white uppercase">Recommendation {recommendation.status}</h4>
                <p className="text-zinc-500 mt-1 leading-normal">
                  Merchant action has been recorded in the system audit log.
                </p>
              </div>
            </div>
          )}

          {/* Impact and metrics */}
          <div className="border border-amber-500/10 bg-amber-500/[0.01] rounded-lg p-6 shadow-lg space-y-6">
            <div>
              <span className="text-[9px] text-amber-400 uppercase tracking-widest font-mono block mb-1">Expected Opportunity</span>
              <h3 className="text-xl font-black text-amber-500 tracking-tight">
                ₹{recommendation.estimatedOpportunity.toLocaleString('en-IN')}
              </h3>
              <p className="text-[9px] font-mono text-zinc-500 mt-1">RECOVERABLE VOLUME</p>
            </div>
            
            <div className="pt-4 border-t border-zinc-900">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block mb-2">Confidence Level</span>
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-white font-mono">{recommendation.confidence}%</div>
                <div className="flex-1 bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${recommendation.confidence}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action form panel */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Action Workflow</h4>
            
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Merchant Response Notes</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Optional notes: e.g. Implementing fallback routing next Monday."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 h-24 resize-none"
                disabled={isActioned || submitting}
              />
            </div>

            {!isActioned && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleAction('reject')}
                  className="py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-rose-400 rounded-lg text-xs font-bold transition-all"
                  disabled={submitting}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="py-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 rounded-lg text-xs font-bold transition-all"
                  disabled={submitting}
                >
                  Approve Action
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
