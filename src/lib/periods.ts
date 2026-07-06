// Seletor de período (4 campos): lista única de 20 tipos, usada em todas as análises.
// Meses são representados como strings 'YYYY-MM' para evitar problemas de fuso horário.

export type PeriodCode =
  | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'
  | 'M7' | 'M8' | 'M9' | 'M10' | 'M11' | 'M12'
  | 'T1' | 'T2' | 'T3' | 'T4'
  | 'S1' | 'S2'
  | 'N9'
  | 'AA';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const PERIOD_OPTIONS: { code: PeriodCode; label: string }[] = [
  ...MESES.map((m, i) => ({ code: `M${i + 1}` as PeriodCode, label: m })),
  { code: 'T1', label: 'T1' },
  { code: 'T2', label: 'T2' },
  { code: 'T3', label: 'T3' },
  { code: 'T4', label: 'T4' },
  { code: 'S1', label: '1º semestre' },
  { code: 'S2', label: '2º semestre' },
  { code: 'N9', label: '9 meses' },
  { code: 'AA', label: 'Ano cheio' },
];

export const ANO_MINIMO = 2015;

/** Retorna o mês final (1-12) coberto por um período dentro do ano. */
function endMonthOf(code: PeriodCode): number {
  if (code[0] === 'M') return parseInt(code.slice(1), 10);
  if (code[0] === 'T') return parseInt(code.slice(1), 10) * 3;
  if (code === 'S1') return 6;
  if (code === 'S2') return 12;
  if (code === 'N9') return 9;
  return 12; // AA
}

/** Retorna o mês inicial (1-12) coberto por um período dentro do ano. */
function startMonthOf(code: PeriodCode): number {
  if (code[0] === 'M') return parseInt(code.slice(1), 10);
  if (code[0] === 'T') return (parseInt(code.slice(1), 10) - 1) * 3 + 1;
  if (code === 'S1') return 1;
  if (code === 'S2') return 7;
  return 1; // N9, AA
}

function ym(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Intervalo de meses ('YYYY-MM') cobertos pelo período, início e fim inclusive. */
export function monthRange(code: PeriodCode, year: number): { start: string; end: string } {
  return { start: ym(year, startMonthOf(code)), end: ym(year, endMonthOf(code)) };
}

/** Lista de todos os meses ('YYYY-MM') entre start e end, inclusive. */
export function monthsBetween(start: string, end: string): string[] {
  const [ys, ms] = start.split('-').map(Number);
  const [ye, me] = end.split('-').map(Number);
  const months: string[] = [];
  let y = ys, m = ms;
  while (y < ye || (y === ye && m <= me)) {
    months.push(ym(y, m));
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

/** Desloca um mês 'YYYY-MM' por N meses (positivo = futuro, negativo = passado). */
export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  return ym(Math.floor(total / 12), (total % 12) + 1);
}

export function mesLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  return `${MESES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
}

export function periodLabel(code: PeriodCode, year: number): string {
  const opt = PERIOD_OPTIONS.find((o) => o.code === code)!;
  if (code[0] === 'M') return `${opt.label}/${year}`;
  return `${opt.label} ${year}`;
}

/** Um período é parcial se seu mês final ainda não chegou nos dados disponíveis. */
export function isPartial(code: PeriodCode, year: number, latestMonth: string): boolean {
  const { end } = monthRange(code, year);
  return end > latestMonth;
}

/** Duas janelas têm duração diferente (tipo diferente) — sinal de alerta na comparação. */
export function differentDuration(codeA: PeriodCode, codeB: PeriodCode): boolean {
  return tipoDe(codeA) !== tipoDe(codeB);
}

function tipoDe(code: PeriodCode): string {
  if (code[0] === 'M') return 'M';
  if (code[0] === 'T') return 'T';
  return code; // S1, S2, N9, AA são cada um sua própria categoria
}

/** Sugestão automática de comparação: mesmo período do ano anterior. */
export function defaultComparison(code: PeriodCode, year: number): { code: PeriodCode; year: number } {
  return { code, year: Math.max(ANO_MINIMO, year - 1) };
}

export function anosDisponiveis(anoAtual: number): number[] {
  const anos: number[] = [];
  for (let a = anoAtual; a >= ANO_MINIMO; a--) anos.push(a);
  return anos;
}

/** Duração (em meses) de um tipo de período — usada para "andar" períodos anteriores no mapa de calor. */
export function periodStepMonths(code: PeriodCode): number {
  if (code[0] === 'M') return 1;
  if (code[0] === 'T') return 3;
  if (code === 'S1' || code === 'S2') return 6;
  return 12; // N9, AA — âncora anual
}

/** Intervalo do k-ésimo período anterior ao mesmo tipo (k=0 é o próprio período selecionado). */
export function shiftPeriod(code: PeriodCode, year: number, k: number): { start: string; end: string } {
  const step = periodStepMonths(code);
  const base = monthRange(code, year);
  return { start: shiftMonth(base.start, -step * k), end: shiftMonth(base.end, -step * k) };
}

/** Rótulo de um período deslocado, derivado do seu mês inicial. */
export function labelForShiftedPeriod(code: PeriodCode, start: string): string {
  const [y, m] = start.split('-').map(Number);
  if (code[0] === 'M') return mesLabel(start);
  if (code[0] === 'T') {
    const q = Math.floor((m - 1) / 3) + 1;
    return `T${q} ${String(y).slice(2)}`;
  }
  if (code === 'S1' || code === 'S2') return `${m === 1 ? 'S1' : 'S2'} ${String(y).slice(2)}`;
  if (code === 'N9') return `9M ${y}`;
  return `${y}`; // AA
}

/** Lê os 4 campos do seletor de período a partir dos searchParams da URL. */
export function readPeriodParams(
  searchParams: { [key: string]: string | string[] | undefined },
  latestMonth: string
) {
  const anoAtual = parseInt(latestMonth.slice(0, 4), 10);
  const pCode = (searchParams.pCode as PeriodCode) || 'AA';
  const pYear = searchParams.pYear ? parseInt(searchParams.pYear as string, 10) : anoAtual;
  const def = defaultComparison(pCode, pYear);
  const cCode = (searchParams.cCode as PeriodCode) || def.code;
  const cYear = searchParams.cYear ? parseInt(searchParams.cYear as string, 10) : def.year;
  return { pCode, pYear, cCode, cYear };
}

/** Lê Período + Ano + quantidade de períodos anteriores (página de análise histórica). */
export function readHistoricoParams(
  searchParams: { [key: string]: string | string[] | undefined },
  latestMonth: string
) {
  const anoAtual = parseInt(latestMonth.slice(0, 4), 10);
  const hCode = (searchParams.hCode as PeriodCode) || 'AA';
  const hYear = searchParams.hYear ? parseInt(searchParams.hYear as string, 10) : anoAtual;
  const hN = searchParams.hN ? parseInt(searchParams.hN as string, 10) : 8;
  return { hCode, hYear, hN };
}
