'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CORES = ['var(--tegma-orange)', 'var(--tegma-blue)', 'var(--tegma-orange-light)', '#8a9498', '#b34f05'];

export default function RegionDonut({ data }: { data: { region: string; sharePct: number }[] }) {
  const chartData = data.map((d) => ({ name: d.region, value: Math.round(d.sharePct * 1000) / 10 }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          isAnimationActive={false}
          label={({ name, value }) => `${name} ${value}%`}
          labelLine={{ stroke: 'var(--text-muted)' }}
        >
          {chartData.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
