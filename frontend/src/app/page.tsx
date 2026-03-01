'use client';

import { useState, useEffect } from 'react';
import AnalysisForm from '@/components/AnalysisForm';
import AnalysisResults from '@/components/AnalysisResults';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import CompareMode from '@/components/CompareMode';
import AnalysisHistory from '@/components/AnalysisHistory';
import Watchlist from '@/components/Watchlist';
import PortfolioTracker from '@/components/PortfolioTracker';
import MarketOverview from '@/components/MarketOverview';
import StockScreener from '@/components/StockScreener';
import SearchBar from '@/components/SearchBar';
import NotificationCenter from '@/components/NotificationCenter';
import QuickActions from '@/components/QuickActions';
import AnalysisLoadingModal from '@/components/AnalysisLoadingModal';
import ErrorState from '@/components/ui/ErrorState';
import { TrendingUp, Search, BarChart3, History, Star, Briefcase, Globe, Filter, Shield } from 'lucide-react';
import Link from 'next/link';

type Mode = 'analyze' | 'compare' | 'history' | 'watchlist' | 'portfolio' | 'market' | 'screener';

const MODES: Mode[] = ['analyze', 'compare', 'history', 'watchlist', 'portfolio', 'market', 'screener'];

const TAB_CONFIG: { mode: Mode; icon: typeof Search; label: string }[] = [
  { mode: 'analyze', icon: Search, label: 'Analyze' },
  { mode: 'compare', icon: BarChart3, label: 'Compare' },
  { mode: 'history', icon: History, label: 'History' },
  { mode: 'watchlist', icon: Star, label: 'Watchlist' },
  { mode: 'portfolio', icon: Briefcase, label: 'Portfolio' },
  { mode: 'market', icon: Globe, label: 'Market' },
  { mode: 'screener', icon: Filter, label: 'Screener' },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingSymbol, setAnalyzingSymbol] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Keyboard shortcuts: 1-7 for tabs, Alt+Left/Right to navigate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= MODES.length) {
        e.preventDefault();
        setMode(MODES[num - 1]);
        return;
      }

      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const idx = MODES.indexOf(mode);
        if (e.key === 'ArrowLeft' && idx > 0) setMode(MODES[idx - 1]);
        if (e.key === 'ArrowRight' && idx < MODES.length - 1) setMode(MODES[idx + 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  const handleAnalyze = async (symbol: string) => {
    setIsAnalyzing(true);
    setAnalyzingSymbol(symbol);
    setResult(null);
    setError(null);
    setMode('analyze');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(`${apiUrl}/api/analyze/${symbol}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Analysis failed');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Analysis timed out. Please try again.');
      } else {
        setError(err.message || 'Connection failed');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNavigate = (m: string) => {
    setMode(m as Mode);
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="container mx-auto px-4 py-6">

        {/* === TOP NAVIGATION BAR === */}
        <div className="flex items-center justify-between mb-6 gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Stock Research Agent</h1>
              <p className="text-xs leading-tight" style={{ color: 'var(--text-dimmed)' }}>AI-Powered Educational Analysis</p>
            </div>
          </div>

          {/* Right side: Search + Actions + Notifications + Theme */}
          <div className="flex items-center gap-2">
            <SearchBar onAnalyze={handleAnalyze} onNavigate={handleNavigate} />
            <QuickActions onNavigate={handleNavigate} />
            <NotificationCenter />
            <ThemeSwitcher />
          </div>
        </div>

        {/* Educational Disclaimer Banner */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: 'rgba(234, 179, 8, 0.06)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold text-amber-400">Educational Only</span> — This tool provides AI-generated analysis for learning purposes. Not investment advice.{' '}
                <Link href="/terms" className="underline" style={{ color: 'var(--accent)' }}>Terms</Link>
              </p>
            </div>
          </div>
        </div>

        {/* === MODE TABS === */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
            {TAB_CONFIG.map(({ mode: m, icon: Icon, label }, idx) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all relative"
                style={{
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {mode !== m && (
                  <span className="hidden lg:inline text-xs opacity-40 ml-0.5">{idx + 1}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* === PAGE CONTENT === */}
        <div className="animate-fadeIn" key={mode}>
          {mode === 'analyze' && (
            <>
              <AnalysisForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

              {isAnalyzing && (
                <AnalysisLoadingModal symbol={analyzingSymbol} isActive={isAnalyzing} />
              )}

              {error && !isAnalyzing && (
                <div className="max-w-2xl mx-auto mb-10">
                  <ErrorState
                    title={`Couldn't analyze ${analyzingSymbol || 'stock'}`}
                    message={error}
                    type={error.includes('timed out') ? 'network' : error.includes('not found') ? 'not_found' : 'generic'}
                    onRetry={analyzingSymbol ? () => handleAnalyze(analyzingSymbol) : undefined}
                  />
                </div>
              )}

              {result && <div className="animate-slideUp"><AnalysisResults result={result} /></div>}
            </>
          )}

          {mode === 'compare' && <CompareMode />}
          {mode === 'history' && <AnalysisHistory />}
          {mode === 'watchlist' && <Watchlist />}
          {mode === 'portfolio' && <PortfolioTracker />}
          {mode === 'market' && <MarketOverview />}
          {mode === 'screener' && <StockScreener />}
        </div>

        {/* Footer Disclaimer */}
        <div className="max-w-4xl mx-auto mt-16 pt-8 text-center" style={{ borderTop: '1px solid var(--border-divider)' }}>
          <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
            Stock Research Agent is an educational tool for informational purposes only.
            It does not constitute investment advice, financial advice, trading advice, or any other sort of advice.
            You should not treat any of the content as such. Past performance does not guarantee future results.
            All investments involve risk including possible loss of principal.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-dimmed)' }}>
            <Link href="/terms" className="underline" style={{ color: 'var(--text-muted)' }}>Terms of Service</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
