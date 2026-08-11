import React, { useState } from 'react';

interface SubmitClaimScreenProps {
  onSubmit: (claim: string, budgetUsdc: number) => void;
  onBack: () => void;
  loading: boolean;
}

export const SubmitClaimScreen: React.FC<SubmitClaimScreenProps> = ({ onSubmit, onBack, loading }) => {
  const [claim, setClaim] = useState('');
  const [budgetUsdc, setBudgetUsdc] = useState(0.002);

  const sampleClaims = [
    'Acme Corp completed a $5.8B acquisition of CyberShield Security in 2026',
    'Tesla misses on earnings as free cash flow turns negative and margins slide',
    'OpenAI launched GPT-5 preview model with native real-time Web3 wallet signing'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;
    onSubmit(claim.trim(), budgetUsdc);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button
        onClick={onBack}
        className="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors"
      >
        ← Back to Landing Page
      </button>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Submit New Claim Investigation</h2>
          <p className="text-slate-400 text-sm">
            Enter any financial, corporate, or news claim. AI agents will decompose it into sub-questions and buy evidence via x402.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Claim Input Area */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Claim Text to Verify
            </label>
            <textarea
              id="claim-text-input"
              rows={4}
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="e.g. Acme Corp completed a $5.8B acquisition of CyberShield Security in 2026..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm font-sans"
              required
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Quick Samples</label>
            <div className="flex flex-wrap gap-2">
              {sampleClaims.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setClaim(sample)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors text-left truncate max-w-full"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Budget Picker Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-white">
                  Max USDC Budget Limit
                </label>
                <p className="text-slate-400 text-xs">
                  0/1 Knapsack Optimizer selects highest-value sources within this limit.
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-cyan-400 text-xl font-bold">
                  ${budgetUsdc.toFixed(4)} USDC
                </span>
              </div>
            </div>

            {/* Budget Presets */}
            <div className="grid grid-cols-4 gap-3">
              {[0.001, 0.002, 0.005, 0.010].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBudgetUsdc(amount)}
                  className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all border ${
                    budgetUsdc === amount
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ${amount.toFixed(3)}
                </button>
              ))}
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.001"
              max="0.010"
              step="0.001"
              value={budgetUsdc}
              onChange={(e) => setBudgetUsdc(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Submit CTA */}
          <button
            id="launch-investigation-btn"
            type="submit"
            disabled={loading || !claim.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Initializing Agent Workflow...
              </>
            ) : (
              <>Launch Autonomous Investigation (${budgetUsdc.toFixed(4)} USDC Max) →</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
