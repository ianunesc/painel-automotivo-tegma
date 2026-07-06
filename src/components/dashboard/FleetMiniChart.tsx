'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type FleetPoint = { ano: number; frota: number | null; idade: number | null };

export default function FleetMiniChart({ data }: { data: FleetPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="ano" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={32} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={28} />
        <Tooltip wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="frota" name="Frota (mi)" fill="var(--tegma-orange-xlight)" stroke="var(--tegma-orange)" isAnimationActive={false} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="idade"
          name="Idade média (anos)"
          stroke="var(--tegma-blue)"
          strokeWidth={2}
          dot={{ r: 2 }}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
