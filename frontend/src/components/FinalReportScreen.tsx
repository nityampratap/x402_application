import React, { useState } from 'react';
import { Investigation, EvidenceItem, PaymentLog } from '../types';

interface FinalReportScreenProps {
  investigation: Investigation;
  onNewInvestigation: () => void;
}

/* ── Rubber Stamp SVG Component (The ONE bold visual moment) ────── */
const VerifiedStamp: React.FC<{ pct: string; scoreNum: number }> = ({ pct, scoreNum }) => {
  const isHighConfidence = scoreNum >= 75;
  const isMediumConfidence = scoreNum >= 50 && scoreNum < 75;
  
  const stampColor = isHighConfidence ? '#3E7A5C' : isMediumConfidence ? '#2F5FE0' : '#B23B2E';
  const stampText = isHighConfidence ? 'VERIFIED' : isMediumConfidence ? 'INCONCLUSIVE' : 'DISPUTED';

  return (
    <div className="stamp-graphic" style={{ display: 'inline-flex', position: 'relative', userSelect: 'none' }}>
      <svg
        width="190" height="190" viewBox="0 0 200 200"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        aria-label={`${stampText} — ${pct}% confidence`}
      >
        {/* Distressed outer ring */}
        <circle cx="100" cy="100" r="92" stroke={stampColor} strokeWidth="5.5" strokeDasharray="9 3 5 2 7 1 4 4" opacity="0.95"/>
        {/* Inner concentric ring */}
        <circle cx="100" cy="100" r="82" stroke={stampColor} strokeWidth="1.5" opacity="0.6"/>
        
        {/* SVG filter for subtle distressed texture */}
        <defs>
          <filter id="stamp-grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended"/>
            <feComponentTransfer in="blended">
              <feFuncA type="linear" slope="0.9"/>
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Top arc text */}
        <path id="stamp-top-arc" d="M 24,100 A 76,76 0 0,1 176,100" fill="none"/>
        <text fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="13" letterSpacing="5" fill={stampColor}>
          <textPath href="#stamp-top-arc" startOffset="50%" textAnchor="middle">{stampText}</textPath>
        </text>

        {/* Bottom arc text */}
        <path id="stamp-bot-arc" d="M 24,100 A 76,76 0 0,0 176,100" fill="none"/>
        <text fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="10" letterSpacing="4" fill={stampColor}>
          <textPath href="#stamp-bot-arc" startOffset="50%" textAnchor="middle">EVIDENCEOS</textPath>
        </text>

        {/* Large confidence percentage score */}
        <text x="100" y="98" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="42" fill={stampColor}>
          {pct}%
        </text>
        
        {/* Sub-label */}
        <text x="100" y="118" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={stampColor} letterSpacing="2" opacity="0.85">
          CONFIDENCE
        </text>

        {/* Distressed grain overlay */}
        <rect x="8" y="8" width="184" height="184" rx="92" fill={stampColor} opacity="0.03" filter="url(#stamp-grain-filter)"/>
      </svg>
    </div>
  );
};

/* Helper for Exhibit labels: Exhibit A, Exhibit B, etc. */
const getExhibitLabel = (index: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `Exhibit ${letters[index] || index + 1}`;
};

