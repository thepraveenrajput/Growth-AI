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
        await fetchRecommendations();
      }
    } catch (e) {
      console.error('Action failed', e);
    }
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <header className="px-8 py-5 bg-zinc-900/40 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">AI Growth Copilot</h1>
            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/5 text-amber-500 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)] px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              <Sparkles className="w-2.5 h-2.5" /> SYSTEM ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">DECISION-SUPPORT CONVERSATIONAL DIAGNOSTICS</p>
        </div>
      </header>

      {/* Main Chat Flow */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950/20">
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          
          if (isUser) {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-xl rounded-xl p-4 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-none shadow-sm">
                  <p className="text-xs leading-relaxed">{m.text}</p>
                  <div className="text-[8px] text-zinc-500 font-mono mt-2 text-right">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          }

          // Agent response - inline document style, not a speech bubble
          return (
            <div key={idx} className="flex justify-start w-full max-w-3xl">
              <div className="w-full space-y-6">
                
                {/* Intro greeting text (only if not returning data) */}
                {!m.data && (
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 rounded-tl-none text-zinc-300 text-xs leading-relaxed">
                    {m.text}
                  </div>
                )}

                {/* Agent Structured Response */}
                {m.data && (
                  <div className="space-y-6">
                    {/* Tool executions (Observability macOS Terminal window) */}
                    {m.data.toolCallsExecuted && m.data.toolCallsExecuted.length > 0 && (
                      <div className="border border-zinc-850 rounded-lg bg-zinc-950 overflow-hidden shadow-md">
                        <div 
                          onClick={() => toggleTools(idx)}
                          className="w-full px-4 py-2 bg-zinc-900/40 flex justify-between items-center text-[9px] text-zinc-400 font-mono font-bold cursor-pointer select-none border-b border-zinc-850"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                            <span className="ml-1.5 flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-amber-400" />
                              copilot-diagnostics-trace
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] px-1 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded">
                              {m.data.toolCallsExecuted.length} calls
                            </span>
                            {openToolsIndex[idx] ? <ChevronUp className="w-3 h-3 text-zinc-500" /> : <ChevronDown className="w-3 h-3 text-zinc-500" />}
                          </div>
                        </div>
                        
                        {openToolsIndex[idx] && (
                          <div className="p-4 divide-y divide-zinc-900/60 max-h-48 overflow-y-auto font-mono text-[9px] text-zinc-400 bg-zinc-950">
                            {m.data.toolCallsExecuted.map((tc: any, tIdx: number) => (
                              <div key={tIdx} className="py-2.5 first:pt-0 last:pb-0">
                                <div className="text-amber-400 flex items-center gap-1 font-semibold">
                                  <Play className="w-2.5 h-2.5 fill-current" /> {tc.toolName}()
                                </div>
                                <div className="pl-3.5 text-zinc-500 mt-1">
                                  args: {JSON.stringify(tc.inputParams)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Handcrafted Report Document with gold left border */}
                    <div className="border-l-2 border-amber-500 pl-6 space-y-6">
                      {/* Section 1: Finding */}
                      <div>
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono block mb-1">Diagnostic Finding</span>
                        <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{m.data.finding}</h3>
                      </div>

                      {/* Section 2: Evidence */}
                      {m.data.evidence && m.data.evidence.length > 0 && (
                        <div>
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono block mb-1.5">Supporting Evidence</span>
                          <ul className="space-y-1.5 text-xs text-zinc-300">
                            {m.data.evidence.map((ev: string, eIdx: number) => (
                              <li key={eIdx} className="flex items-start gap-2">
                                <span className="text-amber-500 select-none mt-0.5 font-mono">▸</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Section 3: Cause */}
                      <div>
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono block mb-1">Likely Cause</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{m.data.likelyCause}</p>
                      </div>

                      {/* Section 4: Action */}
                      <div>
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono block mb-1">Recommended Action</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{m.data.recommendedAction}</p>
                      </div>

                      {/* Grid Data card */}
                      <div className="grid grid-cols-2 gap-4 bg-zinc-900/60 rounded-lg p-4 border border-zinc-900 max-w-md shadow-sm">
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider font-semibold">Lost volume leak</span>
                          <span className="text-sm font-bold text-emerald-400 tracking-tight">
                            ₹{m.data.estimatedOpportunity.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider font-semibold">Reasoning Confidence</span>
                          <span className="text-sm font-bold text-zinc-300 tracking-tight">
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
                        <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-[9px] text-zinc-500 font-mono">
                            Opportunity ID: <span className="font-semibold">{linkedRec.opportunityId.slice(0, 8)}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {isActioned ? (
                              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border ${
                                isApproved 
                                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-950/20 text-rose-400 border-rose-500/20'
                              }`}>
                                {isApproved ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                Action {linkedRec.status}
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAction(linkedRec.id, 'reject')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-zinc-800 text-zinc-400 rounded-lg hover:text-rose-400 hover:bg-zinc-900 transition-colors text-xs font-bold"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                                <button
                                  onClick={() => handleAction(linkedRec.id, 'approve')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 rounded-lg transition-all text-xs font-bold shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                              </>
                            )}
                            <Link 
                              href={`/recommendations/${linkedRec.id}`} 
                              className="text-[10px] text-zinc-500 hover:underline hover:text-zinc-300 ml-1.5 font-mono"
                            >
                              [DETAILS]
                            </Link>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="text-[8px] text-zinc-500 font-mono pt-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading state indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
              <span className="text-xs text-zinc-500 font-mono">Running transaction SQL queries & reasoning...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts panel */}
      <div className="px-8 py-3 bg-zinc-950/60 border-t border-zinc-900 flex flex-wrap gap-2 flex-shrink-0">
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center mr-1">Suggestions:</span>
        <button 
          onClick={() => handleSuggestion("Why did my payment success rate fall yesterday?")}
          className="text-[10px] bg-zinc-900/50 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-full px-3 py-1 hover:text-white transition-colors"
        >
          UPI Evening Failure
        </button>
        <button 
          onClick={() => handleSuggestion("What is wrong with my Netbanking success rate?")}
          className="text-[10px] bg-zinc-900/50 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-full px-3 py-1 hover:text-white transition-colors"
        >
          Netbanking Conversion
        </button>
        <button 
          onClick={() => handleSuggestion("Analyze VIP customer transaction failures.")}
          className="text-[10px] bg-zinc-900/50 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-full px-3 py-1 hover:text-white transition-colors"
        >
          VIP Enterprise Failures
        </button>
      </div>

      {/* Input area */}
      <div className="p-6 bg-zinc-900/30 border-t border-zinc-900 flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI Growth Copilot: e.g. Why did my UPI success rate drop?"
            className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 disabled:opacity-40 text-zinc-300 rounded-xl p-3 flex items-center justify-center transition-all duration-200"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
