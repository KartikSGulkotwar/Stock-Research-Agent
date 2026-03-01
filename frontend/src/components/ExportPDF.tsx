'use client';

import { Download } from 'lucide-react';

export default function ExportPDF() {
  const handleExport = () => {
    window.print();
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
      style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
    >
      <Download className="w-4 h-4" /> Export PDF
    </button>
  );
}
