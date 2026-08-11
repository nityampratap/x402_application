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

  const handleStartNew = () => setCurrentScreen('submit');

  const handleSelectInvestigation = async (inv: Investigation) => {
    setLoading(true);
    try {
      const full = await getInvestigation(inv.id);
      setCurrentInvestigation(full);
      setSelectedInvestigationId(full.id);
      setCurrentScreen(full.status === 'COMPLETED' ? 'report' : 'activity');
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Navbar ───────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>

          {/* Wordmark */}
          <button
            onClick={() => setCurrentScreen('landing')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: 0 }}
          >
            {/* Logo mark — a simple wax-seal circle */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
              <circle cx="16" cy="16" r="15" stroke="#A3311F" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="10" stroke="#A3311F" strokeWidth="1"/>
              <text x="16" y="20" textAnchor="middle" fill="#A3311F" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">EOS</text>
            </svg>
            <div>
              <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.01em', lineHeight: 1 }}>
                EvidenceOS
              </div>
              <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Base Sepolia / 84532
              </div>
            </div>
          </button>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentScreen('landing')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 12px',
                fontSize: '12px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                color: currentScreen === 'landing' ? 'var(--text)' : 'var(--text-muted)',
                borderBottom: currentScreen === 'landing' ? '1px solid var(--text)' : '1px solid transparent',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Case Files
            </button>
            <button
              onClick={() => setCurrentScreen('submit')}
              style={{
                padding: '7px 16px',
                fontSize: '12px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--bg)',
                background: 'var(--text)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              New Investigation
            </button>
          </nav>
        </div>
      </header>

      {/* ── Screen Container ─────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: '72rem', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {currentScreen === 'landing' && (
          <LandingScreen onStartNew={handleStartNew} onSelectInvestigation={handleSelectInvestigation} />
        )}
        {currentScreen === 'submit' && (
          <SubmitClaimScreen onSubmit={handleSubmitClaim} onBack={() => setCurrentScreen('landing')} loading={loading} />
        )}
        {currentScreen === 'activity' && selectedInvestigationId && (
          <LiveActivityScreen investigationId={selectedInvestigationId} onViewReport={handleViewReportFromActivity} />
        )}
        {currentScreen === 'report' && currentInvestigation && (
          <FinalReportScreen investigation={currentInvestigation} onNewInvestigation={handleStartNew} />
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1rem 1.5rem',
        textAlign: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: 'var(--text-dim)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        EvidenceOS &bull; Autonomous Evidence Acquisition &bull; x402 Protocol &bull; Base Sepolia Testnet
      </footer>
    </div>
  );
};
