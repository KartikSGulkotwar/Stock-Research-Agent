'use client';

const directionColors: Record<string, string> = {
  bullish: 'text-emerald-400',
  bearish: 'text-red-400',
  neutral: 'text-amber-400',
  BUY: 'text-emerald-400',
  SELL: 'text-red-400',
  HOLD: 'text-amber-400',
};

const directionLabels: Record<string, string> = {
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
  BUY: 'Bullish',
  SELL: 'Bearish',
  HOLD: 'Neutral',
};

export default function RecommendationCard({ symbol, price, targetPrice, stopLoss, direction, confidence }: {
  symbol: string;
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  direction: string;
  confidence: number;
}) {
  const upside = targetPrice ? ((targetPrice - price) / price) * 100 : null;
  const downside = stopLoss ? ((price - stopLoss) / price) * 100 : null;
  const recColor = directionColors[direction] || 'text-amber-400';
  const recLabel = directionLabels[direction] || 'Neutral';

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Price Levels</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Current Price</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${price.toFixed(2)}</p>
        </div>
        {targetPrice != null && (
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Estimated Fair Value</p>
            <p className="text-xl font-bold text-emerald-400">${targetPrice.toFixed(2)}</p>
            {upside != null && <p className="text-xs text-emerald-400/80">{upside >= 0 ? '+' : ''}{upside.toFixed(1)}%</p>}
          </div>
        )}
        {stopLoss != null && (
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Technical Support</p>
            <p className="text-xl font-bold text-red-400">${stopLoss.toFixed(2)}</p>
            {downside != null && <p className="text-xs text-red-400/80">-{downside.toFixed(1)}%</p>}
          </div>
        )}
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analysis Confidence</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{(confidence * 100).toFixed(0)}%</p>
        </div>
      </div>
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-divider)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Analysis Direction: </span>
        <span className={'font-bold ' + recColor}>{recLabel}</span>
      </div>
    </div>
  );
}
