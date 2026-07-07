// Diagnóstico: por que certos meses não têm dados de montadoras?
// Compara a soma do Top 40 do Autoo com o licenciamento Anfavea mês a mês.

import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function carregarEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  for (const linha of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}
carregarEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function mesesComDados(tabela, filtro = {}) {
  const meses = new Set();
  let from = 0;
  for (;;) {
    let q = supabase.from(tabela).select('ref_month').range(from, from + 999);
    for (const [k, v] of Object.entries(filtro)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw error;
    for (const r of data) meses.add(r.ref_month.slice(0, 7));
    if (data.length < 1000) break;
    from += 1000;
  }
  return meses;
}

async function fetchAutooAno(ano) {
  const res = await fetch(`https://www.autoo.com.br/emplacamentos/marcas-mais-vendidas/${ano}/`);
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const html = new TextDecoder('iso-8859-1').decode(buf);
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
  return marcas;
}

async function main() {
  const [brandMeses, licMeses] = await Promise.all([
    mesesComDados('brand_sales'),
    mesesComDados('monthly_values', { indicator: 'licenciamento' }),
  ]);

  // Meses esperados: 2015-01 até o último mês com licenciamento
  const ultimoLic = [...licMeses].sort().pop();
  const faltantes = [];
  for (let ano = 2015; ano <= parseInt(ultimoLic.slice(0, 4)); ano++) {
    for (let m = 1; m <= 12; m++) {
      const ym = `${ano}-${String(m).padStart(2, '0')}`;
      if (ym > ultimoLic) break;
      if (!brandMeses.has(ym)) faltantes.push(ym);
    }
  }
  console.log('Meses SEM dados de montadoras (até ' + ultimoLic + '):', faltantes.join(', ') || 'nenhum');
  console.log('');

  const anos = [...new Set(faltantes.map((f) => parseInt(f.slice(0, 4))))];
  const autooCache = {};
  for (const ano of anos) autooCache[ano] = await fetchAutooAno(ano);

  console.log('Mês       | Anfavea (lic) | Top40 Autoo | "Outras" (lic−top40) | Diferença %');
  console.log('----------|---------------|-------------|----------------------|------------');
  for (const ym of faltantes) {
    const [ano, mes] = ym.split('-').map(Number);
    const marcas = autooCache[ano];
    const { data: licRow } = await supabase
      .from('monthly_values').select('value')
      .eq('indicator', 'licenciamento').eq('ref_month', `${ym}-01`).maybeSingle();
    const lic = licRow ? Math.round(licRow.value * 1000) : null;

    if (!marcas) { console.log(`${ym}   | ${lic ?? '—'} | página do Autoo indisponível`); continue; }
    const doMes = marcas.map((mk) => ({ b: mk.brand, u: mk.mensal[mes - 1] })).filter((x) => x.u > 0).sort((a, b) => b.u - a.u);
    const top40 = doMes.slice(0, 40).reduce((acc, x) => acc + x.u, 0);
    const totalAutoo = doMes.reduce((acc, x) => acc + x.u, 0);
    const outras = lic !== null ? lic - top40 : null;
    const difPct = lic ? (((top40 - lic) / lic) * 100).toFixed(2) : '—';
    console.log(
      `${ym}   | ${lic === null ? 'SEM DADO' : lic.toLocaleString('pt-BR')} | ${top40.toLocaleString('pt-BR')} | ${outras === null ? '—' : outras.toLocaleString('pt-BR')} | ${difPct}%  (marcas no mês: ${doMes.length}, total autoo: ${totalAutoo.toLocaleString('pt-BR')})`
    );
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
