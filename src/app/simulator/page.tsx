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

  const handleSliderChange = () => {
    runSimulation();
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="px-8 py-7 bg-zinc-900/40 border-b border-zinc-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Revenue Simulator</h1>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">DETERMINISTIC VALUE FORECASTING MODEL</p>
        </div>
      </header>

      {/* Main Grid */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl w-full mx-auto">
        {/* Sliders Control Panel */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 shadow-sm lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-zinc-900">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Parameters</h3>
          </div>

          {baseline && (
            <div className="text-[9px] text-zinc-500 bg-zinc-950 p-3 rounded-lg border border-zinc-900 font-mono leading-relaxed">
              <span className="font-bold text-zinc-400 block mb-1.5 uppercase">Historic baseline (30d):</span>
              Success: <span className="text-zinc-200 font-bold">{baseline.successRate}%</span> <br/>
              Orders: <span className="text-zinc-200 font-bold">{baseline.transactionCount.toLocaleString()}</span> <br/>
              Avg Order: <span className="text-zinc-200 font-bold">₹{Math.round(baseline.averageTransactionValue)}</span>
            </div>
          )}

          {/* Slider 1: Target Success Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-zinc-400 font-medium text-[11px]">Target Success Rate</label>
              <span className="font-mono font-bold text-amber-500 text-xs">{successRate}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="99"
              step="0.1"
              value={successRate}
              onChange={(e) => setSuccessRate(parseFloat(e.target.value))}
              onMouseUp={handleSliderChange}
              onTouchEnd={handleSliderChange}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
              <span>75%</span>
              <span>Baseline: {baseline?.successRate ?? '91.8'}%</span>
              <span>99%</span>
            </div>
          </div>

          {/* Slider 2: Transaction Count */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-zinc-400 font-medium text-[11px]">Monthly Order Volume</label>
              <span className="font-mono font-bold text-amber-500 text-xs">{transactionCount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="150000"
              step="1000"
              value={transactionCount}
              onChange={(e) => setTransactionCount(parseInt(e.target.value, 10))}
              onMouseUp={handleSliderChange}
              onTouchEnd={handleSliderChange}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
              <span>10K</span>
              <span>150K</span>
            </div>
          </div>

          {/* Slider 3: Average Transaction Value */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-zinc-400 font-medium text-[11px]">Avg Order Ticket (INR)</label>
              <span className="font-mono font-bold text-amber-500 text-xs">₹{averageAmount}</span>
            </div>
            <input
              type="range"
              min="100"
              max="15000"
              step="50"
              value={averageAmount}
              onChange={(e) => setAverageAmount(parseInt(e.target.value, 10))}
              onMouseUp={handleSliderChange}
              onTouchEnd={handleSliderChange}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
              <span>₹100</span>
              <span>₹15K</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={runSimulation}
              className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reset Simulator
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300 font-mono">{error}</div>
            </div>
          )}

          {simulation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Additional Transactions */}
              <div className="bg-zinc-900/50 border border-zinc-900 border-t-2 border-t-zinc-500 rounded-lg p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-2 font-semibold">Additional Successful Orders</span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    +{simulation.additionalSuccessfulTransactions.toLocaleString()}
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-500 mt-2">DUE TO SYSTEM FRICTION REMOVAL</p>
                </div>
              </div>

              {/* Card 2: Revenue Recovery (Glowing top border) */}
              <div className="border border-amber-500/10 border-t-2 border-t-amber-500 bg-amber-500/[0.01] rounded-lg p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl" />
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-mono tracking-wider block mb-2 font-semibold">Estimated Revenue recovery</span>
                  <h3 className="text-2xl font-black text-amber-500 tracking-tight">
                    ₹{simulation.estimatedAdditionalVolume.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-500 mt-2">POTENTIAL GMV RESTORED</p>
                </div>
              </div>

              {/* Formula & Disclaimer block */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6 shadow-sm md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Formula Logic</h4>
                <div className="text-[10px] text-zinc-400 bg-zinc-950 p-4 rounded-lg font-mono leading-relaxed space-y-2 border border-zinc-900">
                  <div>
                    1. Target Success Rate: <span className="text-amber-500 font-bold">{simulation.targetSuccessRate}%</span> (Baseline: {baseline?.successRate}%)
                  </div>
                  <div>
                    2. Additional Successful Orders = <span className="text-zinc-200">({simulation.targetSuccessRate}% - {baseline?.successRate}%) × {simulation.inputTransactionCount.toLocaleString()}</span>
                  </div>
                  <div>
                    3. Estimated Recovery = <span className="text-zinc-200">Additional Successful Orders × ₹{simulation.inputAverageTransactionValue}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[9px] leading-relaxed text-zinc-500 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Disclaimer: This is a forecasting simulation. Actual results are dependent on acquirer gateway downtimes, fraud filters, and credit card network response patterns.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-700">
              <RefreshCw className="w-7 h-7 animate-spin text-zinc-800 mb-2" />
              <p className="text-xs font-mono uppercase">Computing simulation tables...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
