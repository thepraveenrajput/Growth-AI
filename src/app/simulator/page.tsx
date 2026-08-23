'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

export default function Simulator() {
  const [successRate, setSuccessRate] = useState(91.8);
  const [transactionCount, setTransactionCount] = useState(48420);
  const [averageAmount, setAverageAmount] = useState(842);
  
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
      
      // Auto-load values from database on first run
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

  const formatLakhs = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-zinc-950">
      
      {/* Header */}
      <header className="px-8 py-7 bg-zinc-900 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Revenue Simulator</h1>
          <p className="text-[10px] text-zinc-550 font-mono mt-0.5">DETERMINISTIC VALUE FORECASTING MODEL</p>
        </div>
      </header>

      {/* Main Workspace Grid (Section 15 layout) */}
      <section className="p-8 flex-1 max-w-5xl w-full mx-auto">
        {error && (
          <div className="bg-rose-950/10 border border-rose-900/30 rounded p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-450 mt-0.5" />
            <div className="text-xs text-rose-300 font-mono">{error}</div>
          </div>
        )}

        {baseline && simulation ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-zinc-900 bg-zinc-950 rounded-lg overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-zinc-900">
            
            {/* Column 1: Current Performance (Left) */}
            <div className="p-8 space-y-6">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono border-b border-zinc-900 pb-2">
                Current Performance
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] text-zinc-550 block font-mono uppercase font-semibold">Success rate</span>
                  <span className="text-base font-bold text-zinc-200 font-mono">
                    {baseline.successRate}%
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-zinc-550 block font-mono uppercase font-semibold">Attempted Transactions</span>
                  <span className="text-base font-bold text-zinc-200 font-mono">
                    {baseline.transactionCount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-zinc-550 block font-mono uppercase font-semibold">Avg. Transaction Value</span>
                  <span className="text-base font-bold text-zinc-200 font-mono">
                    ₹{baseline.averageTransactionValue.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Target Success Rate slider (Center) */}
            <div className="p-8 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono border-b border-zinc-900 pb-2">
                  Simulation Target
                </h3>
                
                {/* Target success rate slider */}
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Target Success Rate</span>
                    <span className="font-bold text-amber-500">{successRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="85"
                    max="99"
                    step="0.1"
                    value={successRate}
                    onChange={(e) => setSuccessRate(parseFloat(e.target.value))}
                    onMouseUp={handleSliderChange}
                    onTouchEnd={handleSliderChange}
                    className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-650 font-mono">
                    <span>85.0%</span>
                    <span>Baseline: {baseline.successRate}%</span>
                    <span>99.0%</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900 mt-6">
                <button
                  onClick={runSimulation}
                  className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-350 text-[10px] font-mono uppercase font-bold rounded transition-colors"
                >
                  Reset Parameters
                </button>
              </div>
            </div>

            {/* Column 3: Estimated Impact (Right) */}
            <div className="p-8 space-y-6 bg-zinc-900/10">
              <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono border-b border-zinc-900 pb-2">
                Estimated Impact
              </h3>

              <div className="space-y-6">
                <div>
                  <span className="text-[8px] text-zinc-500 block font-mono uppercase font-semibold">Successful payments</span>
                  <span className="text-xl font-bold text-white tracking-tight">
                    +{simulation.additionalSuccessfulTransactions.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-zinc-550 block font-mono mt-0.5">additional payments</span>
                </div>

                <div>
                  <span className="text-[8px] text-zinc-500 block font-mono uppercase font-semibold">Additional payment volume</span>
                  <span className="text-xl font-black text-amber-500 tracking-tight">
                    {formatLakhs(simulation.estimatedAdditionalVolume)}
                  </span>
                  <span className="text-[9px] text-zinc-550 block font-mono mt-0.5">restored revenue</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <RefreshCw className="w-5 h-5 animate-spin text-zinc-550 mb-2" />
            <p className="text-xs font-mono uppercase">Computing simulation forecasts...</p>
          </div>
        )}

        {/* Disclaimer footer */}
        <div className="mt-6 flex items-start gap-2.5 text-[9px] leading-relaxed text-zinc-500 font-mono max-w-2xl">
          <AlertCircle className="w-4 h-4 text-zinc-650 flex-shrink-0 mt-0.5" />
          <p>
            Estimate based on historical transaction patterns. Actual volume recovery is subject to card issuer authentication levels, gateway integration types, and customer retry rates.
          </p>
        </div>
      </section>
    </div>
  );
}
