import React from 'react';
import { PaymentLog } from '../types';

interface PaymentAuditProps {
  paymentLogs: PaymentLog[];
}

export const PaymentAudit: React.FC<PaymentAuditProps> = ({ paymentLogs }) => {
  const totalSpent = paymentLogs
    .filter(p => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + p.amount_usdc, 0);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl mb-8">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">⚡</span> x402 Micropayment Ledger & Audit Log
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Real-time on-chain payment record on Base Sepolia testnet (USDC)
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium uppercase">Total Successful Spend</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            ${totalSpent.toFixed(2)} USDC
          </div>
        </div>
      </div>

      {paymentLogs.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm italic">
          No x402 micropayment attempts recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 font-sans">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase font-mono">
              <tr>
                <th className="p-3">Endpoint URL</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Network</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tx Hash / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paymentLogs.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono text-xs text-slate-300 max-w-xs truncate">
                      {log.endpoint_url}
                    </td>
                    <td className="p-3 font-mono font-semibold text-emerald-300">
                      ${log.amount_usdc} USDC
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-blue-950/80 border border-blue-800/60 text-blue-300 px-2 py-0.5 rounded font-mono">
                        {log.network}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          isSuccess
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {isSuccess ? (
                        <span className="text-cyan-400 truncate max-w-xs block" title={log.tx_hash || ''}>
                          {log.tx_hash ? `${log.tx_hash.substring(0, 18)}...` : 'N/A'}
                        </span>
                      ) : (
                        <span className="text-rose-400 italic">
                          {log.failure_reason || 'Payment Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
