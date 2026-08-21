import React, { useEffect, useState } from 'react';
import { Investigation } from '../types';
import { listInvestigations } from '../services/api';

interface LandingScreenProps {
  onStartNew: () => void;
  onSelectInvestigation: (inv: Investigation) => void;
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  COMPLETED:      { label: 'Verified & Closed', bg: 'var(--success-light)', color: 'var(--success)', border: '#C2E0D1' },
  IN_PROGRESS:    { label: 'Executing',          bg: 'var(--accent-light)',  color: 'var(--accent)',  border: '#CBE0FE' },
  PLANNING:       { label: 'Planning',           bg: '#F5F3EF',              color: 'var(--text-muted)', border: 'var(--border)' },
  AGENT_DISPATCH: { label: 'Dispatched',         bg: '#F5F3EF',              color: 'var(--text-muted)', border: 'var(--border)' },
  SCORING:        { label: 'Scoring',            bg: '#F5F3EF',              color: 'var(--text-muted)', border: 'var(--border)' },
  FAILED:         { label: 'Failed',             bg: 'var(--danger-light)',  color: 'var(--danger)',  border: '#F8C8C4' },
};

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStartNew, onSelectInvestigation }) => {
  const [history, setHistory] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchDetails, setShowArchDetails] = useState(false);

  useEffect(() => {
    listInvestigations()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '3rem' }}>

      {/* ── 1. HERO SECTION (Hackviser Hero Pattern with Real Product Screenshot) ── */}
      <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        {/* Top Eyebrow Tag */}
        <div className="chip-primary" style={{ marginBottom: '1.25rem' }}>
          <span>★</span> Autonomous AI Agent Verification Platform
        </div>

        {/* Main Display Headline */}
        <h1 className="font-display" style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
          fontWeight: 600,
          lineHeight: 1.12,
          color: 'var(--text)',
          margin: '0 0 1.25rem',
          maxWidth: '22ch'
        }}>
          Autonomous Evidence <span style={{ color: 'var(--accent)' }}>Investigation</span> & Micropayments
        </h1>

        {/* Subtitle / Value Proposition */}
        <p className="font-body" style={{
          fontSize: '17px',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          margin: '0 0 2.25rem',
          maxWidth: '52ch'
        }}>
          Our AI reviews your claim, allocates spending dynamically via an <strong>Optimal 0/1 Knapsack</strong>, and purchases paywalled evidence on-chain using <strong>x402 Micropayments</strong>.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
          <button
            id="start-investigation-btn"
            onClick={onStartNew}
            className="btn-primary"
            style={{ fontSize: '15px', padding: '13px 32px' }}
          >
            Start New Investigation &rarr;
          </button>
          <a
            href="#how-it-works"
            className="btn-secondary"
            style={{ fontSize: '15px', padding: '12px 24px', textDecoration: 'none' }}
          >
            Explore Platform Features &darr;
          </a>
        </div>

        {/* ── Real Product UI Preview Container (Browser Frame) ── */}
        <div style={{ width: '100%', maxWidth: '58rem' }}>
          <div className="browser-frame">
            <div className="browser-header">
              <div className="browser-dots">
                <div className="browser-dot" style={{ backgroundColor: '#FF5F56' }} />
                <div className="browser-dot" style={{ backgroundColor: '#FFBD2E' }} />
                <div className="browser-dot" style={{ backgroundColor: '#27C93F' }} />
              </div>
              <div className="browser-url-bar">
                evidenceos.ai / investigations / live-report-preview
              </div>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--surface)' }}>
              <img
                src="/assets/hero_screenshot.jpg"
                alt="EvidenceOS Final Investigation Report Dashboard"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* ── 2. REAL SOCIAL PROOF / HACKATHON BADGES ROW ───────────────────────── */}
      <section className="card-secondary" style={{ padding: '1.25rem 2rem', backgroundColor: '#F9F8F5' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '1.5rem',
          flexWrap: 'wrap',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Base Sepolia Testnet (84532)
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border)' }} className="hidden md:block" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>💳</span>
            <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              x402 Open Protocol Standard
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border)' }} className="hidden md:block" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🧠</span>
            <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              Stance-Aware AI Reasoning
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', backgroundColor: 'var(--border)' }} className="hidden md:block" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <span className="font-data" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Production Enterprise Edition
            </span>
          </div>
        </div>
      </section>


      {/* ── 3. ALTERNATING FEATURE EXPLANATIONS (Hackviser Feature Layout Pattern) ── */}
      <section id="how-it-works" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '36rem', margin: '0 auto' }}>
          <div className="chip-primary" style={{ marginBottom: '0.75rem' }}>
            ARCHITECTURE & WORKFLOW
          </div>
          <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.5rem' }}>
            How <span style={{ color: 'var(--accent)' }}>EvidenceOS</span> Operates
          </h2>
          <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            An end-to-end pipeline connecting autonomous AI agents with HTTP 402 paywall settlement.
          </p>
        </div>

        {/* Feature 1: Text Left, Image Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="chip-primary" style={{ width: 'fit-content' }}>
              STEP 1 &bull; DYNAMIC KNAPSACK SOLVER
            </div>
            <h3 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Claim Decomposition & Budget Allocation
            </h3>
            <p className="font-body" style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              Submit any complex factual statement and define your spending limit (e.g. <strong>$0.005 USDC</strong>). The AI planner decomposes the claim into targeted search sub-questions and evaluates available evidence candidates using an <strong>0/1 Knapsack optimization algorithm</strong>.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span className="font-body" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                  <strong>Knapsack Optimization:</strong> Maximizes total evidence value within exact USDC budget.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span className="font-body" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                  <strong>Custom Spending Limit:</strong> Interactive range slider ($0.001 – $0.050 USDC).
                </span>
              </div>
            </div>
          </div>

          <div className="browser-frame">
            <div className="browser-header">
              <div className="browser-dots">
                <div className="browser-dot" style={{ backgroundColor: '#FF5F56' }} />
                <div className="browser-dot" style={{ backgroundColor: '#FFBD2E' }} />
                <div className="browser-dot" style={{ backgroundColor: '#27C93F' }} />
              </div>
              <div className="browser-url-bar">evidenceos.ai / submit-claim</div>
            </div>
            <img src="/assets/claim_submit_preview.jpg" alt="Claim Submission Screen Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>

        {/* Feature 2: Image Left, Text Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div className="browser-frame" style={{ order: 2 }}>
            <div className="browser-header">
              <div className="browser-dots">
                <div className="browser-dot" style={{ backgroundColor: '#FF5F56' }} />
                <div className="browser-dot" style={{ backgroundColor: '#FFBD2E' }} />
                <div className="browser-dot" style={{ backgroundColor: '#27C93F' }} />
              </div>
              <div className="browser-url-bar">evidenceos.ai / live-investigation-stream</div>
            </div>
            <img src="/assets/live_agent_preview.jpg" alt="Live Investigation Activity Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', order: 1 }}>
            <div className="chip-primary" style={{ width: 'fit-content' }}>
              STEP 2 &bull; ON-CHAIN X402 MICROPAYMENTS
            </div>
            <h3 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Parallel Agent Dispatch & On-Chain Settlement
            </h3>
            <p className="font-body" style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              Autonomous <strong>Web Search</strong> and <strong>Financial Registry Agents</strong> execute concurrently in parallel. When encountering paywalled APIs, agents generate EIP-712 cryptographic signatures and settle <strong>x402 HTTP micropayments</strong> on Base Sepolia in real-time.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span className="font-body" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                  <strong>Parallel Execution:</strong> Agents gather open-source and paywalled data simultaneously.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span className="font-body" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                  <strong>Real-Time SSE Broadcast:</strong> Live event log stream delivered to the UI.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Text Left, Image Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="chip-primary" style={{ width: 'fit-content' }}>
              STEP 3 &bull; STANCE-AWARE REASONING
            </div>
            <h3 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Stance Analysis & Verifiable Audit Report
            </h3>
            <p className="font-body" style={{ fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              Gathered evidence is evaluated for explicit stance relative to the claim: <strong>SUPPORTS</strong>, <strong>CONTRADICTS</strong>, or <strong>NEUTRAL</strong>. Contradicting evidence actively lowers confidence scores, preventing false positives and producing clear, auditable verdicts.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span className="font-body" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                  <strong>Stance Badges:</strong> Clear green / red badges showing exact AI stance justification.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span className="font-body" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                  <strong>Transparent Audit Log:</strong> Complete record of transaction hashes, costs, and sources.
                </span>
              </div>
            </div>
          </div>

          <div className="browser-frame">
            <div className="browser-header">
              <div className="browser-dots">
                <div className="browser-dot" style={{ backgroundColor: '#FF5F56' }} />
                <div className="browser-dot" style={{ backgroundColor: '#FFBD2E' }} />
                <div className="browser-dot" style={{ backgroundColor: '#27C93F' }} />
              </div>
              <div className="browser-url-bar">evidenceos.ai / final-report-summary</div>
            </div>
            <img src="/assets/evidence_report_preview.jpg" alt="Final Evidence Report Dashboard Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>

      </section>


      {/* ── 4. EXPANDABLE TECHNICAL ARCHITECTURE DETAILS ───────────────────────── */}
      <section className="card-secondary" style={{ padding: '1.75rem 2rem' }}>
        <button
          onClick={() => setShowArchDetails(!showArchDetails)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 0,
            textAlign: 'left'
          }}
        >
          <div>
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Technical Architecture & Protocol Integration
            </h3>
            <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Click to inspect technical details of x402 header negotiation, EIP-712 signing, and backend scoring logic.
            </p>
          </div>
          <span style={{ fontSize: '18px', color: 'var(--accent)', transition: 'transform 0.2s ease', transform: showArchDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ↓
          </span>
        </button>

        {showArchDetails && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="font-data" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                X402 HTTP PROTOCOL
              </div>
              <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Handles HTTP 402 Payment Required status code headers and settles micropayments automatically via official x402 resource server middleware.
              </p>
            </div>

            <div>
              <div className="font-data" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                EIP-712 SIGNATURES
              </div>
              <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Constructs typed structured data signatures with user nonces, ensuring tamper-proof authorization for every paid evidence transaction.
              </p>
            </div>

            <div>
              <div className="font-data" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                0/1 KNAPSACK OPTIMIZER
              </div>
              <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Solves dynamic programming allocation to pick maximum value evidence candidates subject to strict spending budget constraints.
              </p>
            </div>
          </div>
        )}
      </section>


      {/* ── 5. RECENT INVESTIGATIONS HISTORY TABLE ───────────────────────────── */}
      <section className="card-primary" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Recent Investigations
            </h2>
            <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Past claims evaluated by autonomous agents
            </p>
          </div>
          <span className="font-data" style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {history.length} records
          </span>
        </div>

        {loading ? (
          <div className="font-body" style={{ padding: '2rem 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Loading past investigations...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 1rem' }}>No investigations recorded yet.</p>
            <button onClick={onStartNew} className="btn-secondary" style={{ fontSize: '13px' }}>
              Create your first investigation
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((inv) => {
              const st = STATUS_STYLE[inv.status] || { label: inv.status, bg: 'var(--bg)', color: 'var(--text-muted)', border: 'var(--border)' };
              return (
                <button
                  key={inv.id}
                  onClick={() => onSelectInvestigation(inv)}
                  className="feature-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Left: Claim & status tag */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span className="font-body" style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`
                      }}>
                        {st.label}
                      </span>
                      <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {new Date(inv.created_at).toLocaleDateString()} &bull; {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-body" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{inv.claim_text}"
                    </p>
                  </div>

                  {/* Right: Spend & Confidence */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spent</div>
                      <div className="font-data" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        ${(inv.total_spend_usdc || 0).toFixed(4)} USDC
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Confidence</div>
                      <div className="font-data" style={{ fontSize: '13px', fontWeight: 700, color: inv.overall_confidence_score !== null ? 'var(--success)' : 'var(--text-dim)' }}>
                        {inv.overall_confidence_score !== null ? `${Math.round(inv.overall_confidence_score * 100)}%` : '—'}
                      </div>
                    </div>

                    <span style={{ color: 'var(--accent)', fontSize: '16px', fontWeight: 600 }}>&rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
