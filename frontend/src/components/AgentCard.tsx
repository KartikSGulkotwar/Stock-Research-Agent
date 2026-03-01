'use client';

import { TrendingUp, DollarSign, Newspaper, AlertTriangle } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  technical: <TrendingUp className="w-6 h-6" />,
  fundamental: <DollarSign className="w-6 h-6" />,
  sentiment: <Newspaper className="w-6 h-6" />,
  risk: <AlertTriangle className="w-6 h-6" />,
};

const titles: Record<string, string> = { technical: 'Technical', fundamental: 'Fundamental', sentiment: 'Sentiment', risk: 'Risk' };

export default function AgentCard({ type, summary, score, extra }: { type: string; summary: string; score?: number; extra?: Record<string, unknown> }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg" style={{ background: 'var(--bg-icon)', color: 'var(--accent)' }}>{icons[type]}</div>
        <div className="flex-1">
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{titles[type]}</h4>
          {score != null && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Score: {score}/100</p>}
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{summary}</p>
      {extra && Object.keys(extra).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(extra).map(([key, value]) => {
            if (value == null) return null;
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (Array.isArray(value)) {
              return value.map((item, i) => (
                <span key={`${key}-${i}`} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  {String(item)}
                </span>
              ));
            }
            return (
              <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                {label}: <strong className="ml-1" style={{ color: 'var(--text-primary)' }}>{String(value)}</strong>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
