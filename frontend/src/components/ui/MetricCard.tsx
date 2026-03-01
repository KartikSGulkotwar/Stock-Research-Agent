'use client';

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
}

export default function MetricCard({ icon: Icon, label, value, subtext, color, trend }: MetricCardProps) {
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : 'var(--text-muted)';

  return (
    <div
      className="rounded-xl p-4 transition-all card-hover"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: color ? `${color}15` : 'var(--bg-input)' }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: color || 'var(--accent)', width: '18px', height: '18px' }} />
        </div>
        {trend && (
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '━'}
          </span>
        )}
      </div>
      <p className="text-xs mb-0.5" style={{ color: 'var(--text-dimmed)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      {subtext && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtext}</p>
      )}
    </div>
  );
}
