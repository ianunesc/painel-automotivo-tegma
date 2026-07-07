'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PERIOD_OPTIONS, anosDisponiveis, readHistoricoParams } from '@/lib/periods';
import { optionLabel } from '@/components/PeriodSelector';

export default function HistoricoControls({ latestMonth }: { latestMonth: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const anoAtual = parseInt(latestMonth.slice(0, 4), 10);
  const { hCode, hYear, hN } = readHistoricoParams(Object.fromEntries(searchParams.entries()), latestMonth);

  function update(next: Partial<{ hCode: string; hYear: number; hN: number }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.hCode !== undefined) params.set('hCode', next.hCode);
    if (next.hYear !== undefined) params.set('hYear', String(next.hYear));
    if (next.hN !== undefined) params.set('hN', String(next.hN));
    router.push(`${pathname}?${params.toString()}`);
  }

  const anos = anosDisponiveis(anoAtual);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        Período
        <select value={hCode} onChange={(e) => update({ hCode: e.target.value })} className="selectPeriodo">
          {PERIOD_OPTIONS.map((o) => <option key={o.code} value={o.code}>{optionLabel(o.code, o.label, latestMonth)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        Ano
        <select value={hYear} onChange={(e) => update({ hYear: parseInt(e.target.value, 10) })} className="selectPeriodo">
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        Períodos anteriores
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {[4, 8, 12].map((n) => (
            <button
              key={n}
              onClick={() => update({ hN: n })}
              className={`px-3 py-1.5 text-sm ${hN === n ? 'btnToggleActive' : 'bg-surface text-foreground hover:bg-surface-muted'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </label>
    </div>
  );
}
