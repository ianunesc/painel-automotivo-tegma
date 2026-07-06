import { createClient } from '@/lib/supabase/server';
import type { Indicator } from '@/lib/indicators';

function toDate(ym: string): string {
  return `${ym}-01`;
}

export async function fetchMonthlyValues(indicators: Indicator[], start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('monthly_values')
    .select('indicator, ref_month, value')
    .in('indicator', indicators)
    .gte('ref_month', toDate(start))
    .lte('ref_month', toDate(end))
    .order('ref_month', { ascending: true });
  if (error) throw error;
  return data as { indicator: Indicator; ref_month: string; value: number }[];
}

export async function fetchBrandSales(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('brand_sales')
    .select('ref_month, brand, units')
    .gte('ref_month', toDate(start))
    .lte('ref_month', toDate(end));
  if (error) throw error;
  return data as { ref_month: string; brand: string; units: number }[];
}

export async function fetchRegionSales(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('region_sales')
    .select('ref_month, region, share_pct, units')
    .gte('ref_month', toDate(start))
    .lte('ref_month', toDate(end));
  if (error) throw error;
  return data as { ref_month: string; region: string; share_pct: number; units: number }[];
}

export async function fetchAnnualValues(indicators: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('annual_values')
    .select('indicator, ref_year, value')
    .in('indicator', indicators)
    .order('ref_year', { ascending: true });
  if (error) throw error;
  return data as { indicator: string; ref_year: number; value: number | null }[];
}

export async function fetchBusinessDays(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('business_days')
    .select('ref_month, dias_uteis')
    .gte('ref_month', toDate(start))
    .lte('ref_month', toDate(end));
  if (error) throw error;
  return data as { ref_month: string; dias_uteis: number }[];
}

/** Mês mais recente com dado de licenciamento — usado para saber o que é "parcial". */
export async function fetchLatestMonth(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('monthly_values')
    .select('ref_month')
    .eq('indicator', 'licenciamento')
    .order('ref_month', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return new Date().toISOString().slice(0, 7);
  return (data[0].ref_month as string).slice(0, 7);
}

/** Última data de atualização por fonte, para o rodapé de fontes. */
export async function fetchSourceStatus() {
  const supabase = await createClient();
  const [monthly, brand, region, annual] = await Promise.all([
    supabase.from('monthly_values').select('source, updated_at').order('updated_at', { ascending: false }),
    supabase.from('brand_sales').select('source, updated_at').order('updated_at', { ascending: false }).limit(1),
    supabase.from('region_sales').select('source, updated_at').order('updated_at', { ascending: false }).limit(1),
    supabase.from('annual_values').select('source, updated_at').order('updated_at', { ascending: false }).limit(1),
  ]);

  const bySource = new Map<string, string>();
  for (const rows of [monthly.data, brand.data, region.data, annual.data]) {
    for (const row of rows ?? []) {
      const key = row.source as string;
      const existing = bySource.get(key);
      if (!existing || row.updated_at > existing) bySource.set(key, row.updated_at as string);
    }
  }
  return bySource;
}

export async function fetchIngestLog(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingest_log')
    .select('source, ref_month, status, message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as { source: string; ref_month: string | null; status: string; message: string; created_at: string }[];
}

/** Último mês carregado por indicador — usado no painel Admin para saber o que falta atualizar. */
export async function fetchLastMonthByIndicator() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('monthly_values')
    .select('indicator, ref_month')
    .order('ref_month', { ascending: false });
  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (!map.has(row.indicator)) map.set(row.indicator, row.ref_month as string);
  }
  return map;
}
