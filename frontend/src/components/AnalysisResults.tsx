'use client';

import AnalysisSummaryCards from './AnalysisSummaryCards';
import KeyInsightsCards from './KeyInsightsCards';
import PriceLadder from './PriceLadder';
import EnhancedScoreDisplay from './EnhancedScoreDisplay';
import InvestorGuidance from './InvestorGuidance';
import AgentCard from './AgentCard';
import AgentDebate from './AgentDebate';
import CompanyProfile from './CompanyProfile';
import PerformanceSimulator from './PerformanceSimulator';
import NewsTimeline from './NewsTimeline';
import PriceChart from './PriceChart';
import ExportPDF from './ExportPDF';
import ShareCard from './ShareCard';
import DataAttribution from './ui/DataAttribution';
import InfoTooltip from './ui/InfoTooltip';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisResultsProps {
  result: {
    symbol: string;
    recommendation: string;
    analysis_direction?: string;
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
    risk_considerations?: string[];
    analyst_ratings?: {
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
      consensus: string;
      targetHigh: number;
      targetLow: number;
      targetConsensus: number;
      targetMedian: number;
    };
    detailed_analysis?: {
      technical?: { summary: string; score?: number; trend?: string; momentum?: string };
      fundamental?: { summary: string; score?: number; valuation?: string };
      sentiment?: { summary: string; score?: number; overall_sentiment?: string };
      risk?: { summary: string; risk_level?: string; key_risks?: string[] };
    };
  };
}

const directionLabel: Record<string, string> = {
  bullish: 'Bullish Signals Detected',
  bearish: 'Bearish Signals Detected',
  neutral: 'Mixed Signals',
  BUY: 'Bullish Signals Detected',
  SELL: 'Bearish Signals Detected',
  HOLD: 'Mixed Signals',
};

