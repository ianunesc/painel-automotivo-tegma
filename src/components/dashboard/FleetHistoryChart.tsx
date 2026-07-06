'use client';

import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type FleetPoint = { ano: number; frota: number | null; idade: number | null };

export default function FleetHistoryChart({ data }: { data: FleetPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12 }}
          label={{ value: 'mi veículos', angle: -90, position: 'insideLeft', fontSize: 11 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          label={{ value: 'anos', angle: 90, position: 'insideRight', fontSize: 11 }}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="frota"
          name="Frota circulante (mi)"
          stroke="var(--tegma-orange)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="idade"
          name="Idade média (anos)"
          stroke="var(--tegma-blue)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
