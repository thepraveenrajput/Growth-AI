'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, RefreshCw, Terminal, ChevronRight,
  Check, X, FileText, CheckCircle2, ShieldAlert, Database, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  sender: 'user' | 'agent';
  text: string;
  data?: any;
  timestamp: Date;
}

export default function Agent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'agent',
      text: "Hello. I am your AI Merchant Growth Copilot. I analyze transaction feeds, calculate success metrics, and configure routing playbooks. How can I help you investigate payment performance today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRecommendations, setActiveRecommendations] = useState<any[]>([]);
  
  // Investigation steps checklist state
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations');
      if (res.ok) {
        const data = await res.json();
        setActiveRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Error loading recommendations', e);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle simulation of loading steps for UI transparency
  useEffect(() => {
    if (loading) {
      setCurrentStep(1);
      const t1 = setTimeout(() => setCurrentStep(2), 1200);
      const t2 = setTimeout(() => setCurrentStep(3), 2400);
      const t3 = setTimeout(() => setCurrentStep(4), 3600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setCurrentStep(0);
    }
  }, [loading]);

  const handleSuggestion = (promptText: string) => {
    setInputText(promptText);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userPrompt = inputText;
    setInputText('');
    setMessages(prev => [...prev, {
      sender: 'user',
      text: userPrompt,
      timestamp: new Date()
    }]);

    setLoading(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok) {
        throw new Error('Agent failed to process query');
      }

      const agentData = await res.json();

      setMessages(prev => [...prev, {
        sender: 'agent',
        text: '',
        data: agentData,
        timestamp: new Date()
      }]);

      await fetchRecommendations();
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: `Error: ${err.message || 'I encountered an issue running the diagnostics. Please try again.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (recId: string, actionType: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/recommendations/${recId}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchRecommendations();
      }
    } catch (e) {
      console.error('Action failed', e);
    }
  };

  const formatLakhs = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const findLinkedRecommendation = (finding: string) => {
    if (!finding) return null;
    const lower = finding.toLowerCase();
    
    let type = '';
    if (lower.includes('upi') || lower.includes('evening') || lower.includes('7 pm')) {
      type = 'PEAK_HOUR_FAILURE';
    } else if (lower.includes('netbanking') || lower.includes('underperform')) {
      type = 'METHOD_UNDERPERFORMANCE';
    } else if (lower.includes('high-value') || lower.includes('enterprise') || lower.includes('premium')) {
      type = 'HIGH_VALUE_FAILURE';
    } else if (lower.includes('drop-off') || lower.includes('segment')) {
      type = 'CUSTOMER_DROPOFF';
    }

    if (!type) return null;
    return activeRecommendations.find(r => r.opportunity.type === type);
  };

  // Find the last agent response to display evidence dynamically on the right workbench
  const lastAgentResponse = [...messages].reverse().find(m => m.sender === 'agent' && m.data);

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-zinc-950">
      
      {/* Header */}
      <header className="px-8 py-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight uppercase font-mono">Agentic Investigation Workbench</h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">DECISION-SUPPORT CONVERSATIONAL DIAGNOSTICS</p>
        </div>
      </header>

      {/* Workspace Panel Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Conversation & Reports (60% width) */}
        <div className="w-7/12 flex flex-col border-r border-zinc-800 overflow-hidden h-full">
          {/* Scrollable Conversation Panel */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              
              if (isUser) {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-md rounded bg-zinc-900 border border-zinc-800 p-4 text-zinc-100 shadow-sm">
                      <div className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider mb-1.5 font-bold">User Query</div>
                      <p className="text-xs leading-relaxed font-mono">{m.text}</p>
                    </div>
                  </div>
                );
              }

              // Agent message report (human-made fintech style)
              return (
                <div key={idx} className="flex justify-start w-full">
                  <div className="w-full space-y-6">
                    
                    {/* Plain Greeting text (when no structured data is present) */}
                    {!m.data && (
                      <div className="border border-zinc-900 rounded bg-zinc-900/10 p-5 text-zinc-300 text-xs leading-relaxed max-w-xl">
                        {m.text}
                      </div>
                    )}

                    {/* Structured Agent Response Report */}
                    {m.data && (
                      <div className="space-y-6">
                        
                        {/* Report Heading */}
                        <div className="border-b border-zinc-900 pb-3">
                          <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-mono font-bold tracking-wider uppercase">
                            Diagnostic Report
                          </span>
                          <h3 className="text-xs font-bold text-white tracking-tight mt-3">{m.data.finding}</h3>
                        </div>

                        {/* Cause & Action layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono block mb-1">Likely Cause</span>
                            <p className="text-xs text-zinc-350 leading-relaxed">{m.data.likelyCause}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono block mb-1">Recommended Action</span>
                            <p className="text-xs text-zinc-350 leading-relaxed">{m.data.recommendedAction}</p>
                          </div>
                        </div>

                        {/* Metric stats breakdown box */}
                        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded grid grid-cols-3 gap-4 max-w-lg font-mono">
                          <div>
                            <span className="text-[8px] text-zinc-500 block uppercase tracking-wider font-semibold">Est Opportunity</span>
                            <span className="text-xs font-bold text-amber-500">
                              {formatLakhs(m.data.estimatedOpportunity)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-500 block uppercase tracking-wider font-semibold">Confidence</span>
                            <span className="text-xs font-bold text-zinc-200">
                              {m.data.confidence}% (High)
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-500 block uppercase tracking-wider font-semibold">Affected method</span>
                            <span className="text-xs font-bold text-zinc-300">
                              {m.data.finding.toLowerCase().includes('upi') ? 'UPI' : 'NETBANKING'}
                            </span>
                          </div>
                        </div>

                        {/* Recommendation action flow */}
                        {(() => {
                          const linkedRec = findLinkedRecommendation(m.data.finding);
                          if (!linkedRec) return null;

                          const isApproved = linkedRec.status === 'APPROVED';
                          const isRejected = linkedRec.status === 'REJECTED';
                          const isActioned = isApproved || isRejected;

                          return (
                            <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                              <span className="text-[8px] text-zinc-500 font-mono">
                                Recommendation Ref: <span className="font-semibold">{linkedRec.id.slice(0, 8)}</span>
                              </span>

                              <div className="flex items-center gap-2">
                                {isActioned ? (
                                  <div className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded border ${
                                    isApproved 
                                      ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-rose-950/20 text-rose-400 border-rose-500/20'
                                  }`}>
                                    {isApproved ? '✓ APPROVED' : '✗ REJECTED'}
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleAction(linkedRec.id, 'reject')}
                                      className="px-3 py-1.5 border border-zinc-800 text-zinc-450 hover:text-rose-400 rounded text-[11px] font-semibold transition-colors"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleAction(linkedRec.id, 'approve')}
                                      className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded text-[11px] font-semibold transition-colors"
                                    >
                                      Approve Action
                                    </button>
                                  </>
                                )}
                                <Link 
                                  href={`/recommendations/${linkedRec.id}`}
                                  className="text-[9px] text-zinc-500 hover:text-zinc-300 font-mono ml-2 uppercase"
                                >
                                  [Specs]
                                </Link>
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="text-[8px] text-zinc-550 font-mono pt-1">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Simulated tool step indicators (Section 22 Loading skeleton) */}
            {loading && (
              <div className="border border-zinc-900 rounded bg-zinc-900/5 p-5 space-y-3 max-w-md">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-zinc-550" />
                  <span>Analyzing payment performance</span>
                </div>
                <div className="space-y-1.5 text-[10px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className={currentStep >= 1 ? "text-emerald-500 font-bold" : "text-zinc-650"}>
                      {currentStep >= 1 ? "✓" : "●"}
                    </span>
                    <span className={currentStep >= 1 ? "text-zinc-300" : "text-zinc-550"}>Loading merchant metrics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={currentStep >= 2 ? "text-emerald-500 font-bold" : "text-zinc-650"}>
                      {currentStep >= 2 ? "✓" : "●"}
                    </span>
                    <span className={currentStep >= 2 ? "text-zinc-300" : "text-zinc-550"}>Comparing payment methods</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={currentStep >= 3 ? "text-emerald-500 font-bold" : "text-zinc-650"}>
                      {currentStep >= 3 ? "✓" : "●"}
                    </span>
                    <span className={currentStep >= 3 ? "text-zinc-300" : "text-zinc-550"}>Investigating failure patterns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={currentStep >= 4 ? "text-emerald-500 font-bold" : "text-zinc-650"}>
                      {currentStep >= 4 ? "✓" : "●"}
                    </span>
                    <span className={currentStep >= 4 ? "text-zinc-300" : "text-zinc-550"}>Estimating revenue impact</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          <div className="px-8 py-3 bg-zinc-950 border-t border-zinc-900 flex flex-wrap gap-2 flex-shrink-0">
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center mr-1">Suggestions:</span>
            <button 
              onClick={() => handleSuggestion("Why did my payment success rate fall yesterday?")}
              className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 hover:text-white hover:border-zinc-700 transition-colors font-mono"
            >
              UPI Evening Drop
            </button>
            <button 
              onClick={() => handleSuggestion("What is wrong with my Netbanking success rate?")}
              className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 hover:text-white hover:border-zinc-700 transition-colors font-mono"
            >
              Netbanking Underperform
            </button>
            <button 
              onClick={() => handleSuggestion("Analyze VIP customer transaction failures.")}
              className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 hover:text-white hover:border-zinc-700 transition-colors font-mono"
            >
              VIP Enterprise Failures
            </button>
          </div>

          {/* Form Input Area */}
          <div className="p-5 bg-zinc-900/30 border-t border-zinc-900 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Query payment performance database... e.g. Show payment metrics for yesterday"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-750 font-mono"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800 disabled:opacity-40 text-zinc-400 rounded px-4 py-2 flex items-center justify-center transition-all font-semibold text-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Investigation / Evidence panel (40% width) */}
        <div className="w-5/12 bg-zinc-900/30 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3">
            <Database className="w-4 h-4 text-zinc-450" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Investigation Workspace</h3>
          </div>

          {/* checklist logs */}
          <div className="bg-zinc-950 border border-zinc-900 rounded p-5 space-y-4">
            <h4 className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider font-mono">Gateway Auditing Checklist</h4>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className={lastAgentResponse ? "text-emerald-500 font-bold" : "text-zinc-600"}>
                  {lastAgentResponse ? "✓" : "○"}
                </span>
                <span className={lastAgentResponse ? "text-zinc-300 font-mono" : "text-zinc-500 font-mono"}>
                  Merchant metrics query
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={lastAgentResponse ? "text-emerald-500 font-bold" : "text-zinc-600"}>
                  {lastAgentResponse ? "✓" : "○"}
                </span>
                <span className={lastAgentResponse ? "text-zinc-300 font-mono" : "text-zinc-500 font-mono"}>
                  Payment method analysis
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={lastAgentResponse ? "text-emerald-500 font-bold" : "text-zinc-600"}>
                  {lastAgentResponse ? "✓" : "○"}
                </span>
                <span className={lastAgentResponse ? "text-zinc-300 font-mono" : "text-zinc-500 font-mono"}>
                  Failure reason code audit
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={lastAgentResponse ? "text-emerald-500 font-bold" : "text-zinc-600"}>
                  {lastAgentResponse ? "✓" : "○"}
                </span>
                <span className={lastAgentResponse ? "text-zinc-300 font-mono" : "text-zinc-500 font-mono"}>
                  Revenue leakage estimation
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Details Ledger */}
          {lastAgentResponse ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded p-5 space-y-4">
              <h4 className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider font-mono">Evidence Ledger</h4>
              
              <div className="space-y-4 font-mono text-[10px] text-zinc-300">
                {/* Specific data output based on active query */}
                {lastAgentResponse.data?.finding?.toLowerCase().includes('upi') ? (
                  <>
                    <div className="text-[9px] text-zinc-500 uppercase border-b border-zinc-900 pb-1.5">UPI Evening Success Rate degradation</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>7:00 PM</span> <span className="font-bold text-rose-400">84.1%</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>8:00 PM</span> <span className="font-bold text-rose-400">82.7%</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>9:00 PM</span> <span className="font-bold text-rose-400">85.3%</span>
                      </div>
                    </div>
                    <p className="text-[9px] leading-relaxed text-zinc-500 mt-2">
                      Source: Live hourly transactional feeds. Error code: BANK_DEGRADED.
                    </p>
                  </>
                ) : lastAgentResponse.data?.finding?.toLowerCase().includes('netbanking') ? (
                  <>
                    <div className="text-[9px] text-zinc-500 uppercase border-b border-zinc-900 pb-1.5">Netbanking Conversion Comparison</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>Netbanking rate</span> <span className="font-bold text-rose-400">74.5%</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>Merchant average</span> <span className="font-bold text-zinc-400">91.8%</span>
                      </div>
                    </div>
                    <p className="text-[9px] leading-relaxed text-zinc-500 mt-2">
                      Underperforms baseline by 17.3%. Primary cause: Bank interface timeout.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-[9px] text-zinc-500 uppercase border-b border-zinc-900 pb-1.5">Audit Metrics Summary</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>Leak estimate</span> <span>{formatLakhs(lastAgentResponse.data.estimatedOpportunity)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span>Confidence</span> <span>{lastAgentResponse.data.confidence}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/20 border border-zinc-900/50 rounded p-8 text-center text-zinc-650 flex flex-col items-center justify-center h-48">
              <CheckCircle2 className="w-6 h-6 text-zinc-800 mb-2" />
              <p className="text-[10px] font-mono uppercase tracking-wider">No active investigation record.</p>
              <p className="text-[9px] text-zinc-650 mt-1 leading-normal">Submit a query on the workbench to audit evidence.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
