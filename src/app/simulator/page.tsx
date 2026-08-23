'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, RefreshCw, AlertCircle, Play, DollarSign,
  ChevronRight, ArrowRight, CheckCircle2, Sliders
} from 'lucide-react';

export default function Simulator() {
  const [successRate, setSuccessRate] = useState(91.8);
  const [transactionCount, setTransactionCount] = useState(50000);
  const [averageAmount, setAverageAmount] = useState(850);
  
  const [loading, setLoading] = useState(false);
  const [baseline, setBaseline] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionCount: transactionCount,
          targetSuccessRate: successRate,
          averageTransactionValue: averageAmount
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to run revenue simulation');
      }

      const data = await res.json();
      setBaseline(data.baseline);
      setSimulation(data.simulation);
      
      // Keep state in sync with baseline if first run
      if (!baseline) {
        setSuccessRate(data.baseline.successRate);
        setTransactionCount(data.baseline.transactionCount);
        setAverageAmount(data.baseline.averageTransactionValue);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  // Run simulation whenever values change
  const handleSliderChange = () => {
    runSimulation();
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="px-8 py-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">What-If Revenue Simulator</h1>
          <p className="text-xs text-slate-400">Interactive revenue forecasting based on historical transaction baseline parameters.</p>
        </div>
      </header>

      {/* Main Grid */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">Simulation Parameters</h3>
          </div>

          {baseline && (
            <div className="text-[10px] text-slate-500 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="font-semibold text-slate-400 block mb-1">Baseline 30-day metrics:</span>
              Success Rate: <span className="text-slate-300 font-bold">{baseline.successRate}%</span> | 
              Count: <span className="text-slate-300 font-bold">{baseline.transactionCount.toLocaleString()}</span> | 
              Avg Amount: <span className="text-slate-300 font-bold">₹{Math.round(baseline.averageTransactionValue)}</span>
            </div>
          )}

          {/* Slider 1: Target Success Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-medium">Target Success Rate</label>
              <span className="font-mono font-bold text-indigo-400 text-sm">{successRate}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="99"
              step="0.1"
              value={successRate}
              onChange={(e) => {
                setSuccessRate(parseFloat(e.target.value));
              }}
              onMouseUp={handleSliderChange}
              onTouchEnd={handleSliderChange}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>75%</span>
              <span>Baseline: {baseline?.successRate ?? '91.8'}%</span>
              <span>99%</span>
            </div>
          </div>

          {/* Slider 2: Transaction Count */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-medium">Monthly Transactions</label>
              <span className="font-mono font-bold text-indigo-400 text-sm">{transactionCount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="150000"
              step="1000"
              value={transactionCount}
              onChange={(e) => {
                setTransactionCount(parseInt(e.target.value, 10));
              }}
              onMouseUp={handleSliderChange}
              onTouchEnd={handleSliderChange}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>10K</span>
              <span>150K</span>
            </div>
          </div>

          {/* Slider 3: Average Transaction Value */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-medium">Avg Transaction Value</label>
              <span className="font-mono font-bold text-indigo-400 text-sm">₹{averageAmount}</span>
            </div>
            <input
              type="range"
              min="100"
              max="15000"
              step="50"
              value={averageAmount}
              onChange={(e) => {
                setAverageAmount(parseInt(e.target.value, 10));
              }}
              onMouseUp={handleSliderChange}
              onTouchEnd={handleSliderChange}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>₹100</span>
              <span>₹15K</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={runSimulation}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Simulation
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300">{error}</div>
            </div>
          )}

          {simulation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Additional Transactions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold tracking-wider block mb-2">Additional Successful Transactions</span>
                  <h3 className="text-3xl font-extrabold text-white">
                    +{simulation.additionalSuccessfulTransactions.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-2">Unlocking payment success and reducing user drop-off friction.</p>
                </div>
              </div>

              {/* Card 2: Revenue Recovery */}
              <div className="bg-slate-900 border border-indigo-900/60 rounded-xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
                <div>
                  <span className="text-[10px] text-indigo-300 uppercase font-mono font-semibold tracking-wider block mb-2">Estimated Revenue Opportunity</span>
                  <h3 className="text-3xl font-black text-indigo-400">
                    ₹{simulation.estimatedAdditionalVolume.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-indigo-300/60 mt-2">Potential additional successful transaction volume recovery.</p>
                </div>
              </div>

              {/* Formula & Disclaimer block */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-white">Simulator Calculations Model</h4>
                <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-lg font-mono leading-relaxed space-y-2 border border-slate-850">
                  <div>
                    1. Target Success Rate Increase: <span className="text-indigo-400 font-bold">{simulation.targetSuccessRate}%</span> (Baseline: {baseline?.successRate}%)
                  </div>
                  <div>
                    2. Additional Successful Orders = <span className="text-slate-200">({simulation.targetSuccessRate}% - {baseline?.successRate}%) × {simulation.inputTransactionCount.toLocaleString()}</span>
                  </div>
                  <div>
                    3. Estimated Recovery = <span className="text-slate-200">Additional Successful Orders × ₹{simulation.inputAverageTransactionValue}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-[10px] text-slate-500">
                  <AlertCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <b>Estimate Disclaimer:</b> {simulation.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-700 mb-2" />
              <p className="text-xs">Computing simulation tables...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
