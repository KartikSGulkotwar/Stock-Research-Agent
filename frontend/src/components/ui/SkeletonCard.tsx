'use client';

export function SkeletonLine({ width = '100%', height = '12px' }: { width?: string; height?: string }) {
  return <div className="skeleton" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="40%" height="16px" />
          <SkeletonLine width="60%" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine width="80%" />
      <div className="flex gap-3">
        <SkeletonLine width="30%" height="32px" />
        <SkeletonLine width="30%" height="32px" />
        <SkeletonLine width="30%" height="32px" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="p-4" style={{ background: 'var(--bg-input)' }}>
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} width={`${100 / cols}%`} height="14px" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="p-4 flex gap-4" style={{ borderTop: '1px solid var(--border-divider)' }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <SkeletonLine key={ci} width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetricCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="skeleton w-8 h-8 rounded-lg mx-auto mb-2" />
          <SkeletonLine width="60%" height="10px" />
          <div className="mt-2">
            <SkeletonLine width="50%" height="20px" />
          </div>
        </div>
      ))}
    </div>
  );
}
