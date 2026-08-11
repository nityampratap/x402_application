import React, { useState } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { SubmitClaimScreen } from './components/SubmitClaimScreen';
import { LiveActivityScreen } from './components/LiveActivityScreen';
import { FinalReportScreen } from './components/FinalReportScreen';
import { createInvestigation, getInvestigation } from './services/api';
import { Investigation } from './types';

type ScreenType = 'landing' | 'submit' | 'activity' | 'report';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartNew = () => {
    setCurrentScreen('submit');
  };

  const handleSelectInvestigation = async (inv: Investigation) => {
    setLoading(true);
    try {
      const full = await getInvestigation(inv.id);
      setCurrentInvestigation(full);
      setSelectedInvestigationId(full.id);
      if (full.status === 'COMPLETED') {
        setCurrentScreen('report');
      } else {
        setCurrentScreen('activity');
      }
    } catch (err) {
      console.error('Failed to load investigation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (claimText: string, budgetUsdc: number) => {
    setLoading(true);
    try {
      const newInv = await createInvestigation(claimText, budgetUsdc);
      setCurrentInvestigation(newInv);
      setSelectedInvestigationId(newInv.id);
      setCurrentScreen('activity');
    } catch (err: any) {
      alert(`Investigation submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReportFromActivity = async (inv: Investigation) => {
    try {
      const full = await getInvestigation(inv.id);
      setCurrentInvestigation(full);
      setCurrentScreen('report');
    } catch (err) {
      console.error('Failed to fetch report:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div
            onClick={() => setCurrentScreen('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              eOS
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                EvidenceOS
                <span className="text-[10px] font-mono font-normal bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded">
                  Base Sepolia (84532)
                </span>
              </h1>
              <p className="text-slate-400 text-xs">
                Autonomous Evidence-Purchasing & Verification Platform
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen('landing')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'landing' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setCurrentScreen('submit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentScreen === 'submit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
              }`}
            >
              + New Investigation
            </button>
          </nav>
        </div>
      </header>

      {/* Screen Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {currentScreen === 'landing' && (
          <LandingScreen
            onStartNew={handleStartNew}
            onSelectInvestigation={handleSelectInvestigation}
          />
        )}

        {currentScreen === 'submit' && (
          <SubmitClaimScreen
            onSubmit={handleSubmitClaim}
            onBack={() => setCurrentScreen('landing')}
            loading={loading}
          />
        )}

        {currentScreen === 'activity' && selectedInvestigationId && (
          <LiveActivityScreen
            investigationId={selectedInvestigationId}
            onViewReport={handleViewReportFromActivity}
          />
        )}

        {currentScreen === 'report' && currentInvestigation && (
          <FinalReportScreen
            investigation={currentInvestigation}
            onNewInvestigation={handleStartNew}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        EvidenceOS Autonomous Platform &bull; Powered by x402 Micropayments &amp; Base Sepolia Testnet
      </footer>
    </div>
  );
};
