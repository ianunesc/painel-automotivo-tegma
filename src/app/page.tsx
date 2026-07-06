import {
  fetchMonthlyValues, fetchBusinessDays, fetchRegionSales, fetchBrandSales,
  fetchAnnualValues, fetchLatestMonth,
} from '@/lib/data';
import { shiftMonth, mesLabel } from '@/lib/periods';
import { INDICATOR_META, INDICATOR_ORDER, aggregateLicPorDiaUtil, type Indicator } from '@/lib/indicators';
import IndicatorCard from '@/components/dashboard/IndicatorCard';
import MarketTrendChart from '@/components/dashboard/MarketTrendChart';
import CreditChart from '@/components/dashboard/CreditChart';
import RegionDonut from '@/components/dashboard/RegionDonut';
import BrandMiniRanking from '@/components/dashboard/BrandMiniRanking';
import FleetSection from '@/components/dashboard/FleetSection';
import FleetMiniChart from '@/components/dashboard/FleetMiniChart';

function toYm(dateStr: string) {
  return dateStr.slice(0, 7);
}

export default async function DashboardPage() {
  const latestMonth = await fetchLatestMonth();
  const start = shiftMonth(latestMonth, -12);
  const prevYearMonth = shiftMonth(latestMonth, -12);

  const [monthly, businessDays, regionSales, brandSales, annual] = await Promise.all([
    fetchMonthlyValues(INDICATOR_ORDER, start, latestMonth),
    fetchBusinessDays(start, latestMonth),
    fetchRegionSales(latestMonth, latestMonth),
    fetchBrandSales(latestMonth, latestMonth),
    fetchAnnualValues(['frota_circulante', 'idade_media_frota']),
  ]);

  const byIndicator = new Map<Indicator, Map<string, number>>();
  for (const row of monthly) {
    if (!byIndicator.has(row.indicator)) byIndicator.set(row.indicator, new Map());
    byIndicator.get(row.indicator)!.set(toYm(row.ref_month), row.value);
  }

  const diasUteisMap = new Map(businessDays.map((b) => [toYm(b.ref_month), b.dias_uteis]));

  function delta(indicator: Indicator) {
    const serie = byIndicator.get(indicator);
    const atual = serie?.get(latestMonth) ?? null;
    const anterior = serie?.get(prevYearMonth) ?? null;
    if (atual === null || anterior === null || anterior === 0) return { atual, delta: null };
    return { atual, delta: (atual - anterior) / anterior };
  }

  const meses12 = Array.from({ length: 12 }, (_, i) => shiftMonth(latestMonth, i - 11));

  const trendData = meses12.map((m) => ({
    mes: mesLabel(m),
    licenciamento: byIndicator.get('licenciamento')?.get(m) ?? null,
    producao: byIndicator.get('producao')?.get(m) ?? null,
    exportacao: byIndicator.get('exportacao')?.get(m) ?? null,
  }));

  const creditData = meses12.map((m) => ({
    mes: mesLabel(m),
    saldo: byIndicator.get('credito_saldo')?.get(m) ?? null,
    juros: byIndicator.get('credito_juros')?.get(m) ?? null,
    inadimplencia: byIndicator.get('credito_inadimplencia')?.get(m) ?? null,
  }));

  const licAtual = byIndicator.get('licenciamento')?.get(latestMonth) ?? null;
  const licAnterior = byIndicator.get('licenciamento')?.get(prevYearMonth) ?? null;
  const diasAtual = diasUteisMap.get(latestMonth);
  const diasAnterior = diasUteisMap.get(prevYearMonth);
  const licPorDiaAtual = licAtual !== null && diasAtual ? aggregateLicPorDiaUtil([licAtual], [diasAtual]) : null;
  const licPorDiaAnterior = licAnterior !== null && diasAnterior ? aggregateLicPorDiaUtil([licAnterior], [diasAnterior]) : null;
  const licPorDiaDelta = licPorDiaAtual !== null && licPorDiaAnterior ? (licPorDiaAtual - licPorDiaAnterior) / licPorDiaAnterior : null;

  const anosFrota = [...new Set(annual.map((a) => a.ref_year))].sort((a, b) => b - a);
  const ultimoAnoFrota = anosFrota[0] ?? null;
  const frotaValor = annual.find((a) => a.indicator === 'frota_circulante' && a.ref_year === ultimoAnoFrota)?.value ?? null;
  const idadeValor = annual.find((a) => a.indicator === 'idade_media_frota' && a.ref_year === ultimoAnoFrota)?.value ?? null;

  const anosFrotaAsc = [...anosFrota].sort((a, b) => a - b);
  const frotaHistorico = anosFrotaAsc.map((ano) => ({
    ano,
    frota: annual.find((a) => a.indicator === 'frota_circulante' && a.ref_year === ano)?.value ?? null,
    idade: annual.find((a) => a.indicator === 'idade_media_frota' && a.ref_year === ano)?.value ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Dashboard</h1>
        <p className="text-sm text-text-muted">Último mês disponível: {mesLabel(latestMonth)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {INDICATOR_ORDER.map((ind) => {
          const meta = INDICATOR_META[ind];
          const { atual, delta: d } = delta(ind);
          return (
            <IndicatorCard
              key={ind}
              label={meta.label}
              value={atual}
              unit={meta.unit}
              decimals={meta.decimals}
              deltaPct={d}
              mesReferencia={mesLabel(latestMonth)}
            />
          );
        })}
        <IndicatorCard
          label="Licenciamento por dia útil"
          value={licPorDiaAtual}
          unit="mil un./dia"
          decimals={2}
          deltaPct={licPorDiaDelta}
          mesReferencia={mesLabel(latestMonth)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 text-sm font-medium text-tegma-dark">Mercado — últimos 12 meses</h2>
          <MarketTrendChart data={trendData} />
        </section>
        <section className="card">
          <h2 className="mb-2 text-sm font-medium text-tegma-dark">Crédito PF — aquisição de veículos</h2>
          <CreditChart data={creditData} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card">
          <h2 className="mb-2 text-sm font-medium text-tegma-dark">Share por região</h2>
          <RegionDonut data={regionSales.map((r) => ({ region: r.region, sharePct: r.share_pct }))} />
        </section>
        <section className="card">
          <h2 className="mb-2 text-sm font-medium text-tegma-dark">Top montadoras — licenciamento</h2>
          <BrandMiniRanking data={brandSales} />
        </section>
        <section className="card">
          <h2 className="mb-2 text-sm font-medium text-tegma-dark">Frota</h2>
          <FleetSection frota={frotaValor} idadeMedia={idadeValor} ano={ultimoAnoFrota} />
          <div className="mt-2">
            <FleetMiniChart data={frotaHistorico} />
          </div>
        </section>
      </div>
    </div>
  );
}