const directionStyle: Record<string, { bg: string; text: string; border: string; icon: typeof TrendingUp }> = {
  bullish: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.4)', icon: TrendingUp },
  bearish: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.4)', icon: TrendingDown },
  neutral: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)', icon: Minus },
  BUY: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.4)', icon: TrendingUp },
  SELL: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.4)', icon: TrendingDown },
  HOLD: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)', icon: Minus },
};

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  const direction = result.analysis_direction || result.recommendation;
  const label = directionLabel[direction] || 'Mixed Signals';
  const style = directionStyle[direction] || directionStyle['HOLD'];
  const DirIcon = style.icon;
  const strength = result.signal_strength || (result.confidence > 0.7 ? 'strong' : result.confidence > 0.4 ? 'moderate' : 'weak');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Main Direction Card */}
      <div
        className="rounded-2xl p-6 text-center animate-fadeIn"
        style={{ background: 'var(--bg-card)', border: `2px solid ${style.border}` }}
      >
        <div className="flex justify-end gap-2 mb-2 print:hidden">
          <ShareCard
            symbol={result.symbol}
            direction={direction}
            confidence={result.confidence}
            technicalScore={result.technical_score}
            fundamentalScore={result.fundamental_score}
            sentimentScore={result.sentiment_score}
            price={result.price_at_analysis}
            targetPrice={result.target_price}
            summary={result.summary}
          />
          <ExportPDF />
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{result.symbol} Analysis Complete</p>
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-3" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
          <DirIcon className="w-7 h-7" style={{ color: style.text }} />
          <span className="text-2xl font-bold" style={{ color: style.text }}>{label}</span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3 mb-4 flex-wrap">
          <span className="text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)' }}>
            Signal: <strong className="capitalize">{strength}</strong>
            <InfoTooltip term="Signal Strength" brief="Intensity of the directional signal: Strong, Moderate, or Weak." size="sm" />
          </span>
          <span className="text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)' }}>
            Confidence: <strong>{(result.confidence * 100).toFixed(0)}%</strong>
            <InfoTooltip term="Confidence" brief="How strong the AI analysis signals are — higher means more agreement among indicators." size="sm" />
          </span>
          <span className="text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)' }}>
            Risk: <strong className="capitalize">{result.risk_level}</strong>
          </span>
        </div>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
      </div>

      {/* Summary Metric Cards */}
      <AnalysisSummaryCards
        confidence={result.confidence}
        signalStrength={strength}
        riskLevel={result.risk_level}
      />

      {/* Company Profile */}
      <CompanyProfile symbol={result.symbol} />

      {/* Interactive Price Chart */}
      <PriceChart symbol={result.symbol} />

      {/* Key Insights (categorized positive/negative) */}
      {result.key_findings && result.key_findings.length > 0 && (
        <KeyInsightsCards
            findings={result.key_findings}
            direction={direction}
            confidence={result.confidence}
            technicalScore={result.technical_score}
            fundamentalScore={result.fundamental_score}
            sentimentScore={result.sentiment_score}
          />
      )}

      {/* Price Ladder (replaces RecommendationCard) */}
      <PriceLadder
        currentPrice={result.price_at_analysis}
        targetPrice={result.target_price}
        stopLoss={result.stop_loss}
        analystTarget={result.analyst_ratings?.targetConsensus}
        direction={direction}
      />

      {/* Enhanced Score Display (replaces ScoreChart) */}
      <EnhancedScoreDisplay
        technical={result.technical_score}
        fundamental={result.fundamental_score}
        sentiment={result.sentiment_score}
      />

      {/* Performance Simulator */}
      <PerformanceSimulator
        symbol={result.symbol}
        currentPrice={result.price_at_analysis}
        targetPrice={result.target_price}
        stopLoss={result.stop_loss}
        confidence={result.confidence}
      />

      {/* Analyst Ratings */}
      {result.analyst_ratings && (() => {
        const a = result.analyst_ratings!;
        const total = a.strongBuy + a.buy + a.hold + a.sell + a.strongSell;
        const buyPct = total > 0 ? ((a.strongBuy + a.buy) / total) * 100 : 0;
        const holdPct = total > 0 ? (a.hold / total) * 100 : 0;
        const sellPct = total > 0 ? ((a.sell + a.strongSell) / total) * 100 : 0;
        return (
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Wall Street Analyst Consensus</h3>
                <InfoTooltip term="Analyst Consensus" brief="Aggregated ratings from Wall Street analysts. These are third-party opinions, not our recommendation." />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} analysts</span>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-dimmed)' }}>Based on third-party Wall Street analyst opinions, not our recommendation.</p>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-emerald-500/60 flex flex-col items-center justify-center" style={{ background: 'var(--bg-icon)' }}>
                <span className="text-xl font-bold text-emerald-400">{buyPct.toFixed(0)}%</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Buy</span>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: 'Buy', pct: buyPct, color: '#10b981' },
                  { label: 'Hold', pct: holdPct, color: '#f59e0b' },
                  { label: 'Sell', pct: sellPct, color: '#ef4444' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="text-sm w-10" style={{ color: r.color }}>{r.label}</span>
                    <div className="flex-1 rounded-full h-3 overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                    <span className="text-sm w-14 text-right" style={{ color: 'var(--text-secondary)' }}>{r.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid var(--border-divider)' }}>
              {[
                { label: 'Target Low', value: a.targetLow, color: '#ef4444' },
                { label: 'Median Target', value: a.targetMedian, color: '#f59e0b' },
                { label: 'Consensus Target', value: a.targetConsensus, color: '#10b981' },
                { label: 'Target High', value: a.targetHigh, color: '#3b82f6' },
              ].map(t => (
                <div key={t.label} className="text-center">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
                  <p className="text-lg font-semibold" style={{ color: t.color }}>${t.value.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Investor Guidance */}
      <InvestorGuidance
        direction={direction}
        confidence={result.confidence}
        riskLevel={result.risk_level}
        technicalScore={result.technical_score}
        fundamentalScore={result.fundamental_score}
        sentimentScore={result.sentiment_score}
      />

      {/* Risk Considerations */}
      {result.risk_considerations && result.risk_considerations.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Considerations
          </h3>
          <ul className="space-y-2">
            {result.risk_considerations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-red-400 mt-0.5">&#x26A0;</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent Detail Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          AI Agent Analysis
          <InfoTooltip term="AI Agents" brief="Each agent independently analyzes different aspects of the stock, then a coordinator synthesizes their findings." />
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {result.detailed_analysis?.technical && (
            <AgentCard
              type="technical"
              summary={result.detailed_analysis.technical.summary}
              score={result.detailed_analysis.technical.score}
              extra={{ trend: result.detailed_analysis.technical.trend, momentum: result.detailed_analysis.technical.momentum }}
            />
          )}
          {result.detailed_analysis?.fundamental && (
            <AgentCard
              type="fundamental"
              summary={result.detailed_analysis.fundamental.summary}
              score={result.detailed_analysis.fundamental.score}
              extra={{ valuation: result.detailed_analysis.fundamental.valuation }}
            />
          )}
          {result.detailed_analysis?.sentiment && (
            <AgentCard
              type="sentiment"
              summary={result.detailed_analysis.sentiment.summary}
              score={result.detailed_analysis.sentiment.score}
              extra={{ overall_sentiment: result.detailed_analysis.sentiment.overall_sentiment }}
            />
          )}
          {result.detailed_analysis?.risk && (
            <AgentCard
              type="risk"
              summary={result.detailed_analysis.risk.summary}
              extra={{ risk_level: result.detailed_analysis.risk.risk_level, key_risks: result.detailed_analysis.risk.key_risks }}
            />
          )}
        </div>
      </div>

      {/* Agent Debate View */}
      {result.detailed_analysis?.technical && result.detailed_analysis?.fundamental &&
       result.detailed_analysis?.sentiment && result.detailed_analysis?.risk && (
        <AgentDebate
          symbol={result.symbol}
          technical={result.detailed_analysis.technical}
          fundamental={result.detailed_analysis.fundamental}
          sentiment={result.detailed_analysis.sentiment}
          risk={result.detailed_analysis.risk}
          direction={direction}
        />
      )}

      {/* News Timeline */}
      <NewsTimeline symbol={result.symbol} />

      {/* Data Attribution */}
      <DataAttribution sources={['prices', 'news', 'fundamentals', 'analysts']} />

      {/* Disclaimer */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-400">Educational Analysis Only</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            This analysis is for educational and informational purposes only. It does NOT constitute investment advice,
            financial advice, or a personal recommendation. All investments involve risk of loss.
            Past performance does not guarantee future results. Always consult a licensed financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
