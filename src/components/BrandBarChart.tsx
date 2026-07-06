'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BrandBarChart({ data }: { data: { brand: string; units: number }[] }) {
  const top10 = [...data].filter((d) => d.brand !== 'Outras').sort((a, b) => b.units - a.units).slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top10} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="brand" tick={{ fontSize: 12 }} width={110} />
        <Tooltip formatter={(v) => Number(v).toLocaleString('pt-BR')} />
        <Bar dataKey="units" fill="var(--tegma-blue)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
