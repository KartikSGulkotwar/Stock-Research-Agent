'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  History, Clock, TrendingUp, TrendingDown, Minus, Target,
  CheckCircle, XCircle, Loader2, BarChart3, PieChart, ArrowUpDown,
  Activity, Hash, Percent, Crosshair,
} from 'lucide-react';
import ProgressBar from './ui/ProgressBar';
import EmptyState from './ui/EmptyState';
import InfoTooltip from './ui/InfoTooltip';

interface HistoryEntry {
  symbol: string;
  timestamp: string;
  analysis_direction?: string;
  recommendation: string;
  signal_strength?: string;
  confidence: number;
  technical_score: number;
  fundamental_score: number;
  sentiment_score: number;
  risk_level: string;
  price_at_analysis: number;
  target_price?: number;
  summary: string;
}

interface HistorySummary {
  symbol: string;
  total_analyses: number;
  latest: HistoryEntry;
  first_analyzed: string;
  last_analyzed: string;
}

const directionLabel: Record<string, string> = {
  bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral',
  BUY: 'Bullish', SELL: 'Bearish', HOLD: 'Neutral',
};
const directionColor: Record<string, string> = {
  bullish: 'text-emerald-400', bearish: 'text-red-400', neutral: 'text-amber-400',
  BUY: 'text-emerald-400', SELL: 'text-red-400', HOLD: 'text-amber-400',
};

