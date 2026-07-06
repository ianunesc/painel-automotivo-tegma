'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type CreditPoint = { mes: string; saldo: number | null; juros: number | null; inadimplencia: number | null };

export default function CreditChart({ data }: { data: CreditPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'R$ bi', angle: -90, position: 'insideLeft', fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="saldo" name="Saldo de crédito (R$ bi)" fill="var(--tegma-orange-xlight)" stroke="var(--tegma-orange)" />
        <Line yAxisId="right" type="monotone" dataKey="juros" name="Taxa de juros (%)" stroke="var(--tegma-blue)" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="inadimplencia" name="Inadimplência (%)" stroke="var(--danger)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
