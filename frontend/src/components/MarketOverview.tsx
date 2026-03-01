'use client';

import { useState, useEffect } from 'react';
import { Globe, TrendingUp, TrendingDown, Activity, Clock, RefreshCw, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from './ui/EmptyState';
import DataAttribution from './ui/DataAttribution';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

interface SectorPerf {
  sector: string;
  changePct: number;
}

interface TopMover {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [sectors, setSectors] = useState<SectorPerf[]>([]);
  const [gainers, setGainers] = useState<TopMover[]>([]);
  const [losers, setLosers] = useState<TopMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/market/overview`);
      if (res.ok) {
        const data = await res.json();
        setIndices(data.indices || []);
        setSectors(data.sectors || []);
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const maxAbsSector = Math.max(...sectors.map(s => Math.abs(s.changePct)), 1);

  // Sentiment calculation
  const positiveCount = indices.filter(i => i.changePct >= 0).length;
  const totalCount = indices.length;
  const sentimentRatio = totalCount > 0 ? positiveCount / totalCount : 0.5;
  const sentiment: 'Bullish' | 'Neutral' | 'Bearish' =
    sentimentRatio >= 0.65 ? 'Bullish' : sentimentRatio <= 0.35 ? 'Bearish' : 'Neutral';
  const sentimentColor =
    sentiment === 'Bullish' ? '#10b981' : sentiment === 'Bearish' ? '#ef4444' : '#f59e0b';

  // Loading skeleton
  if (loading && indices.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-6 animate-pulse"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--bg-input)' }} />
            <div className="h-6 w-48 rounded-lg" style={{ background: 'var(--bg-input)' }} />
          </div>
          <div className="h-3 w-64 rounded" style={{ background: 'var(--bg-input)' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 animate-pulse"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div className="h-3 w-16 rounded mb-3" style={{ background: 'var(--bg-input)' }} />
              <div className="h-6 w-24 rounded mb-2" style={{ background: 'var(--bg-input)' }} />
              <div className="h-3 w-14 rounded" style={{ background: 'var(--bg-input)' }} />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 animate-pulse"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="h-4 w-36 rounded mb-4" style={{ background: 'var(--bg-input)' }} />
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-5 w-full rounded mb-2.5" style={{ background: 'var(--bg-input)' }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Inline animation styles */}
      <style>{`
        @keyframes marketCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .market-card-enter {
          animation: marketCardIn 0.4s ease-out both;
        }
      `}</style>

      {/* Header */}
      <div
        className="rounded-2xl p-6 market-card-enter"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Market Overview</h2>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dimmed)' }}>
                <Clock className="w-3 h-3" /> {lastUpdated}
              </span>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
          Real-time market data for educational purposes. Data may be delayed.
        </p>
      </div>

      {/* Market Sentiment Indicator */}
      {indices.length > 0 && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between market-card-enter"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            animationDelay: '0.05s',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: sentimentColor,
                boxShadow: `0 0 8px ${sentimentColor}60`,
              }}
            />
            <span className="text-sm font-semibold" style={{ color: sentimentColor }}>
              {sentiment}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
              Market Sentiment
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sentiment gauge bar */}
            <div
              className="w-32 h-2 rounded-full overflow-hidden flex"
              style={{ background: 'var(--bg-input)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${sentimentRatio * 100}%`,
                  background: `linear-gradient(90deg, #ef4444, #f59e0b, #10b981)`,
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {positiveCount}/{totalCount} positive
            </span>
          </div>
        </div>
      )}

      {/* Market Indices - Enhanced Cards */}
      {indices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {indices.map((idx, i) => {
            const isPositive = idx.changePct >= 0;
            const borderAccent = isPositive ? '#10b981' : '#ef4444';
            return (
              <div
                key={idx.symbol}
                className="rounded-xl p-4 relative overflow-hidden market-card-enter"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border-color)`,
                  borderLeft: `3px solid ${borderAccent}`,
                  animationDelay: `${0.08 + i * 0.05}s`,
                }}
              >
                <p className="text-xs font-medium mb-1 truncate" style={{ color: 'var(--text-muted)' }}>
                  {idx.name}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {idx.price >= 1000
                    ? idx.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : idx.price.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{idx.changePct.toFixed(2)}%
                  </span>
                </div>
                {/* Mini change bar */}
                <div
                  className="mt-2.5 h-1 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.abs(idx.changePct) * 15, 100)}%`,
                      background: isPositive ? '#10b981' : '#ef4444',
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Sector Performance - Enhanced Heatmap */}
        {sectors.length > 0 && (
          <div
            className="rounded-2xl p-6 market-card-enter"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              animationDelay: '0.2s',
            }}
          >
            <h3
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Activity className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Sector Performance
            </h3>
            <div className="space-y-2">
              {sectors.map(s => {
                const isPositive = s.changePct >= 0;
                const barWidth = (Math.abs(s.changePct) / maxAbsSector) * 50;
                return (
                  <div key={s.sector} className="flex items-center gap-2">
                    <span
                      className="text-xs w-28 truncate font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {s.sector}
                    </span>
                    <div
                      className="flex-1 h-6 relative rounded-md overflow-hidden"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      {/* Center line */}
                      <div
                        className="absolute top-0 bottom-0 w-px"
                        style={{ left: '50%', background: 'var(--border-divider)' }}
                      />
                      {/* Bar from center */}
                      <div
                        className="absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-500"
                        style={{
                          background: isPositive ? '#10b981' : '#ef4444',
                          opacity: 0.35 + (Math.abs(s.changePct) / maxAbsSector) * 0.45,
                          width: `${barWidth}%`,
                          ...(isPositive
                            ? { left: '50%' }
                            : { right: '50%' }),
                        }}
                      />
                      {/* Label inside bar */}
                      <span
                        className="absolute inset-0 flex items-center text-[10px] font-semibold"
                        style={{
                          justifyContent: isPositive ? 'flex-end' : 'flex-start',
                          paddingLeft: isPositive ? undefined : '4px',
                          paddingRight: isPositive ? '4px' : undefined,
                          color: isPositive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isPositive ? '+' : ''}{s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Movers - Enhanced */}
        <div className="space-y-3">
          {gainers.length > 0 && (
            <div
              className="rounded-2xl p-5 market-card-enter"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                animationDelay: '0.25s',
              }}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" /> Top Gainers
              </h3>
              <div className="space-y-2">
                {gainers.slice(0, 5).map((g, i) => (
                  <div
                    key={g.symbol}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all market-card-enter"
                    style={{
                      background: 'var(--bg-input)',
                      borderLeft: '2px solid #10b98140',
                      animationDelay: `${0.3 + i * 0.04}s`,
                    }}
                  >
                    {/* Rank */}
                    <span
                      className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}
                    >
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {g.symbol}
                        </span>
                        <span className="text-xs truncate" style={{ color: 'var(--text-dimmed)' }}>
                          {g.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        ${g.price.toFixed(2)}
                      </p>
                      <p className="text-xs font-semibold text-emerald-400 flex items-center justify-end gap-0.5">
                        <ArrowUp className="w-3 h-3" />
                        +{g.changePct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {losers.length > 0 && (
            <div
              className="rounded-2xl p-5 market-card-enter"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                animationDelay: '0.35s',
              }}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-400">
                <TrendingDown className="w-4 h-4" /> Top Losers
              </h3>
              <div className="space-y-2">
                {losers.slice(0, 5).map((l, i) => (
                  <div
                    key={l.symbol}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all market-card-enter"
                    style={{
                      background: 'var(--bg-input)',
                      borderLeft: '2px solid #ef444440',
                      animationDelay: `${0.4 + i * 0.04}s`,
                    }}
                  >
                    {/* Rank */}
                    <span
                      className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-badge)', color: 'var(--text-dimmed)' }}
                    >
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {l.symbol}
                        </span>
                        <span className="text-xs truncate" style={{ color: 'var(--text-dimmed)' }}>
                          {l.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        ${l.price.toFixed(2)}
                      </p>
                      <p className="text-xs font-semibold text-red-400 flex items-center justify-end gap-0.5">
                        <ArrowDown className="w-3 h-3" />
                        {l.changePct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && indices.length === 0 && (
        <EmptyState
          icon={Globe}
          title="Market Data Unavailable"
          description="Market data could not be loaded. Make sure the API server is running and try again."
          actionLabel="Retry"
          onAction={fetchData}
        />
      )}

      {/* Market Summary */}
      {indices.length > 0 && (
        <div
          className="rounded-xl px-5 py-3 text-center market-card-enter"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            animationDelay: '0.4s',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Markets are trading{' '}
            <span style={{ color: positiveCount > totalCount / 2 ? '#10b981' : positiveCount < totalCount / 2 ? '#ef4444' : 'var(--text-secondary)' }}>
              {positiveCount > totalCount / 2 ? 'higher' : positiveCount < totalCount / 2 ? 'lower' : 'mixed'}
            </span>{' '}
            today with{' '}
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {positiveCount} of {totalCount}
            </span>{' '}
            indices positive
            {sectors.length > 0 && (
              <>
                {' '}&mdash;{' '}
                {sectors.filter(s => s.changePct >= 0).length} of {sectors.length} sectors in the green
              </>
            )}
          </p>
        </div>
      )}

      {/* Data Attribution */}
      <DataAttribution
        lastUpdated={lastUpdated}
        onRefresh={fetchData}
        loading={loading}
        sources={['prices']}
      />
    </div>
  );
}