type SortMode = 'recent' | 'confidence' | 'most_analyzed';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ---- Tiny reusable stat card for the dashboard ---- */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-[11px] truncate" style={{ color: 'var(--text-dimmed)' }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ---- Accuracy bar visualization ---- */
function AccuracyBar({ correct, incorrect, total }: { correct: number; incorrect: number; total: number }) {
  if (total === 0) return null;
  const correctPct = (correct / total) * 100;
  const incorrectPct = (incorrect / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {correct} correct
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {incorrect} incorrect
        </span>
      </div>
      <div
        className="w-full h-3 rounded-full overflow-hidden flex"
        style={{ background: 'var(--bg-input)' }}
      >
        {correctPct > 0 && (
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${correctPct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
          />
        )}
        {incorrectPct > 0 && (
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${incorrectPct}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)' }}
          />
        )}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: '#10b981' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#10b981' }} />
          Correct {correctPct.toFixed(0)}%
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: '#ef4444' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#ef4444' }} />
          Incorrect {incorrectPct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/* ---- Mini summary preview ---- */
function SummaryPreview({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const preview = text.length > 120 ? text.slice(0, 120) + '...' : text;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-[11px] underline decoration-dotted underline-offset-2 cursor-help"
        style={{ color: 'var(--accent-muted)' }}
      >
        Summary
      </button>
      {show && (
        <div
          className="absolute bottom-full left-0 mb-2 p-3 rounded-lg text-xs z-50 animate-fadeIn"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            minWidth: '240px',
            maxWidth: '340px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {preview}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Main component
   ================================================================ */
export default function AnalysisHistory() {
  const [summaries, setSummaries] = useState<HistorySummary[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [symbolHistory, setSymbolHistory] = useState<HistoryEntry[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/history`);
      const data = await res.json();
      setSummaries(data);

      // Fetch current prices for all symbols
      const pricePromises = data.map(async (s: HistorySummary) => {
        try {
          const pRes = await fetch(`${apiUrl}/api/price/${s.symbol}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            return { symbol: s.symbol, price: pData.price };
          }
        } catch { /* ignore */ }
        return null;
      });
      const prices = await Promise.all(pricePromises);
      const priceMap: Record<string, number> = {};
      prices.forEach(p => { if (p) priceMap[p.symbol] = p.price; });
      setCurrentPrices(priceMap);
    } catch {
      /* empty history is fine */
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbolHistory = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/history/${symbol}?days=365`);
      const data = await res.json();
      setSymbolHistory(data);
    } catch {
      setSymbolHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getAccuracy = (entry: HistoryEntry) => {
    const currentPrice = currentPrices[entry.symbol];
    if (!currentPrice || !entry.price_at_analysis) return null;

    const priceChange = ((currentPrice - entry.price_at_analysis) / entry.price_at_analysis) * 100;
    const dir = entry.analysis_direction || entry.recommendation;
    const wasBullish = dir === 'bullish' || dir === 'BUY';
    const wasBearish = dir === 'bearish' || dir === 'SELL';

    const correct = (wasBullish && priceChange > 0) || (wasBearish && priceChange < 0);

    return { priceChange, correct, currentPrice };
  };

  /* ---- Derived dashboard stats ---- */
  const dashboardStats = useMemo(() => {
    const totalAnalyses = summaries.reduce((sum, s) => sum + s.total_analyses, 0);
    const uniqueStocks = summaries.length;

    const confidences = summaries.map(s => s.latest.confidence).filter(c => c > 0);
    const avgConfidence = confidences.length > 0
      ? (confidences.reduce((a, b) => a + b, 0) / confidences.length * 100).toFixed(0)
      : '0';

    let correct = 0;
    let incorrect = 0;
    let total = 0;
    summaries.forEach(s => {
      const acc = getAccuracy(s.latest);
      const dir = s.latest.analysis_direction || s.latest.recommendation;
      if (acc && dir !== 'neutral' && dir !== 'HOLD') {
        total++;
        if (acc.correct) correct++;
        else incorrect++;
      }
    });
    const accuracyRate = total > 0 ? ((correct / total) * 100).toFixed(0) : null;

    return { totalAnalyses, uniqueStocks, avgConfidence, correct, incorrect, total, accuracyRate };
  }, [summaries, currentPrices]);

  /* ---- Sorted summaries ---- */
  const sortedSummaries = useMemo(() => {
    const copy = [...summaries];
    switch (sortMode) {
      case 'confidence':
        return copy.sort((a, b) => b.latest.confidence - a.latest.confidence);
      case 'most_analyzed':
        return copy.sort((a, b) => b.total_analyses - a.total_analyses);
      case 'recent':
      default:
        return copy.sort((a, b) => new Date(b.last_analyzed).getTime() - new Date(a.last_analyzed).getTime());
    }
  }, [summaries, sortMode]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading history...</p>
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (summaries.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState
          icon={History}
          title="No Analysis History Yet"
          description="Run your first stock analysis to start building history. Past analyses are tracked to measure accuracy over time."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ============ Performance Dashboard ============ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Performance Dashboard</h3>
          <div className="flex-1 h-px" style={{ background: 'var(--border-divider)' }} />
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Hash}
            label="Total Analyses"
            value={dashboardStats.totalAnalyses}
            sub={`across ${dashboardStats.uniqueStocks} stock${dashboardStats.uniqueStocks !== 1 ? 's' : ''}`}
            color="#6366f1"
          />
          <StatCard
            icon={PieChart}
            label="Unique Stocks"
            value={dashboardStats.uniqueStocks}
            color="#8b5cf6"
          />
          <StatCard
            icon={Percent}
            label="Avg Confidence"
            value={`${dashboardStats.avgConfidence}%`}
            color="#f59e0b"
          />
          <StatCard
            icon={Crosshair}
            label="Direction Accuracy"
            value={dashboardStats.accuracyRate !== null ? `${dashboardStats.accuracyRate}%` : 'N/A'}
            sub={dashboardStats.total > 0 ? `${dashboardStats.correct}/${dashboardStats.total} correct` : 'Insufficient data'}
            color="#10b981"
          />
        </div>
      </div>

      {/* ============ Accuracy Visualization ============ */}
      {dashboardStats.total > 0 && (
        <div
          className="rounded-2xl p-5 transition-all duration-300"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Direction Accuracy
              </p>
              <InfoTooltip
                term="Direction Accuracy"
                brief="Measures whether the predicted direction (bullish/bearish) matched actual price movement."
                detail="Neutral signals are excluded. Past accuracy does not predict future results. Accuracy is calculated based on the latest analysis for each symbol compared to the current market price."
              />
            </div>
          </div>
          <AccuracyBar
            correct={dashboardStats.correct}
            incorrect={dashboardStats.incorrect}
            total={dashboardStats.total}
          />
        </div>
      )}

      {/* ============ Overview Cards Header + Sort ============ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Analyzed Stocks</h3>
            <div className="flex-1 h-px" style={{ background: 'var(--border-divider)' }} />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--text-dimmed)' }} />
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="confidence">Highest Confidence</option>
              <option value="most_analyzed">Most Analyzed</option>
            </select>
          </div>
        </div>

        {/* ============ Overview Cards Grid ============ */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {sortedSummaries.map((s, idx) => {
            const dir = s.latest.analysis_direction || s.latest.recommendation;
            const acc = getAccuracy(s.latest);
            const DirIcon = dir === 'bullish' || dir === 'BUY' ? TrendingUp : dir === 'bearish' || dir === 'SELL' ? TrendingDown : Minus;
            return (
              <button
                key={s.symbol}
                onClick={() => fetchSymbolHistory(s.symbol)}
                className="rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: selectedSymbol === s.symbol ? 'var(--active-badge-bg)' : 'var(--bg-card)',
                  border: selectedSymbol === s.symbol ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{s.symbol}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
                    {s.total_analyses}x
                  </span>
                </div>
                <div className={`flex items-center gap-1 mb-1 ${directionColor[dir] || ''}`}>
                  <DirIcon className="w-3 h-3" />
                  <span className="text-xs font-semibold">{directionLabel[dir] || dir}</span>
                </div>
                {/* Confidence mini bar */}
                <div className="mb-1.5">
                  <ProgressBar
                    value={s.latest.confidence * 100}
                    max={100}
                    height={4}
                    color="var(--accent)"
                  />
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dimmed)' }}>
                    {(s.latest.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ${s.latest.price_at_analysis.toFixed(2)}
                  {acc && (
                    <span className={acc.priceChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {' \u2192 $'}{acc.currentPrice.toFixed(2)} ({acc.priceChange > 0 ? '+' : ''}{acc.priceChange.toFixed(1)}%)
                    </span>
                  )}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>
                  <Clock className="w-3 h-3 inline mr-1" />{timeAgo(s.last_analyzed)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Selected Symbol Detail ============ */}
      {selectedSymbol && (
        <div
          className="rounded-2xl p-6 animate-fadeIn"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedSymbol} Analysis History
              </h3>
              <div className="hidden sm:block flex-1 h-px ml-2" style={{ background: 'var(--border-divider)' }} />
            </div>
            <button onClick={() => setSelectedSymbol(null)} className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
              Close
            </button>
          </div>

          {historyLoading ? (
            <div className="text-center py-6">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--accent)' }} />
            </div>
          ) : symbolHistory.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No history entries found.</p>
          ) : (
            <div className="space-y-3">
              {symbolHistory.map((entry, i) => {
                const dir = entry.analysis_direction || entry.recommendation;
                const acc = getAccuracy(entry);
                const DirIcon = dir === 'bullish' || dir === 'BUY' ? TrendingUp : dir === 'bearish' || dir === 'SELL' ? TrendingDown : Minus;
                return (
                  <div
                    key={i}
                    className="rounded-xl p-4 transition-all duration-300 hover:translate-x-1"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-divider)',
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    {/* Row 1: Direction + Date */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${directionColor[dir] || ''}`}>
                          <DirIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{directionLabel[dir] || dir}</span>
                        </div>
                        {entry.signal_strength && (
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
                            {entry.signal_strength}
                          </span>
                        )}
                        {acc && (dir !== 'neutral' && dir !== 'HOLD') && (
                          acc.correct
                            ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
                        {new Date(entry.timestamp).toLocaleDateString()} ({timeAgo(entry.timestamp)})
                      </span>
                    </div>

                    {/* Row 2: Price info */}
                    <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                      <span>Price: ${entry.price_at_analysis.toFixed(2)}</span>
                      {entry.target_price && <span>Fair Value: ${entry.target_price.toFixed(2)}</span>}
                      <span>Confidence: {(entry.confidence * 100).toFixed(0)}%</span>
                    </div>

                    {/* Row 3: Score progress bars */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <ProgressBar
                          value={entry.technical_score}
                          max={10}
                          height={6}
                          color="#3b82f6"
                          label="Technical"
                          showLabel
                        />
                      </div>
                      <div>
                        <ProgressBar
                          value={entry.fundamental_score}
                          max={10}
                          height={6}
                          color="#10b981"
                          label="Fundamental"
                          showLabel
                        />
                      </div>
                      <div>
                        <ProgressBar
                          value={entry.sentiment_score}
                          max={10}
                          height={6}
                          color="#f59e0b"
                          label="Sentiment"
                          showLabel
                        />
                      </div>
                    </div>

                    {/* Row 4: Risk + accuracy + summary tooltip */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-medium ${entry.risk_level === 'HIGH' ? 'text-red-400' : entry.risk_level === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Risk: {entry.risk_level}
                      </span>
                      {acc && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Current: ${acc.currentPrice.toFixed(2)}
                          <span className={acc.priceChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {' '}({acc.priceChange > 0 ? '+' : ''}{acc.priceChange.toFixed(1)}% since analysis)
                          </span>
                        </span>
                      )}
                      {entry.summary && (
                        <SummaryPreview text={entry.summary} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: 'var(--text-dimmed)' }}>
        Historical analysis accuracy is shown for educational purposes. Past performance does not guarantee future results.
      </p>
    </div>
  );
}
