import React, { useState } from 'react';

interface ClaimInputProps {
  onSubmit: (claimText: string) => Promise<void>;
  loading: boolean;
}

export const ClaimInput: React.FC<ClaimInputProps> = ({ onSubmit, loading }) => {
  const [claimText, setClaimText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() || loading) return;
    await onSubmit(claimText.trim());
  };

  const setSampleClaim = (sample: string) => {
    setClaimText(sample);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl mb-8">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <span className="text-cyan-400">🛡️</span> Submit Claim for Autonomous Investigation
      </h2>
      <p className="text-slate-400 text-sm mb-4">
        Enter a claim to trigger LangGraph agent planning, free open-web search, and automated x402 testnet USDC paywalled evidence purchasing.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
            placeholder="e.g. Acme Corporation acquired TechStartup XYZ for $50M in Q2 2025"
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-all font-sans h-28"
            required
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-500 self-center font-medium">Try Sample Claims:</span>
            <button
              type="button"
              onClick={() => setSampleClaim("Acme Corp completed acquisition of Startup XYZ for $50M")}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-md transition-colors"
            >
              M&A Acquisition Claim
            </button>
            <button
              type="button"
              onClick={() => setSampleClaim("Global Health Inc received FDA approval for Drug X in 2025")}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-md transition-colors"
            >
              Regulatory Approval Claim
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !claimText.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Dispatching Agents...' : '🚀 Start Investigation'}
          </button>
        </div>
      </form>
    </div>
  );
};
