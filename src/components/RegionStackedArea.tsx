'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CORES: Record<string, string> = {
  Norte: 'var(--tegma-orange)',
  Nordeste: 'var(--tegma-blue)',
  'Centro-Oeste': 'var(--tegma-orange-light)',
  Sudeste: '#8a9498',
  Sul: '#b34f05',
};

export type RegionPoint = { mes: string; Norte: number; Nordeste: number; 'Centro-Oeste': number; Sudeste: number; Sul: number };

export default function RegionStackedArea({ data }: { data: RegionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {Object.keys(CORES).map((regiao) => (
          <Area key={regiao} type="monotone" dataKey={regiao} stackId="1" stroke={CORES[regiao]} fill={CORES[regiao]} fillOpacity={0.75} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
