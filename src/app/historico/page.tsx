import { fetchLatestMonth, fetchMonthlyValues, fetchBusinessDays } from '@/lib/data';
import HistoricoControls from '@/components/HistoricoControls';
import { shiftPeriod, labelForShiftedPeriod, isPartial as isPartialRange, readHistoricoParams } from '@/lib/periods';
import { INDICATOR_META, INDICATOR_ORDER } from '@/lib/indicators';
import { buildSeriesMap, buildDiasUteisMap, computePeriodValues } from '@/lib/compute';
import { heatColor, heatTextColor } from '@/lib/heatColor';
import ExportExcelButton from '@/components/ExportExcelButton';

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const latestMonth = await fetchLatestMonth();
  const { hCode, hYear, hN } = readHistoricoParams(sp, latestMonth);

  // Colunas do mais antigo (k=hN) ao mais recente (k=0), filtrando períodos que ainda não começaram.
  const colunas = Array.from({ length: hN + 1 }, (_, i) => hN - i)
    .map((k) => ({ k, ...shiftPeriod(hCode, hYear, k) }))
    .filter((c) => c.start >= '2015-01');

  const start = colunas[0]?.start ?? shiftPeriod(hCode, hYear, hN).start;
  const end = colunas[colunas.length - 1]?.end ?? shiftPeriod(hCode, hYear, 0).end;

  const [monthly, businessDays] = await Promise.all([
    fetchMonthlyValues(INDICATOR_ORDER, start, end),
    fetchBusinessDays(start, end),
  ]);

  const byIndicator = buildSeriesMap(monthly);
  const diasUteis = buildDiasUteisMap(businessDays);

  // Licenciamento por dia útil entra logo abaixo do licenciamento
  const linhasDef = INDICATOR_ORDER.flatMap((ind) => {
    const linha = { key: ind as 'licenciamento_dia_util' | typeof ind, label: INDICATOR_META[ind].label, decimals: INDICATOR_META[ind].decimals };
    return ind === 'licenciamento'
      ? [linha, { key: 'licenciamento_dia_util' as const, label: 'Licenciamento por dia útil', decimals: 2 }]
      : [linha];
  });

  const colunasComputadas = colunas.map((c) => ({
    ...c,
    label: labelForShiftedPeriod(hCode, c.start),
    parcial: isPartialRange(hCode, parseInt(c.start.slice(0, 4), 10), latestMonth) && c.k === 0,
    valores: computePeriodValues(byIndicator, diasUteis, c.start, c.end),
  }));

  const linhas = linhasDef.map((def) => {
    const valores = colunasComputadas.map((c) => c.valores[def.key]);
    const disponiveis = valores.filter((v): v is number => v !== null);
    const min = disponiveis.length ? Math.min(...disponiveis) : 0;
    const max = disponiveis.length ? Math.max(...disponiveis) : 1;
    return { ...def, valores, min, max };
  });

  const exportRows = linhas.map((l) => {
    const row: Record<string, string | number> = { Indicador: l.label };
    colunasComputadas.forEach((c, i) => { row[c.label] = l.valores[i] ?? ''; });
    return row;
  });

  const nColunas = colunasComputadas.length;
  const fontSize = nColunas > 10 ? '11px' : '12.5px';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Análise histórica — mapa de calor</h1>
        <p className="text-sm text-text-muted">Escala de cor calculada por linha (cada indicador na própria régua mín–máx).</p>
      </div>

      <HistoricoControls latestMonth={latestMonth} />

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-tegma-dark">
            {labelForShiftedPeriod(hCode, colunasComputadas[colunasComputadas.length - 1]?.start ?? start)}
            {' '}e {hN} períodos anteriores
          </h2>
          <ExportExcelButton filename="historico" rows={exportRows} fonte="Anfavea, Banco Central (SGS)" />
        </div>

        <table className="w-full border-separate" style={{ borderSpacing: 2, fontSize }}>
          <thead>
            <tr>
              <th className="min-w-[150px] py-1 text-left text-text-secondary">Indicador</th>
              {colunasComputadas.map((c, i) => (
                <th key={c.k} className="px-1 py-1 text-center font-normal text-text-secondary" style={{ fontWeight: i === nColunas - 1 ? 500 : 400, color: i === nColunas - 1 ? 'var(--foreground)' : undefined }}>
                  {c.label}{c.parcial ? '*' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.key}>
                <td className="py-1 pr-2 text-foreground">{l.label}</td>
                {l.valores.map((v, i) => {
                  if (v === null) {
                    return <td key={i} className="rounded text-center text-text-muted">—</td>;
                  }
                  const t = l.max === l.min ? 0.5 : (v - l.min) / (l.max - l.min);
                  return (
                    <td
                      key={i}
                      className="rounded px-1 py-1 text-center"
                      style={{ background: heatColor(t), color: heatTextColor(t) }}
                    >
                      {v.toLocaleString('pt-BR', { minimumFractionDigits: l.decimals, maximumFractionDigits: l.decimals })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <span>Menor</span>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
              <div key={t} style={{ width: 16, background: heatColor(t) }} />
            ))}
          </div>
          <span>Maior</span>
          {colunasComputadas.some((c) => c.parcial) && (
            <span className="ml-3 text-text-muted">* período em andamento — dados até {latestMonth}</span>
          )}
        </div>
      </div>
    </div>
  );
}
