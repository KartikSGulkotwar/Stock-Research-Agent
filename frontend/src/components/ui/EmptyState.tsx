'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  suggestions?: { label: string; onClick: () => void }[];
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, suggestions }: EmptyStateProps) {
  return (
    <div className="rounded-2xl p-12 text-center animate-fadeIn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--bg-input)' }}
      >
        <Icon className="w-8 h-8" style={{ color: 'var(--text-dimmed)' }} />
      </div>
      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          {actionLabel}
        </button>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-6">
          <p className="text-xs mb-2" style={{ color: 'var(--text-dimmed)' }}>Popular choices:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map(s => (
              <button
                key={s.label}
                onClick={s.onClick}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
