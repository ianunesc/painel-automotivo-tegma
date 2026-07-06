import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertMonthlyValuesSkipManual } from './common';

// Séries SGS do Banco Central — crédito PF, aquisição de veículos, recursos livres.
const SERIES: Record<string, number> = {
  credito_saldo: 20581,
  credito_concessao: 20673,
  credito_juros: 20749,
  credito_inadimplencia: 21121,
};

// Saldo e concessões vêm em R$ milhões na API do BCB; convertemos para R$ bilhões.
const EM_MILHOES = new Set(['credito_saldo', 'credito_concessao']);

async function fetchSerie(codigo: number, ultimosN: number) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${ultimosN}?formato=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Banco Central: falha ao consultar a série ${codigo} (HTTP ${res.status}).`);
  return (await res.json()) as { data: string; valor: string }[];
}

function dataBrParaRefMonth(dataBr: string): string {
  const [, mm, yyyy] = dataBr.split('/');
  return `${yyyy}-${mm}-01`;
}

export async function ingestBcb(supabase: SupabaseClient, ultimosN = 6) {
  const rows: { indicator: string; ref_month: string; value: number; source: string }[] = [];

  for (const [indicator, codigo] of Object.entries(SERIES)) {
    const pontos = await fetchSerie(codigo, ultimosN);
    for (const ponto of pontos) {
      const valorBruto = parseFloat(ponto.valor.replace(',', '.'));
      if (!Number.isFinite(valorBruto)) continue;
      const value = EM_MILHOES.has(indicator) ? valorBruto / 1000 : valorBruto;
      rows.push({ indicator, ref_month: dataBrParaRefMonth(ponto.data), value, source: 'bcb' });
    }
  }

  return upsertMonthlyValuesSkipManual(supabase, rows);
}
