'use client';

import { ThumbsUp, AlertTriangle, Target } from 'lucide-react';

interface KeyInsightsCardsProps {
  findings: string[];
  direction: string;
  confidence: number;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
}

function categorizeFindings(findings: string[], techScore: number, fundScore: number, sentScore: number) {
  const positive: string[] = [];
  const negative: string[] = [];

  const positiveWords = ['strong', 'bullish', 'positive', 'buy', 'growth', 'healthy', 'outperform', 'above', 'upside', 'increasing', 'robust', 'high earnings', 'beat', 'improve', 'momentum'];
  const negativeWords = ['weak', 'bearish', 'negative', 'sell', 'decline', 'risk', 'below', 'downside', 'decreasing', 'volatile', 'overvalued', 'concern', 'miss', 'pressure', 'resistance'];

  for (const finding of findings) {
    const lower = finding.toLowerCase();
    const hasPositive = positiveWords.some(w => lower.includes(w));
    const hasNegative = negativeWords.some(w => lower.includes(w));

    if (hasPositive && !hasNegative) positive.push(finding);
    else if (hasNegative && !hasPositive) negative.push(finding);
    else if (hasPositive && hasNegative) {
      // Mixed — categorize by dominant score
      if (techScore + fundScore + sentScore > 150) positive.push(finding);
      else negative.push(finding);
    } else {
      // Neutral — put in whichever has fewer
      if (positive.length <= negative.length) positive.push(finding);
      else negative.push(finding);
    }
  }

  return { positive, negative };
}

export default function KeyInsightsCards({ findings, direction, confidence, technicalScore, fundamentalScore, sentimentScore }: KeyInsightsCardsProps) {
  if (!findings || findings.length === 0) return null;

  const { positive, negative } = categorizeFindings(findings, technicalScore, fundamentalScore, sentimentScore);

  // Generate bottom line
  const avgScore = (technicalScore + fundamentalScore + sentimentScore) / 3;
  const bottomLine = direction === 'bullish' || direction === 'BUY'
    ? `Overall positive outlook with ${confidence > 0.7 ? 'strong' : 'moderate'} confidence. ${technicalScore < 50 ? 'Consider technical weakness for entry timing.' : 'Technicals support the bullish view.'}`
    : direction === 'bearish' || direction === 'SELL'
    ? `Caution warranted. ${fundamentalScore > 60 ? 'Fundamentals remain decent despite bearish signals.' : 'Both technicals and fundamentals show weakness.'}`
    : `Mixed signals suggest patience. ${avgScore > 50 ? 'Slight lean positive on balance.' : 'Wait for clearer direction before acting.'}`;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Key Insights</h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Positive factors */}
        {positive.length > 0 && (
          <div className="rounded-xl p-4 gradient-success" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-400">Positive Factors</p>
            </div>
            <ul className="space-y-2">
              {positive.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">+</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk factors */}
        {negative.length > 0 && (
          <div className="rounded-xl p-4 gradient-danger" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400">Risk Factors</p>
            </div>
            <ul className="space-y-2">
              {negative.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-red-400 mt-0.5 flex-shrink-0">!</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom line */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bottom Line</p>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{bottomLine}</p>
      </div>
    </div>
  );
}
