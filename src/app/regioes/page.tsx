import { fetchLatestMonth, fetchRegionSales } from '@/lib/data';
import { readPeriodParams, monthRange, periodLabel, monthsBetween, shiftMonth, mesLabel } from '@/lib/periods';
import { REGIOES } from '@/lib/indicators';
import { sumByKey, pctDelta } from '@/lib/compute';
import PeriodSelector from '@/components/PeriodSelector';
import RegionStackedArea from '@/components/RegionStackedArea';
import ExportExcelButton from '@/components/ExportExcelButton';

export default async function RegioesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const latestMonth = await fetchLatestMonth();
  const { pCode, pYear, cCode, cYear } = readPeriodParams(sp, latestMonth);

  const rangeA = monthRange(pCode, pYear, latestMonth);
  const rangeB = monthRange(cCode, cYear, latestMonth);
  const labelA = periodLabel(pCode, pYear, latestMonth);
  const labelB = periodLabel(cCode, cYear, latestMonth);
  const trend12Start = shiftMonth(latestMonth, -11);
  const start = [rangeA.start, rangeB.start, trend12Start].sort()[0];
  const end = [rangeA.end, rangeB.end, latestMonth].sort().reverse()[0];

  const rows = await fetchRegionSales(start, end);

  const mesesA = monthsBetween(rangeA.start, rangeA.end);
  const mesesB = monthsBetween(rangeB.start, rangeB.end);
  const totalsA = sumByKey(rows, 'region', mesesA);
  const totalsB = sumByKey(rows, 'region', mesesB);
  const totalA = [...totalsA.values()].reduce((a, b) => a + b, 0);
  const totalB = [...totalsB.values()].reduce((a, b) => a + b, 0);

  const linhas = REGIOES.map((regiao) => {
    const unitsA = totalsA.get(regiao) ?? 0;
    const unitsB = totalsB.get(regiao) ?? 0;
    const shareA = totalA > 0 ? unitsA / totalA : 0;
    const shareB = totalB > 0 ? unitsB / totalB : 0;
    return { regiao, unitsA, unitsB, shareA, shareB, deltaUnits: pctDelta(unitsA, unitsB), deltaShare: shareA - shareB };
  });

  const meses12 = Array.from({ length: 12 }, (_, i) => shiftMonth(latestMonth, i - 11));
  const byMonthRegion = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const m = r.ref_month.slice(0, 7);
    if (!byMonthRegion.has(m)) byMonthRegion.set(m, new Map());
    byMonthRegion.get(m)!.set(r.region, r.units);
  }
  const trendData = meses12.map((m) => {
    const map = byMonthRegion.get(m);
    return {
      mes: mesLabel(m),
      Norte: Math.round(map?.get('Norte') ?? 0),
      Nordeste: Math.round(map?.get('Nordeste') ?? 0),
      'Centro-Oeste': Math.round(map?.get('Centro-Oeste') ?? 0),
      Sudeste: Math.round(map?.get('Sudeste') ?? 0),
      Sul: Math.round(map?.get('Sul') ?? 0),
    };
  });

  const exportRows = linhas.map((l) => ({
    Região: l.regiao,
    [`Unidades — ${labelA}`]: Math.round(l.unitsA),
    [`Unidades — ${labelB}`]: Math.round(l.unitsB),
    [`Share — ${labelA} (%)`]: Math.round(l.shareA * 1000) / 10,
    [`Share — ${labelB} (%)`]: Math.round(l.shareB * 1000) / 10,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Vendas por região</h1>
        <p className="text-sm text-text-muted">Fonte: Fenabrave · absoluto e share por região do Brasil</p>
      </div>

      <PeriodSelector latestMonth={latestMonth} />

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-tegma-dark">{labelA} vs {labelB}</h2>
          <ExportExcelButton filename="regioes" rows={exportRows} fonte="Fenabrave" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="py-2">Região</th>
              <th className="py-2 text-right">Unidades — {labelA}</th>
              <th className="py-2 text-right">Share</th>
              <th className="py-2 text-right">Unidades — {labelB}</th>
              <th className="py-2 text-right">Share</th>
              <th className="py-2 text-right">Δ volume</th>
              <th className="py-2 text-right">Δ share (p.p.)</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const corVol = l.deltaUnits === null ? 'text-text-muted' : l.deltaUnits > 0 ? 'text-success' : 'text-danger';
              const corShare = Math.abs(l.deltaShare) < 0.0005 ? 'text-text-muted' : l.deltaShare > 0 ? 'text-success' : 'text-danger';
              return (
                <tr key={l.regiao} className="border-b border-border last:border-0">
                  <td className="py-2 text-foreground">{l.regiao}</td>
                  <td className="py-2 text-right">{Math.round(l.unitsA).toLocaleString('pt-BR')}</td>
                  <td className="py-2 text-right text-text-secondary">{(l.shareA * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right">{Math.round(l.unitsB).toLocaleString('pt-BR')}</td>
                  <td className="py-2 text-right text-text-secondary">{(l.shareB * 100).toFixed(1)}%</td>
                  <td className={`py-2 text-right ${corVol}`}>{l.deltaUnits === null ? '—' : `${l.deltaUnits > 0 ? '+' : ''}${(l.deltaUnits * 100).toFixed(1)}%`}</td>
                  <td className={`py-2 text-right ${corShare}`}>{`${l.deltaShare > 0 ? '+' : ''}${(l.deltaShare * 100).toFixed(2)} p.p.`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-tegma-dark">Evolução regional — últimos 12 meses</h2>
        <RegionStackedArea data={trendData} />
      </div>
    </div>
  );
}
