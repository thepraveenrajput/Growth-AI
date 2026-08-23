'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, RefreshCw, Terminal, ChevronDown, ChevronUp, 
  Play, Check, X, CheckSquare, HelpCircle, AlertCircle
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
      text: "Hello! I am your AI Merchant Growth Copilot. I analyze transaction streams, locate revenue leakage points, and build actionable recovery playbooks. How can I help you optimize your payments health today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [openToolsIndex, setOpenToolsIndex] = useState<{ [key: number]: boolean }>({});
  const [activeRecommendations, setActiveRecommendations] = useState<any[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch recommendations to map chat findings to database actions
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

      // Refresh DB recommendations list so we have fresh statuses
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

  const toggleTools = (idx: number) => {
    setOpenToolsIndex(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleAction = async (recId: string, actionType: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/recommendations/${recId}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        // Refresh local recommendations to update UI state
        await fetchRecommendations();
      }
    } catch (e) {
      console.error('Action failed', e);
    }
  };

  // Maps an agent finding to a database recommendation based on type keywords
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <header className="px-8 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">AI Growth Agent</h1>
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold font-mono">
              <Sparkles className="w-2.5 h-2.5" /> AGENTIC ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Conversational payment diagnostics executing local analytical tools.</p>
        </div>
      </header>

      {/* Main Chat Flow */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950/40">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl rounded-xl p-5 ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
              }`}>
                {/* Standard Message text */}
                {!m.data && <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                {/* Agent Structured Response */}
                {m.data && (
                  <div className="space-y-6">
                    {/* Tool executions (Observability trace) */}
                    {m.data.toolCallsExecuted && m.data.toolCallsExecuted.length > 0 && (
                      <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
                        <button 
                          onClick={() => toggleTools(idx)}
                          className="w-full px-4 py-2 bg-slate-900/80 hover:bg-slate-900 flex justify-between items-center text-[10px] text-slate-400 font-mono font-semibold"
                        >
                          <span className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-violet-400" />
                            EXECUTIVE TRACE ({m.data.toolCallsExecuted.length} Tools)
                          </span>
                          {openToolsIndex[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        
                        {openToolsIndex[idx] && (
                          <div className="p-3 divide-y divide-slate-900 max-h-48 overflow-y-auto font-mono text-[9px] text-slate-400">
                            {m.data.toolCallsExecuted.map((tc: any, tIdx: number) => (
                              <div key={tIdx} className="py-2 first:pt-0 last:pb-0">
                                <div className="text-violet-400 flex items-center gap-1">
                                  <Play className="w-2 h-2 fill-current" /> {tc.toolName}()
                                </div>
                                <div className="pl-3 text-slate-500 mt-0.5">
                                  Params: {JSON.stringify(tc.inputParams)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendation Card */}
                    <div className="border-l-4 border-indigo-500 pl-4 space-y-4">
                      {/* Title / Finding */}
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Diagnostic Finding</span>
                        <h3 className="text-sm font-bold text-white leading-snug">{m.data.finding}</h3>
                      </div>

                      {/* Evidence */}
                      {m.data.evidence && m.data.evidence.length > 0 && (
                        <div>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Supporting Evidence</span>
                          <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                            {m.data.evidence.map((ev: string, eIdx: number) => (
                              <li key={eIdx}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Likely Cause */}
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Likely Cause</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{m.data.likelyCause}</p>
                      </div>

                      {/* Recommended Action */}
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Recommended Remediation</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{m.data.recommendedAction}</p>
                      </div>

                      {/* Financial Impact */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-950/40 rounded-lg p-3 border border-slate-800">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Est. Opportunity</span>
                          <span className="text-xs font-bold text-emerald-400">
                            ₹{m.data.estimatedOpportunity.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider">Confidence</span>
                          <span className="text-xs font-bold text-indigo-300">
                            {m.data.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Approval Workflow */}
                    {(() => {
                      const linkedRec = findLinkedRecommendation(m.data.finding);
                      if (!linkedRec) return null;

                      const isApproved = linkedRec.status === 'APPROVED';
                      const isRejected = linkedRec.status === 'REJECTED';
                      const isActioned = isApproved || isRejected;

                      return (
                        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-[9px] text-slate-500 font-mono">
                            Opportunity ID: <span className="font-semibold">{linkedRec.opportunityId.slice(0, 8)}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {isActioned ? (
                              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                                isApproved 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {isApproved ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                Recommendation {linkedRec.status}
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAction(linkedRec.id, 'reject')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 text-slate-400 rounded-lg hover:text-rose-400 hover:bg-slate-800 transition-colors text-xs font-semibold"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                                <button
                                  onClick={() => handleAction(linkedRec.id, 'approve')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-xs font-semibold"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                              </>
                            )}
                            <Link 
                              href={`/recommendations/${linkedRec.id}`} 
                              className="text-[10px] text-slate-500 hover:underline hover:text-slate-300 ml-1.5"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className={`text-[9px] text-slate-500 mt-2 ${isUser ? 'text-right' : ''}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading state indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 rounded-tl-none flex items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
              <span className="text-xs text-slate-400 font-mono">Running transaction SQL queries & reasoning...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts panel */}
      <div className="px-8 py-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap gap-2 flex-shrink-0">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center mr-1">Suggestions:</span>
        <button 
          onClick={() => handleSuggestion("Why did my payment success rate fall yesterday?")}
          className="text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-full px-3 py-1 hover:text-white transition-colors"
        >
          UPI Evening Failure Check
        </button>
        <button 
          onClick={() => handleSuggestion("What is wrong with my Netbanking success rate?")}
          className="text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-full px-3 py-1 hover:text-white transition-colors"
        >
          Netbanking Underperformance
        </button>
        <button 
          onClick={() => handleSuggestion("Analyze VIP customer transaction failures.")}
          className="text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-full px-3 py-1 hover:text-white transition-colors"
        >
          VIP Enterprise Failures
        </button>
      </div>

      {/* Textarea Input area */}
      <div className="p-6 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI Growth Copilot: e.g. Why did my UPI success rate drop?"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl p-3 flex items-center justify-center transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
