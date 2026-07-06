'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CORES = ['var(--tegma-orange)', 'var(--tegma-blue)', 'var(--tegma-orange-light)', '#8a9498', '#b34f05'];

export default function RegionDonut({ data }: { data: { region: string; sharePct: number }[] }) {
  const chartData = data.map((d) => ({ name: d.region, value: Math.round(d.sharePct * 1000) / 10 }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {chartData.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
