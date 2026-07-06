import Link from 'next/link';

export default function BrandMiniRanking({ data }: { data: { brand: string; units: number }[] }) {
  const top = [...data].sort((a, b) => b.units - a.units).slice(0, 10);
  const max = top[0]?.units ?? 1;

  return (
    <div className="flex flex-col gap-2">
      {top.map((m) => (
        <div key={m.brand} className="flex items-center gap-2 text-sm">
          <span className="w-28 truncate text-text-secondary">{m.brand}</span>
          <div className="h-2 flex-1 rounded bg-surface-muted">
            <div
              className="h-2 rounded bg-tegma-blue"
              style={{ width: `${Math.max(2, (m.units / max) * 100)}%` }}
            />
          </div>
          <span className="w-16 text-right text-text-muted">{m.units.toLocaleString('pt-BR')}</span>
        </div>
      ))}
      <Link href="/montadoras" className="mt-1 text-xs font-medium text-tegma-blue hover:underline">
        Ver ranking completo →
      </Link>
    </div>
  );
}
