import { monthsBetween } from './periods';
import { INDICATOR_META, aggregate, aggregateLicPorDiaUtil, INDICATOR_ORDER, type Indicator } from './indicators';

export type SeriesMap = Map<Indicator, Map<string, number>>; // indicator -> 'YYYY-MM' -> valor
export type DiasUteisMap = Map<string, number>; // 'YYYY-MM' -> dias úteis

export function buildSeriesMap(rows: { indicator: Indicator; ref_month: string; value: number }[]): SeriesMap {
  const map: SeriesMap = new Map();
  for (const row of rows) {
    if (!map.has(row.indicator)) map.set(row.indicator, new Map());
    map.get(row.indicator)!.set(row.ref_month.slice(0, 7), row.value);
  }
  return map;
}

export function buildDiasUteisMap(rows: { ref_month: string; dias_uteis: number }[]): DiasUteisMap {
  return new Map(rows.map((r) => [r.ref_month.slice(0, 7), r.dias_uteis]));
}

/** Agrega todos os indicadores mensais (+ licenciamento/dia útil) para um período (start-end). */
export function computePeriodValues(byIndicator: SeriesMap, diasUteis: DiasUteisMap, start: string, end: string) {
  const months = monthsBetween(start, end);
  const result = {} as Record<Indicator | 'licenciamento_dia_util', number | null>;

  for (const ind of INDICATOR_ORDER) {
    const serie = byIndicator.get(ind);
    const values = months.map((m) => serie?.get(m)).filter((v): v is number => v !== undefined && v !== null);
    result[ind] = values.length > 0 ? aggregate(values, INDICATOR_META[ind].rule) : null;
  }

  const licSerie = byIndicator.get('licenciamento');
  const licValues: number[] = [];
  const diasValues: number[] = [];
  for (const m of months) {
    const lic = licSerie?.get(m);
    const dias = diasUteis.get(m);
    if (lic !== undefined && lic !== null && dias) {
      licValues.push(lic);
      diasValues.push(dias);
    }
  }
  result.licenciamento_dia_util = aggregateLicPorDiaUtil(licValues, diasValues);

  return result;
}

export function pctDelta(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null || anterior === 0) return null;
  return (atual - anterior) / anterior;
}

/** Soma unidades por chave (marca ou região) dentro de um conjunto de meses. */
export function sumByKey<T extends { ref_month: string; units: number }>(
  rows: T[],
  keyField: keyof T,
  months: string[]
): Map<string, number> {
  const monthSet = new Set(months);
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!monthSet.has(row.ref_month.slice(0, 7))) continue;
    const key = String(row[keyField]);
    totals.set(key, (totals.get(key) ?? 0) + row.units);
  }
  return totals;
}
