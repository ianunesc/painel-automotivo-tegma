// Recarrega montadoras (Autoo) para anos específicos, com a tolerância de
// divergência Fenabrave × Anfavea (até 0,5% → publica com "Outras" = 0).
// Uso: node scripts/backfill-autoo.mjs 2019 2021 2022 2023 2025 2026

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const linha of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  const m = linha.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const TOLERANCIA = 0.005;

async function backfillAno(ano) {
  const res = await fetch(`https://www.autoo.com.br/emplacamentos/marcas-mais-vendidas/${ano}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
  });
  if (!res.ok) { console.warn(`⚠ Autoo ${ano}: HTTP ${res.status}`); return; }
  const html = new TextDecoder('iso-8859-1').decode(await res.arrayBuffer());
  const $ = cheerio.load(html);

  const marcas = [];
  $('table#example tbody tr').each((_, tr) => {
    const brand = $(tr).find('span.marcark').text().trim();
    if (!brand) return;
    const mensal = [];
    $(tr).find('td[data-order]').each((i, td) => {
      if (i >= 12) return;
      mensal.push(Number($(td).attr('data-order')) || 0);
    });
    marcas.push({ brand, mensal });
  });

  for (let m = 0; m < 12; m++) {
    const refMonth = `${ano}-${String(m + 1).padStart(2, '0')}-01`;
    const doMes = marcas.map((mk) => ({ brand: mk.brand, units: mk.mensal[m] })).filter((mk) => mk.units > 0).sort((a, b) => b.units - a.units);
    if (doMes.length === 0) continue;

    const top40 = doMes.slice(0, 40);
    const somaTop40 = top40.reduce((acc, mk) => acc + mk.units, 0);

    const { data: licRow } = await supabase.from('monthly_values').select('value').eq('indicator', 'licenciamento').eq('ref_month', refMonth).maybeSingle();
    if (!licRow) continue;

    const licenciamentoTotal = Math.round(licRow.value * 1000);
    let outras = licenciamentoTotal - somaTop40;
    let nota = '';
    if (outras < 0) {
      const divergencia = -outras / licenciamentoTotal;
      if (divergencia > TOLERANCIA) {
        console.log(`✗ ${refMonth}: divergência ${(divergencia * 100).toFixed(2)}% acima da tolerância — mantido sem publicar.`);
        continue;
      }
      nota = ` (divergência de ${-outras} un., ${(divergencia * 100).toFixed(2)}% — "Outras" = 0)`;
      await supabase.from('ingest_log').insert({
        source: 'autoo', ref_month: refMonth, status: 'alerta',
        message: `Fontes divergem em ${-outras} unidades (${(divergencia * 100).toFixed(2)}%) — publicado com "Outras" = 0.`,
      });
      outras = 0;
    }

    const { data: existentes } = await supabase.from('brand_sales').select('brand, edited_manually').eq('ref_month', refMonth);
    const manuais = new Set((existentes ?? []).filter((e) => e.edited_manually).map((e) => e.brand));
    const rows = [
      ...top40.map((mk) => ({ ref_month: refMonth, brand: mk.brand, units: mk.units, source: 'autoo' })),
      { ref_month: refMonth, brand: 'Outras', units: outras, source: 'autoo' },
    ].filter((r) => !manuais.has(r.brand));

    const { error } = await supabase.from('brand_sales').upsert(rows, { onConflict: 'ref_month,brand' });
    if (error) throw error;
    console.log(`✔ ${refMonth}: ${rows.length} marcas salvas${nota}`);
  }
}

const anos = process.argv.slice(2).map(Number).filter(Boolean);
if (anos.length === 0) { console.error('Informe os anos: node scripts/backfill-autoo.mjs 2019 2021 ...'); process.exit(1); }
for (const ano of anos) await backfillAno(ano);
console.log('\nBackfill concluído.');
