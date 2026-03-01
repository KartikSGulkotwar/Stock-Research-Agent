'use client';

import { TrendingUp, DollarSign, Newspaper, AlertTriangle, Brain } from 'lucide-react';

interface AgentDebateProps {
  symbol: string;
  technical: { summary: string; score?: number; trend?: string; momentum?: string };
  fundamental: { summary: string; score?: number; valuation?: string };
  sentiment: { summary: string; score?: number; overall_sentiment?: string };
  risk: { summary: string; risk_level?: string; key_risks?: string[] };
  direction: string;
}

const agentProfiles = {
  technical: { name: 'Technical Analyst', icon: TrendingUp, color: '#3b82f6', emoji: '' },
  fundamental: { name: 'Fundamental Analyst', icon: DollarSign, color: '#10b981', emoji: '' },
  sentiment: { name: 'Sentiment Analyst', icon: Newspaper, color: '#f59e0b', emoji: '' },
  risk: { name: 'Risk Assessor', icon: AlertTriangle, color: '#ef4444', emoji: '' },
  coordinator: { name: 'Coordinator', icon: Brain, color: '#8b5cf6', emoji: '' },
};

function getStance(score: number | undefined, label?: string): 'bullish' | 'bearish' | 'neutral' {
  if (label === 'bullish' || label === 'positive') return 'bullish';
  if (label === 'bearish' || label === 'negative') return 'bearish';
  if (score === undefined) return 'neutral';
  if (score >= 60) return 'bullish';
  if (score <= 40) return 'bearish';
  return 'neutral';
}

function stanceColor(stance: string) {
  if (stance === 'bullish') return 'text-emerald-400';
  if (stance === 'bearish') return 'text-red-400';
  return 'text-amber-400';
}

function stanceLabel(stance: string) {
  if (stance === 'bullish') return 'Bullish';
  if (stance === 'bearish') return 'Bearish';
  return 'Neutral';
}

export default function AgentDebate({ symbol, technical, fundamental, sentiment, risk, direction }: AgentDebateProps) {
  const techStance = getStance(technical.score, technical.trend);
  const fundStance = getStance(fundamental.score, fundamental.valuation === 'undervalued' ? 'bullish' : fundamental.valuation === 'overvalued' ? 'bearish' : undefined);
  const sentStance = getStance(sentiment.score, sentiment.overall_sentiment);
  const riskStance = risk.risk_level === 'HIGH' ? 'bearish' as const : risk.risk_level === 'LOW' ? 'bullish' as const : 'neutral' as const;

  // Build debate messages
  const messages = [
    {
      agent: 'coordinator',
      text: `Let's analyze ${symbol}. Each agent will present their findings. Technical Analyst, what are the charts telling us?`,
    },
    {
      agent: 'technical',
      stance: techStance,
      text: technical.summary + (technical.trend ? ` The trend is ${technical.trend}.` : '') + (technical.momentum ? ` Momentum is ${technical.momentum}.` : ''),
      score: technical.score,
    },
    {
      agent: 'coordinator',
      text: `Score: ${technical.score}/100. ${techStance === 'bullish' ? 'Technical indicators are favorable.' : techStance === 'bearish' ? 'Charts show concerning patterns.' : 'Mixed technical signals.'} Fundamental Analyst, what about the financials?`,
    },
    {
      agent: 'fundamental',
      stance: fundStance,
      text: fundamental.summary + (fundamental.valuation ? ` Valuation appears ${fundamental.valuation}.` : ''),
      score: fundamental.score,
    },
    {
      agent: 'coordinator',
      text: `Score: ${fundamental.score}/100. ${fundStance === techStance ? 'This aligns with the technical view.' : 'Interesting — a different perspective from technicals.'} Sentiment Analyst, what\'s the market mood?`,
    },
    {
      agent: 'sentiment',
      stance: sentStance,
      text: sentiment.summary + (sentiment.overall_sentiment ? ` Overall sentiment is ${sentiment.overall_sentiment}.` : ''),
      score: sentiment.score,
    },
    {
      agent: 'coordinator',
      text: `Score: ${sentiment.score}/100. Risk Assessor, what should we watch out for?`,
    },
    {
      agent: 'risk',
      stance: riskStance,
      text: risk.summary + (risk.key_risks && risk.key_risks.length > 0 ? ` Key risks: ${risk.key_risks.slice(0, 2).join('; ')}.` : ''),
    },
  ];

  // Add consensus message
  const stances = [techStance, fundStance, sentStance, riskStance];
  const bullishCount = stances.filter(s => s === 'bullish').length;
  const bearishCount = stances.filter(s => s === 'bearish').length;

  let consensusText: string;
  if (bullishCount >= 3) {
    consensusText = `Strong consensus: ${bullishCount} out of 4 agents see bullish signals. The data broadly supports a positive outlook for ${symbol}.`;
  } else if (bearishCount >= 3) {
    consensusText = `Strong consensus: ${bearishCount} out of 4 agents see bearish signals. The data broadly suggests caution for ${symbol}.`;
  } else if (bullishCount === bearishCount) {
    consensusText = `The agents are split — ${bullishCount} bullish, ${bearishCount} bearish, ${4 - bullishCount - bearishCount} neutral. This suggests mixed signals for ${symbol}, warranting closer examination.`;
  } else {
    consensusText = `Moderate consensus: ${bullishCount} bullish, ${bearishCount} bearish, ${4 - bullishCount - bearishCount} neutral. The overall lean is ${bullishCount > bearishCount ? 'positive' : 'cautious'} for ${symbol}.`;
  }

  messages.push({
    agent: 'coordinator',
    text: consensusText + ' Remember: this is educational analysis, not investment advice.',
  });

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Agent Debate</h3>
      <p className="text-xs mb-5" style={{ color: 'var(--text-dimmed)' }}>Watch the 6 AI agents discuss their findings on {symbol}</p>

      {/* Consensus Bar */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-divider)' }}>
        <div className="flex gap-1">
          {stances.map((s, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : s === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}
            >
              {s === 'bullish' ? '+' : s === 'bearish' ? '-' : '~'}
            </div>
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {bullishCount} Bullish &middot; {bearishCount} Bearish &middot; {4 - bullishCount - bearishCount} Neutral
        </span>
      </div>

      {/* Chat Messages */}
      <div className="space-y-4">
        {messages.map((msg, i) => {
          const profile = agentProfiles[msg.agent as keyof typeof agentProfiles];
          const Icon = profile.icon;
          const isCoordinator = msg.agent === 'coordinator';
          const stance = 'stance' in msg ? msg.stance : undefined;

          return (
            <div key={i} className={`flex gap-3 ${isCoordinator ? 'pl-0' : 'pl-6'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${profile.color}20`, border: `1px solid ${profile.color}40` }}
              >
                <Icon className="w-4 h-4" style={{ color: profile.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: profile.color }}>{profile.name}</span>
                  {stance && (
                    <span className={`text-xs font-medium ${stanceColor(stance)}`}>
                      {stanceLabel(stance)}
                    </span>
                  )}
                  {'score' in msg && msg.score !== undefined && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-badge)', color: 'var(--text-muted)' }}>
                      {msg.score}/100
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: isCoordinator ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
