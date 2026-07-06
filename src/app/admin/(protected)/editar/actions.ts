'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function salvarValorMensal(indicator: string, refMonth: string, valor: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('monthly_values')
    .upsert(
      { indicator, ref_month: refMonth, value: valor, source: 'manual', edited_manually: true },
      { onConflict: 'indicator,ref_month' }
    );
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/comparativo');
  revalidatePath('/historico');
}

export async function salvarDiasUteis(refMonth: string, dias: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('business_days')
    .upsert({ ref_month: refMonth, dias_uteis: dias, edited_manually: true }, { onConflict: 'ref_month' });
  if (error) throw new Error(error.message);
  revalidatePath('/');
}
