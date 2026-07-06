// Script de carga histórica (rodar uma única vez, depois que o projeto Supabase existir).
// Uso: node scripts/seed-historico.mjs
// Requer no .env.local: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Carrega .env.local manualmente (sem depender de pacote extra) ---
function carregarEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Arquivo .env.local não encontrado. Copie .env.local.example e preencha as chaves do Supabase.');
    process.exit(1);
  }
  for (const linha of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}
carregarEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ANO_INICIAL = 2015;
const ANO_FINAL = new Date().getFullYear();

// ============================================================
// 1. DIAS ÚTEIS (2015-2030) — feriados nacionais fixos + Sexta-feira Santa
// ============================================================
function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function feriadosNacionais(ano) {
  const sextaSanta = new Date(pascoa(ano).getTime() - 2 * 86400000);
  return [
    new Date(Date.UTC(ano, 0, 1)),   // Confraternização Universal
    sextaSanta,                       // Sexta-feira Santa
    new Date(Date.UTC(ano, 3, 21)),  // Tiradentes
    new Date(Date.UTC(ano, 4, 1)),   // Dia do Trabalho
    new Date(Date.UTC(ano, 8, 7)),   // Independência
    new Date(Date.UTC(ano, 9, 12)),  // Nossa Sr.ª Aparecida
    new Date(Date.UTC(ano, 10, 2)),  // Finados
    new Date(Date.UTC(ano, 10, 15)), // Proclamação da República
    new Date(Date.UTC(ano, 11, 25)), // Natal
  ].map((d) => d.toISOString().slice(0, 10));
}

function gerarDiasUteis() {
  const rows = [];
  for (let ano = ANO_INICIAL; ano <= 2030; ano++) {
    const feriados = new Set(feriadosNacionais(ano));
    for (let mes = 0; mes < 12; mes++) {
      const totalDias = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
      let uteis = 0;
      for (let dia = 1; dia <= totalDias; dia++) {
        const d = new Date(Date.UTC(ano, mes, dia));
        const diaSemana = d.getUTCDay();
        const iso = d.toISOString().slice(0, 10);
        if (diaSemana !== 0 && diaSemana !== 6 && !feriados.has(iso)) uteis++;
      }
      rows.push({ ref_month: `${ano}-${String(mes + 1).padStart(2, '0')}-01`, dias_uteis: uteis });
    }
  }
  return rows;
}

async function seedDiasUteis() {
  const rows = gerarDiasUteis();
  const { error } = await supabase.from('business_days').upsert(rows, { onConflict: 'ref_month' });
  if (error) throw error;
  console.log(`✔ Dias úteis: ${rows.length} meses (2015-2030) carregados.`);
}

// ============================================================
// 2. REGIÕES + FROTA — a partir de "base para importação.xlsx"
// ============================================================
function excelSerialParaData(serial) {
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d.toISOString().slice(0, 10);
}

