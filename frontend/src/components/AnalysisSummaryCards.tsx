'use client';

import { BarChart3, Zap, Bot, Shield } from 'lucide-react';

interface AnalysisSummaryCardsProps {
  confidence: number;
  signalStrength: string;
  riskLevel: string;
  agentsComplete?: number;
}

export default function AnalysisSummaryCards({ confidence, signalStrength, riskLevel, agentsComplete = 6 }: AnalysisSummaryCardsProps) {
  const confidencePct = Math.round(confidence * 100);
  const confidenceColor = confidencePct >= 70 ? '#10b981' : confidencePct >= 40 ? '#f59e0b' : '#ef4444';
  const strengthLabel = signalStrength?.charAt(0).toUpperCase() + signalStrength?.slice(1) || 'Moderate';
  const strengthColor = signalStrength === 'strong' ? '#10b981' : signalStrength === 'weak' ? '#ef4444' : '#f59e0b';
  const riskColor = riskLevel === 'LOW' ? '#10b981' : riskLevel === 'HIGH' ? '#ef4444' : '#f59e0b';

  const cards = [
    { icon: BarChart3, label: 'Confidence', value: `${confidencePct}%`, color: confidenceColor, sub: confidencePct >= 70 ? 'High agreement' : confidencePct >= 40 ? 'Moderate agreement' : 'Low agreement' },
    { icon: Zap, label: 'Signal Strength', value: strengthLabel, color: strengthColor, sub: signalStrength === 'strong' ? 'Clear direction' : signalStrength === 'weak' ? 'Unclear direction' : 'Some clarity' },
    { icon: Bot, label: 'Agents Complete', value: `${agentsComplete}/6`, color: '#8b5cf6', sub: 'All agents analyzed' },
    { icon: Shield, label: 'Risk Level', value: riskLevel, color: riskColor, sub: riskLevel === 'LOW' ? 'Lower volatility' : riskLevel === 'HIGH' ? 'Higher volatility' : 'Average volatility' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl p-4 text-center animate-fadeIn stagger-${i + 1}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${card.color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{card.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dimmed)' }}>{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
