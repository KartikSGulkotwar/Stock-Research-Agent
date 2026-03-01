'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X, TrendingUp, Clock, Star, ArrowRight, Command } from 'lucide-react';
import { STOCK_SYMBOLS } from '@/lib/helpContent';

interface SearchBarProps {
  onAnalyze: (symbol: string) => void;
  onNavigate: (mode: string) => void;
}

const RECENT_SEARCHES_KEY = 'stock-agent-recent-searches';

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(items: string[]) {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, 8)));
}

export default function SearchBar({ onAnalyze, onNavigate }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toUpperCase().trim();
    const matched = STOCK_SYMBOLS.filter(s =>
      s.symbol.includes(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 6);
    return matched;
  }, [query]);

  const allItems = useMemo(() => {
    const items: { type: string; label: string; sub: string; action: () => void }[] = [];

    if (query.trim()) {
      // Quick analyze action
      const sym = query.trim().toUpperCase();
      items.push({
        type: 'action',
        label: `Analyze ${sym}`,
        sub: 'Run full AI analysis',
        action: () => {
          addRecent(sym);
          onAnalyze(sym);
          setOpen(false);
          setQuery('');
        },
      });

      // Stock matches
      results.forEach(r => {
        items.push({
          type: 'stock',
          label: r.symbol,
          sub: `${r.name} · ${r.sector}`,
          action: () => {
            addRecent(r.symbol);
            onAnalyze(r.symbol);
            setOpen(false);
            setQuery('');
          },
        });
      });
    } else {
      // Recent searches
      recent.forEach(r => {
        items.push({
          type: 'recent',
          label: r,
          sub: 'Recent search',
          action: () => {
            onAnalyze(r);
            setOpen(false);
            setQuery('');
          },
        });
      });
    }

    return items;
  }, [query, results, recent, onAnalyze]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  const addRecent = useCallback((sym: string) => {
    const updated = [sym, ...recent.filter(r => r !== sym)].slice(0, 8);
    setRecent(updated);
    saveRecent(updated);
  }, [recent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIdx]) {
        allItems[selectedIdx].action();
      } else if (query.trim()) {
        const sym = query.trim().toUpperCase();
        addRecent(sym);
        onAnalyze(sym);
        setOpen(false);
        setQuery('');
      }
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search stocks...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}>
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]" style={{ background: 'var(--bg-overlay)' }}>
          <div
            ref={containerRef}
            className="w-full max-w-lg animate-scaleIn"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-dropdown)',
              overflow: 'hidden',
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-divider)' }}>
              <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks, run analysis..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-0.5" style={{ color: 'var(--text-dimmed)' }}>
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto py-2">
              {allItems.length > 0 ? (
                allItems.map((item, i) => (
                  <button
                    key={`${item.type}-${item.label}-${i}`}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      background: i === selectedIdx ? 'var(--accent-muted)' : 'transparent',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      {item.type === 'action' ? <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} /> :
                       item.type === 'recent' ? <Clock className="w-4 h-4" style={{ color: 'var(--text-dimmed)' }} /> :
                       <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-dimmed)' }}>{item.sub}</p>
                    </div>
                    {i === selectedIdx && (
                      <kbd className="px-1.5 py-0.5 rounded text-xs font-mono flex-shrink-0" style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}>
                        Enter
                      </kbd>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  {query ? (
                    <>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No matches for &quot;{query}&quot;</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>Press Enter to analyze as symbol</p>
                    </>
                  ) : (
                    <>
                      <Search className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-dimmed)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Type a stock symbol or company name</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>e.g. TSLA, Apple, NVDA</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 flex items-center gap-4" style={{ borderTop: '1px solid var(--border-divider)' }}>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmed)' }}>
                <kbd className="px-1 rounded" style={{ background: 'var(--bg-badge)' }}>↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmed)' }}>
                <kbd className="px-1 rounded" style={{ background: 'var(--bg-badge)' }}>↵</kbd> Select
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmed)' }}>
                <kbd className="px-1 rounded" style={{ background: 'var(--bg-badge)' }}>esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
