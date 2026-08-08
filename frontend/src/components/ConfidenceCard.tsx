import React from 'react';
import { Investigation, EvidenceItem } from '../types';

interface ConfidenceCardProps {
  investigation: Investigation | null;
  evidenceItems: EvidenceItem[];
}

export const ConfidenceCard: React.FC<ConfidenceCardProps> = ({ investigation, evidenceItems }) => {
  if (!investigation || investigation.overall_confidence_score === null) {
    return null;
  }

  const scorePct = Math.round(investigation.overall_confidence_score * 100);
  
  let scoreColor = 'from-emerald-500 to-teal-400 text-emerald-400';
  if (scorePct < 50) {
    scoreColor = 'from-rose-500 to-amber-500 text-rose-400';
  } else if (scorePct < 85) {
    scoreColor = 'from-amber-500 to-cyan-400 text-amber-400';
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl mb-8">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎯</span> Aggregated Confidence Score
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Calculated across {evidenceItems.length} gathered evidence items (Paid & Open sources)
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-xl">
          <div className={`text-4xl font-extrabold font-mono ${scoreColor.split(' ')[2]}`}>
            {scorePct}%
          </div>
          <div className="text-xs text-slate-400 font-medium leading-tight">
            VERIFICATION<br />CONFIDENCE
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Extracted Evidence Summary
        </h4>

        {evidenceItems.map((item, idx) => (
          <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-mono text-cyan-400 truncate max-w-md" title={item.source_url}>
                🔗 {item.source_url}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-medium border ${
                  item.is_paid
                    ? 'bg-purple-950/80 border-purple-800 text-purple-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.is_paid ? '⚡ x402 Paid Source' : '🌐 Open Source'}
              </span>
            </div>

            <p className="text-slate-200 text-sm">{item.content_summary}</p>
            
            <div className="mt-2 text-xs text-slate-500">
              Reliability Score: <span className="text-amber-400 font-semibold">{item.reliability_score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
