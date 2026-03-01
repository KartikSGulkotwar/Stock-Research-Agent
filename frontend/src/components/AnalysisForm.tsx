'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

const POPULAR = ['TSLA', 'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AMD'];

export default function AnalysisForm({ onAnalyze, isAnalyzing }: { onAnalyze: (s: string) => void; isAnalyzing: boolean }) {
  const [symbol, setSymbol] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = symbol.trim().toUpperCase();
    if (s && !isAnalyzing) onAnalyze(s);
  };
  return (
    <div className="max-w-2xl mx-auto mb-10">
      <form onSubmit={submit} className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter symbol (e.g. TSLA)"
            className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            disabled={isAnalyzing}
          />
        </div>
        <button type="submit" disabled={isAnalyzing || !symbol.trim()} className="px-6 py-3 rounded-xl disabled:opacity-50 font-semibold text-white" style={{ background: 'var(--accent)' }}>
          {isAnalyzing ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {POPULAR.map((s) => (
          <button key={s} type="button" onClick={() => { setSymbol(s); if (!isAnalyzing) onAnalyze(s); }} disabled={isAnalyzing} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)' }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
