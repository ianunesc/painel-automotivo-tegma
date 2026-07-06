import { fetchMonthlyValues, fetchBusinessDays, fetchLatestMonth } from '@/lib/data';
import { shiftMonth } from '@/lib/periods';
import { INDICATOR_META, INDICATOR_ORDER } from '@/lib/indicators';
import EditableGrid from '@/components/admin/EditableGrid';
import { salvarValorMensal, salvarDiasUteis } from './actions';

export default async function EditarPage() {
  const latestMonth = await fetchLatestMonth();
  const start = shiftMonth(latestMonth, -11);
  const meses = Array.from({ length: 12 }, (_, i) => shiftMonth(latestMonth, i - 11));

  const [monthly, businessDays] = await Promise.all([
    fetchMonthlyValues(INDICATOR_ORDER, start, latestMonth),
    fetchBusinessDays(start, latestMonth),
  ]);

  const byIndicator = new Map<string, Map<string, number>>();
  for (const row of monthly) {
    if (!byIndicator.has(row.indicator)) byIndicator.set(row.indicator, new Map());
    byIndicator.get(row.indicator)!.set(row.ref_month.slice(0, 7), row.value);
  }
  const linhasIndicadores = INDICATOR_ORDER.map((ind) => ({
    key: ind,
    label: INDICATOR_META[ind].label,
    decimals: INDICATOR_META[ind].decimals,
    valores: meses.map((m) => byIndicator.get(ind)?.get(m) ?? null),
  }));

  const diasMap = new Map(businessDays.map((b) => [b.ref_month.slice(0, 7), b.dias_uteis]));
  const linhaDias = [{
    key: 'dias_uteis',
    label: 'Dias úteis',
    decimals: 0,
    valores: meses.map((m) => diasMap.get(m) ?? null),
  }];

  async function salvarDiasWrapper(_rowKey: string, mes: string, valor: number) {
    'use server';
    await salvarDiasUteis(`${mes}-01`, valor);
  }

  async function salvarIndicadorWrapper(rowKey: string, mes: string, valor: number) {
    'use server';
    await salvarValorMensal(rowKey, `${mes}-01`, valor);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Editar dados</h1>
        <p className="text-sm text-text-muted">Últimos 12 meses. Para editar meses mais antigos, peça para carregar um período específico.</p>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-tegma-dark">Indicadores mensais</h2>
        <EditableGrid meses={meses} linhas={linhasIndicadores} onSave={salvarIndicadorWrapper} />
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-medium text-tegma-dark">Dias úteis</h2>
        <EditableGrid meses={meses} linhas={linhaDias} onSave={salvarDiasWrapper} />
      </div>
    </div>
  );
}
