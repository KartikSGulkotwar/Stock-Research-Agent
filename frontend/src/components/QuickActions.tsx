'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Search, Star, Globe, Briefcase, Filter, HelpCircle, BarChart3, X } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (mode: string) => void;
}

const ACTIONS = [
  { key: 'analyze', label: 'Analyze a stock', desc: 'Run full AI analysis', icon: Search, shortcut: '1', color: '#60a5fa' },
  { key: 'compare', label: 'Compare stocks', desc: 'Side-by-side comparison', icon: BarChart3, shortcut: '2', color: '#8b5cf6' },
  { key: 'watchlist', label: 'View watchlist', desc: 'Tracked stocks & alerts', icon: Star, shortcut: '4', color: '#f59e0b' },
  { key: 'market', label: 'Market overview', desc: 'Indices, sectors, movers', icon: Globe, shortcut: '6', color: '#10b981' },
  { key: 'portfolio', label: 'Check portfolio', desc: 'Hypothetical positions', icon: Briefcase, shortcut: '5', color: '#3b82f6' },
  { key: 'screener', label: 'Run stock screen', desc: 'Filter by criteria', icon: Filter, shortcut: '7', color: '#ec4899' },
];

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl transition-all"
        style={{
          background: open ? 'var(--accent)' : 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          color: open ? '#ffffff' : 'var(--text-muted)',
        }}
        title="Quick Actions"
      >
        <Zap className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden animate-slideDown z-50"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-dropdown)',
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-divider)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            <button onClick={() => setOpen(false)} className="p-0.5" style={{ color: 'var(--text-dimmed)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1">
            {ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => { onNavigate(action.key); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${action.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>{action.desc}</p>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded text-xs font-mono flex-shrink-0" style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}>
                    {action.shortcut}
                  </kbd>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border-divider)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
              Press number keys 1-7 for direct access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
