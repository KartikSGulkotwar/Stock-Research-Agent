'use client';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export default function SparklineChart({ data, width = 120, height = 32, color, showArea = true }: SparklineChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUp = data[data.length - 1] >= data[0];
  const lineColor = color || (isUp ? '#10b981' : '#ef4444');

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {showArea && (
        <path d={areaD} fill={lineColor} fillOpacity="0.1" />
      )}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={lineColor} />
    </svg>
  );
}
