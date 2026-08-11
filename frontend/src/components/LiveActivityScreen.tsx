import React, { useEffect, useState } from 'react';
import { Investigation, AgentRun } from '../types';
import { getInvestigation, subscribeToInvestigationSSE } from '../services/api';

interface LiveActivityScreenProps {
  investigationId: string;
  onViewReport: (inv: Investigation) => void;
}

export const LiveActivityScreen: React.FC<LiveActivityScreenProps> = ({ investigationId, onViewReport }) => {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; timestamp: string; payload: any }>>([]);
  const [budgetAllocation, setBudgetAllocation] = useState<any>(null);

  // Poll investigation state and subscribe to SSE events
  useEffect(() => {
    let isMounted = true;

    const fetchCurrent = async () => {
      try {
        const inv = await getInvestigation(investigationId);
        if (isMounted) setInvestigation(inv);
      } catch (err) {
        console.error('Error fetching investigation:', err);
      }
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 1500);

    const unsubscribe = subscribeToInvestigationSSE(investigationId, (eventType, data) => {
      if (!isMounted) return;
      setEvents((prev) => [...prev, { type: eventType, timestamp: data.timestamp, payload: data.payload }]);
      
      if (eventType === 'BUDGET_ALLOCATION') {
        setBudgetAllocation(data.payload);
      }
      if (eventType === 'STATE_CHANGE' || eventType === 'COMPLETED') {
        fetchCurrent();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [investigationId]);

  const steps = ['PLANNING', 'AGENT_DISPATCH', 'IN_PROGRESS', 'SCORING', 'COMPLETED'];
  const currentStepIdx = investigation ? steps.indexOf(investigation.status) : 0;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">Live Agent Investigation</span>
            <h2 className="text-2xl font-bold text-white mt-1">"{investigation?.claim_text || 'Loading Claim...'}"</h2>
            <p className="text-slate-400 text-xs font-mono mt-1">ID: {investigationId}</p>
          </div>

          {investigation?.status === 'COMPLETED' && (
            <button
              id="view-report-btn"
              onClick={() => onViewReport(investigation)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              View Final Report →
            </button>
          )}
        </div>

        {/* Workflow Stepper */}
        <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-800/80">
          {steps.map((step, idx) => {
            const isPassed = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="space-y-2">
                <div className={`h-2 rounded-full transition-all ${
                  isPassed ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-800'
                }`} />
                <div className={`text-[10px] font-mono uppercase tracking-wider text-center ${
                  isCurrent ? 'text-cyan-300 font-bold' : isPassed ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {step.replace('_', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 0/1 Knapsack Budget Allocation Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🎯 0/1 Knapsack Budget Allocation Decisions
          </h3>
          <span className="text-cyan-400 font-mono text-sm font-bold">
            Max Budget: ${(investigation?.max_budget_usdc || 0.002).toFixed(4)} USDC
          </span>
        </div>

        {investigation?.agent_runs && investigation.agent_runs.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {investigation.agent_runs.map((ar: AgentRun) => (
              <div
                key={ar.id}
                className={`p-4 rounded-xl border transition-all ${
                  ar.selection_status === 'SELECTED'
                    ? 'bg-slate-950/80 border-cyan-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      ar.selection_status === 'SELECTED'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {ar.selection_status || 'SELECTED'}
                    </span>
                    <h4 className="font-bold text-white text-sm">{ar.agent_name}</h4>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">Value Score: <strong className="text-emerald-400">{ar.estimated_value || 85}/100</strong></span>
                    <span className="text-slate-400">Cost: <strong className="text-cyan-400">${(ar.estimated_cost_usdc || 0.001).toFixed(4)} USDC</strong></span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between gap-4">
                  <p className="line-clamp-1">Sub-question: "{ar.sub_question}"</p>
                  <span className="text-slate-500 text-[11px] shrink-0">{ar.selection_reason}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs font-mono bg-slate-950/50 rounded-xl border border-slate-800">
            Running LLM Value Estimator & 0/1 Knapsack Optimizer...
          </div>
        )}
      </div>

      {/* Live Event Log Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            📡 Live Event Stream & Agent Activity Log
          </h3>
          <span className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Backend SSE Connected
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 max-h-80 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <div className="text-slate-500 italic">Listening for backend orchestration events...</div>
          ) : (
            events.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-3 border-b border-slate-900 pb-1.5 last:border-0">
                <span className="text-slate-500 shrink-0">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span className="text-cyan-400 font-bold shrink-0">[{evt.type}]</span>
                <span className="text-slate-300 break-all">{JSON.stringify(evt.payload)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
