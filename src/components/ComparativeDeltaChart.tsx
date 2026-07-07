'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ComparativeDeltaChart({
  data,
}: {
  data: { label: string; deltaPct: number | null; inverse?: boolean }[];
}) {
  const chartData = data
    .filter((d) => d.deltaPct !== null)
    .map((d) => ({
      label: d.label,
      delta: Math.round((d.deltaPct as number) * 1000) / 10,
      inverse: d.inverse ?? false,
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 36)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={150} />
        <ReferenceLine x={0} stroke="var(--border)" />
        <Tooltip formatter={(v) => `${Number(v) > 0 ? '+' : ''}${v}%`} />
        <Bar dataKey="delta" isAnimationActive={false}>
          {chartData.map((d, i) => {
            // Para juros e inadimplência, subir é ruim: barra positiva fica vermelha
            const bom = d.inverse ? d.delta < 0 : d.delta >= 0;
            return <Cell key={i} fill={bom ? 'var(--success)' : 'var(--danger)'} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
