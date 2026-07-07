import { fetchLatestMonth, fetchBrandSales } from '@/lib/data';
import { readPeriodParams, monthRange, periodLabel, monthsBetween } from '@/lib/periods';
import { sumByKey, pctDelta } from '@/lib/compute';
import PeriodSelector from '@/components/PeriodSelector';
import MontadorasTable, { type MontadoraLinha } from '@/components/MontadorasTable';
import BrandBarChart from '@/components/BrandBarChart';
import ExportExcelButton from '@/components/ExportExcelButton';

export default async function MontadorasPage({
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
  const start = rangeA.start < rangeB.start ? rangeA.start : rangeB.start;
  const end = rangeA.end > rangeB.end ? rangeA.end : rangeB.end;

  const rows = await fetchBrandSales(start, end);

  const mesesA = monthsBetween(rangeA.start, rangeA.end);
  const mesesB = monthsBetween(rangeB.start, rangeB.end);
  const totalsA = sumByKey(rows, 'brand', mesesA);
  const totalsB = sumByKey(rows, 'brand', mesesB);
  const totalGeralA = [...totalsA.values()].reduce((a, b) => a + b, 0);
  const totalGeralB = [...totalsB.values()].reduce((a, b) => a + b, 0);

  const marcas = new Set([...totalsA.keys(), ...totalsB.keys()]);
  const linhas: MontadoraLinha[] = [...marcas].map((brand) => {
    const unitsA = totalsA.get(brand) ?? 0;
    const unitsB = totalsB.get(brand) ?? 0;
    const shareA = totalGeralA > 0 ? unitsA / totalGeralA : 0;
    const shareB = totalGeralB > 0 ? unitsB / totalGeralB : 0;
    return {
      brand, unitsA, unitsB, shareA, shareB,
      deltaUnitsPct: pctDelta(unitsA, unitsB),
      deltaSharePP: shareA - shareB,
    };
  }).sort((a, b) => (a.brand === 'Outras' ? 1 : b.brand === 'Outras' ? -1 : b.unitsA - a.unitsA));

  const exportRows = linhas.map((l, i) => ({
    Posição: l.brand === 'Outras' ? '—' : i + 1,
    Marca: l.brand,
    [`Unidades — ${labelA}`]: Math.round(l.unitsA),
    [`Share — ${labelA} (%)`]: Math.round(l.shareA * 1000) / 10,
    [`Unidades — ${labelB}`]: Math.round(l.unitsB),
    'Δ volume (%)': l.deltaUnitsPct === null ? '' : Math.round(l.deltaUnitsPct * 1000) / 10,
    'Δ share (p.p.)': Math.round(l.deltaSharePP * 10000) / 100,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Vendas por montadora</h1>
        <p className="text-sm text-text-muted">Reflete apenas licenciamento (fonte: Autoo) · Top 40 + &quot;Outras&quot;</p>
      </div>

      <PeriodSelector latestMonth={latestMonth} />

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-tegma-dark">{labelA} vs {labelB}</h2>
          <ExportExcelButton filename="montadoras" rows={exportRows} fonte="Autoo (Fenabrave), Anfavea" />
        </div>
        <MontadorasTable linhas={linhas} />
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-tegma-dark">Top 10 — {labelA}</h2>
        <BrandBarChart data={linhas.map((l) => ({ brand: l.brand, units: l.unitsA }))} />
      </div>
    </div>
  );
}
