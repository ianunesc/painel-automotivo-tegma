'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ComparativeDeltaChart({ data }: { data: { label: string; deltaPct: number | null }[] }) {
  const chartData = data
    .filter((d) => d.deltaPct !== null)
    .map((d) => ({ label: d.label, delta: Math.round((d.deltaPct as number) * 1000) / 10 }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 36)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={150} />
        <ReferenceLine x={0} stroke="var(--border)" />
        <Tooltip formatter={(v) => `${Number(v) > 0 ? '+' : ''}${v}%`} />
        <Bar dataKey="delta">
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.delta >= 0 ? 'var(--success)' : 'var(--danger)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
