'use client';

import { AlertCircle, RefreshCw, Search, MessageCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  type?: 'network' | 'not_found' | 'api_limit' | 'generic';
  onRetry?: () => void;
  onSearch?: () => void;
}

const ERROR_REASONS: Record<string, string[]> = {
  network: ['Network connection may be down', 'API server might not be running', 'Request timed out'],
  not_found: ['Invalid stock symbol', 'Symbol may have been delisted', 'Check spelling and try again'],
  api_limit: ['API rate limit reached', 'Too many requests in a short time', 'Wait a moment and try again'],
  generic: ['An unexpected error occurred', 'The service may be temporarily unavailable', 'Try again in a moment'],
};

export default function ErrorState({ title, message, type = 'generic', onRetry, onSearch }: ErrorStateProps) {
  const reasons = ERROR_REASONS[type] || ERROR_REASONS.generic;

  return (
    <div className="rounded-2xl p-8 text-center animate-scaleIn" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>

      <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title || 'Something went wrong'}
      </p>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{message}</p>

      <div className="max-w-xs mx-auto text-left mb-6 space-y-1.5">
        <p className="text-xs font-medium" style={{ color: 'var(--text-dimmed)' }}>Possible reasons:</p>
        {reasons.map((r, i) => (
          <p key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-red-400/60 mt-0.5">&#x2022;</span>
            {r}
          </p>
        ))}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        )}
        {onSearch && (
          <button
            onClick={onSearch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)' }}
          >
            <Search className="w-3.5 h-3.5" /> Search Stocks
          </button>
        )}
      </div>
    </div>
  );
}
