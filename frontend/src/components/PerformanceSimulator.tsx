'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';

interface SimulatorProps {
  symbol: string;
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  confidence: number;
}

export default function PerformanceSimulator({ symbol, currentPrice, targetPrice, stopLoss, confidence }: SimulatorProps) {
  const [amount, setAmount] = useState<string>('1000');

  const investment = parseFloat(amount) || 0;
  if (!currentPrice || investment <= 0) return null;

  const shares = investment / currentPrice;

  const scenarios = [
    {
      label: 'Fair Value Reached',
      price: targetPrice || currentPrice * 1.15,
      color: 'text-emerald-400',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    {
      label: 'Moderate Gain (+10%)',
      price: currentPrice * 1.10,
      color: 'text-emerald-400',
      bg: 'rgba(16, 185, 129, 0.05)',
      border: 'rgba(16, 185, 129, 0.2)',
    },
    {
      label: 'No Change',
      price: currentPrice,
      color: 'var(--text-muted)',
      bg: 'var(--bg-input)',
      border: 'var(--border-divider)',
    },
    {
      label: 'Moderate Loss (-10%)',
      price: currentPrice * 0.90,
      color: 'text-amber-400',
      bg: 'rgba(245, 158, 11, 0.05)',
      border: 'rgba(245, 158, 11, 0.2)',
    },
    {
      label: 'Technical Support Hit',
      price: stopLoss || currentPrice * 0.85,
      color: 'text-red-400',
      bg: 'rgba(239, 68, 68, 0.05)',
      border: 'rgba(239, 68, 68, 0.2)',
    },
  ];

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Calculator className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        Performance Simulator
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-dimmed)' }}>
        Hypothetical scenarios only. Not a prediction or recommendation. All investments carry risk of loss.
      </p>

      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm" style={{ color: 'var(--text-muted)' }}>Hypothetical Investment:</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-dimmed)' }}>$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-32 pl-7 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            min="0"
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
          = {shares.toFixed(2)} shares @ ${currentPrice.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        {scenarios.map((s, i) => {
          const returnAmt = (s.price - currentPrice) * shares;
          const returnPct = ((s.price - currentPrice) / currentPrice) * 100;
          const finalValue = investment + returnAmt;
          const isGain = returnAmt > 0;
          const isLoss = returnAmt < 0;

          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div className="flex items-center gap-2">
                {isGain ? <TrendingUp className={`w-4 h-4 ${s.color}`} /> : isLoss ? <TrendingDown className={`w-4 h-4 ${s.color}`} /> : <span className="w-4" />}
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>@ ${s.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${s.color}`}>
                  ${finalValue.toFixed(0)}
                </p>
                <p className={`text-xs font-medium ${s.color}`}>
                  {isGain ? '+' : ''}{returnPct.toFixed(1)}% ({isGain ? '+' : ''}${returnAmt.toFixed(0)})
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-dimmed)' }}>
        These are hypothetical scenarios for educational purposes. Actual results will vary. This is NOT investment advice.
      </p>
    </div>
  );
}
