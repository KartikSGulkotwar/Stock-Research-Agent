'use client';

import { Database, Newspaper, BarChart3, Star, Clock, RefreshCw } from 'lucide-react';

interface DataAttributionProps {
  lastUpdated?: string;
  onRefresh?: () => void;
  loading?: boolean;
  sources?: ('prices' | 'news' | 'fundamentals' | 'analysts')[];
}

const SOURCE_INFO = {
  prices: { icon: BarChart3, label: 'Prices: Yahoo Finance (15min delay)', color: '#3b82f6' },
  news: { icon: Newspaper, label: 'News: NewsAPI', color: '#f59e0b' },
  fundamentals: { icon: Database, label: 'Fundamentals: FMP API', color: '#10b981' },
  analysts: { icon: Star, label: 'Analysts: Third-party consensus', color: '#8b5cf6' },
};

export default function DataAttribution({ lastUpdated, onRefresh, loading, sources = ['prices', 'fundamentals'] }: DataAttributionProps) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2"
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium" style={{ color: 'var(--text-dimmed)' }}>Data Sources:</span>
        {sources.map(s => {
          const info = SOURCE_INFO[s];
          const Icon = info.icon;
          return (
            <span key={s} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Icon className="w-3 h-3" style={{ color: info.color }} />
              {info.label}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {lastUpdated && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmed)' }}>
            <Clock className="w-3 h-3" />
            Updated {lastUpdated}
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all"
            style={{ color: 'var(--accent)' }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
