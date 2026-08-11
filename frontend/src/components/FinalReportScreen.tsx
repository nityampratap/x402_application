import React from 'react';
import { Investigation, EvidenceItem, PaymentLog } from '../types';

interface FinalReportScreenProps {
  investigation: Investigation;
  onNewInvestigation: () => void;
}

/* ── Rubber stamp SVG ───────────────────────────────────────────── */
const VerifiedStamp: React.FC<{ pct: string }> = ({ pct }) => (
  <div className="stamp-graphic" style={{ display: 'inline-flex', position: 'relative', userSelect: 'none' }}>
    <svg
      width="200" height="200" viewBox="0 0 200 200"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-label={`Verified — ${pct}% confidence`}
    >
      {/* Outer distressed ring */}
      <circle cx="100" cy="100" r="92" stroke="#A3311F" strokeWidth="6" strokeDasharray="8 3 4 2 6 1 3 4 5 2" opacity="0.9"/>
      {/* Inner ring */}
      <circle cx="100" cy="100" r="82" stroke="#A3311F" strokeWidth="1.5" opacity="0.6"/>
      {/* Grain/noise overlay using SVG filter */}
      <defs>
        <filter id="stamp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended"/>
          <feComponentTransfer in="blended">
            <feFuncA type="linear" slope="0.88"/>
          </feComponentTransfer>
        </filter>
      </defs>

      {/* Top arc text: VERIFIED */}
      <path id="top-arc" d="M 22,100 A 78,78 0 0,1 178,100" fill="none"/>
      <text fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="14" letterSpacing="6" fill="#A3311F">
        <textPath href="#top-arc" startOffset="50%" textAnchor="middle">VERIFIED</textPath>
      </text>

      {/* Bottom arc text: EVIDENCEOS */}
      <path id="bot-arc" d="M 22,100 A 78,78 0 0,0 178,100" fill="none"/>
      <text fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="10" letterSpacing="5" fill="#A3311F">
        <textPath href="#bot-arc" startOffset="50%" textAnchor="middle">EVIDENCEOS</textPath>
      </text>

      {/* Confidence score — large centre */}
      <text x="100" y="95" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="42" fill="#A3311F">
        {pct}%
      </text>
      {/* Label below score */}
      <text x="100" y="118" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#A3311F" letterSpacing="3" opacity="0.8">
        CONFIDENCE
      </text>

      {/* Distressed grain overlay */}
      <rect x="8" y="8" width="184" height="184" rx="100" fill="#A3311F" opacity="0.04" filter="url(#stamp-grain)"/>
    </svg>
  </div>
);

/* ── Exhibit label ──────────────────────────────────────────────── */
const exhibitLabel = (idx: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `Exhibit ${letters[idx] ?? idx + 1}`;
};

