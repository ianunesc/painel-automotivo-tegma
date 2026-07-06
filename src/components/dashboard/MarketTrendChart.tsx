'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type TrendPoint = { mes: string; licenciamento: number | null; producao: number | null; exportacao: number | null };

export default function MarketTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="licenciamento" name="Licenciamento" stroke="var(--tegma-orange)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="producao" name="Produção" stroke="var(--tegma-blue)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="exportacao" name="Exportação" stroke="#8a9498" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
