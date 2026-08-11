import React, { useEffect, useState } from 'react';
import { Investigation } from '../types';
import { listInvestigations } from '../services/api';

interface LandingScreenProps {
  onStartNew: () => void;
  onSelectInvestigation: (inv: Investigation) => void;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  COMPLETED:      { label: 'CLOSED', color: 'var(--confidence)' },
  IN_PROGRESS:    { label: 'ACTIVE', color: 'var(--accent)' },
  PLANNING:       { label: 'PLANNING', color: 'var(--text-muted)' },
  AGENT_DISPATCH: { label: 'DISPATCHED', color: 'var(--text-muted)' },
  SCORING:        { label: 'SCORING', color: 'var(--text-muted)' },
  FAILED:         { label: 'FAILED', color: 'var(--stamp)' },
};

const S = {
  label: {
    display: 'inline-block',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '2px 7px',
    border: '1px solid',
  } as React.CSSProperties,
};

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStartNew, onSelectInvestigation }) => {
  const [history, setHistory] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInvestigations()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        borderTop: '3px solid var(--text)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 0 2.5rem',
      }}>
        {/* Eyebrow */}
        <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          Autonomous Evidence Acquisition System &nbsp;/&nbsp; x402 Protocol
        </div>

        <h1 className="font-display" style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 600,
          lineHeight: 1.1,
          color: 'var(--text)',
          margin: '0 0 1.25rem',
          maxWidth: '28ch',
          fontStyle: 'italic',
        }}>
          Forensic Evidence,<br />Purchased on Demand.
        </h1>

        <p className="font-body" style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '52ch', marginBottom: '2rem', lineHeight: 1.7 }}>
          EvidenceOS deploys autonomous AI agents to evaluate factual claims.
          Paywalled evidence sources are acquired via x402 micropayments on Base Sepolia,
          settled on-chain, and weighed by a 0/1 Knapsack optimizer against your budget.
        </p>

        <button
          id="start-investigation-btn"
          onClick={onStartNew}
          style={{
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--bg)',
            background: 'var(--text)',
            border: 'none',
            padding: '12px 28px',
            cursor: 'pointer',
          }}
        >
          Open New Investigation
        </button>

        {/* ── Capability row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0', marginTop: '3rem', borderTop: '1px solid var(--border)' }}>
          {[
            { code: '01', title: 'x402 Settlement', desc: 'EIP-712 payment authorization signed on Base Sepolia testnet, every purchase on-chain.' },
            { code: '02', title: 'Knapsack Budget', desc: 'LLM scores source value 0–100. Brute-force 0/1 Knapsack selects optimal subset.' },
            { code: '03', title: 'Chain-of-custody', desc: 'Every payment, evidence item, and agent decision logged with timestamps and tx hashes.' },
          ].map((cap, i) => (
            <div key={i} style={{
              padding: '1.5rem 1.5rem 1.5rem 0',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              paddingLeft: i > 0 ? '1.5rem' : '0',
            }}>
              <div className="font-data" style={{ fontSize: '9px', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{cap.code}</div>
              <div className="font-body" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '0.5rem' }}>{cap.title}</div>
              <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{cap.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Case File History ─────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', margin: 0, fontStyle: 'italic' }}>
            Case Files
          </h2>
          <span className="font-data" style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
            {history.length} record{history.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="font-data" style={{ padding: '2rem 0', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            Retrieving case files...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '3rem 0', borderTop: '1px solid var(--border-subtle)' }}>
            <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 0.75rem' }}>No investigations on record.</p>
            <button onClick={onStartNew} className="font-body" style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Open the first case
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.map((inv, i) => {
              const st = STATUS_LABEL[inv.status] || { label: inv.status, color: 'var(--text-muted)' };
              return (
                <button
                  key={inv.id}
                  onClick={() => onSelectInvestigation(inv)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    padding: '1.25rem 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Left: case number + claim */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0 }}>
                    <span className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.06em', paddingTop: '4px', flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span style={{ ...S.label, color: st.color, borderColor: st.color }}>{st.label}</span>
                      </div>
                      <p className="font-body" style={{ fontSize: '14px', color: 'var(--text)', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50ch' }}>
                        "{inv.claim_text}"
                      </p>
                      <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                        {new Date(inv.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: metrics */}
                  <div style={{ display: 'flex', gap: '2rem', flexShrink: 0, alignItems: 'flex-start' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Spend</div>
                      <div className="font-data" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>${(inv.total_spend_usdc || 0).toFixed(4)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>Confidence</div>
                      <div className="font-data" style={{ fontSize: '13px', color: inv.overall_confidence_score ? 'var(--confidence)' : 'var(--text-muted)' }}>
                        {inv.overall_confidence_score !== null ? `${(inv.overall_confidence_score * 100).toFixed(1)}%` : '—'}
                      </div>
                    </div>
                    <div style={{ paddingTop: '2px', color: 'var(--text-dim)', fontSize: '16px' }}>›</div>
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
