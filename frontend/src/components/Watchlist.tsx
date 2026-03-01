'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Star, Bell, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, BarChart3, ShieldAlert, Eye } from 'lucide-react';
import ProgressBar from './ui/ProgressBar';
import EmptyState from './ui/EmptyState';
import Badge from './ui/Badge';

interface WatchlistStock {
  symbol: string;
  addedAt: string;
  lastAnalysis?: {
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
    timestamp: string;
  };
  currentPrice?: number;
}

const directionLabel: Record<string, string> = {
  bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral',
  BUY: 'Bullish', SELL: 'Bearish', HOLD: 'Neutral',
};
const directionColor: Record<string, string> = {
  bullish: 'text-emerald-400', bearish: 'text-red-400', neutral: 'text-amber-400',
  BUY: 'text-emerald-400', SELL: 'text-red-400', HOLD: 'text-amber-400',
};
const directionBorderColor: Record<string, string> = {
  bullish: '#10b981', bearish: '#ef4444', neutral: '#f59e0b',
  BUY: '#10b981', SELL: '#ef4444', HOLD: '#f59e0b',
};

const STORAGE_KEY = 'stock-agent-watchlist';

function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveWatchlist(symbols: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
}

export default function Watchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const saved = loadWatchlist();
    setSymbols(saved);
    if (saved.length > 0) fetchAllData(saved);
  }, []);

  const fetchAllData = async (syms: string[]) => {
    setLoading(true);
    const results: WatchlistStock[] = [];

    await Promise.all(syms.map(async (symbol) => {
      const stock: WatchlistStock = { symbol, addedAt: new Date().toISOString() };
      try {
        // Fetch latest analysis from history
        const histRes = await fetch(`${apiUrl}/api/history/${symbol}?days=90`);
        if (histRes.ok) {
          const history = await histRes.json();
          if (history.length > 0) stock.lastAnalysis = history[0];
        }
        // Fetch current price
        const priceRes = await fetch(`${apiUrl}/api/price/${symbol}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          stock.currentPrice = priceData.price;
        }
      } catch { /* ignore */ }
      results.push(stock);
    }));

    setStocks(results);
    setLoading(false);
  };

  const addSymbol = (sym?: string) => {
    const raw = sym || newSymbol;
    const s = raw.trim().toUpperCase();
    if (!s || symbols.includes(s)) return;
    const updated = [...symbols, s];
    setSymbols(updated);
    saveWatchlist(updated);
    setNewSymbol('');
    fetchAllData(updated);
  };

  const removeSymbol = (sym: string) => {
    const updated = symbols.filter(s => s !== sym);
    setSymbols(updated);
    saveWatchlist(updated);
    setStocks(stocks.filter(s => s.symbol !== sym));
  };

  const refreshStock = async (symbol: string) => {
    setRefreshing(symbol);
    try {
      const res = await fetch(`${apiUrl}/api/analyze/${symbol}`, { signal: AbortSignal.timeout(180000) });
      if (res.ok) {
        await fetchAllData(symbols);
      }
    } catch { /* ignore */ }
    setRefreshing(null);
  };

  const getAlert = (stock: WatchlistStock): { type: string; message: string; color: string } | null => {
    if (!stock.lastAnalysis || !stock.currentPrice) return null;

    const priceChange = ((stock.currentPrice - stock.lastAnalysis.price_at_analysis) / stock.lastAnalysis.price_at_analysis) * 100;
    const dir = stock.lastAnalysis.analysis_direction || stock.lastAnalysis.recommendation;

    // Alert if price moved >5% against prediction
    if ((dir === 'bullish' || dir === 'BUY') && priceChange < -5) {
      return { type: 'warning', message: `Price dropped ${Math.abs(priceChange).toFixed(1)}% since bullish analysis`, color: 'text-red-400' };
    }
    if ((dir === 'bearish' || dir === 'SELL') && priceChange > 5) {
      return { type: 'warning', message: `Price rose ${priceChange.toFixed(1)}% since bearish analysis`, color: 'text-amber-400' };
    }

    // Alert if target reached
    if (stock.lastAnalysis.target_price && stock.currentPrice >= stock.lastAnalysis.target_price) {
      return { type: 'target', message: `Price reached estimated fair value!`, color: 'text-emerald-400' };
    }

    // Alert if high risk and big move
    if (stock.lastAnalysis.risk_level === 'HIGH' && Math.abs(priceChange) > 3) {
      return { type: 'risk', message: `High-risk stock moved ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`, color: 'text-amber-400' };
    }

    return null;
  };

  // Compute alert count and quick stats
  const alertCount = useMemo(() => {
    return stocks.filter(s => getAlert(s) !== null).length;
  }, [stocks]);

  const avgConfidence = useMemo(() => {
    const withAnalysis = stocks.filter(s => s.lastAnalysis);
    if (withAnalysis.length === 0) return 0;
    const total = withAnalysis.reduce((sum, s) => sum + (s.lastAnalysis?.confidence || 0), 0);
    return total / withAnalysis.length;
  }, [stocks]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Keyframe styles for pulse animation */}
      <style>{`
        @keyframes watchlist-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.12); }
        }
        .watchlist-alert-pulse {
          animation: watchlist-pulse 2s ease-in-out infinite;
        }
        .watchlist-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .watchlist-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        @keyframes watchlist-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .watchlist-alert-banner {
          animation: watchlist-slide-in 0.3s ease-out;
        }
      `}</style>

      {/* Alert Summary Header */}
      {!loading && alertCount > 0 && (
        <div
          className="watchlist-alert-banner rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245, 158, 11, 0.15)' }}
          >
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              <span className="watchlist-alert-pulse inline-block text-amber-400 text-lg font-bold mr-1.5">
                {alertCount}
              </span>
              {alertCount === 1 ? 'alert needs' : 'alerts need'} attention
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Review flagged stocks below for significant price movements
            </p>
          </div>
        </div>
      )}

      {/* Add to Watchlist */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Watchlist
        </h3>
        <div className="flex gap-2">
          <input
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && addSymbol()}
            placeholder="Add symbol (e.g. TSLA)"
            className="flex-1 max-w-xs px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => addSymbol()}
            disabled={!newSymbol.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      {!loading && stocks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Stocks Watched</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{symbols.length}</p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Alerts Active</span>
            </div>
            <p className="text-xl font-bold" style={{ color: alertCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{alertCount}</p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Avg Confidence</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {avgConfidence > 0 ? `${(avgConfidence * 100).toFixed(0)}%` : '--'}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading watchlist data...</p>
        </div>
      )}

      {/* Better Empty State */}
      {!loading && symbols.length === 0 && (
        <EmptyState
          icon={Star}
          title="Your Watchlist is Empty"
          description="Add stock symbols above to track them. Run analyses and come back to check alerts and price changes."
          suggestions={[
            { label: 'Add AAPL', onClick: () => addSymbol('AAPL') },
            { label: 'Add MSFT', onClick: () => addSymbol('MSFT') },
            { label: 'Add TSLA', onClick: () => addSymbol('TSLA') },
            { label: 'Add GOOGL', onClick: () => addSymbol('GOOGL') },
            { label: 'Add AMZN', onClick: () => addSymbol('AMZN') },
          ]}
        />
      )}

      {/* Watchlist Cards - 2-column grid on larger screens */}
      {!loading && stocks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stocks.map(stock => {
            const analysis = stock.lastAnalysis;
            const dir = analysis?.analysis_direction || analysis?.recommendation || '';
            const DirIcon = dir === 'bullish' || dir === 'BUY' ? TrendingUp : dir === 'bearish' || dir === 'SELL' ? TrendingDown : Minus;
            const alert = getAlert(stock);
            const priceChange = analysis && stock.currentPrice
              ? ((stock.currentPrice - analysis.price_at_analysis) / analysis.price_at_analysis) * 100
              : null;
            const borderLeft = dir ? directionBorderColor[dir] || 'var(--border-color)' : 'var(--border-color)';

            return (
              <div
                key={stock.symbol}
                className="watchlist-card rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: 'var(--bg-card)',
                  border: alert ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--border-color)',
                  borderLeft: `4px solid ${borderLeft}`,
                }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stock.symbol}</span>
                    {dir && (
                      <Badge
                        variant={dir === 'bullish' || dir === 'BUY' ? 'success' : dir === 'bearish' || dir === 'SELL' ? 'danger' : 'warning'}
                        dot
                      >
                        <DirIcon className="w-3 h-3" />
                        {directionLabel[dir] || dir}
                      </Badge>
                    )}
                    {analysis?.signal_strength && (
                      <Badge variant="neutral" size="sm">
                        {analysis.signal_strength}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => refreshStock(stock.symbol)}
                      disabled={refreshing === stock.symbol}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}
                      title="Re-analyze"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing === stock.symbol ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => removeSymbol(stock.symbol)}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Alert Banner */}
                {alert && (
                  <div
                    className="watchlist-alert-banner rounded-lg px-3 py-2 mb-3 flex items-center gap-2"
                    style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)' }}
                  >
                    <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className={`text-sm font-medium ${alert.color}`}>{alert.message}</span>
                  </div>
                )}

                {analysis ? (
                  <div className="space-y-4">
                    {/* Price Row */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--text-dimmed)' }}>Analysis Price</p>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>${analysis.price_at_analysis.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--text-dimmed)' }}>Current Price</p>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {stock.currentPrice ? `$${stock.currentPrice.toFixed(2)}` : '-'}
                          {priceChange !== null && (
                            <span className={`text-xs ml-1 ${priceChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ({priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--text-dimmed)' }}>Fair Value Est.</p>
                        <p className="font-semibold text-emerald-400">{analysis.target_price ? `$${analysis.target_price.toFixed(2)}` : '-'}</p>
                      </div>
                    </div>

                    {/* Sparkline Placeholder */}
                    <div
                      className="rounded-lg h-12 flex items-center justify-center"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-dimmed)' }}>Price trend chart coming soon</span>
                    </div>

                    {/* Score Bars */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs w-24 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Confidence</span>
                        <div className="flex-1">
                          <ProgressBar value={analysis.confidence * 100} max={100} height={6} showLabel />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs w-24 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Technical</span>
                        <div className="flex-1">
                          <ProgressBar value={analysis.technical_score} max={100} height={6} color="#3b82f6" showLabel />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs w-24 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Fundamental</span>
                        <div className="flex-1">
                          <ProgressBar value={analysis.fundamental_score} max={100} height={6} color="#10b981" showLabel />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs w-24 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Sentiment</span>
                        <div className="flex-1">
                          <ProgressBar value={analysis.sentiment_score} max={100} height={6} color="#f59e0b" showLabel />
                        </div>
                      </div>
                    </div>

                    {/* Risk Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-dimmed)' }}>Risk Level:</span>
                        <Badge
                          variant={analysis.risk_level === 'HIGH' ? 'danger' : analysis.risk_level === 'LOW' ? 'success' : 'warning'}
                          dot
                          size="sm"
                        >
                          {analysis.risk_level}
                        </Badge>
                      </div>
                      {analysis.timestamp && (
                        <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
                          {new Date(analysis.timestamp).toLocaleDateString()} {new Date(analysis.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      <BarChart3 className="w-5 h-5" style={{ color: 'var(--text-dimmed)' }} />
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>No analysis yet</p>
                    <button
                      onClick={() => refreshStock(stock.symbol)}
                      disabled={refreshing === stock.symbol}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {refreshing === stock.symbol ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: 'var(--text-dimmed)' }}>
        Watchlist data is stored locally in your browser. Alerts are based on price changes since last analysis and are for educational purposes only.
      </p>
    </div>
  );
}
