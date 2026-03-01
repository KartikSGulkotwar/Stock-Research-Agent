'use client';

import { useState, useEffect } from 'react';
import { Bot, Database, TrendingUp, DollarSign, Newspaper, AlertTriangle, Brain, Check, Loader2 } from 'lucide-react';

interface AnalysisLoadingModalProps {
  symbol: string;
  isActive: boolean;
}

const AGENTS = [
  { id: 'data', name: 'Data Collector', icon: Database, desc: 'Fetching price data & fundamentals', color: '#60a5fa', duration: 5000 },
  { id: 'technical', name: 'Technical Analyzer', icon: TrendingUp, desc: 'RSI, MACD, Moving Averages', color: '#3b82f6', duration: 8000 },
  { id: 'fundamental', name: 'Fundamental Analyzer', icon: DollarSign, desc: 'P/E, EPS, Profit Margins', color: '#10b981', duration: 12000 },
  { id: 'sentiment', name: 'Sentiment Analyzer', icon: Newspaper, desc: 'News & market sentiment', color: '#f59e0b', duration: 18000 },
  { id: 'risk', name: 'Risk Assessor', icon: AlertTriangle, desc: 'Volatility & risk factors', color: '#ef4444', duration: 24000 },
  { id: 'coordinator', name: 'Coordinator', icon: Brain, desc: 'Synthesizing all findings', color: '#8b5cf6', duration: 35000 },
];

export default function AnalysisLoadingModal({ symbol, isActive }: AnalysisLoadingModalProps) {
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [tip, setTip] = useState(0);

  const TIPS = [
    'AI agents work together to analyze stocks from multiple perspectives',
    'Technical analysis examines price patterns and momentum indicators',
    'Fundamental analysis evaluates company financials and valuation',
    'Sentiment analysis gauges market mood from news and social data',
    'Risk assessment identifies potential downside scenarios',
    'The coordinator synthesizes all agent findings into a unified view',
  ];

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => clearInterval(timer);
  }, [isActive, startTime]);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setTip(t => (t + 1) % TIPS.length), 5000);
    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  const completedCount = AGENTS.filter(a => elapsed > a.duration).length;
  const progress = Math.min(95, (elapsed / 40000) * 100);

  return (
    <div className="max-w-2xl mx-auto mb-10 animate-scaleIn">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse-subtle" style={{ background: 'var(--accent-muted)' }}>
            <Bot className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Analyzing {symbol}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dimmed)' }}>
            6 AI agents working together
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {completedCount}/{AGENTS.length} agents complete
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, var(--accent), var(--accent-hover))`,
              }}
            />
          </div>
        </div>

        {/* Agent status */}
        <div className="px-6 pb-4 space-y-1.5">
          {AGENTS.map(agent => {
            const Icon = agent.icon;
            const isComplete = elapsed > agent.duration;
            const isActive = !isComplete && elapsed > (agent.duration - 6000);

            return (
              <div key={agent.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg" style={{
                background: isActive ? 'var(--accent-muted)' : 'transparent',
              }}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isComplete ? `${agent.color}20` : 'var(--bg-input)' }}
                >
                  {isComplete ? (
                    <Check className="w-3.5 h-3.5" style={{ color: agent.color }} />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: agent.color }} />
                  ) : (
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-dimmed)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: isComplete ? agent.color : isActive ? 'var(--text-primary)' : 'var(--text-dimmed)' }}>
                    {agent.name}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-dimmed)' }}>
                  {isComplete ? 'Done' : isActive ? 'Working...' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tip */}
        <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border-divider)' }}>
          <p className="text-xs text-center animate-fadeIn" key={tip} style={{ color: 'var(--text-muted)' }}>
            💡 {TIPS[tip]}
          </p>
        </div>
      </div>
    </div>
  );
}
