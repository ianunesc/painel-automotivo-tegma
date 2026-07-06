'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { REGIOES } from '@/lib/indicators';

export type AcaoResultado = { ok: boolean; mensagem: string };

export async function salvarRegiaoMensal(_prev: AcaoResultado | null, formData: FormData): Promise<AcaoResultado> {
  const mes = formData.get('mes') as string; // 'YYYY-MM'
  if (!mes) return { ok: false, mensagem: 'Selecione o mês.' };
  const refMonth = `${mes}-01`;

  const percentuais = REGIOES.map((r) => ({
    regiao: r,
    pct: parseFloat((formData.get(`pct_${r}`) as string)?.replace(',', '.') ?? '0'),
  }));

  const soma = percentuais.reduce((acc, p) => acc + p.pct, 0);
  if (Math.abs(soma - 100) > 0.5) {
    return { ok: false, mensagem: `A soma dos percentuais é ${soma.toFixed(1)}% — deveria ser ~100%. Confira os valores.` };
  }

  const supabase = await createClient();
  const { data: licRow, error: errLic } = await supabase
    .from('monthly_values')
    .select('value')
    .eq('indicator', 'licenciamento')
    .eq('ref_month', refMonth)
    .maybeSingle();

  if (errLic || !licRow) {
    return { ok: false, mensagem: `Licenciamento da Anfavea para ${mes} ainda não foi carregado. Atualize a Anfavea primeiro.` };
  }

  const licenciamentoTotal = licRow.value * 1000;
  const rows = percentuais.map((p) => ({
    ref_month: refMonth,
    region: p.regiao,
    share_pct: p.pct / 100,
    units: (p.pct / 100) * licenciamentoTotal,
    source: 'fenabrave',
    edited_manually: true,
  }));

  const { error } = await supabase.from('region_sales').upsert(rows, { onConflict: 'ref_month,region' });
  if (error) return { ok: false, mensagem: error.message };

  revalidatePath('/regioes');
  revalidatePath('/');
  return { ok: true, mensagem: `Regiões de ${mes} salvas com sucesso.` };
}
