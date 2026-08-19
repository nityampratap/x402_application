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

  useEffect(() => {
    listInvestigations()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* ── Hero Section (Baby Pink Tint Wash Background) ────────── */}
      <section className="card-tint" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '44rem', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div className="font-data" style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>
            Autonomous Micro-Payment Verification
          </div>

          {/* Centered Main Title */}
          <h1 className="font-display" style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 600,
            lineHeight: 1.15,
            color: 'var(--text)',
            margin: '0 0 0.5rem',
          }}>
            EvidenceOS
          </h1>

          {/* Small, Restrained Descriptor */}
          <p className="font-body" style={{ fontSize: '15px', color: 'var(--text-muted)', margin: '0 0 1.5rem', fontWeight: 400 }}>
            Autonomous Evidence Investigation
          </p>

          {/* Plain Language Summary */}
          <p className="font-body" style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '36ch' }}>
            Our AI reviews your claim, decides what evidence is worth checking, and only buys the sources that fit your budget.
          </p>

          <button
            id="start-investigation-btn"
            onClick={onStartNew}
            className="btn-primary"
            style={{ fontSize: '15px', padding: '12px 28px' }}
          >
            Start New Investigation &rarr;
          </button>
        </div>
      </section>

      {/* ── Feature Highlights (No 01/02/03 Numbering, Centered Headings, HR Separator) ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            How EvidenceOS Operates
          </h2>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div className="card-secondary" style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
            <h3 className="font-body" style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)', margin: '0 0 0.5rem' }}>
              On-Chain Payments
            </h3>
            <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              A real, cryptographically signed payment for paywalled evidence — verifiable on the blockchain.
            </p>
          </div>

          <div className="card-secondary" style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
            <h3 className="font-body" style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Smart Budget Allocation
            </h3>
            <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              We automatically pick the most valuable evidence within your custom spending limit.
            </p>
          </div>

          <div className="card-secondary" style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
            <h3 className="font-body" style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Verifiable Audit Trail
            </h3>
            <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Every transaction, evidence item, and decision is recorded with complete transparency.
            </p>
          </div>
        </div>
      </section>

      {/* ── Recent Cases History Table ───────────────────────────── */}
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
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
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
