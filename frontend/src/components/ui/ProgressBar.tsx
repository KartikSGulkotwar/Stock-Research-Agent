'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({ value, max = 100, color, height = 8, showLabel, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const autoColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const barColor = color || autoColor;

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>}
          {showLabel && <span className="text-xs font-medium" style={{ color: barColor }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: `${height}px`, background: 'var(--bg-input)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          }}
        />
      </div>
    </div>
  );
}
