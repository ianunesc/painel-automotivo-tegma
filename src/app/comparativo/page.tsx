import { fetchLatestMonth, fetchMonthlyValues, fetchBusinessDays } from '@/lib/data';
import { readPeriodParams, monthRange, periodLabel } from '@/lib/periods';
import { AGGREGATE_RULES_LABEL, INDICATOR_META, INDICATOR_ORDER } from '@/lib/indicators';
import { buildSeriesMap, buildDiasUteisMap, computePeriodValues, pctDelta } from '@/lib/compute';
import PeriodSelector from '@/components/PeriodSelector';
import ComparativeDeltaChart from '@/components/ComparativeDeltaChart';
import ExportExcelButton from '@/components/ExportExcelButton';

export default async function ComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const latestMonth = await fetchLatestMonth();
  const { pCode, pYear, cCode, cYear } = readPeriodParams(sp, latestMonth);

  const rangeA = monthRange(pCode, pYear);
  const rangeB = monthRange(cCode, cYear);
  const start = rangeA.start < rangeB.start ? rangeA.start : rangeB.start;
  const end = rangeA.end > rangeB.end ? rangeA.end : rangeB.end;

  const [monthly, businessDays] = await Promise.all([
    fetchMonthlyValues(INDICATOR_ORDER, start, end),
    fetchBusinessDays(start, end),
  ]);

  const byIndicator = buildSeriesMap(monthly);
  const diasUteis = buildDiasUteisMap(businessDays);

  const valuesA = computePeriodValues(byIndicator, diasUteis, rangeA.start, rangeA.end);
  const valuesB = computePeriodValues(byIndicator, diasUteis, rangeB.start, rangeB.end);

  const linhas = [
    ...INDICATOR_ORDER.map((ind) => ({
      key: ind,
      label: INDICATOR_META[ind].label,
      unit: INDICATOR_META[ind].unit,
      decimals: INDICATOR_META[ind].decimals,
      a: valuesA[ind],
      b: valuesB[ind],
    })),
    {
      key: 'licenciamento_dia_util' as const,
      label: 'Licenciamento por dia útil',
      unit: 'mil un./dia',
      decimals: 2,
      a: valuesA.licenciamento_dia_util,
      b: valuesB.licenciamento_dia_util,
    },
  ];

  const exportRows = linhas.map((l) => ({
    Indicador: l.label,
    [`${periodLabel(pCode, pYear)}`]: l.a ?? '',
    [`${periodLabel(cCode, cYear)}`]: l.b ?? '',
    'Variação (%)': l.a !== null && l.b !== null ? Math.round((pctDelta(l.a, l.b) ?? 0) * 1000) / 10 : '',
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Análise comparativa</h1>
        <p className="text-sm text-text-muted">{AGGREGATE_RULES_LABEL}</p>
      </div>

      <PeriodSelector latestMonth={latestMonth} />

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-tegma-dark">
            {periodLabel(pCode, pYear)} vs {periodLabel(cCode, cYear)}
          </h2>
          <ExportExcelButton filename="comparativo" rows={exportRows} fonte="Anfavea, Banco Central (SGS)" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="py-2">Indicador</th>
              <th className="py-2 text-right">{periodLabel(pCode, pYear)}</th>
              <th className="py-2 text-right">{periodLabel(cCode, cYear)}</th>
              <th className="py-2 text-right">Variação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const d = pctDelta(l.a, l.b);
              const cor = d === null ? 'text-text-muted' : d > 0 ? 'text-success' : d < 0 ? 'text-danger' : 'text-text-muted';
              return (
                <tr key={l.key} className="border-b border-border last:border-0">
                  <td className="py-2 text-foreground">{l.label} <span className="text-xs text-text-muted">({l.unit})</span></td>
                  <td className="py-2 text-right">{l.a === null ? '—' : l.a.toLocaleString('pt-BR', { minimumFractionDigits: l.decimals, maximumFractionDigits: l.decimals })}</td>
                  <td className="py-2 text-right">{l.b === null ? '—' : l.b.toLocaleString('pt-BR', { minimumFractionDigits: l.decimals, maximumFractionDigits: l.decimals })}</td>
                  <td className={`py-2 text-right ${cor}`}>{d === null ? '—' : `${d > 0 ? '+' : ''}${(d * 100).toFixed(1)}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-tegma-dark">Variação por indicador</h2>
        <ComparativeDeltaChart data={linhas.map((l) => ({ label: l.label, deltaPct: pctDelta(l.a, l.b) }))} />
      </div>
    </div>
  );
}
