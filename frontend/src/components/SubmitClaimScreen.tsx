import React, { useState } from 'react';

interface SubmitClaimScreenProps {
  onSubmit: (claim: string, budgetUsdc: number) => void;
  onBack: () => void;
  loading: boolean;
}

const SAMPLES = [
  'Acme Corp completed a $5.8B acquisition of CyberShield Security in 2026',
  'Tesla misses on earnings as free cash flow turns negative and margins slide',
  'OpenAI launched GPT-5 preview model with native real-time Web3 wallet signing',
];

const PRESETS = [0.001, 0.002, 0.005, 0.010];

export const SubmitClaimScreen: React.FC<SubmitClaimScreenProps> = ({ onSubmit, onBack, loading }) => {
  const [claim, setClaim] = useState('');
  const [budgetUsdc, setBudgetUsdc] = useState(0.002);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;
    onSubmit(claim.trim(), budgetUsdc);
  };

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Back */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, alignSelf: 'flex-start' }}>
        ← Case Files
      </button>

      {/* Heading */}
      <div style={{ borderTop: '3px solid var(--text)', paddingTop: '1.75rem' }}>
        <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          New Investigation — Submit Claim
        </div>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, fontStyle: 'italic', color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>
          What claim requires verification?
        </h2>
        <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
          Agents will decompose the claim, score evidence sources, and purchase verified data via x402 micropayments within your budget.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Claim input */}
        <div>
          <label className="font-data" style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Claim statement
          </label>
          <textarea
            id="claim-text-input"
            rows={5}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="e.g. Acme Corp completed a $5.8B acquisition of CyberShield Security..."
            required
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 0,
              padding: '0.875rem 1rem',
              color: 'var(--text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--text-muted)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Sample claims */}
        <div>
          <div className="font-data" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Sample claims
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setClaim(s)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  padding: '6px 0',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '12px',
                  color: claim === s ? 'var(--text)' : 'var(--text-dim)',
                  borderBottom: '1px solid var(--border-subtle)',
                  lineHeight: 1.4,
                  transition: 'color 0.1s',
                }}
              >
                "{s}"
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <div>
              <div className="font-data" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
                Max Evidence Budget
              </div>
              <div className="font-body" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Knapsack optimizer selects highest-value sources within this limit
              </div>
            </div>
            <div className="font-data" style={{ fontSize: '1.25rem', color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
              ${budgetUsdc.toFixed(4)} USDC
            </div>
          </div>

          {/* Preset pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBudgetUsdc(amt)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '5px 12px',
                  background: budgetUsdc === amt ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${budgetUsdc === amt ? 'var(--accent)' : 'var(--border)'}`,
                  color: budgetUsdc === amt ? 'var(--accent)' : 'var(--text-dim)',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.1s',
                }}
              >
                ${amt.toFixed(3)}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0.001" max="0.010" step="0.001"
            value={budgetUsdc}
            onChange={(e) => setBudgetUsdc(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Submit */}
        <button
          id="launch-investigation-btn"
          type="submit"
          disabled={loading || !claim.trim()}
          style={{
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--bg)',
            background: loading || !claim.trim() ? 'var(--text-muted)' : 'var(--text)',
            border: 'none',
            padding: '14px 28px',
            cursor: loading || !claim.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.15s',
          }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="8"/>
              </svg>
              Initialising investigation...
            </>
          ) : (
            `Launch Investigation — ${budgetUsdc.toFixed(4)} USDC max`
          )}
        </button>
      </form>
    </div>
  );
};
