'use client';

import { Target, DollarSign, ShieldCheck, BarChart3 } from 'lucide-react';
import InfoTooltip from './ui/InfoTooltip';

interface PriceLadderProps {
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  analystTarget?: number;
  direction: string;
}

export default function PriceLadder({ currentPrice: rawPrice, targetPrice, stopLoss, analystTarget, direction }: PriceLadderProps) {
  const currentPrice = rawPrice || 0;
  if (!currentPrice) return null;
  const prices: { label: string; price: number; icon: typeof Target; color: string; pct: number; tag: string }[] = [];

  if (targetPrice && targetPrice > currentPrice) {
    const pct = ((targetPrice - currentPrice) / currentPrice) * 100;
    prices.push({ label: 'Estimated Fair Value', price: targetPrice, icon: Target, color: '#10b981', pct, tag: `+${pct.toFixed(1)}% upside` });
  }

  if (analystTarget && analystTarget !== targetPrice && analystTarget > currentPrice) {
    const pct = ((analystTarget - currentPrice) / currentPrice) * 100;
    prices.push({ label: 'Analyst Consensus', price: analystTarget, icon: BarChart3, color: '#3b82f6', pct, tag: `+${pct.toFixed(1)}% upside` });
  }

  // Sort targets descending
  prices.sort((a, b) => b.price - a.price);

  // Current price
  const currentItem = { label: 'Current Price', price: currentPrice, icon: DollarSign, color: 'var(--text-primary)', pct: 0, tag: 'You are here' };

  // Stop loss
  const supports: typeof prices = [];
  if (stopLoss && stopLoss < currentPrice) {
    const pct = ((currentPrice - stopLoss) / currentPrice) * 100;
    supports.push({ label: 'Technical Support', price: stopLoss, icon: ShieldCheck, color: '#ef4444', pct: -pct, tag: `-${pct.toFixed(1)}% downside` });
  }

  if (targetPrice && targetPrice < currentPrice) {
    const pct = ((targetPrice - currentPrice) / currentPrice) * 100;
    prices.push({ label: 'Estimated Fair Value', price: targetPrice, icon: Target, color: '#ef4444', pct, tag: `${pct.toFixed(1)}% downside` });
  }

  const allItems = [...prices, currentItem, ...supports];

  // Calculate risk/reward ratio
  const upside = targetPrice ? Math.abs(((targetPrice - currentPrice) / currentPrice) * 100) : 0;
  const downside = stopLoss ? Math.abs(((currentPrice - stopLoss) / currentPrice) * 100) : 0;
  const rrRatio = downside > 0 ? (upside / downside) : 0;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Price Levels & Targets</h3>
        <InfoTooltip term="Price Levels" brief="Key price points from the analysis including fair value estimates and technical support levels." />
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--text-dimmed)' }}>Vertical price map showing key levels relative to current price</p>

      {/* Visual ladder */}
      <div className="relative pl-8 space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px" style={{ background: 'var(--border-divider)' }} />

        {allItems.map((item, i) => {
          const Icon = item.icon;
          const isCurrent = item.label === 'Current Price';

          return (
            <div key={item.label} className="relative flex items-center gap-4 py-3">
              {/* Dot on the line */}
              <div
                className="absolute left-[-21px] w-3 h-3 rounded-full z-10"
                style={{
                  background: isCurrent ? 'var(--accent)' : typeof item.color === 'string' && item.color.startsWith('#') ? item.color : 'var(--text-muted)',
                  border: isCurrent ? '2px solid var(--accent)' : '2px solid var(--bg-card)',
                  boxShadow: isCurrent ? '0 0 0 3px var(--accent-muted)' : 'none',
                }}
              />

              {/* Content */}
              <div className={`flex-1 flex items-center justify-between rounded-xl px-4 py-3 ${isCurrent ? 'animate-glow' : ''}`}
                style={{
                  background: isCurrent ? 'var(--accent-muted)' : 'var(--bg-input)',
                  border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border-divider)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" style={{ color: typeof item.color === 'string' && item.color.startsWith('#') ? item.color : 'var(--accent)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {item.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>{item.tag}</p>
                  </div>
                </div>
                <p className="text-lg font-bold" style={{ color: typeof item.color === 'string' && item.color.startsWith('#') ? item.color : 'var(--text-primary)' }}>
                  ${(item.price ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk/Reward ratio */}
      {rrRatio > 0 && (
        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-divider)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Risk/Reward Ratio:</span>
            <span className="text-sm font-bold" style={{ color: rrRatio >= 1 ? '#10b981' : '#ef4444' }}>
              1:{rrRatio.toFixed(2)}
            </span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{
            background: rrRatio >= 1.5 ? 'rgba(16, 185, 129, 0.15)' : rrRatio >= 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: rrRatio >= 1.5 ? '#10b981' : rrRatio >= 1 ? '#f59e0b' : '#ef4444',
          }}>
            {rrRatio >= 1.5 ? 'Favorable' : rrRatio >= 1 ? 'Moderate' : 'Unfavorable'}
          </span>
        </div>
      )}
    </div>
  );
}
