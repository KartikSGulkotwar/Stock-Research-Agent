'use client';

import { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface InfoTooltipProps {
  term: string;
  brief: string;
  detail?: string;
  size?: 'sm' | 'md';
}

export default function InfoTooltip({ term, brief, detail, size = 'sm' }: InfoTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowTooltip(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="inline-flex items-center relative" ref={ref}>
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => detail && setShowModal(true)}
          className="inline-flex items-center justify-center rounded-full transition-colors"
          style={{
            width: size === 'sm' ? '14px' : '16px',
            height: size === 'sm' ? '14px' : '16px',
            color: 'var(--text-dimmed)',
          }}
          aria-label={`Info about ${term}`}
        >
          <Info style={{ width: size === 'sm' ? '12px' : '14px', height: size === 'sm' ? '12px' : '14px' }} />
        </button>

        {showTooltip && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs z-50 whitespace-normal animate-fadeIn"
            style={{
              background: 'var(--tooltip-bg)',
              border: '1px solid var(--tooltip-border)',
              color: 'var(--text-secondary)',
              minWidth: '180px',
              maxWidth: '260px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{term}</p>
            <p className="leading-relaxed">{brief}</p>
            {detail && (
              <p className="mt-1 underline cursor-pointer" style={{ color: 'var(--accent)' }}>Click for more</p>
            )}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1"
              style={{ background: 'var(--tooltip-bg)', borderRight: '1px solid var(--tooltip-border)', borderBottom: '1px solid var(--tooltip-border)' }}
            />
          </div>
        )}
      </div>

      {showModal && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-md rounded-2xl p-6 animate-scaleIn"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{term}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{brief}</p>
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>{detail}</p>
          </div>
        </div>
      )}
    </>
  );
}