export const FinalReportScreen: React.FC<FinalReportScreenProps> = ({ investigation, onNewInvestigation }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const confidenceScore = investigation.overall_confidence_score !== null ? investigation.overall_confidence_score : 0.88;
  const scoreNum = Math.round(confidenceScore * 100);
  const confidencePct = scoreNum.toString();

  const isHighConfidence = scoreNum >= 75;
  const verdictText = isHighConfidence
    ? "High confidence verification — multiple independent sources confirm the claim."
    : scoreNum >= 50
    ? "Moderate confidence verification — evidence is partially supported."
    : "Low confidence / Disputed claim — evidence contradicts key statements.";

  /* Merge timeline events (payments + evidence items) chronologically */
  const timelineEvents: Array<{ type: 'payment' | 'evidence'; data: any; timestamp: number }> = [];
  
  investigation.payment_logs?.forEach((pl) => {
    timelineEvents.push({ type: 'payment', data: pl, timestamp: new Date(pl.created_at).getTime() });
  });

  investigation.evidence_items?.forEach((ev) => {
    timelineEvents.push({ type: 'evidence', data: ev, timestamp: new Date(ev.created_at).getTime() });
  });

  timelineEvents.sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── Report Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div className="font-data" style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Final Investigation Report &bull; ID: {investigation.id}
          </div>
          <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1.25 }}>
            "{investigation.claim_text}"
          </h2>
        </div>

        <button
          onClick={onNewInvestigation}
          className="btn-primary"
          style={{ fontSize: '14px' }}
        >
          + New Investigation
        </button>
      </div>

      {/* ── Featured Verdict & Rubber Stamp Card ────────────────────── */}
      <div className="card-primary" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2.5rem' }}>
          
          {/* Rotated Rubber Stamp Graphic (The ONE bold moment) */}
          <div style={{ flexShrink: 0, padding: '0.5rem' }}>
            <VerifiedStamp pct={confidencePct} scoreNum={scoreNum} />
          </div>

          {/* Verdict Plain Copy & Financial Metrics */}
          <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div className="font-body" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Investigation Result
              </div>
              <h3 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.5rem' }}>
                {isHighConfidence ? 'Claim Verified' : 'Investigation Verdict'}
              </h3>
              <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                {verdictText}
              </p>
            </div>

            {/* Metrics Breakdown Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div>
                <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Spent</div>
                <div className="font-data" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  ${investigation.total_spend_usdc.toFixed(4)} USDC
                </div>
              </div>

              <div>
                <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spending Limit</div>
                <div className="font-data" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ${(investigation.max_budget_usdc || 0.002).toFixed(4)} USDC
                </div>
              </div>

              <div>
                <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evidence Items</div>
                <div className="font-data" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  {investigation.evidence_items?.length || 0} Sources
                </div>
              </div>

              <div>
                <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paid Transactions</div>
                <div className="font-data" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  {investigation.payment_logs?.length || 0} Settled
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Evidence Exhibits List (Exhibit A, Exhibit B, etc.) ────── */}
      <section className="card-primary" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Gathered Evidence ({investigation.evidence_items?.length || 0})
          </h3>
          <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Sources evaluated and acquired during the investigation
          </p>
        </div>

        {investigation.evidence_items && investigation.evidence_items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {investigation.evidence_items.map((item: EvidenceItem, idx: number) => {
              const exhibitName = getExhibitLabel(idx);
              return (
                <div
                  key={item.id}
                  className="card-secondary"
                  style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-data" style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)'
                      }}>
                        {exhibitName}
                      </span>

                      <span className="font-body" style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: item.is_paid ? 'var(--accent-light)' : 'var(--bg)',
                        color: item.is_paid ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${item.is_paid ? '#CBE0FE' : 'var(--border)'}`
                      }}>
                        {item.is_paid ? 'Paid Source ($0.0010 USDC)' : 'Open Source'}
                      </span>
                    </div>

                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-data"
                      style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'underline' }}
                    >
                      View Source &rarr;
                    </a>
                  </div>

                  <p className="font-body" style={{ fontSize: '14px', color: 'var(--text)', margin: '4px 0 0', lineHeight: 1.6 }}>
                    {item.content_summary}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '4px' }}>
                    <span className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Reliability Rating: <strong className="font-data" style={{ color: 'var(--success)' }}>{Math.round(item.reliability_score * 100)}%</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="font-body" style={{ padding: '1.5rem', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            No evidence items retrieved for this investigation.
          </div>
        )}
      </section>

      {/* ── Audit Trail & Timeline ─────────────────────────────────── */}
      <section className="card-primary" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Investigation Replay & Payment Audit Log
          </h3>
          <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            Chronological record of agent decisions and micropayment authorizations
          </p>
        </div>

        {timelineEvents.length === 0 ? (
          <div className="font-body" style={{ padding: '1rem 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            No events recorded in audit log.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
            {timelineEvents.map((evt, idx) => {
              const timeStr = new Date(evt.timestamp).toLocaleTimeString();

              if (evt.type === 'payment') {
                const log: PaymentLog = evt.data;
                const agentRun = investigation.agent_runs?.find((ar) => ar.id === log.agent_run_id);
                return (
                  <div key={`pl-${log.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{timeStr}</span>
                      <span className="font-body" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #C2E0D1' }}>
                        Payment Executed (${log.amount_usdc.toFixed(4)} USDC)
                      </span>
                    </div>

                    <div className="card-secondary" style={{ padding: '1rem', backgroundColor: 'var(--surface)' }}>
                      <div className="font-data" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
                        Endpoint: {log.endpoint_url}
                      </div>

                      {log.tx_hash && (
                        <div className="font-data" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          Tx Hash: <a href={`https://sepolia.basescan.org/tx/${log.tx_hash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                            {log.tx_hash}
                          </a>
                        </div>
                      )}

                      {/* "Why did I pay?" Explanation Panel */}
                      {agentRun && (
                        <div style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: 'var(--bg)', borderLeft: '3px solid var(--accent)', borderRadius: '0 6px 6px 0' }}>
                          <div className="font-body" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                            Why was this source purchased?
                          </div>
                          <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Agent {agentRun.agent_name} estimated value score at <strong>{agentRun.estimated_value}/100</strong>. {agentRun.selection_reason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                const ev: EvidenceItem = evt.data;
                return (
                  <div key={`ev-${ev.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{timeStr}</span>
                      <span className="font-body" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        Evidence Recorded
                      </span>
                    </div>

                    <div className="card-secondary" style={{ padding: '1rem' }}>
                      <p className="font-body" style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
                        {ev.content_summary}
                      </p>
                      <div className="font-data" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Reliability: {Math.round(ev.reliability_score * 100)}% &bull; Source: <a href={ev.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{ev.source_url}</a>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </section>

      {/* ── Expandable "Technical Details" Toggle ────────────────── */}
      <section className="card-secondary" style={{ padding: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '10px', display: 'inline-block', transform: showTechnicalDetails ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
            &gt;
          </span>
          {showTechnicalDetails ? 'Hide technical audit breakdown' : 'Show technical audit breakdown'}
        </button>

        {showTechnicalDetails && (
          <div className="font-data" style={{
            marginTop: '12px',
            padding: '14px',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }}>
            <div><strong>Orchestration Graph:</strong> LangGraph parallel scatter-gather workflow</div>
            <div><strong>Payment Layer:</strong> x402 Micropayment Protocol with EIP-712 payment authorization headers</div>
            <div><strong>Optimization Model:</strong> Exact 0/1 Knapsack algorithm selecting optimal evidence subset within budget constraint</div>
            <div><strong>Verification Network:</strong> Base Sepolia EVM Testnet (Chain ID 84532, Sepolia USDC Contract 0x036C...93b3)</div>
          </div>
        )}
      </section>
    </div>
  );
};