async function seedRegioesEFrota() {
  const arquivo = path.join(__dirname, '..', '..', 'base para importação.xlsx');
  if (!fs.existsSync(arquivo)) {
    console.warn('⚠ "base para importação.xlsx" não encontrado — pulei regiões e frota.');
    return;
  }
  const wb = XLSX.readFile(arquivo);

  // --- Regiões ---
  const wsRegiao = wb.Sheets['Vendas por região'];
  const linhasRegiao = XLSX.utils.sheet_to_json(wsRegiao, { header: 1, defval: '' });
  const REGIOES_COLS = [
    { nome: 'Norte', colUnidades: 1, colShare: 7 },
    { nome: 'Nordeste', colUnidades: 2, colShare: 8 },
    { nome: 'Centro-Oeste', colUnidades: 3, colShare: 9 },
    { nome: 'Sudeste', colUnidades: 4, colShare: 10 },
    { nome: 'Sul', colUnidades: 5, colShare: 11 },
  ];
  const regiaoRows = [];
  for (const linha of linhasRegiao.slice(2)) {
    if (typeof linha[0] !== 'number') continue;
    const refMonth = excelSerialParaData(linha[0]).slice(0, 7) + '-01';
    for (const r of REGIOES_COLS) {
      const unidades = Number(linha[r.colUnidades]) || 0;
      const share = Number(linha[r.colShare]) || 0;
      if (unidades === 0 && share === 0) continue;
      regiaoRows.push({ ref_month: refMonth, region: r.nome, share_pct: share, units: unidades, source: 'fenabrave' });
    }
  }
  for (let i = 0; i < regiaoRows.length; i += 500) {
    const { error } = await supabase.from('region_sales').upsert(regiaoRows.slice(i, i + 500), { onConflict: 'ref_month,region' });
    if (error) throw error;
  }
  console.log(`✔ Regiões: ${regiaoRows.length} linhas carregadas (${regiaoRows.length / 5} meses).`);

  // --- Frota ---
  const wsFrota = wb.Sheets['Frota de veículos'];
  const linhasFrota = XLSX.utils.sheet_to_json(wsFrota, { header: 1, defval: '' });
  const frotaRows = [];
  for (const linha of linhasFrota.slice(1)) {
    const ano = Number(linha[0]);
    if (!ano) continue;
    const frota = Number(linha[1]) || null;
    const idade = typeof linha[2] === 'number' ? linha[2] : null;
    frotaRows.push({ indicator: 'frota_circulante', ref_year: ano, value: frota, source: 'sindipecas' });
    frotaRows.push({ indicator: 'idade_media_frota', ref_year: ano, value: idade, source: 'sindipecas' });
  }
  const { error: errFrota } = await supabase.from('annual_values').upsert(frotaRows, { onConflict: 'indicator,ref_year' });
  if (errFrota) throw errFrota;
  console.log(`✔ Frota: ${frotaRows.length / 2} anos carregados.`);
}

// ============================================================
// 3. ANFAVEA (2015 até o ano atual)
// ============================================================
function toNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function readRow(sheetRows, index, expectedLabel) {
  const row = sheetRows[index];
  if (!row || String(row[0]).trim() !== expectedLabel) {
    throw new Error(`Estrutura da planilha Anfavea mudou na linha ${index} (esperado "${expectedLabel}")`);
  }
  return row;
}

async function seedAnfaveaAno(ano) {
  const res = await fetch(`https://anfavea.com.br/docs/siteautoveiculos${ano}.xlsx`);
  if (!res.ok) { console.warn(`⚠ Anfavea ${ano}: HTTP ${res.status}, pulando.`); return; }
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });

  const emplacamento = XLSX.utils.sheet_to_json(wb.Sheets['I. Emplacamento'], { header: 1, defval: 0 });
  const exportacao = XLSX.utils.sheet_to_json(wb.Sheets['V. Exportação Volume'], { header: 1, defval: 0 });
  const producao = XLSX.utils.sheet_to_json(wb.Sheets['VI. Produção'], { header: 1, defval: 0 });

  const licRow = readRow(emplacamento, 44, 'Veículos leves');
  const impRow = readRow(emplacamento, 25, 'Veículos leves');
  const expRow = readRow(exportacao, 6, 'Veículos leves');
  const proRow = readRow(producao, 6, 'Veículos leves');

  const rows = [];
  for (let m = 0; m < 12; m++) {
    const col = 2 + m;
    const licenciamento = toNumber(licRow[col]);
    if (licenciamento === 0) continue;
    const refMonth = `${ano}-${String(m + 1).padStart(2, '0')}-01`;
    rows.push({ indicator: 'licenciamento', ref_month: refMonth, value: licenciamento / 1000, source: 'anfavea' });
    rows.push({ indicator: 'importados', ref_month: refMonth, value: toNumber(impRow[col]) / 1000, source: 'anfavea' });
    rows.push({ indicator: 'exportacao', ref_month: refMonth, value: toNumber(expRow[col]) / 1000, source: 'anfavea' });
    rows.push({ indicator: 'producao', ref_month: refMonth, value: toNumber(proRow[col]) / 1000, source: 'anfavea' });
  }
  if (rows.length === 0) return;
  const { error } = await supabase.from('monthly_values').upsert(rows, { onConflict: 'indicator,ref_month' });
  if (error) throw error;
  console.log(`✔ Anfavea ${ano}: ${rows.length / 4} meses.`);
}

