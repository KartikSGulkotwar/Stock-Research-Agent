'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ProgressBar from './ui/ProgressBar';
import InfoTooltip from './ui/InfoTooltip';

interface EnhancedScoreDisplayProps {
  technical: number;
  fundamental: number;
  sentiment: number;
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'STRONG', color: '#10b981' };
  if (score >= 60) return { label: 'GOOD', color: '#22c55e' };
  if (score >= 40) return { label: 'MIXED', color: '#f59e0b' };
  if (score >= 25) return { label: 'WEAK', color: '#f97316' };
  return { label: 'POOR', color: '#ef4444' };
}

function getScoreSubtext(type: string, score: number): string {
  if (type === 'Technical') {
    if (score >= 60) return 'Bullish trend with positive momentum';
    if (score >= 40) return 'Mixed signals, no clear trend';
    return 'Bearish setup, weak momentum';
  }
  if (type === 'Fundamental') {
    if (score >= 60) return 'Solid financials and valuation';
    if (score >= 40) return 'Average fundamentals';
    return 'Weak financials or overvalued';
  }
  if (score >= 60) return 'Positive market mood and news';
  if (score >= 40) return 'Neutral to mixed sentiment';
  return 'Negative sentiment prevails';
}

export default function EnhancedScoreDisplay({ technical, fundamental, sentiment }: EnhancedScoreDisplayProps) {
  const scores = [
    { name: 'Technical', score: technical, fill: '#3b82f6', helpTerm: 'Technical Score', helpBrief: 'Composite score from RSI, MACD, Moving Averages, and Bollinger Bands analysis.' },
    { name: 'Fundamental', score: fundamental, fill: '#10b981', helpTerm: 'Fundamental Score', helpBrief: 'Composite score from P/E ratio, EPS growth, profit margins, and debt levels.' },
    { name: 'Sentiment', score: sentiment, fill: '#f59e0b', helpTerm: 'Sentiment Score', helpBrief: 'Composite score from news sentiment, analyst ratings, and market mood.' },
  ];

  const avgScore = Math.round((technical + fundamental + sentiment) / 3);
  const consensus = scores.filter(s => s.score >= 60).length;
  const consensusText = consensus >= 2
    ? `${consensus} of 3 scores are strong — consensus is positive`
    : consensus === 1
    ? '1 of 3 scores is strong — mixed consensus'
    : 'No strong scores — weak consensus';

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Analysis Scores</h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
          Avg: {avgScore}/100
        </span>
      </div>

      {/* Score bars with details */}
      <div className="space-y-5 mb-5">
        {scores.map(s => {
          const { label, color } = getScoreLabel(s.score);
          const subtext = getScoreSubtext(s.name, s.score);
          return (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                  <InfoTooltip term={s.helpTerm} brief={s.helpBrief} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: s.fill }}>{s.score}/100</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${color}15`, color }}>{label}</span>
                </div>
              </div>
              <ProgressBar value={s.score} max={100} color={s.fill} height={8} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>{subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="h-48 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scores} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="var(--chart-axis)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg)',
                border: '1px solid var(--tooltip-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={(v: number) => [v + '/100', 'Score']}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {scores.map((s, i) => <Cell key={i} fill={s.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Consensus */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}>
        <div className="flex gap-1">
          {scores.map(s => (
            <div
              key={s.name}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: s.score >= 60 ? 'rgba(16, 185, 129, 0.2)' : s.score >= 40 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: s.score >= 60 ? '#10b981' : s.score >= 40 ? '#f59e0b' : '#ef4444',
              }}
            >
              {s.score >= 60 ? '+' : s.score >= 40 ? '~' : '-'}
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{consensusText}</p>
      </div>
    </div>
  );
}
