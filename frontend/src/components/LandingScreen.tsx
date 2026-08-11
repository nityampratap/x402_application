import React, { useEffect, useState } from 'react';
import { Investigation } from '../types';
import { listInvestigations } from '../services/api';

interface LandingScreenProps {
  onStartNew: () => void;
  onSelectInvestigation: (inv: Investigation) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStartNew, onSelectInvestigation }) => {
  const [history, setHistory] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInvestigations()
      .then((data) => setHistory(data))
      .catch((err) => console.error('Failed to load history:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            x402 Protocol & Autonomous Micropayments
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Autonomous Evidence Purchasing & <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Truth Verification</span>
          </h1>

          <p className="text-slate-300 text-lg leading-relaxed">
            EvidenceOS uses AI agents to evaluate claim validity, perform exact 0/1 Knapsack budget allocation, and execute on-chain x402 micropayments to purchase verified evidence from paywalled registries.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              id="start-investigation-btn"
              onClick={onStartNew}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Start New Investigation →
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 mt-12 border-t border-slate-800/80">
          <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-cyan-400 text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-white mb-1">x402 Paywall Settlement</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Real EIP-712 payment authorization signed on Base Sepolia testnet.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-cyan-400 text-2xl mb-2">🎯</div>
            <h3 className="font-bold text-white mb-1">0/1 Knapsack Budgeting</h3>
            <p className="text-slate-400 text-xs leading-relaxed">LLM evaluates source value scores (0-100) and selects the optimal subset within budget.</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/60">
            <div className="text-cyan-400 text-2xl mb-2">🛡️</div>
            <h3 className="font-bold text-white mb-1">On-Chain Audit Trail</h3>
            <p className="text-slate-400 text-xs leading-relaxed">Every purchased evidence item links to verified transaction hashes on BaseScan.</p>
          </div>
        </div>
      </section>

      {/* History & Previous Runs Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📜 Recent Investigations History
          </h2>
          <span className="text-slate-400 text-xs font-mono">{history.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            Loading investigation history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <p>No investigations found yet.</p>
            <button
              onClick={onStartNew}
              className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm underline"
            >
              Create your first investigation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((inv) => (
              <div
                key={inv.id}
                onClick={() => onSelectInvestigation(inv)}
                className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                      inv.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}>
                      {inv.status}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      {new Date(inv.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold group-hover:text-cyan-300 transition-colors line-clamp-1">
                    "{inv.claim_text}"
                  </h3>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <div className="text-slate-400 text-xs">Total Spend</div>
                    <div className="font-mono text-cyan-400 font-bold">${(inv.total_spend_usdc || 0).toFixed(4)} USDC</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs">Confidence</div>
                    <div className="font-mono text-emerald-400 font-bold">
                      {inv.overall_confidence_score !== null ? `${(inv.overall_confidence_score * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="text-slate-500 group-hover:text-cyan-400 text-lg transition-transform group-hover:translate-x-1">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
