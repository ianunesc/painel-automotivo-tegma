import * as cheerio from 'cheerio';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logIngest } from './common';

// Fenabrave (base do Autoo) e Anfavea medem quase o mesmo universo, mas com
// cortes/momentos de apuração diferentes. Divergências de até este percentual
// são tratadas como metodológicas: o mês é publicado com "Outras" = 0.
export const TOLERANCIA_DIVERGENCIA = 0.005; // 0,5%

async function fetchRankingAno(year: number) {
  const url = `https://www.autoo.com.br/emplacamentos/marcas-mais-vendidas/${year}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Autoo: falha ao baixar o ranking de ${year} (HTTP ${res.status}).`);
  // A página é servida em ISO-8859-1, não UTF-8.
  const buf = await res.arrayBuffer();
  const html = new TextDecoder('iso-8859-1').decode(buf);
  const $ = cheerio.load(html);

  const marcas: { brand: string; mensal: number[] }[] = [];
  $('table#example tbody tr').each((_, tr) => {
    const brand = $(tr).find('span.marcark').text().trim();
    if (!brand) return;
    const celulas = $(tr).find('td[data-order]');
    const mensal: number[] = [];
    celulas.each((i, td) => {
      if (i >= 12) return; // ignora a 13ª célula (Total Ano)
      mensal.push(Number($(td).attr('data-order')) || 0);
    });
    marcas.push({ brand, mensal });
  });

  if (marcas.length === 0) {
    throw new Error('A estrutura da página do Autoo mudou (nenhuma marca encontrada) — verificar o parser.');
  }
  return marcas;
}

/** Ingesta o ranking de montadoras (licenciamento) de um ano inteiro, mês a mês. */
export async function ingestAutooYear(supabase: SupabaseClient, year: number) {
  const marcas = await fetchRankingAno(year);
  let mesesSalvos = 0;
  let mesesComAlerta = 0;

  for (let m = 0; m < 12; m++) {
    const refMonth = `${year}-${String(m + 1).padStart(2, '0')}-01`;

    const doMes = marcas
      .map((mk) => ({ brand: mk.brand, units: mk.mensal[m] }))
      .filter((mk) => mk.units > 0)
      .sort((a, b) => b.units - a.units);

    if (doMes.length === 0) continue; // mês ainda não publicado

    const top40 = doMes.slice(0, 40);
    const somaTop40 = top40.reduce((acc, mk) => acc + mk.units, 0);

    const { data: licRow } = await supabase
      .from('monthly_values')
      .select('value')
      .eq('indicator', 'licenciamento')
      .eq('ref_month', refMonth)
      .maybeSingle();

    if (!licRow) {
      await logIngest(supabase, 'autoo', 'alerta', `Licenciamento Anfavea de ${refMonth} ainda não carregado — "Outras" não calculada.`, refMonth);
      mesesComAlerta++;
      continue;
    }

    const licenciamentoTotal = licRow.value * 1000; // volta de "mil un." para unidades
    let outras = licenciamentoTotal - somaTop40;

    if (outras < 0) {
      // Fenabrave (base do Autoo) e Anfavea divergem levemente em alguns meses.
      // Dentro da tolerância, publica com "Outras" = 0 e registra a divergência;
      // acima dela, segura o mês para revisão manual.
      const divergencia = -outras / licenciamentoTotal;
      if (divergencia <= TOLERANCIA_DIVERGENCIA) {
        await logIngest(
          supabase, 'autoo', 'alerta',
          `Fontes divergem em ${-outras} unidades (${(divergencia * 100).toFixed(2)}%) em ${refMonth} — publicado com "Outras" = 0.`,
          refMonth
        );
        outras = 0;
      } else {
        await logIngest(
          supabase, 'autoo', 'alerta',
          `Soma do Top 40 (${somaTop40}) excede o licenciamento Anfavea (${licenciamentoTotal}) em ${(divergencia * 100).toFixed(2)}% em ${refMonth} — acima da tolerância, revisar antes de publicar.`,
          refMonth
        );
        mesesComAlerta++;
        continue;
      }
    }

    const rows = [
      ...top40.map((mk) => ({ ref_month: refMonth, brand: mk.brand, units: mk.units, source: 'autoo' })),
      { ref_month: refMonth, brand: 'Outras', units: outras, source: 'autoo' },
    ];

    const { data: existentes } = await supabase
      .from('brand_sales')
      .select('brand, edited_manually')
      .eq('ref_month', refMonth);
    const manuais = new Set((existentes ?? []).filter((e) => e.edited_manually).map((e) => e.brand));
    const paraSalvar = rows.filter((r) => !manuais.has(r.brand));

    if (paraSalvar.length > 0) {
      const { error } = await supabase.from('brand_sales').upsert(paraSalvar, { onConflict: 'ref_month,brand' });
      if (error) throw error;
    }
    mesesSalvos++;
  }

  await logIngest(supabase, 'autoo', mesesComAlerta > 0 ? 'alerta' : 'ok', `${mesesSalvos} mês(es) salvos, ${mesesComAlerta} com alerta.`);
  return { mesesSalvos, mesesComAlerta };
}
