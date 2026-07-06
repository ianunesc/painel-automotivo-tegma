'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  PERIOD_OPTIONS, anosDisponiveis, isPartial, differentDuration,
  defaultComparison, readPeriodParams, type PeriodCode,
} from '@/lib/periods';

export default function PeriodSelector({ latestMonth }: { latestMonth: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const anoAtual = parseInt(latestMonth.slice(0, 4), 10);
  const { pCode, pYear, cCode, cYear } = readPeriodParams(
    Object.fromEntries(searchParams.entries()),
    latestMonth
  );

  function update(next: Partial<{ pCode: string; pYear: number; cCode: string; cYear: number }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.pCode !== undefined) params.set('pCode', next.pCode);
    if (next.pYear !== undefined) params.set('pYear', String(next.pYear));
    if (next.cCode !== undefined) params.set('cCode', next.cCode);
    if (next.cYear !== undefined) params.set('cYear', String(next.cYear));
    router.push(`${pathname}?${params.toString()}`);
  }

  function mudarAnalisePeriodo(code: string) {
    const def = defaultComparison(code as PeriodCode, pYear);
    const params = new URLSearchParams(searchParams.toString());
    params.set('pCode', code);
    params.set('cCode', def.code);
    params.set('cYear', String(def.year));
    router.push(`${pathname}?${params.toString()}`);
  }

  function mudarAnaliseAno(year: number) {
    const def = defaultComparison(pCode, year);
    const params = new URLSearchParams(searchParams.toString());
    params.set('pYear', String(year));
    params.set('cCode', def.code);
    params.set('cYear', String(def.year));
    router.push(`${pathname}?${params.toString()}`);
  }

  const parcial = isPartial(pCode, pYear, latestMonth);
  const duracaoDiferente = differentDuration(pCode, cCode);
  const anos = anosDisponiveis(anoAtual);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
      <Campo label="Período">
        <select value={pCode} onChange={(e) => mudarAnalisePeriodo(e.target.value)} className="selectPeriodo">
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
      </Campo>
      <Campo label="Ano">
        <select value={pYear} onChange={(e) => mudarAnaliseAno(parseInt(e.target.value, 10))} className="selectPeriodo">
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Campo>

      <div className="mx-1 hidden text-text-muted sm:block">vs</div>

      <Campo label="Comparar — período">
        <select value={cCode} onChange={(e) => update({ cCode: e.target.value })} className="selectPeriodo">
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
      </Campo>
      <Campo label="Comparar — ano">
        <select value={cYear} onChange={(e) => update({ cYear: parseInt(e.target.value, 10) })} className="selectPeriodo">
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Campo>

      {(parcial || duracaoDiferente) && (
        <div className="basis-full text-xs text-tegma-orange-dark">
          {parcial && <p>Período em andamento — dados até {latestMonth}.</p>}
          {duracaoDiferente && (
            <p>Os períodos comparados têm durações diferentes — a comparação de valores absolutos fica distorcida.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-secondary">
      {label}
      {children}
    </label>
  );
}
