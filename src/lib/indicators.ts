export type Indicator =
  | 'licenciamento' | 'producao' | 'exportacao' | 'importados'
  | 'credito_saldo' | 'credito_concessao' | 'credito_juros' | 'credito_inadimplencia';

export type AggRule = 'sum' | 'avg' | 'last';

export const INDICATOR_META: Record<Indicator, {
  label: string;
  unit: string;
  decimals: number;
  rule: AggRule;
  source: string;
  group: 'mercado' | 'credito';
}> = {
  licenciamento: { label: 'Licenciamento', unit: 'mil un.', decimals: 1, rule: 'sum', source: 'Anfavea', group: 'mercado' },
  producao: { label: 'Produção', unit: 'mil un.', decimals: 1, rule: 'sum', source: 'Anfavea', group: 'mercado' },
  exportacao: { label: 'Exportação', unit: 'mil un.', decimals: 1, rule: 'sum', source: 'Anfavea', group: 'mercado' },
  importados: { label: 'Venda de importados', unit: 'mil un.', decimals: 1, rule: 'sum', source: 'Anfavea', group: 'mercado' },
  credito_saldo: { label: 'Saldo de crédito PF', unit: 'R$ bi', decimals: 1, rule: 'last', source: 'Banco Central (SGS)', group: 'credito' },
  credito_concessao: { label: 'Concessões de crédito PF', unit: 'R$ bi', decimals: 1, rule: 'sum', source: 'Banco Central (SGS)', group: 'credito' },
  credito_juros: { label: 'Taxa de juros PF', unit: '% a.a.', decimals: 1, rule: 'avg', source: 'Banco Central (SGS)', group: 'credito' },
  credito_inadimplencia: { label: 'Inadimplência PF', unit: '%', decimals: 1, rule: 'avg', source: 'Banco Central (SGS)', group: 'credito' },
};

export const INDICATOR_ORDER: Indicator[] = [
  'licenciamento', 'producao', 'exportacao', 'importados',
  'credito_saldo', 'credito_concessao', 'credito_juros', 'credito_inadimplencia',
];

/** Agrega uma série de valores mensais conforme a regra do indicador. */
export function aggregate(values: number[], rule: AggRule): number | null {
  if (values.length === 0) return null;
  if (rule === 'sum') return values.reduce((a, b) => a + b, 0);
  if (rule === 'avg') return values.reduce((a, b) => a + b, 0) / values.length;
  return values[values.length - 1]; // 'last'
}

/** Licenciamento por dia útil = soma do licenciamento no período ÷ soma dos dias úteis. */
export function aggregateLicPorDiaUtil(licenciamentoMensal: number[], diasUteisMensal: number[]): number | null {
  if (licenciamentoMensal.length === 0) return null;
  const somaLic = licenciamentoMensal.reduce((a, b) => a + b, 0);
  const somaDias = diasUteisMensal.reduce((a, b) => a + b, 0);
  if (somaDias === 0) return null;
  return somaLic / somaDias;
}

export const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;
export type Regiao = (typeof REGIOES)[number];

export const AGGREGATE_RULES_LABEL =
  'Fluxos (licenciamento, produção, exportação, importados, concessões): soma dos meses. ' +
  'Saldo de crédito: valor do último mês do período. ' +
  'Juros e inadimplência: média do período. ' +
  'Licenciamento por dia útil: soma do licenciamento ÷ soma dos dias úteis.';