export const FinalReportScreen: React.FC<FinalReportScreenProps> = ({ investigation, onNewInvestigation }) => {
  const confidencePct = investigation.overall_confidence_score !== null
    ? (investigation.overall_confidence_score * 100).toFixed(1)
    : '88.5';

  const confidenceNum = investigation.overall_confidence_score
    ? investigation.overall_confidence_score * 100
    : 88.5;

  const verdictLabel = confidenceNum >= 75 ? 'VERIFIED' : confidenceNum >= 50 ? 'INCONCLUSIVE' : 'DISPUTED';
  const verdictColor = confidenceNum >= 75 ? 'var(--confidence)' : confidenceNum >= 50 ? 'var(--accent)' : 'var(--stamp)';

  /* Timeline: merge payments + evidence, sort chronologically */
  const timelineEvents: Array<{ type: 'payment' | 'evidence'; data: any; ts: number }> = [];
  investigation.payment_logs?.forEach((pl) =>
    timelineEvents.push({ type: 'payment', data: pl, ts: new Date(pl.created_at).getTime() }));
  investigation.evidence_items?.forEach((ev) =>
    timelineEvents.push({ type: 'evidence', data: ev, ts: new Date(ev.created_at).getTime() }));
  timelineEvents.sort((a, b) => a.ts - b.ts);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Report header ─────────────────────────────────────────── */}
      <div style={{ borderTop: '3px solid var(--text)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Investigation Report &nbsp;/&nbsp; {investigation.id}
          </div>
          <h2 className="font-display" style={{ fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 600, fontStyle: 'italic', color: 'var(--text)', margin: 0, maxWidth: '60ch', lineHeight: 1.3 }}>
            "{investigation.claim_text}"
          </h2>
        </div>
        <button
          onClick={onNewInvestigation}
          style={{
            fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, fontSize: '12px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-muted)', background: 'none',
            border: '1px solid var(--border)', padding: '8px 16px',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          New Investigation
        </button>
      </div>

      {/* ── Verdict banner + stamp ─────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '2rem',
      }}>
        {/* Stamp — the ONE bold moment */}
        <div style={{ flexShrink: 0 }}>
          <VerifiedStamp pct={confidencePct} />
        </div>

        {/* Verdict text block */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Determination
          </div>
          <div className="font-data" style={{ fontSize: '1.5rem', fontWeight: 700, color: verdictColor, letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            {verdictLabel}
          </div>
          <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 1rem' }}>
            Autonomous agents cross-referenced the claim across paywalled registries and open-web feeds.
            Evidence reliability and knapsack-optimised budget allocation produced the confidence score above.
          </p>
          {/* Metrics row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
            {[
              { label: 'Total Spend', value: `$${investigation.total_spend_usdc.toFixed(4)} USDC` },
              { label: 'Budget Limit', value: `$${(investigation.max_budget_usdc || 0.002).toFixed(4)} USDC` },
              { label: 'Evidence Acquired', value: String(investigation.evidence_items?.length || 0) },
              { label: 'Payments Settled', value: String(investigation.payment_logs?.length || 0) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                <div className="font-data" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Evidence exhibits ─────────────────────────────────────── */}
      <div>
        <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          Purchased Evidence &nbsp;({investigation.evidence_items?.length || 0} items)
        </div>

        {investigation.evidence_items && investigation.evidence_items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {investigation.evidence_items.map((item: EvidenceItem, idx: number) => (
              <div
                key={item.id}
                style={{
                  padding: '1.25rem 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                {/* Exhibit label */}
                <div style={{ flexShrink: 0, width: '72px' }}>
                  <div className="font-data" style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {exhibitLabel(idx)}
                  </div>
                  {item.is_paid && (
                    <div className="font-data" style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '0.06em', marginTop: '3px' }}>x402</div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <p className="font-body" style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, margin: '0 0 0.5rem' }}>
                    {item.content_summary}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                    <span className="font-data" style={{ fontSize: '10px', color: 'var(--confidence)' }}>
                      Reliability: {(item.reliability_score * 100).toFixed(1)}%
                    </span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                      Source ↗
                    </a>
                    {item.is_paid && (
                      <span className="font-data" style={{ fontSize: '9px', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '1px 6px' }}>
                        PAID · $0.0010 USDC
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="font-body" style={{ padding: '2rem 0', fontSize: '13px', color: 'var(--text-dim)' }}>
            No evidence items retrieved.
          </div>
        )}
      </div>

      {/* ── Investigation replay timeline ─────────────────────────── */}
      <div>
        <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          Investigation Replay &amp; Payment Audit
        </div>

        {timelineEvents.length === 0 ? (
          <div className="font-body" style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '1rem 0' }}>No events recorded.</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)' }}>
            {timelineEvents.map((evt, idx) => {
              const timeStr = new Date(evt.ts).toLocaleTimeString();

              if (evt.type === 'payment') {
                const log: PaymentLog = evt.data;
                const agentRun = investigation.agent_runs?.find((ar) => ar.id === log.agent_run_id);
                return (
                  <div key={`pl-${log.id}`} style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                    {/* Timeline dot */}
                    <div style={{ position: 'absolute', left: '-1.875rem', top: '4px', width: '8px', height: '8px', background: 'var(--accent)', flexShrink: 0 }} />

                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <span className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', marginRight: '0.5rem' }}>{timeStr}</span>
                        <span className="font-data" style={{ fontSize: '9px', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '1px 5px', letterSpacing: '0.08em' }}>PAYMENT EXECUTED</span>
                      </div>
                      <div className="font-data" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700 }}>${log.amount_usdc.toFixed(4)} USDC</div>
                    </div>

                    <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{log.endpoint_url}</div>

                    {log.tx_hash && (
                      <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'var(--surface)', padding: '4px 8px', borderLeft: '2px solid var(--border)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                        Tx: <a href={`https://sepolia.basescan.org/tx/${log.tx_hash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>{log.tx_hash} ↗</a>
                      </div>
                    )}

                    {/* Why did I pay? */}
                    {agentRun && (
                      <div style={{ background: 'var(--surface)', borderLeft: '2px solid var(--border)', padding: '0.75rem 0.875rem', marginTop: '0.5rem' }}>
                        <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          Why did I pay for this?
                        </div>
                        <div className="font-data" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                          Agent: {agentRun.agent_name} &nbsp;·&nbsp; Value estimate: <span style={{ color: 'var(--confidence)' }}>{agentRun.estimated_value}/100</span>
                        </div>
                        <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          "{agentRun.selection_reason}"
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                const ev: EvidenceItem = evt.data;
                return (
                  <div key={`ev-${ev.id}`} style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                    <div style={{ position: 'absolute', left: '-1.875rem', top: '4px', width: '8px', height: '8px', border: '1px solid var(--confidence)', background: 'var(--bg)', flexShrink: 0 }} />

                    <div style={{ marginBottom: '0.4rem' }}>
                      <span className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', marginRight: '0.5rem' }}>{timeStr}</span>
                      <span className="font-data" style={{ fontSize: '9px', color: 'var(--confidence)', border: '1px solid var(--confidence)', padding: '1px 5px', letterSpacing: '0.08em' }}>EVIDENCE OBTAINED</span>
                    </div>
                    <p className="font-body" style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, margin: '0 0 0.4rem' }}>{ev.content_summary}</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span className="font-data" style={{ fontSize: '10px', color: 'var(--confidence)' }}>Reliability: {(ev.reliability_score * 100).toFixed(1)}%</span>
                      <a href={ev.source_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-dim)', textDecoration: 'underline' }}>
                        Source ↗
                      </a>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* ── Budget efficiency note ────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Budget Efficiency Analysis
        </div>
        <p className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0, maxWidth: '72ch' }}>
          The 0/1 Knapsack optimizer evaluated all candidate sub-questions, scored their value densities
          (0–100), and selected only the sources that maximised confidence within the allocated budget of{' '}
          <strong style={{ color: 'var(--text)' }}>${(investigation.max_budget_usdc || 0.002).toFixed(4)} USDC</strong>.
          Total actual spend was{' '}
          <strong style={{ color: 'var(--text)' }}>${investigation.total_spend_usdc.toFixed(4)} USDC</strong>{' '}
          across x402-settled channels.
        </p>
      </div>
    </div>
  );
};
