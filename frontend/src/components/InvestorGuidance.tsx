'use client';

import { Shield, Rocket, Zap, Clock } from 'lucide-react';

interface InvestorGuidanceProps {
  direction: string;
  confidence: number;
  riskLevel: string;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
}

export default function InvestorGuidance({ direction, confidence, riskLevel, technicalScore, fundamentalScore, sentimentScore }: InvestorGuidanceProps) {
  const isBullish = direction === 'bullish' || direction === 'BUY';
  const isBearish = direction === 'bearish' || direction === 'SELL';
  const avgScore = (technicalScore + fundamentalScore + sentimentScore) / 3;

  // Generate guidance per investor type
  const conservative = isBullish
    ? [
        technicalScore < 50 ? 'Wait for technical improvement before entry' : 'Technical setup is favorable for entry',
        'Consider dollar-cost averaging over 3-6 months',
        riskLevel === 'HIGH' ? 'Position size should be small given high risk' : 'Moderate position size acceptable',
      ]
    : isBearish
    ? [
        'Avoid new positions until trend reverses',
        'If holding, consider trimming on bounces',
        'Set strict trailing stops if maintaining position',
      ]
    : [
        'Wait for clearer direction before allocating',
        'If interested, start with very small position',
        'Monitor for breakout or breakdown signals',
      ];

  const growth = isBullish
    ? [
        fundamentalScore > 60 ? 'Strong fundamentals justify long-term hold' : 'Growth potential but fundamentals need monitoring',
        technicalScore < 50 ? 'Current weakness may be buying opportunity' : 'Momentum supports the bullish case',
        'Consider adding on pullbacks to support levels',
      ]
    : isBearish
    ? [
        'Short-term weakness may create entry opportunity later',
        fundamentalScore > 60 ? 'Fundamentals remain solid despite bearish signals' : 'Both price and fundamentals deteriorating',
        'Watch for reversal signals before adding',
      ]
    : [
        'Mixed signals suggest accumulation phase',
        'Scale in gradually on weakness',
        'Set clear price targets before entry',
      ];

  const active = isBullish
    ? [
        technicalScore > 60 ? 'Bullish technicals support momentum trades' : 'Wait for technical confirmation',
        `Key level to watch: MA50 and recent support`,
        'Volume confirmation needed for breakout',
      ]
    : isBearish
    ? [
        'Short-term bearish setup may offer opportunities',
        `Watch for oversold bounces (RSI < 30)`,
        'Tight stops recommended given uncertainty',
      ]
    : [
        'Range-bound trading may be appropriate',
        'Look for breakout/breakdown from current range',
        'Use smaller position sizes in mixed conditions',
      ];

  // Time horizon guidance
  const shortTerm = isBullish ? (technicalScore > 50 ? 'Positive' : 'Neutral — technical weakness') : isBearish ? (technicalScore < 40 ? 'Bearish' : 'Cautious') : 'Neutral';
  const medTerm = isBullish ? (fundamentalScore > 50 ? 'Positive' : 'Moderate') : isBearish ? (fundamentalScore > 60 ? 'May improve' : 'Cautious') : 'Neutral';
  const longTerm = fundamentalScore > 60 ? 'Constructive' : fundamentalScore > 40 ? 'Neutral' : 'Cautious';

  const shortColor = shortTerm.includes('Positive') ? '#10b981' : shortTerm.includes('Bearish') || shortTerm.includes('weakness') ? '#ef4444' : '#f59e0b';
  const medColor = medTerm.includes('Positive') ? '#10b981' : medTerm.includes('Cautious') ? '#ef4444' : '#f59e0b';
  const longColor = longTerm === 'Constructive' ? '#10b981' : longTerm === 'Cautious' ? '#ef4444' : '#f59e0b';

  const profiles = [
    { icon: Shield, title: 'Conservative Investors', color: '#3b82f6', points: conservative },
    { icon: Rocket, title: 'Growth Investors', color: '#10b981', points: growth },
    { icon: Zap, title: 'Active Traders', color: '#f59e0b', points: active },
  ];

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>What This Analysis Means</h3>
      <p className="text-xs mb-5" style={{ color: 'var(--text-dimmed)' }}>Educational guidance by investor type — not personalized advice</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {profiles.map(p => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="rounded-xl p-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${p.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: p.color }}>{p.title}</p>
              </div>
              <ul className="space-y-2">
                {p.points.map((point, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: p.color }} className="mt-0.5">&#x2022;</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Time Horizon */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Time Horizon View</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>0-3 months</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: shortColor }}>{shortTerm}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>3-12 months</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: medColor }}>{medTerm}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>1-3 years</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: longColor }}>{longTerm}</p>
          </div>
        </div>
      </div>

      <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-dimmed)' }}>
        This is educational guidance based on general principles, not personalized investment advice.
      </p>
    </div>
  );
}
