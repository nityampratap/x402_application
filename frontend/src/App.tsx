import React, { useState, useEffect } from 'react';
import { ClaimInput } from './components/ClaimInput';
import { Timeline } from './components/Timeline';
import { PaymentAudit } from './components/PaymentAudit';
import { ConfidenceCard } from './components/ConfidenceCard';
import { createInvestigation, getInvestigation, subscribeToInvestigationSSE } from './services/api';
import { Investigation, PaymentLog, EvidenceItem } from './types';

export const App: React.FC = () => {
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [sseEvents, setSseEvents] = useState<Array<{ type: string; timestamp: string; payload: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'payments'>('timeline');

  const handleClaimSubmit = async (claimText: string) => {
    setLoading(true);
    setSseEvents([]);
    try {
      const newInv = await createInvestigation(claimText);
      setCurrentInvestigation(newInv);

      // Subscribe to SSE stream for live updates
      const unsubscribe = subscribeToInvestigationSSE(newInv.id, (eventType, data) => {
        setSseEvents((prev) => [...prev, { type: eventType, timestamp: data.timestamp, payload: data.payload }]);
        
        // Refresh investigation snapshot on state changes
        if (eventType === 'STATE_CHANGE') {
          getInvestigation(newInv.id).then(updated => {
            if (updated) setCurrentInvestigation(updated);
          });
        }
      });

      // Cleanup subscription on unmount / next claim
      return () => unsubscribe();
    } catch (err: any) {
      alert(`Investigation creation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-lg shadow-cyan-500/20">
              eOS
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                EvidenceOS
                <span className="text-xs font-mono font-normal bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded">
                  Base Sepolia (84532)
                </span>
              </h1>
              <p className="text-slate-400 text-xs">
                Autonomous Evidence-Purchasing & Verification Platform (x402 Protocol)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              x402 Protocol Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ClaimInput onSubmit={handleClaimSubmit} loading={loading} />

        {currentInvestigation && (
          <>
            <ConfidenceCard
              investigation={currentInvestigation}
              evidenceItems={currentInvestigation.evidence_items || []}
            />

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 mb-6">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'timeline'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📋 Investigation Timeline & Events
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ x402 Micropayment Ledger ({currentInvestigation.payment_logs?.length || 0})
              </button>
            </div>

            {activeTab === 'timeline' ? (
              <Timeline investigation={currentInvestigation} events={sseEvents} />
            ) : (
              <PaymentAudit paymentLogs={currentInvestigation.payment_logs || []} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
