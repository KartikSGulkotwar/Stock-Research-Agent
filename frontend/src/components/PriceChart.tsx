'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ReferenceLine, Legend
} from 'recharts';
import { TrendingUp, CandlestickChart, BarChart3, Activity } from 'lucide-react';

interface PriceData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma_20?: number;
  ma_50?: number;
  ma_200?: number;
  rsi?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
}

type ChartView = 'price' | 'volume' | 'rsi';
type TimeRange = '1M' | '3M' | '6M' | '1Y';

export default function PriceChart({ symbol }: { symbol: string }) {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ChartView>('price');
  const [range, setRange] = useState<TimeRange>('6M');
  const [showMA, setShowMA] = useState({ ma20: true, ma50: true, ma200: false });
  const [showBB, setShowBB] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`${apiUrl}/api/chart/${symbol}?range=${range}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol, range, apiUrl]);

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volColor: d.close >= d.open ? '#10b981' : '#ef4444',
    }));
  }, [data]);

  const priceStats = useMemo(() => {
    if (data.length === 0) return null;
    const closes = data.map(d => d.close);
    const latest = data[data.length - 1];
    const first = data[0];
    const change = latest.close - first.close;
    const changePct = (change / first.close) * 100;
    return {
      current: latest.close,
      high: Math.max(...data.map(d => d.high)),
      low: Math.min(...data.map(d => d.low)),
      change,
      changePct,
      avgVolume: Math.round(data.reduce((s, d) => s + d.volume, 0) / data.length),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-4">
          <CandlestickChart className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Price Chart</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) return null;

  const formatPrice = (v: number) => `$${v.toFixed(2)}`;
  const formatVol = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`;

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CandlestickChart className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {symbol} Price Chart
          </h3>
          {priceStats && (
            <span className={`text-sm font-medium px-2 py-0.5 rounded ${priceStats.changePct >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {priceStats.changePct >= 0 ? '+' : ''}{priceStats.changePct.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Time range selector */}
        <div className="flex gap-1">
          {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: range === r ? 'var(--accent)' : 'var(--bg-badge)',
                color: range === r ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {priceStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Current', value: formatPrice(priceStats.current) },
            { label: 'Period High', value: formatPrice(priceStats.high) },
            { label: 'Period Low', value: formatPrice(priceStats.low) },
            { label: 'Change', value: `${priceStats.change >= 0 ? '+' : ''}${formatPrice(priceStats.change)}`, color: priceStats.change >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Avg Volume', value: formatVol(priceStats.avgVolume) },
          ].map((s, i) => (
            <div key={i} className="text-center rounded-lg p-2" style={{ background: 'var(--bg-input)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-sm font-semibold" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* View tabs */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex gap-1">
          {([
            { key: 'price', icon: TrendingUp, label: 'Price' },
            { key: 'volume', icon: BarChart3, label: 'Volume' },
            { key: 'rsi', icon: Activity, label: 'RSI' },
          ] as { key: ChartView; icon: any; label: string }[]).map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: view === v.key ? 'var(--active-badge-bg)' : 'transparent',
                color: view === v.key ? 'var(--active-badge-text)' : 'var(--text-muted)',
                border: view === v.key ? '1px solid var(--active-badge-border)' : '1px solid transparent',
              }}
            >
              <v.icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          ))}
        </div>

        {view === 'price' && (
          <div className="flex items-center gap-3 ml-auto text-xs">
            {[
              { key: 'ma20', label: 'MA20', color: '#fbbf24' },
              { key: 'ma50', label: 'MA50', color: '#60a5fa' },
              { key: 'ma200', label: 'MA200', color: '#a78bfa' },
            ].map(ma => (
              <label key={ma.key} className="flex items-center gap-1 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={showMA[ma.key as keyof typeof showMA]}
                  onChange={() => setShowMA(p => ({ ...p, [ma.key]: !p[ma.key as keyof typeof showMA] }))}
                  className="w-3 h-3 rounded"
                />
                <span style={{ color: showMA[ma.key as keyof typeof showMA] ? ma.color : 'var(--text-dimmed)' }}>{ma.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-1 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={showBB}
                onChange={() => setShowBB(p => !p)}
                className="w-3 h-3 rounded"
              />
              <span style={{ color: showBB ? '#f472b6' : 'var(--text-dimmed)' }}>BB</span>
            </label>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'price' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-divider)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} interval="preserveStartEnd" tickCount={8} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickFormatter={formatPrice} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                formatter={(v: number, name: string) => [formatPrice(v), name]}
              />
              {showBB && chartData.some(d => d.bollinger_upper) && (
                <Area type="monotone" dataKey="bollinger_upper" stroke="transparent" fill="#f472b6" fillOpacity={0.05} />
              )}
              {showBB && chartData.some(d => d.bollinger_lower) && (
                <Area type="monotone" dataKey="bollinger_lower" stroke="#f472b6" strokeDasharray="3 3" fill="transparent" strokeWidth={1} dot={false} name="BB Lower" />
              )}
              {showBB && chartData.some(d => d.bollinger_upper) && (
                <Line type="monotone" dataKey="bollinger_upper" stroke="#f472b6" strokeDasharray="3 3" strokeWidth={1} dot={false} name="BB Upper" />
              )}
              <Area type="monotone" dataKey="close" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.08} strokeWidth={2} dot={false} name="Price" />
              {showMA.ma20 && chartData.some(d => d.ma_20) && (
                <Line type="monotone" dataKey="ma_20" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="MA 20" />
              )}
              {showMA.ma50 && chartData.some(d => d.ma_50) && (
                <Line type="monotone" dataKey="ma_50" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="MA 50" />
              )}
              {showMA.ma200 && chartData.some(d => d.ma_200) && (
                <Line type="monotone" dataKey="ma_200" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="MA 200" />
              )}
            </ComposedChart>
          ) : view === 'volume' ? (
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-divider)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} interval="preserveStartEnd" tickCount={8} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickFormatter={formatVol} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatVol(v), 'Volume']}
              />
              <Bar dataKey="volume" fill="var(--accent)" fillOpacity={0.6} name="Volume" />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-divider)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} interval="preserveStartEnd" tickCount={8} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(1), 'RSI']}
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Overbought', fill: '#ef4444', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Oversold', fill: '#10b981', fontSize: 10, position: 'right' }} />
              <Area type="monotone" dataKey="rsi" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} dot={false} name="RSI" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-dimmed)' }}>
        Historical price data from Yahoo Finance. Past performance does not indicate future results.
      </p>
    </div>
  );
}
