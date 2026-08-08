import React from 'react';
import { Investigation } from '../types';

interface TimelineProps {
  investigation: Investigation | null;
  events: Array<{ type: string; timestamp: string; payload: any }>;
}

export const Timeline: React.FC<TimelineProps> = ({ investigation, events }) => {
  if (!investigation) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        Submit a claim above to observe real-time agent execution and x402 payment events.
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'IN_PROGRESS':
      case 'PLANNING':
      case 'AGENT_DISPATCH':
      case 'SCORING':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse';
      case 'FAILED':
      case 'PLANNING_FAILED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2.5 py-1 rounded-md">
            ID: {investigation.id}
          </span>
          <h3 className="text-lg font-bold text-white mt-2">
            "{investigation.claim_text}"
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getStatusBadgeClass(investigation.status)}`}>
            STATE: {investigation.status}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        📋 Auditable Investigation Event Log
      </h4>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.length === 0 ? (
          <div className="text-slate-500 text-sm italic">Connecting to live SSE event stream...</div>
        ) : (
          events.map((evt, idx) => {
            let icon = '🔹';
            let title = evt.type;
            let detail = '';
            let badgeStyle = 'text-slate-300';

            if (evt.type === 'STATE_CHANGE') {
              icon = '🔄';
              title = `State Transition -> ${evt.payload.status}`;
              detail = evt.payload.consensus_summary || `Investigation state updated to ${evt.payload.status}`;
              badgeStyle = 'text-cyan-400 font-semibold';
            } else if (evt.type === 'AGENT_LOG') {
              icon = '🤖';
              title = 'Agent Dispatched';
              detail = evt.payload.message;
              badgeStyle = 'text-indigo-300';
            } else if (evt.type === 'PAYMENT_EVENT') {
              const p = evt.payload.payment_log || {};
              if (p.status === 'SUCCESS') {
                icon = '💳';
                title = `x402 Micropayment Executed ($${p.amount_usdc} USDC)`;
                detail = `Paywalled endpoint: ${p.endpoint_url} | Tx Hash: ${p.tx_hash}`;
                badgeStyle = 'text-emerald-400 font-mono';
              } else {
                icon = '⚠️';
                title = `x402 Payment Failed ($${p.amount_usdc} USDC)`;
                detail = `Reason: ${p.failure_reason || 'Insufficient Funds / Key Error'} | Endpoint: ${p.endpoint_url}`;
                badgeStyle = 'text-rose-400 font-semibold';
              }
            } else if (evt.type === 'EVIDENCE_ADDED') {
              const ev = evt.payload.evidence || {};
              icon = '📄';
              title = `Evidence Recorded (${ev.is_paid ? 'Paid x402 Source' : 'Free Open Source'})`;
              detail = `${ev.content_summary} (Reliability Score: ${ev.reliability_score})`;
              badgeStyle = 'text-amber-300';
            }

            return (
              <div key={idx} className="relative bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-sm">
                <div className="absolute -left-[1.85rem] top-3.5 w-3.5 h-3.5 rounded-full bg-slate-800 border border-cyan-500/50" />
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className={badgeStyle}>{icon} {title}</span>
                  <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-slate-300 font-sans">{detail}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
