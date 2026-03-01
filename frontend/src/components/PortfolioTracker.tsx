'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, Award, AlertTriangle, BarChart3, Target } from 'lucide-react';
import ProgressBar from './ui/ProgressBar';
import EmptyState from './ui/EmptyState';

interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
  addedAt: string;
}

interface HoldingWithPrice extends Holding {
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
}

const STORAGE_KEY = 'stock-agent-portfolio';

function loadPortfolio(): Holding[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function savePortfolio(holdings: Holding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [enriched, setEnriched] = useState<HoldingWithPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newCost, setNewCost] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    setHoldings(loadPortfolio());
  }, []);

  const fetchPrices = useCallback(async (h: Holding[]) => {
    if (h.length === 0) { setEnriched([]); return; }
    setLoading(true);
    const results: HoldingWithPrice[] = [];
    for (const holding of h) {
      try {
        const res = await fetch(`${apiUrl}/api/price/${holding.symbol}`);
        const data = await res.json();
        const currentPrice = data.price || holding.avgCost;
        const totalCost = holding.shares * holding.avgCost;
        const currentValue = holding.shares * currentPrice;
        const pnl = currentValue - totalCost;
        const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
        results.push({ ...holding, currentPrice, totalCost, currentValue, pnl, pnlPct });
      } catch {
        const totalCost = holding.shares * holding.avgCost;
        results.push({ ...holding, currentPrice: holding.avgCost, totalCost, currentValue: totalCost, pnl: 0, pnlPct: 0 });
      }
    }
    setEnriched(results);
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => {
    fetchPrices(holdings);
  }, [holdings, fetchPrices]);

  const addHolding = () => {
    const sym = newSymbol.trim().toUpperCase();
    const shares = parseFloat(newShares);
    const cost = parseFloat(newCost);
    if (!sym || isNaN(shares) || shares <= 0 || isNaN(cost) || cost <= 0) return;

    const existing = holdings.find(h => h.symbol === sym);
    let updated: Holding[];
    if (existing) {
      // Average in
      const totalShares = existing.shares + shares;
      const totalCost = existing.shares * existing.avgCost + shares * cost;
      updated = holdings.map(h => h.symbol === sym ? { ...h, shares: totalShares, avgCost: totalCost / totalShares } : h);
    } else {
      updated = [...holdings, { symbol: sym, shares, avgCost: cost, addedAt: new Date().toISOString() }];
    }
    setHoldings(updated);
    savePortfolio(updated);
    setNewSymbol('');
    setNewShares('');
    setNewCost('');
    setShowAdd(false);
  };

  const quickAdd = (symbol: string) => {
    setNewSymbol(symbol);
    setShowAdd(true);
  };

  const removeHolding = (symbol: string) => {
    const updated = holdings.filter(h => h.symbol !== symbol);
    setHoldings(updated);
    savePortfolio(updated);
  };

  const totals = enriched.reduce((acc, h) => ({
    totalCost: acc.totalCost + h.totalCost,
    totalValue: acc.totalValue + h.currentValue,
    totalPnl: acc.totalPnl + h.pnl,
  }), { totalCost: 0, totalValue: 0, totalPnl: 0 });
  const totalPnlPct = totals.totalCost > 0 ? (totals.totalPnl / totals.totalCost) * 100 : 0;

  // Portfolio Insights
  const largestPosition = enriched.length > 0
    ? enriched.reduce((a, b) => b.currentValue > a.currentValue ? b : a)
    : null;
  const bestPerformer = enriched.length > 0
    ? enriched.reduce((a, b) => b.pnlPct > a.pnlPct ? b : a)
    : null;
  const worstPerformer = enriched.length > 0
    ? enriched.reduce((a, b) => b.pnlPct < a.pnlPct ? b : a)
    : null;
  // Diversification score: 1 holding = 10, 5 = 50, 10+ = 100
  const diversificationScore = Math.min(100, enriched.length * 10);

  // Max absolute pnlPct for scaling P&L bars
  const maxAbsPnlPct = enriched.length > 0
    ? Math.max(...enriched.map(h => Math.abs(h.pnlPct)), 1)
    : 1;

  const formatMoney = (v: number) => v >= 0 ? `$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`;
  const formatLarge = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(2)}K` : `$${v.toFixed(2)}`;

  const summaryCardStyle = (gradientFrom: string, gradientTo: string): React.CSSProperties => ({
    background: 'var(--bg-input)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  });

  const gradientAccent = (color1: string, color2: string): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${color1}, ${color2})`,
    borderRadius: '8px 8px 0 0',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Portfolio Tracker</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPrices(holdings)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Position
            </button>
          </div>
        </div>

        <p className="text-xs mb-4" style={{ color: 'var(--text-dimmed)' }}>
          Track hypothetical positions for educational purposes. This is NOT real trading.
        </p>

        {/* Summary cards with gradient accents */}
        {enriched.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl p-3 text-center relative overflow-hidden" style={{ ...summaryCardStyle('#6366f1', '#8b5cf6') }}>
              <div style={gradientAccent('#6366f1', '#8b5cf6')} />
              <DollarSign className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Value</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatLarge(totals.totalValue)}</p>
            </div>
            <div className="rounded-xl p-3 text-center relative overflow-hidden" style={{ ...summaryCardStyle('#3b82f6', '#6366f1') }}>
              <div style={gradientAccent('#3b82f6', '#6366f1')} />
              <PieChart className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Cost</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatLarge(totals.totalCost)}</p>
            </div>
            <div className="rounded-xl p-3 text-center relative overflow-hidden" style={{ ...summaryCardStyle(totals.totalPnl >= 0 ? '#10b981' : '#ef4444', totals.totalPnl >= 0 ? '#34d399' : '#f87171') }}>
              <div style={gradientAccent(totals.totalPnl >= 0 ? '#10b981' : '#ef4444', totals.totalPnl >= 0 ? '#34d399' : '#f87171')} />
              {totals.totalPnl >= 0 ? <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-400" /> : <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-400" />}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total P&L</p>
              <p className={`text-lg font-bold tabular-nums ${totals.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatMoney(totals.totalPnl)}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center relative overflow-hidden" style={{ ...summaryCardStyle(totalPnlPct >= 0 ? '#10b981' : '#ef4444', totalPnlPct >= 0 ? '#34d399' : '#f87171') }}>
              <div style={gradientAccent(totalPnlPct >= 0 ? '#10b981' : '#ef4444', totalPnlPct >= 0 ? '#34d399' : '#f87171')} />
              {totalPnlPct >= 0 ? <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-400" /> : <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-400" />}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Return %</p>
              <p className={`text-lg font-bold tabular-nums ${totalPnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Insights */}
      {enriched.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Portfolio Insights
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Largest Position */}
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-input)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Largest Position</span>
              </div>
              {largestPosition && (
                <>
                  <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{largestPosition.symbol}</p>
                  <p className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>{formatLarge(largestPosition.currentValue)}</p>
                </>
              )}
            </div>

            {/* Best Performer */}
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-input)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Best Performer</span>
              </div>
              {bestPerformer && (
                <>
                  <p className="text-sm font-bold text-emerald-400">{bestPerformer.symbol}</p>
                  <p className="text-xs tabular-nums text-emerald-400">
                    {bestPerformer.pnlPct >= 0 ? '+' : ''}{bestPerformer.pnlPct.toFixed(2)}%
                  </p>
                </>
              )}
            </div>

            {/* Worst Performer */}
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-input)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Worst Performer</span>
              </div>
              {worstPerformer && (
                <>
                  <p className="text-sm font-bold text-red-400">{worstPerformer.symbol}</p>
                  <p className="text-xs tabular-nums text-red-400">
                    {worstPerformer.pnlPct >= 0 ? '+' : ''}{worstPerformer.pnlPct.toFixed(2)}%
                  </p>
                </>
              )}
            </div>

            {/* Diversification Score */}
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-input)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <PieChart className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Diversification</span>
              </div>
              <p className="text-sm font-bold tabular-nums mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {enriched.length} {enriched.length === 1 ? 'holding' : 'holdings'}
              </p>
              <ProgressBar value={diversificationScore} max={100} height={4} />
            </div>
          </div>
        </div>
      )}

      {/* Add Position Form */}
      {showAdd && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent)',
            borderStyle: 'dashed',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Add Hypothetical Position</h3>
          <div className="flex flex-wrap gap-3">
            <input
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value)}
              placeholder="Symbol (e.g. AAPL)"
              className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <input
              value={newShares}
              onChange={e => setNewShares(e.target.value)}
              placeholder="Shares"
              type="number"
              className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <input
              value={newCost}
              onChange={e => setNewCost(e.target.value)}
              placeholder="Avg Cost ($)"
              type="number"
              className="w-32 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={addHolding}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Holdings Table + Allocation */}
      {enriched.length > 0 ? (
        <div className="space-y-6">
          {/* Enhanced Holdings Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    {['Symbol', 'Shares', 'Avg Cost', 'Current', 'Total Cost', 'Value', 'P&L', 'Return', ''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((h, i) => {
                    const barWidth = Math.abs(h.pnlPct) / maxAbsPnlPct * 100;
                    return (
                      <tr
                        key={h.symbol}
                        className="transition-colors duration-150"
                        style={{
                          borderTop: i > 0 ? '1px solid var(--border-divider)' : undefined,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent)' }}>{h.symbol}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>{h.shares.toFixed(2)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>${h.avgCost.toFixed(2)}</td>
                        <td className="px-4 py-3 font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>${h.currentPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>{formatMoney(h.totalCost)}</td>
                        <td className="px-4 py-3 font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatMoney(h.currentValue)}</td>
                        <td className={`px-4 py-3 font-medium tabular-nums ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.pnl >= 0 ? '+' : ''}{formatMoney(h.pnl)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium tabular-nums text-sm ${h.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                            </span>
                            {/* P&L Bar Visualization */}
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.max(barWidth, 4)}%`,
                                maxWidth: '60px',
                                minWidth: '4px',
                                background: h.pnlPct >= 0
                                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                                  : 'linear-gradient(90deg, #ef4444, #f87171)',
                                transition: 'width 0.5s ease-out',
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeHolding(h.symbol)} className="text-red-400/60 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation View */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            }}
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <PieChart className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Portfolio Allocation
            </h3>
            <div className="space-y-3">
              {enriched
                .slice()
                .sort((a, b) => b.currentValue - a.currentValue)
                .map(h => {
                  const allocationPct = totals.totalValue > 0 ? (h.currentValue / totals.totalValue) * 100 : 0;
                  return (
                    <div key={h.symbol} className="flex items-center gap-3">
                      <span className="text-sm font-semibold w-16 shrink-0" style={{ color: 'var(--accent)' }}>{h.symbol}</span>
                      <div className="flex-1">
                        <div
                          className="rounded-full overflow-hidden"
                          style={{ height: '6px', background: 'var(--bg-input)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${allocationPct}%`,
                              background: 'linear-gradient(90deg, var(--accent), var(--accent-muted))',
                              transition: 'width 0.5s ease-out',
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium tabular-nums w-14 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {allocationPct.toFixed(1)}%
                      </span>
                      <span className="text-xs tabular-nums w-20 text-right" style={{ color: 'var(--text-muted)' }}>
                        {formatLarge(h.currentValue)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No positions yet"
          description="Add a hypothetical stock position to start tracking your simulated portfolio performance."
          actionLabel="Add Your First Position"
          onAction={() => setShowAdd(true)}
          suggestions={[
            { label: 'AAPL', onClick: () => quickAdd('AAPL') },
            { label: 'MSFT', onClick: () => quickAdd('MSFT') },
            { label: 'GOOGL', onClick: () => quickAdd('GOOGL') },
            { label: 'AMZN', onClick: () => quickAdd('AMZN') },
            { label: 'TSLA', onClick: () => quickAdd('TSLA') },
          ]}
        />
      )}

      {/* Disclaimer */}
      <p className="text-xs text-center" style={{ color: 'var(--text-dimmed)' }}>
        This is a hypothetical portfolio for educational purposes only. No real trades are executed.
        Past performance does not guarantee future results.
      </p>
    </div>
  );
}
