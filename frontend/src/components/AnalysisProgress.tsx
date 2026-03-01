'use client';

import { Database, TrendingUp, DollarSign, Newspaper, AlertTriangle, GitMerge } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  data_collector: <Database className="w-5 h-5" />,
  technical: <TrendingUp className="w-5 h-5" />,
  fundamental: <DollarSign className="w-5 h-5" />,
  sentiment: <Newspaper className="w-5 h-5" />,
  risk: <AlertTriangle className="w-5 h-5" />,
  coordinator: <GitMerge className="w-5 h-5" />,
};

const labels: Record<string, string> = {
  data_collector: 'Data Collector',
  technical: 'Technical',
  fundamental: 'Fundamental',
  sentiment: 'Sentiment',
  risk: 'Risk',
  coordinator: 'Coordinator',
};

export default function AnalysisProgress({ progress, activeAgents }: { progress: string[]; activeAgents: string[] }) {
  const agents = ['data_collector', 'technical', 'fundamental', 'sentiment', 'risk', 'coordinator'];
  return (
    <div className="max-w-4xl mx-auto mb-10 rounded-2xl bg-slate-800/60 border border-slate-600/60 overflow-hidden">
      <div className="p-4 border-b border-slate-600/60">
        <h3 className="font-semibold text-slate-200 mb-3">Active agents</h3>
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <div key={agent} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${activeAgents.includes(agent) ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' : 'bg-slate-700/50 text-slate-400 border border-slate-600'}`}>
              {icons[agent]}
              {labels[agent]}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto">
        <h3 className="font-semibold text-slate-200 mb-2">Log</h3>
        <div className="font-mono text-xs text-slate-400 space-y-1">
          {progress.map((msg, i) => <div key={i} className="truncate">{msg}</div>)}
        </div>
      </div>
    </div>
  );
}
