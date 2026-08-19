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

      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
      }}>
        <div style={{
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>

          {/* Left / Center Branding: Centered Wordmark with Restrained Descriptor */}
          <button
            onClick={() => setCurrentScreen('landing')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: 0,
              textAlign: 'left'
            }}
          >
            {/* Minimal line icon logo mark */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--text)',
              color: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              E
            </div>
            <div>
              <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.1 }}>
                EvidenceOS
              </div>
              <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '1px' }}>
                Autonomous Evidence Investigation
              </div>
            </div>
          </button>

          {/* Right Navigation Actions */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setCurrentScreen('landing')}
              className="btn-secondary"
              style={{
                fontSize: '13px',
                color: currentScreen === 'landing' ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: currentScreen === 'landing' ? 600 : 400,
                border: currentScreen === 'landing' ? '1px solid var(--text-muted)' : '1px solid var(--border)'
              }}
            >
              All Cases
            </button>

            {/* Prominent Primary Blue Action for New Investigation */}
            <button
              onClick={() => setCurrentScreen('submit')}
              className="btn-primary"
              style={{ fontSize: '13px' }}
            >
              + New Investigation
            </button>
          </nav>
        </div>
      </header>

      {/* ── Main Screen Container ─────────────────────────────────── */}
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
        backgroundColor: 'var(--surface)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        EvidenceOS &bull; Autonomous Evidence Acquisition Platform &bull; Base Sepolia Testnet (Chain ID 84532)
      </footer>
    </div>
  );
};
