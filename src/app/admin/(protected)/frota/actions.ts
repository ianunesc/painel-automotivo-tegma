'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type AcaoResultado = { ok: boolean; mensagem: string };

export async function salvarFrotaAnual(_prev: AcaoResultado | null, formData: FormData): Promise<AcaoResultado> {
  const ano = parseInt(formData.get('ano') as string, 10);
  const frota = parseFloat((formData.get('frota') as string)?.replace(',', '.'));
  const idadeStr = (formData.get('idade') as string)?.replace(',', '.');
  const idade = idadeStr ? parseFloat(idadeStr) : null;

  if (!ano || Number.isNaN(frota)) {
    return { ok: false, mensagem: 'Preencha ano e frota circulante.' };
  }

  const supabase = await createClient();
  const rows = [
    { indicator: 'frota_circulante', ref_year: ano, value: frota, source: 'sindipecas', edited_manually: true },
    { indicator: 'idade_media_frota', ref_year: ano, value: idade, source: 'sindipecas', edited_manually: true },
  ];

  const { error } = await supabase.from('annual_values').upsert(rows, { onConflict: 'indicator,ref_year' });
  if (error) return { ok: false, mensagem: error.message };

  revalidatePath('/');
  return { ok: true, mensagem: `Frota de ${ano} salva com sucesso.` };
}
