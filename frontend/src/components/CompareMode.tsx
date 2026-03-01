'use client';

import { useState } from 'react';
import { Plus, X, Loader2, BarChart3, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CompareResult {
  symbol: string;
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
  stop_loss?: number;
  summary: string;
  key_findings?: string[];
  analyst_ratings?: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    targetConsensus: number;
  };
}

const directionLabel: Record<string, string> = {
  bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral',
  BUY: 'Bullish', SELL: 'Bearish', HOLD: 'Neutral',
};
const directionColor: Record<string, string> = {
  bullish: 'text-emerald-400', bearish: 'text-red-400', neutral: 'text-amber-400',
  BUY: 'text-emerald-400', SELL: 'text-red-400', HOLD: 'text-amber-400',
};

const STOCK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function getOverallScore(r: CompareResult) {
  return (r.technical_score + r.fundamental_score + r.sentiment_score) / 3;
}

function getUpside(r: CompareResult) {
  if (!r.target_price || !r.price_at_analysis) return 0;
  return ((r.target_price - r.price_at_analysis) / r.price_at_analysis) * 100;
}

export default function CompareMode() {
  const [symbols, setSymbols] = useState<string[]>(['', '']);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSymbol = () => { if (symbols.length < 4) setSymbols([...symbols, '']); };
  const removeSymbol = (i: number) => { if (symbols.length > 2) setSymbols(symbols.filter((_, idx) => idx !== i)); };
  const updateSymbol = (i: number, val: string) => {
    const copy = [...symbols];
    copy[i] = val.toUpperCase();
    setSymbols(copy);
  };

  const compare = async () => {
    const valid = symbols.filter(s => s.trim());
    if (valid.length < 2) { setError('Enter at least 2 symbols'); return; }
    setLoading(true);
    setError(null);
    setResults([]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const promises = valid.map(async (sym) => {
        const res = await fetch(`${apiUrl}/api/analyze/${sym}`, { signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error(`Failed: ${sym}`);
        return res.json();
      });
      const data = await Promise.all(promises);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  // Find the "winner" (highest overall score)
  const winner = results.length >= 2
    ? results.reduce((best, r) => getOverallScore(r) > getOverallScore(best) ? r : best)
    : null;

  // Build radar chart data
  const radarData = results.length >= 2 ? [
    { metric: 'Technical', ...Object.fromEntries(results.map(r => [r.symbol, r.technical_score])) },
    { metric: 'Fundamental', ...Object.fromEntries(results.map(r => [r.symbol, r.fundamental_score])) },
    { metric: 'Sentiment', ...Object.fromEntries(results.map(r => [r.symbol, r.sentiment_score])) },
    { metric: 'Confidence', ...Object.fromEntries(results.map(r => [r.symbol, Math.round(r.confidence * 100)])) },
    { metric: 'Risk (inv)', ...Object.fromEntries(results.map(r => [r.symbol, r.risk_level === 'LOW' ? 80 : r.risk_level === 'HIGH' ? 20 : 50])) },
  ] : [];

  // Find best value per metric for highlighting
  const bestInMetric = (key: string, values: number[]) => {
    const max = Math.max(...values);
    return values.map(v => v === max && max > 0);
  };

  const metricRows = results.length >= 2 ? [
    { label: 'Technical Score', values: results.map(r => r.technical_score), format: (v: number) => `${v}/100` },
    { label: 'Fundamental Score', values: results.map(r => r.fundamental_score), format: (v: number) => `${v}/100` },
    { label: 'Sentiment Score', values: results.map(r => r.sentiment_score), format: (v: number) => `${v}/100` },
    { label: 'Overall Score', values: results.map(r => Math.round(getOverallScore(r))), format: (v: number) => `${v}/100` },
    { label: 'Confidence', values: results.map(r => Math.round(r.confidence * 100)), format: (v: number) => `${v}%` },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Input Section */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Compare Stocks (2-4)</h3>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {symbols.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: STOCK_COLORS[i] }} />
              <input
                value={s}
                onChange={e => updateSymbol(i, e.target.value)}
                placeholder={`Symbol ${i + 1}`}
                className="w-28 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
              {symbols.length > 2 && (
                <button onClick={() => removeSymbol(i)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {symbols.length < 4 && (
            <button onClick={addSymbol} className="p-2 rounded-lg" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={compare}
          disabled={loading || symbols.filter(s => s.trim()).length < 2}
          className="px-6 py-2 rounded-xl disabled:opacity-50 font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? 'Analyzing...' : 'Compare'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing {symbols.filter(s => s.trim()).length} stocks... This may take a few minutes.</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/50 p-4 text-center mb-8">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {results.length >= 2 && (
        <div className="space-y-6">
          {/* Winner Banner */}
          {winner && (
            <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Trophy className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-emerald-400">
                  {winner.symbol} leads with the highest overall score
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Overall: {Math.round(getOverallScore(winner))}/100 &middot; {directionLabel[winner.analysis_direction || winner.recommendation] || 'Mixed'} Signals
                  {winner.target_price ? ` · Estimated upside: ${getUpside(winner).toFixed(1)}%` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className={`grid gap-4 ${results.length === 2 ? 'grid-cols-2' : results.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {results.map((r, i) => {
              const dir = r.analysis_direction || r.recommendation;
              const isWinner = winner?.symbol === r.symbol;
              const DirIcon = dir === 'bullish' || dir === 'BUY' ? TrendingUp : dir === 'bearish' || dir === 'SELL' ? TrendingDown : Minus;
              return (
                <div
                  key={r.symbol}
                  className="rounded-2xl p-4 relative"
                  style={{
                    background: 'var(--bg-card)',
                    border: isWinner ? `2px solid ${STOCK_COLORS[i]}` : '1px solid var(--border-color)',
                  }}
                >
                  {isWinner && (
                    <span className="absolute -top-2.5 left-3 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 font-medium">
                      Top Scored
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: STOCK_COLORS[i] }} />
                    <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                  </div>
                  <div className={`flex items-center gap-1 mb-2 ${directionColor[dir] || ''}`}>
                    <DirIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{directionLabel[dir] || dir}</span>
                  </div>
                  <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <p>Price: <strong>${r.price_at_analysis.toFixed(2)}</strong></p>
                    {r.target_price && <p>Fair Value: <strong className="text-emerald-400">${r.target_price.toFixed(2)}</strong></p>}
                    <p>Overall: <strong>{Math.round(getOverallScore(r))}/100</strong></p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Radar Chart */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Score Radar</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="var(--border-divider)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-dimmed)', fontSize: 10 }} />
                  {results.map((r, i) => (
                    <Radar
                      key={r.symbol}
                      name={r.symbol}
                      dataKey={r.symbol}
                      stroke={STOCK_COLORS[i]}
                      fill={STOCK_COLORS[i]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg)',
                      border: '1px solid var(--tooltip-border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="rounded-2xl p-6 overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 className="w-5 h-5 inline mr-2" style={{ color: 'var(--accent)' }} />
              Detailed Comparison
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <th className="text-left py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Metric</th>
                  {results.map((r, i) => (
                    <th key={r.symbol} className="text-center py-3 px-2 font-bold" style={{ color: STOCK_COLORS[i] }}>
                      {r.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Direction</td>
                  {results.map(r => {
                    const dir = r.analysis_direction || r.recommendation;
                    return <td key={r.symbol} className={`text-center py-3 px-2 font-semibold ${directionColor[dir] || ''}`}>{directionLabel[dir] || dir}</td>;
                  })}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Signal Strength</td>
                  {results.map(r => <td key={r.symbol} className="text-center py-3 px-2 capitalize" style={{ color: 'var(--text-secondary)' }}>{r.signal_strength || '-'}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Price</td>
                  {results.map(r => <td key={r.symbol} className="text-center py-3 px-2 font-semibold" style={{ color: 'var(--text-primary)' }}>${r.price_at_analysis.toFixed(2)}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Fair Value Est.</td>
                  {results.map(r => <td key={r.symbol} className="text-center py-3 px-2 text-emerald-400 font-semibold">{r.target_price ? `$${r.target_price.toFixed(2)}` : '-'}</td>)}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Upside %</td>
                  {results.map(r => {
                    const upside = getUpside(r);
                    return (
                      <td key={r.symbol} className={`text-center py-3 px-2 font-semibold ${upside > 0 ? 'text-emerald-400' : upside < 0 ? 'text-red-400' : ''}`}>
                        {r.target_price ? `${upside > 0 ? '+' : ''}${upside.toFixed(1)}%` : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Scores with winner highlighting */}
                {metricRows.map(row => {
                  const best = bestInMetric(row.label, row.values);
                  return (
                    <tr key={row.label} style={{ borderBottom: '1px solid var(--border-divider)' }}>
                      <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>{row.label}</td>
                      {row.values.map((v, i) => (
                        <td
                          key={results[i].symbol}
                          className={`text-center py-3 px-2 font-semibold ${best[i] ? 'text-emerald-400' : ''}`}
                          style={best[i] ? undefined : { color: 'var(--text-secondary)' }}
                        >
                          {row.format(v)}
                          {best[i] && results.length > 2 && <span className="text-xs ml-1">★</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                <tr style={{ borderBottom: '1px solid var(--border-divider)' }}>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Risk Level</td>
                  {results.map(r => (
                    <td key={r.symbol} className={`text-center py-3 px-2 font-semibold ${r.risk_level === 'HIGH' ? 'text-red-400' : r.risk_level === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r.risk_level}
                    </td>
                  ))}
                </tr>
                {results.some(r => r.analyst_ratings) && (
                  <tr>
                    <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>Analyst Target</td>
                    {results.map(r => (
                      <td key={r.symbol} className="text-center py-3 px-2" style={{ color: 'var(--text-secondary)' }}>
                        {r.analyst_ratings ? `$${r.analyst_ratings.targetConsensus.toFixed(0)}` : '-'}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Key Findings Side-by-Side */}
          {results.some(r => r.key_findings && r.key_findings.length > 0) && (
            <div className={`grid gap-4 ${results.length === 2 ? 'grid-cols-2' : results.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {results.map((r, i) => (
                <div key={r.symbol} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: STOCK_COLORS[i] }}>{r.symbol} Key Findings</h4>
                  {r.key_findings && r.key_findings.length > 0 ? (
                    <ul className="space-y-1">
                      {r.key_findings.slice(0, 4).map((f, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: STOCK_COLORS[i] }} className="mt-0.5">•</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>No findings available</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-center" style={{ color: 'var(--text-dimmed)' }}>
            For educational purposes only. Not investment advice. Past performance does not guarantee future results.
          </p>
        </div>
      )}
    </div>
  );
}