// ============================================================
// 4. BANCO CENTRAL — séries completas desde 2015
// ============================================================
const SERIES_BCB = { credito_saldo: 20581, credito_concessao: 20673, credito_juros: 20749, credito_inadimplencia: 21121 };
const EM_MILHOES = new Set(['credito_saldo', 'credito_concessao']);

async function seedBcb() {
  const rows = [];
  for (const [indicator, codigo] of Object.entries(SERIES_BCB)) {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=01/01/${ANO_INICIAL}`;
    const res = await fetch(url);
    if (!res.ok) { console.warn(`⚠ BCB série ${codigo}: HTTP ${res.status}`); continue; }
    const pontos = await res.json();
    for (const p of pontos) {
      const valorBruto = parseFloat(String(p.valor).replace(',', '.'));
      if (!Number.isFinite(valorBruto)) continue;
      const [, mm, yyyy] = p.data.split('/');
      const value = EM_MILHOES.has(indicator) ? valorBruto / 1000 : valorBruto;
      rows.push({ indicator, ref_month: `${yyyy}-${mm}-01`, value, source: 'bcb' });
    }
  }
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('monthly_values').upsert(rows.slice(i, i + 500), { onConflict: 'indicator,ref_month' });
    if (error) throw error;
  }
  console.log(`✔ Banco Central: ${rows.length} valores carregados.`);
}

// ============================================================
// 5. AUTOO — montadoras (2015 até o ano atual), depende do licenciamento já carregado
// ============================================================
async function seedAutooAno(ano) {
  const url = `https://www.autoo.com.br/emplacamentos/marcas-mais-vendidas/${ano}/`;
  const res = await fetch(url);
  if (!res.ok) { console.warn(`⚠ Autoo ${ano}: HTTP ${res.status}`); return; }
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
  if (marcas.length === 0) { console.warn(`⚠ Autoo ${ano}: nenhuma marca encontrada.`); return; }

  let mesesSalvos = 0, mesesAlerta = 0;
  for (let m = 0; m < 12; m++) {
    const refMonth = `${ano}-${String(m + 1).padStart(2, '0')}-01`;
    const doMes = marcas.map((mk) => ({ brand: mk.brand, units: mk.mensal[m] })).filter((mk) => mk.units > 0).sort((a, b) => b.units - a.units);
    if (doMes.length === 0) continue;
    const top40 = doMes.slice(0, 40);
    const somaTop40 = top40.reduce((acc, mk) => acc + mk.units, 0);

    const { data: licRow } = await supabase.from('monthly_values').select('value').eq('indicator', 'licenciamento').eq('ref_month', refMonth).maybeSingle();
    if (!licRow) { mesesAlerta++; continue; }
    const licenciamentoTotal = licRow.value * 1000;
    const outras = licenciamentoTotal - somaTop40;
    if (outras < 0) { mesesAlerta++; continue; }

    const rows = [...top40.map((mk) => ({ ref_month: refMonth, brand: mk.brand, units: mk.units, source: 'autoo' })), { ref_month: refMonth, brand: 'Outras', units: outras, source: 'autoo' }];
    const { error } = await supabase.from('brand_sales').upsert(rows, { onConflict: 'ref_month,brand' });
    if (error) throw error;
    mesesSalvos++;
  }
  console.log(`✔ Autoo ${ano}: ${mesesSalvos} mês(es) salvos, ${mesesAlerta} com alerta (sem licenciamento).`);
}

// ============================================================
async function main() {
  console.log('Iniciando carga histórica...\n');
  await seedDiasUteis();
  await seedRegioesEFrota();

  for (let ano = ANO_INICIAL; ano <= ANO_FINAL; ano++) await seedAnfaveaAno(ano);
  await seedBcb();
  for (let ano = ANO_INICIAL; ano <= ANO_FINAL; ano++) await seedAutooAno(ano);

  console.log('\nCarga histórica concluída.');
}

main().catch((e) => { console.error(e); process.exit(1); });
