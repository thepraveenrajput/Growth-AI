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
      
      await fetchDetail(); // reload
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
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-slate-950 text-slate-400">
        <RefreshCw className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm font-medium">Fetching recommendation profiles & knowledge articles...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full bg-slate-950 p-6">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Error Loading Recommendation</h3>
        <p className="text-slate-400 text-sm mb-6">{error || 'Record not found'}</p>
        <Link 
          href="/opportunities"
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
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
      <header className="px-8 py-5 bg-slate-900 border-b border-slate-800 flex items-center gap-4 flex-shrink-0">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">AI Recommendation Analysis</h1>
          <p className="text-[10px] text-slate-400">Detailed diagnostic findings, supporting data trails, and RAG knowledge reference documents.</p>
        </div>
      </header>

      {/* Main Grid */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Diagnostics and RAG articles */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Finding box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Diagnostic Finding</h3>
            <p className="text-sm font-bold text-slate-100 leading-snug">{recommendation.finding}</p>
          </div>

          {/* Evidence box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Supporting Evidence</h3>
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {recommendation.evidence}
            </div>
          </div>

          {/* Cause and Remediation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
            <div>
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Likely Cause</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{recommendation.likelyCause}</p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Recommended Action</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{recommendation.recommendedAction}</p>
            </div>
          </div>

          {/* Supporting RAG Knowledge Articles */}
          {relevantArticles && relevantArticles.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Supporting Payment Guides (RAG Context)</h3>
              </div>
              <p className="text-[10px] text-slate-500 mb-4">
                These articles were dynamically pulled from our internal payment knowledge base by matching prompt keywords to provide context-aware solutions.
              </p>
              
              <div className="space-y-3">
                {relevantArticles.map((art: any) => {
                  const isExpanded = !!expandedArticles[art.id];
                  return (
                    <div key={art.id} className="border border-slate-800 rounded-lg bg-slate-950/60 overflow-hidden">
                      <button
                        onClick={() => toggleArticle(art.id)}
                        className="w-full px-4 py-2.5 bg-slate-950 flex justify-between items-center text-xs font-bold text-slate-200 hover:bg-slate-900 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono font-bold uppercase">
                            {art.category}
                          </span>
                          {art.title}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-850 text-xs text-slate-400 leading-relaxed prose prose-invert max-w-none prose-sm">
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
            <div className={`border rounded-xl p-5 shadow-lg flex items-start gap-3 ${
              isApproved 
                ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' 
                : 'bg-rose-950/20 border-rose-900/60 text-rose-400'
            }`}>
              {isApproved ? <Check className="w-5 h-5 mt-0.5" /> : <X className="w-5 h-5 mt-0.5" />}
              <div>
                <h4 className="text-xs font-bold text-white">Recommendation {recommendation.status}</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  This recommendation has been actioned by the merchant. The corresponding opportunity status is updated.
                </p>
              </div>
            </div>
          )}

          {/* Impact and metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block mb-1">Expected Opportunity</span>
              <h3 className="text-2xl font-black text-emerald-400">
                ₹{recommendation.estimatedOpportunity.toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Restorable payment volume leak.</p>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block mb-2">Confidence Level</span>
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-white">{recommendation.confidence}%</div>
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${recommendation.confidence}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action form panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <h4 className="text-xs font-bold text-white">Decision Support Workflow</h4>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Merchant Action Notes</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Optional notes: e.g. Contacting engineering to configure secondary PSP handles."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-24 resize-none"
                disabled={isActioned || submitting}
              />
            </div>

            {!isActioned && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleAction('reject')}
                  className="py-2 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-bold transition-all"
                  disabled={submitting}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/10"
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
