import React, { useState } from 'react';

interface SubmitClaimScreenProps {
  onSubmit: (claim: string, budgetUsdc: number) => void;
  onBack: () => void;
  loading: boolean;
}

const SAMPLE_CLAIMS = [
  'Acme Corp completed a $5.8B acquisition of CyberShield Security in 2026',
  'Tesla misses on earnings as free cash flow turns negative and margins slide',
  'OpenAI launched GPT-5 preview model with native real-time Web3 wallet signing'
];

const PRESETS = [0.001, 0.002, 0.005, 0.010];

export const SubmitClaimScreen: React.FC<SubmitClaimScreenProps> = ({ onSubmit, onBack, loading }) => {
  const [claim, setClaim] = useState('');
  const [budgetUsdc, setBudgetUsdc] = useState(0.002);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;
    onSubmit(claim.trim(), budgetUsdc);
  };

  // Calculate percentage fill for custom slider background track
  const minBudget = 0.001;
  const maxBudget = 0.010;
  const sliderPercentage = ((budgetUsdc - minBudget) / (maxBudget - minBudget)) * 100;

  return (
    <div style={{ maxWidth: '44rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Back Nav */}
      <div>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          &larr; Back to All Cases
        </button>
      </div>

      {/* Main Card */}
      <div className="card-primary" style={{ padding: '2.5rem 2rem' }}>
        
        {/* Screen Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.5rem' }}>
            New Claim Investigation
          </h2>
          <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Our AI reviews your claim, decides what evidence is worth checking, and only buys the sources that fit your budget.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Visually Dominant Claim Input Textarea ────────────── */}
          <div>
            <label className="font-body" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Factual Claim to Verify
            </label>
            <textarea
              id="claim-text-input"
              rows={4}
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="Enter any financial, corporate, regulatory, or news claim (e.g. Acme Corp completed a $5.8B acquisition)..."
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg)',
                border: '2px solid var(--border)',
                borderRadius: '10px',
                padding: '1rem',
                color: 'var(--text)',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '15px',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* ── Sample Claims as Clickable Chip Buttons ──────────── */}
          <div>
            <div className="font-body" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sample Claims to Try:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SAMPLE_CLAIMS.map((sample, idx) => {
                const isSelected = claim === sample;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setClaim(sample)}
                    style={{
                      display: 'block',
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--surface)',
                      color: isSelected ? 'var(--accent)' : 'var(--text)',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--accent)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text)';
                      }
                    }}
                  >
                    "{sample}"
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom Styled Evidence Budget Section ──────────────── */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
            
            {/* Header + Prominent Live Number Display */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <label className="font-body" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  Maximum Spending Budget
                </label>
                <p className="font-body" style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  We automatically pick the most valuable evidence within your spending limit.
                </p>
              </div>

              {/* Live updating numerical value display */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className="font-data" style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  backgroundColor: 'var(--accent-light)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBE0FE',
                  display: 'inline-block'
                }}>
                  ${budgetUsdc.toFixed(4)} USDC
                </span>
              </div>
            </div>

            {/* Restyled Preset Pill Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '1.25rem 0' }}>
              {PRESETS.map((amt) => {
                const isSelected = Math.abs(budgetUsdc - amt) < 0.0001;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBudgetUsdc(amt)}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '8px 4px',
                      textAlign: 'center',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ${amt.toFixed(3)}
                  </button>
                );
              })}
            </div>

            {/* Custom Slider with Progress Track & Tick Marks */}
            <div style={{ position: 'relative', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              
              {/* Custom Track Container with Progress Fill */}
              <div style={{ position: 'relative', width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px' }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${sliderPercentage}%`,
                  backgroundColor: 'var(--accent)',
                  borderRadius: '4px',
                  transition: 'width 0.05s linear'
                }} />
              </div>

              {/* Native range input overlayed transparently */}
              <input
                type="range"
                min="0.001"
                max="0.010"
                step="0.001"
                value={budgetUsdc}
                onChange={(e) => setBudgetUsdc(parseFloat(e.target.value))}
                className="custom-range"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: 0,
                  width: '100%',
                  height: '20px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />

              {/* Tick Marks & Labels at preset values */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                {PRESETS.map((amt) => (
                  <span key={amt} className="font-data" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    ${amt.toFixed(3)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Expandable "Technical Details" Toggle ──────────────── */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
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
              {showTechnicalDetails ? 'Hide technical architecture details' : 'Show technical architecture details'}
            </button>

            {showTechnicalDetails && (
              <div className="font-data" style={{
                marginTop: '10px',
                padding: '12px 14px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: 1.6
              }}>
                <div><strong>Orchestrator:</strong> LangGraph multi-agent parallel execution graph</div>
                <div><strong>Protocol:</strong> x402 Micropayment Protocol with EIP-712 payment authorization signatures</div>
                <div><strong>Budget Algorithm:</strong> Exact 0/1 Knapsack optimization over LLM value-density scores (0–100)</div>
                <div><strong>Settlement Network:</strong> Base Sepolia EVM Testnet (Chain ID 84532, Sepolia USDC Contract 0x036C...93b3)</div>
              </div>
            )}
          </div>

          {/* ── Submit CTA ─────────────────────────────────────────── */}
          <button
            id="launch-investigation-btn"
            type="submit"
            disabled={loading || !claim.trim()}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 600,
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <>Initialising Agent Workflow...</>
            ) : (
              <>Start Autonomous Investigation (${budgetUsdc.toFixed(4)} USDC Max) &rarr;</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
