import React, { useEffect, useState } from 'react';
import { Investigation, AgentRun } from '../types';
import { getInvestigation, subscribeToInvestigationSSE } from '../services/api';

interface LiveActivityScreenProps {
  investigationId: string;
  onViewReport: (inv: Investigation) => void;
}

const STEPS = ['PLANNING', 'AGENT_DISPATCH', 'IN_PROGRESS', 'SCORING', 'COMPLETED'];

const STEP_LABEL: Record<string, string> = {
  PLANNING: 'Planning',
  AGENT_DISPATCH: 'Dispatch',
  IN_PROGRESS: 'Executing',
  SCORING: 'Scoring',
  COMPLETED: 'Closed',
};

export const LiveActivityScreen: React.FC<LiveActivityScreenProps> = ({ investigationId, onViewReport }) => {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; timestamp: string; payload: any }>>([]);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const inv = await getInvestigation(investigationId);
        if (isMounted) setInvestigation(inv);
      } catch {}
    };

    fetch();
    const interval = setInterval(fetch, 1500);

    const unsub = subscribeToInvestigationSSE(investigationId, (eventType, data) => {
      if (!isMounted) return;
      setEvents((prev) => [...prev, { type: eventType, timestamp: data.timestamp, payload: data.payload }]);
      if (eventType === 'STATE_CHANGE' || eventType === 'COMPLETED') fetch();
    });

    return () => { isMounted = false; clearInterval(interval); unsub(); };
  }, [investigationId]);

  const currentStepIdx = investigation ? STEPS.indexOf(investigation.status) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Case Header ───────────────────────────────────────────── */}
      <div style={{ borderTop: '3px solid var(--text)', paddingTop: '1.5rem' }}>
        <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Active Investigation &nbsp;/&nbsp; {investigationId}
        </div>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 600, fontStyle: 'italic', color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
          "{investigation?.claim_text || 'Loading claim…'}"
        </h2>

        {investigation?.status === 'COMPLETED' && (
          <button
            id="view-report-btn"
            onClick={() => onViewReport(investigation)}
            style={{
              marginTop: '1rem',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontWeight: 600,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--bg)',
              background: 'var(--confidence)',
              border: 'none',
              padding: '10px 22px',
              cursor: 'pointer',
            }}
          >
            View Final Report
          </button>
        )}
      </div>

      {/* ── Progress track ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        {STEPS.map((step, idx) => {
          const passed  = idx <= currentStepIdx;
          const current = idx === currentStepIdx;
          return (
            <div key={step} style={{ flex: 1, borderRight: idx < STEPS.length - 1 ? '1px solid var(--border)' : 'none', padding: '0 12px 0 0', marginRight: idx < STEPS.length - 1 ? '12px' : 0 }}>
              <div style={{ height: '2px', background: passed ? 'var(--text)' : 'var(--border-subtle)', marginBottom: '6px', transition: 'background 0.3s' }} />
              <div className="font-data" style={{ fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: current ? 'var(--text)' : passed ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                {STEP_LABEL[step]}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Budget allocation table ───────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-data" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Budget Allocation — 0/1 Knapsack
          </span>
          <span className="font-data" style={{ fontSize: '10px', color: 'var(--accent)' }}>
            Max: ${(investigation?.max_budget_usdc || 0.002).toFixed(4)} USDC
          </span>
        </div>

        {investigation?.agent_runs && investigation.agent_runs.length > 0 ? (
          <div>
            {investigation.agent_runs.map((ar: AgentRun, i: number) => {
              const selected = ar.selection_status === 'SELECTED';
              return (
                <div
                  key={ar.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '0.875rem 1rem',
                    borderBottom: i < (investigation.agent_runs?.length ?? 0) - 1 ? '1px solid var(--border-subtle)' : 'none',
                    opacity: selected ? 1 : 0.5,
                  }}
                >
                  {/* Status tag */}
                  <span className="font-data" style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                    border: `1px solid ${selected ? 'var(--confidence)' : 'var(--border)'}`,
                    color: selected ? 'var(--confidence)' : 'var(--text-dim)',
                    padding: '2px 6px', flexShrink: 0,
                  }}>
                    {selected ? 'SELECTED' : 'SKIPPED'}
                  </span>

                  {/* Agent name + sub-question */}
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div className="font-body" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>{ar.agent_name}</div>
                    <div className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>"{ar.sub_question}"</div>
                    {ar.selection_reason && (
                      <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>{ar.selection_reason}</div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Value</div>
                      <div className="font-data" style={{ fontSize: '13px', color: 'var(--confidence)' }}>{ar.estimated_value || 85}/100</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cost</div>
                      <div className="font-data" style={{ fontSize: '13px', color: 'var(--accent)' }}>${(ar.estimated_cost_usdc || 0.001).toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="font-data" style={{ padding: '1.5rem 1rem', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            Running LLM value estimator &amp; Knapsack optimizer…
          </div>
        )}
      </div>

      {/* ── Live event log ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-data" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Agent Event Log
          </span>
          <span className="font-data" style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            SSE / LIVE
          </span>
        </div>

        <div style={{ padding: '0.75rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {events.length === 0 ? (
            <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Listening for orchestration events…</span>
          ) : (
            events.map((evt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>[{evt.type}]</span>
                <span style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{JSON.stringify(evt.payload)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
