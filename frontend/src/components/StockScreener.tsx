'use client';

import { useState, useEffect, useMemo } from 'react';
import { Filter, Search, TrendingUp, TrendingDown, ArrowUpDown, Loader2, ChevronDown, ChevronUp, Save, Trash2, Eye, X, BarChart3 } from 'lucide-react';
import EmptyState from './ui/EmptyState';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';
import { SkeletonTable } from './ui/SkeletonCard';

interface ScreenerResult {
  symbol: string;
  companyName: string;
  price: number;
  changePct: number;
  marketCap: number;
  pe: number;
  sector: string;
  beta: number;
}

type SortKey = 'symbol' | 'price' | 'changePct' | 'marketCap' | 'pe' | 'beta';
type SortDir = 'asc' | 'desc';

interface SavedScreen {
  name: string;
  preset: string | null;
  symbols: string;
  minMCap: string;
  maxPE: string;
  maxBeta: string;
  minPrice: string;
  maxPrice: string;
  sectorFilter: string;
}

const PRESET_LISTS: { label: string; symbols: string[] }[] = [
  { label: 'Mega Cap Tech', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'] },
  { label: 'Finance', symbols: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK'] },
  { label: 'Healthcare', symbols: ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO'] },
  { label: 'Consumer', symbols: ['WMT', 'PG', 'KO', 'PEP', 'COST', 'NKE', 'MCD'] },
  { label: 'Energy', symbols: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX'] },
  { label: 'Dividend Stars', symbols: ['JNJ', 'PG', 'KO', 'PEP', 'MMM', 'XOM', 'T'] },
];

const SECTOR_OPTIONS = [
  'All Sectors',
  'Technology',
  'Financial Services',
  'Healthcare',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Energy',
  'Industrials',
  'Communication Services',
  'Utilities',
  'Real Estate',
  'Basic Materials',
];

const STORAGE_KEY = 'stock-screener-saved-screens';

const formatMCap = (v: number) => v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(0)}M` : `$${v.toFixed(0)}`;

function loadSavedScreens(): SavedScreen[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedScreens(screens: SavedScreen[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
}

export default function StockScreener() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [customSymbols, setCustomSymbols] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filters
  const [minMCap, setMinMCap] = useState('');
  const [maxPE, setMaxPE] = useState('');
  const [maxBeta, setMaxBeta] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All Sectors');

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);

  // Saved screens
  const [savedScreens, setSavedScreens] = useState<SavedScreen[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Load saved screens from localStorage on mount
  useEffect(() => {
    setSavedScreens(loadSavedScreens());
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchScreener = async (symbols: string[]) => {
    setLoading(true);
    setResults([]);
    setResultsVisible(false);
    setExpandedRow(null);
    try {
      const res = await fetch(`${apiUrl}/api/screener`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      if (res.ok) {
        let data: ScreenerResult[] = await res.json();
        // Apply filters
        if (minMCap) data = data.filter(d => d.marketCap >= parseFloat(minMCap) * 1e9);
        if (maxPE) data = data.filter(d => d.pe > 0 && d.pe <= parseFloat(maxPE));
        if (maxBeta) data = data.filter(d => d.beta <= parseFloat(maxBeta));
        if (minPrice) data = data.filter(d => d.price >= parseFloat(minPrice));
        if (maxPrice) data = data.filter(d => d.price <= parseFloat(maxPrice));
        if (sectorFilter && sectorFilter !== 'All Sectors') {
          data = data.filter(d => d.sector?.toLowerCase().includes(sectorFilter.toLowerCase()));
        }
        setResults(data);
        // Trigger fade-in animation after a brief delay
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setResultsVisible(true));
        });
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handlePreset = (preset: typeof PRESET_LISTS[0]) => {
    setActivePreset(preset.label);
    fetchScreener(preset.symbols);
  };

  const handleCustomSearch = () => {
    const syms = customSymbols.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (syms.length > 0) {
      setActivePreset(null);
      fetchScreener(syms);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...results].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === 'string') return sortDir === 'asc' ? (av as string).localeCompare(bv as string) : (bv as string).localeCompare(av as string);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  // Summary calculations
  const summary = useMemo(() => {
    if (sorted.length === 0) return null;
    const validPE = sorted.filter(r => r.pe > 0);
    const avgPE = validPE.length > 0 ? validPE.reduce((s, r) => s + r.pe, 0) / validPE.length : 0;
    const avgChange = sorted.reduce((s, r) => s + r.changePct, 0) / sorted.length;
    const totalMCap = sorted.reduce((s, r) => s + r.marketCap, 0);
    return { avgPE, avgChange, totalMCap };
  }, [sorted]);

  // Max absolute change for bar scaling
  const maxAbsChange = useMemo(() => {
    if (sorted.length === 0) return 1;
    return Math.max(...sorted.map(r => Math.abs(r.changePct)), 0.01);
  }, [sorted]);

  // Saved screens logic
  const handleSaveScreen = () => {
    if (!saveName.trim()) return;
    const screen: SavedScreen = {
      name: saveName.trim(),
      preset: activePreset,
      symbols: customSymbols,
      minMCap,
      maxPE,
      maxBeta,
      minPrice,
      maxPrice,
      sectorFilter,
    };
    const updated = [...savedScreens.filter(s => s.name !== screen.name), screen];
    setSavedScreens(updated);
    persistSavedScreens(updated);
    setSaveName('');
    setSaveDialogOpen(false);
  };

  const handleDeleteSavedScreen = (name: string) => {
    const updated = savedScreens.filter(s => s.name !== name);
    setSavedScreens(updated);
    persistSavedScreens(updated);
  };

  const handleLoadSavedScreen = (screen: SavedScreen) => {
    setMinMCap(screen.minMCap);
    setMaxPE(screen.maxPE);
    setMaxBeta(screen.maxBeta);
    setMinPrice(screen.minPrice);
    setMaxPrice(screen.maxPrice);
    setSectorFilter(screen.sectorFilter);
    setCustomSymbols(screen.symbols);

    if (screen.preset) {
      const preset = PRESET_LISTS.find(p => p.label === screen.preset);
      if (preset) {
        setActivePreset(preset.label);
        // Need to fetch after state updates, use setTimeout
        setTimeout(() => fetchScreener(preset.symbols), 0);
        return;
      }
    }

    if (screen.symbols) {
      const syms = screen.symbols.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      if (syms.length > 0) {
        setActivePreset(null);
        setTimeout(() => fetchScreener(syms), 0);
      }
    }
  };

  const activeFilterCount = [minMCap, maxPE, maxBeta, minPrice, maxPrice].filter(Boolean).length + (sectorFilter !== 'All Sectors' ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Inline styles for animations */}
      <style>{`
        @keyframes screenerFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes screenerSlideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 400px; }
        }
        .screener-row-hover {
          transition: background 0.15s ease;
        }
        .screener-row-hover:hover {
          background: var(--bg-input) !important;
        }
        .screener-results-enter {
          opacity: 0;
          transform: translateY(12px);
        }
        .screener-results-visible {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .screener-detail-panel {
          animation: screenerSlideDown 0.25s ease forwards;
          overflow: hidden;
        }
        .screener-filter-panel {
          overflow: hidden;
          transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
        }
        .screener-filter-panel.collapsed {
          max-height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
        .screener-filter-panel.expanded {
          max-height: 400px;
          opacity: 1;
        }
        @media (max-width: 640px) {
          .screener-table-responsive {
            font-size: 0.75rem;
          }
          .screener-table-responsive th,
          .screener-table-responsive td {
            padding: 0.5rem 0.5rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Stock Screener</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-dimmed)' }}>
          Screen stocks by sector or custom lists. Data for educational purposes only.
        </p>

        {/* Preset Lists */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_LISTS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activePreset === p.label ? 'var(--accent)' : 'var(--bg-badge)',
                color: activePreset === p.label ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {p.label}
            </button>
          ))}
          {/* Saved screen buttons */}
          {savedScreens.map(s => (
            <div key={s.name} className="relative group inline-flex">
              <button
                onClick={() => handleLoadSavedScreen(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'var(--bg-badge)',
                  color: 'var(--accent)',
                  border: '1px dashed var(--accent-muted)',
                }}
              >
                {s.name}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSavedScreen(s.name); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                title="Delete saved screen"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Custom Search */}
        <div className="flex gap-2 mb-4">
          <input
            value={customSymbols}
            onChange={e => setCustomSymbols(e.target.value)}
            placeholder="Enter symbols (e.g. AAPL, MSFT, TSLA)"
            onKeyDown={e => e.key === 'Enter' && handleCustomSearch()}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleCustomSearch}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
          >
            <Search className="w-4 h-4" /> Screen
          </button>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mb-2"
          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
        >
          <Filter className="w-3.5 h-3.5" />
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          {activeFilterCount > 0 && (
            <span
              className="ml-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              {activeFilterCount}
            </span>
          )}
          {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Collapsible Filters Panel */}
        <div className={`screener-filter-panel ${filtersOpen ? 'expanded' : 'collapsed'}`}>
          <div
            className="rounded-xl p-4 mt-2"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Min MCap ($B)</label>
                <input
                  value={minMCap}
                  onChange={e => setMinMCap(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Max P/E</label>
                <input
                  value={maxPE}
                  onChange={e => setMaxPE(e.target.value)}
                  type="number"
                  placeholder="50"
                  className="px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Max Beta</label>
                <input
                  value={maxBeta}
                  onChange={e => setMaxBeta(e.target.value)}
                  type="number"
                  step="0.1"
                  placeholder="2.0"
                  className="px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Min Price ($)</label>
                <input
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Max Price ($)</label>
                <input
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  type="number"
                  placeholder="1000"
                  className="px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sector</label>
                <select
                  value={sectorFilter}
                  onChange={e => setSectorFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {SECTOR_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter actions */}
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-divider)' }}>
              <button
                onClick={() => {
                  setMinMCap(''); setMaxPE(''); setMaxBeta('');
                  setMinPrice(''); setMaxPrice(''); setSectorFilter('All Sectors');
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}
              >
                Clear Filters
              </button>
              <button
                onClick={() => setSaveDialogOpen(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'var(--bg-badge)', color: 'var(--accent)' }}
              >
                <Save className="w-3 h-3" /> Save Screen
              </button>
            </div>
          </div>
        </div>

        {/* Save Screen Dialog */}
        {saveDialogOpen && (
          <div
            className="mt-3 rounded-xl p-4 flex items-center gap-2"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--accent-muted)' }}
          >
            <input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Screen name..."
              onKeyDown={e => e.key === 'Enter' && handleSaveScreen()}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <button
              onClick={handleSaveScreen}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              Save
            </button>
            <button
              onClick={() => { setSaveDialogOpen(false); setSaveName(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Skeleton Loading State */}
      {loading && <SkeletonTable rows={6} cols={7} />}

      {/* Summary Bar */}
      {!loading && sorted.length > 0 && summary && (
        <div
          className={`rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 ${resultsVisible ? 'screener-results-visible' : 'screener-results-enter'}`}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Showing {sorted.length} stock{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--border-divider)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Avg P/E: <span style={{ color: 'var(--text-secondary)' }}>{summary.avgPE > 0 ? summary.avgPE.toFixed(1) : 'N/A'}</span>
          </span>
          <div className="h-4 w-px" style={{ background: 'var(--border-divider)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Avg Change:{' '}
            <span style={{ color: summary.avgChange >= 0 ? '#10b981' : '#ef4444' }}>
              {summary.avgChange >= 0 ? '+' : ''}{summary.avgChange.toFixed(2)}%
            </span>
          </span>
          <div className="h-4 w-px" style={{ background: 'var(--border-divider)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Total MCap: <span style={{ color: 'var(--text-secondary)' }}>{formatMCap(summary.totalMCap)}</span>
          </span>
        </div>
      )}

      {/* Results Table */}
      {!loading && sorted.length > 0 && (
        <div
          className={`rounded-2xl overflow-hidden ${resultsVisible ? 'screener-results-visible' : 'screener-results-enter'}`}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm screener-table-responsive">
              <thead>
                <tr style={{ background: 'var(--bg-input)' }}>
                  {[
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'price', label: 'Price' },
                    { key: 'changePct', label: 'Change' },
                    { key: 'marketCap', label: 'Market Cap' },
                    { key: 'pe', label: 'P/E' },
                    { key: 'beta', label: 'Beta' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as SortKey)}
                      className="px-4 py-3 text-left text-xs font-medium cursor-pointer select-none"
                      style={{ color: sortKey === col.key ? 'var(--accent)' : 'var(--text-muted)' }}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className="w-3 h-3" style={{ opacity: sortKey === col.key ? 1 : 0.3 }} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sector</th>
                  <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <>
                    <tr
                      key={r.symbol}
                      className="screener-row-hover"
                      style={{
                        borderTop: i > 0 ? '1px solid var(--border-divider)' : undefined,
                        animation: `screenerFadeIn 0.3s ease ${i * 0.04}s both`,
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.symbol}</span>
                        <span className="text-xs ml-1.5 block sm:inline" style={{ color: 'var(--text-dimmed)' }}>{r.companyName}</span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>${r.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`flex items-center gap-1 font-medium ${r.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.changePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (Math.abs(r.changePct) / maxAbsChange) * 100)}%`,
                                background: r.changePct >= 0 ? '#10b981' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatMCap(r.marketCap)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.pe > 0 ? r.pe.toFixed(1) : 'N/A'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.beta.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{r.sector || 'N/A'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedRow(expandedRow === r.symbol ? null : r.symbol)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            background: expandedRow === r.symbol ? 'var(--accent-muted)' : 'var(--bg-badge)',
                            color: expandedRow === r.symbol ? 'var(--accent)' : 'var(--text-muted)',
                          }}
                          title="Quick View"
                        >
                          {expandedRow === r.symbol ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {/* Inline Detail Panel */}
                    {expandedRow === r.symbol && (
                      <tr key={`${r.symbol}-detail`}>
                        <td colSpan={8} style={{ background: 'var(--bg-input)', borderTop: '1px solid var(--border-divider)' }}>
                          <div className="screener-detail-panel px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Company</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.companyName}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sector</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.sector || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Market Cap</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMCap(r.marketCap)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Price</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>${r.price.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>P/E Ratio</p>
                                {r.pe > 0 ? (
                                  <ProgressBar value={Math.min(r.pe, 60)} max={60} height={6} color={r.pe < 20 ? '#10b981' : r.pe < 35 ? '#f59e0b' : '#ef4444'} />
                                ) : (
                                  <span className="text-xs" style={{ color: 'var(--text-dimmed)' }}>N/A</span>
                                )}
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.pe > 0 ? r.pe.toFixed(1) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Beta (Volatility)</p>
                                <ProgressBar value={Math.min(r.beta, 3)} max={3} height={6} color={r.beta < 1 ? '#10b981' : r.beta < 1.5 ? '#f59e0b' : '#ef4444'} />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{r.beta.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Daily Change</p>
                                <Badge variant={r.changePct >= 0 ? 'success' : 'danger'} dot size="md">
                                  {r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Price / MCap</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  ${r.price.toFixed(2)} / {formatMCap(r.marketCap)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <EmptyState
          icon={Filter}
          title="No Stocks Screened Yet"
          description="Select a preset list or enter custom symbols to screen."
          suggestions={PRESET_LISTS.slice(0, 3).map(p => ({
            label: p.label,
            onClick: () => handlePreset(p),
          }))}
        />
      )}

      <p className="text-xs text-center" style={{ color: 'var(--text-dimmed)' }}>
        Stock screener data is for educational purposes only. Prices may be delayed.
      </p>
    </div>
  );
}
