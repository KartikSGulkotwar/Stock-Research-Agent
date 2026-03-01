'use client';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', dot: '#10b981' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', dot: '#f59e0b' },
  danger: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', dot: '#ef4444' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', dot: '#60a5fa' },
  neutral: { bg: 'var(--bg-badge)', text: 'var(--text-muted)', dot: 'var(--text-dimmed)' },
};

export default function Badge({ variant, children, dot, size = 'sm' }: BadgeProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{ background: s.bg, color: s.text }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      )}
      {children}
    </span>
  );
}
