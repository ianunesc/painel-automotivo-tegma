import type { SupabaseClient } from '@supabase/supabase-js';

type MonthlyRow = { indicator: string; ref_month: string; value: number; source: string };

/** Faz upsert em monthly_values, preservando linhas que o Ian editou manualmente. */
export async function upsertMonthlyValuesSkipManual(supabase: SupabaseClient, rows: MonthlyRow[]) {
  if (rows.length === 0) return { salvos: 0, ignorados: 0 };

  const indicadores = [...new Set(rows.map((r) => r.indicator))];
  const meses = [...new Set(rows.map((r) => r.ref_month))];

  const { data: existentes, error: errBusca } = await supabase
    .from('monthly_values')
    .select('indicator, ref_month, edited_manually')
    .in('indicator', indicadores)
    .in('ref_month', meses);
  if (errBusca) throw errBusca;

  const editadosManualmente = new Set(
    (existentes ?? []).filter((e) => e.edited_manually).map((e) => `${e.indicator}|${e.ref_month}`)
  );
  const paraSalvar = rows.filter((r) => !editadosManualmente.has(`${r.indicator}|${r.ref_month}`));

  if (paraSalvar.length === 0) return { salvos: 0, ignorados: rows.length };

  const { error } = await supabase
    .from('monthly_values')
    .upsert(paraSalvar, { onConflict: 'indicator,ref_month' });
  if (error) throw error;

  return { salvos: paraSalvar.length, ignorados: rows.length - paraSalvar.length };
}

export async function logIngest(
  supabase: SupabaseClient,
  source: string,
  status: 'ok' | 'erro' | 'alerta',
  message: string,
  refMonth?: string
) {
  await supabase.from('ingest_log').insert({ source, status, message, ref_month: refMonth ?? null });
}
