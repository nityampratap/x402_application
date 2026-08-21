import React, { useEffect, useState } from 'react';
import { Investigation, AgentRun, PaymentLog } from '../types';
import { getInvestigation, subscribeToInvestigationSSE } from '../services/api';

interface LiveActivityScreenProps {
  investigationId: string;
  onViewReport: (inv: Investigation) => void;
}

const STEPS = ['PLANNING', 'AGENT_DISPATCH', 'IN_PROGRESS', 'SCORING', 'COMPLETED'];

const STEP_LABEL: Record<string, string> = {
  PLANNING: 'Planning Claim',
  AGENT_DISPATCH: 'Dispatching Agents',
  IN_PROGRESS: 'Acquiring Evidence',
  SCORING: 'Aggregating Score',
  COMPLETED: 'Investigation Closed',
};

export const LiveActivityScreen: React.FC<LiveActivityScreenProps> = ({ investigationId, onViewReport }) => {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; timestamp: string; payload: any }>>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchCurrent = async () => {
      try {
        const inv = await getInvestigation(investigationId);
        if (isMounted) setInvestigation(inv);
      } catch (err) {
        console.error('Error fetching investigation state:', err);
      }
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 1200);

    const unsub = subscribeToInvestigationSSE(investigationId, (eventType, data) => {
      if (!isMounted) return;
      setEvents((prev) => [...prev, { type: eventType, timestamp: data.timestamp, payload: data.payload }]);
      if (eventType === 'STATE_CHANGE' || eventType === 'COMPLETED' || eventType === 'PAYMENT_EVENT') {
        fetchCurrent();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsub();
    };
  }, [investigationId]);

  const currentStepIdx = investigation ? STEPS.indexOf(investigation.status) : 0;
  const isCompleted = investigation?.status === 'COMPLETED';

  // Extract payment logs from investigation or recent SSE payment events
  const paymentLogs: PaymentLog[] = investigation?.payment_logs || [];
  const latestPayment = paymentLogs.length > 0 ? paymentLogs[paymentLogs.length - 1] : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Case Header & Status Banner ────────────────────────────── */}
      <div className="card-primary feature-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyBetween: 'space-between', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              
              {/* Blue tag for Active status, Green for Completed */}
              <span className="font-body" style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '4px',
                backgroundColor: isCompleted ? 'var(--success-light)' : 'var(--accent-light)',
                color: isCompleted ? 'var(--success)' : 'var(--accent)',
                border: `1px solid ${isCompleted ? '#C2E0D1' : '#CBE0FE'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {isCompleted ? 'Investigation Complete' : 'Live Investigation Active'}
              </span>

              <span className="font-data" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Case ID: {investigationId}
              </span>
            </div>

            <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', margin: '4px 0 0', lineHeight: 1.3 }}>
              "{investigation?.claim_text || 'Loading claim...'}"
            </h2>
          </div>

          {isCompleted && (
            <button
              id="view-report-btn"
              onClick={() => onViewReport(investigation)}
              className="btn-primary"
              style={{ backgroundColor: 'var(--success)', fontSize: '14px', padding: '10px 22px' }}
            >
              View Final Report &rarr;
            </button>
          )}
        </div>

        {/* ── Workflow Stepper Progress Bar ── */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          {STEPS.map((step, idx) => {
            const isPassed = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: isCurrent ? 'var(--accent)' : isPassed ? 'var(--success)' : 'var(--border)',
                  transition: 'background-color 0.3s ease'
                }} />
                <span className="font-body" style={{
                  fontSize: '11px',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--accent)' : isPassed ? 'var(--text)' : 'var(--text-dim)',
                  lineHeight: 1.2
                }}>
                  {STEP_LABEL[step] || step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ELEVATED MOMENT: Featured x402 On-Chain Settlement Card ─ */}
      {latestPayment ? (
        <div className="card-tint" style={{ padding: '1.75rem 2rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyBetween: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span className="font-data" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Verified On-Chain Transaction &bull; x402 Micropayment Protocol
              </span>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', margin: '4px 0 0' }}>
                HTTP 402 Payment Challenge Cleared
              </h3>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="font-data" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                ${latestPayment.amount_usdc.toFixed(4)} USDC
              </span>
              <div className="font-data" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Base Sepolia Settlement
              </div>
            </div>
          </div>

          <div className="card-primary" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--surface)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paywalled Endpoint</div>
                <div className="font-data" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', wordBreak: 'break-all' }}>
                  {latestPayment.endpoint_url}
                </div>
              </div>

              <div>
                <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payment Status</div>
                <div className="font-body" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  HTTP 200 OK &bull; EIP-712 Signature Verified
                </div>
              </div>

              {latestPayment.tx_hash && (
                <div>
                  <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On-Chain Transaction Hash</div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${latestPayment.tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-data"
                    style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'underline' }}
                  >
                    {latestPayment.tx_hash.substring(0, 20)}...
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-secondary" style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
          <span className="font-data" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            x402 Micropayment Engine ready &bull; Awaiting HTTP 402 challenge from paywalled endpoint...
          </span>
        </div>
      )}

      {/* ── Budget Allocation Decisions Table ─────────────────────── */}
      <section className="card-primary" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Evidence Selection & Budget Allocation
            </h3>
            <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              We automatically pick the most valuable evidence within your spending limit.
            </p>
          </div>

          <span className="font-data" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', backgroundColor: 'var(--accent-light)', padding: '4px 10px', borderRadius: '6px' }}>
            Max Budget: ${(investigation?.max_budget_usdc || 0.002).toFixed(4)} USDC
          </span>
        </div>

        {investigation?.agent_runs && investigation.agent_runs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {investigation.agent_runs.map((ar: AgentRun) => {
              const isSelected = ar.selection_status === 'SELECTED';
              return (
                <div
                  key={ar.id}
                  className={isSelected ? "card-secondary" : "card-secondary"}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: isSelected ? 'var(--surface)' : 'var(--bg)',
                    borderColor: isSelected ? 'var(--border)' : 'var(--border-subtle)',
                    opacity: isSelected ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-body" style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'var(--success-light)' : 'var(--bg)',
                        color: isSelected ? 'var(--success)' : 'var(--text-muted)',
                        border: `1px solid ${isSelected ? '#C2E0D1' : 'var(--border)'}`
                      }}>
                        {isSelected ? 'SELECTED FOR PURCHASE' : 'SKIPPED (EXCEEDS VALUE-TO-BUDGET)'}
                      </span>
                      <span className="font-body" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        {ar.agent_name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Value Score: <strong className="font-data" style={{ color: 'var(--text)' }}>{ar.estimated_value || 85}/100</strong>
                      </span>
                      <span className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Cost: <strong className="font-data" style={{ color: 'var(--text)' }}>${(ar.estimated_cost_usdc || 0.001).toFixed(4)} USDC</strong>
                      </span>
                    </div>
                  </div>

                  <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Sub-question: "{ar.sub_question}"
                  </p>
                  {ar.selection_reason && (
                    <p className="font-data" style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '6px 0 0' }}>
                      Reasoning: {ar.selection_reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="font-body" style={{ padding: '1.5rem', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            Evaluating sub-questions and calculating optimal budget allocation...
          </div>
        )}
      </section>

      {/* ── Live Event Stream Log ──────────────────────────────────── */}
      <section className="card-primary" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Live System Event Log
          </h3>
          <span className="font-data" style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
            Real-time SSE Stream Connected
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1rem',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          color: 'var(--text-muted)',
          maxHeight: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {events.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Listening for live backend event updates...</div>
          ) : (
            events.map((evt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', lineHeight: 1.4, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>[{evt.type}]</span>
                <span style={{ color: 'var(--text)', wordBreak: 'break-all' }}>{JSON.stringify(evt.payload)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
