import * as XLSX from 'xlsx';
import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertMonthlyValuesSkipManual } from './common';

// Estrutura da planilha "siteautoveiculos{ano}.xlsx" (estável desde 2015 até hoje):
// Sheet "I. Emplacamento": linha 44 = "Veículos leves" do bloco "Emplacamento total" (nacional + importado);
//                           linha 25 = "Veículos leves" do bloco "Emplacamento ... importados".
// Sheet "V. Exportação Volume": linha 6 = "Veículos leves".
// Sheet "VI. Produção": linha 6 = "Veículos leves".
// Colunas 2-13 = Jan-Dez; coluna 14 = Total Ano.

function readRow(sheetRows: unknown[][], index: number, expectedLabel: string): unknown[] {
  const row = sheetRows[index];
  if (!row || String(row[0]).trim() !== expectedLabel) {
    throw new Error(
      `A estrutura da planilha da Anfavea mudou (linha ${index} não é mais "${expectedLabel}"). ` +
      `É preciso ajustar o parser ou lançar os dados manualmente no Admin.`
    );
  }
  return row;
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function ingestAnfaveaYear(supabase: SupabaseClient, year: number) {
  const url = `https://anfavea.com.br/docs/siteautoveiculos${year}.xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não foi possível baixar o arquivo da Anfavea para ${year} (HTTP ${res.status}).`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const emplacamento = XLSX.utils.sheet_to_json(wb.Sheets['I. Emplacamento'], { header: 1, defval: 0 }) as unknown[][];
  const exportacao = XLSX.utils.sheet_to_json(wb.Sheets['V. Exportação Volume'], { header: 1, defval: 0 }) as unknown[][];
  const producao = XLSX.utils.sheet_to_json(wb.Sheets['VI. Produção'], { header: 1, defval: 0 }) as unknown[][];

  const licRow = readRow(emplacamento, 44, 'Veículos leves');
  const impRow = readRow(emplacamento, 25, 'Veículos leves');
  const expRow = readRow(exportacao, 6, 'Veículos leves');
  const proRow = readRow(producao, 6, 'Veículos leves');

  const rows: { indicator: string; ref_month: string; value: number; source: string }[] = [];
  for (let m = 0; m < 12; m++) {
    const col = 2 + m;
    const licenciamento = toNumber(licRow[col]);
    if (licenciamento === 0) continue; // mês ainda não publicado pela Anfavea
    const refMonth = `${year}-${String(m + 1).padStart(2, '0')}-01`;
    rows.push({ indicator: 'licenciamento', ref_month: refMonth, value: licenciamento / 1000, source: 'anfavea' });
    rows.push({ indicator: 'importados', ref_month: refMonth, value: toNumber(impRow[col]) / 1000, source: 'anfavea' });
    rows.push({ indicator: 'exportacao', ref_month: refMonth, value: toNumber(expRow[col]) / 1000, source: 'anfavea' });
    rows.push({ indicator: 'producao', ref_month: refMonth, value: toNumber(proRow[col]) / 1000, source: 'anfavea' });
  }

  const resultado = await upsertMonthlyValuesSkipManual(supabase, rows);
  return { ...resultado, mesesEncontrados: rows.length / 4 };
}
