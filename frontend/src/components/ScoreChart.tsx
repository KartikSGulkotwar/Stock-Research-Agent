'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ScoreChart({ technical, fundamental, sentiment }: { technical: number; fundamental: number; sentiment: number }) {
  const data = [
    { name: 'Technical', score: technical, fill: '#3b82f6' },
    { name: 'Fundamental', score: fundamental, fill: '#10b981' },
    { name: 'Sentiment', score: sentiment, fill: '#f59e0b' },
  ];
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="var(--chart-axis)" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '8px', color: 'var(--text-primary)' }} formatter={(v: number) => [v + '/100', 'Score']} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={data[i].fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
