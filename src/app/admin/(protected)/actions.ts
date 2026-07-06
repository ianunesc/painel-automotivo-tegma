'use server';

import { createClient } from '@/lib/supabase/server';
import { ingestBcb } from '@/lib/ingest/bcb';
import { ingestAnfaveaYear } from '@/lib/ingest/anfavea';
import { ingestAutooYear } from '@/lib/ingest/autoo';
import { logIngest } from '@/lib/ingest/common';
import { revalidatePath } from 'next/cache';

export type AcaoResultado = { ok: boolean; mensagem: string };

export async function atualizarBcb(): Promise<AcaoResultado> {
  const supabase = await createClient();
  try {
    const r = await ingestBcb(supabase, 6);
    await logIngest(supabase, 'bcb', 'ok', `${r.salvos} valor(es) salvos, ${r.ignorados} ignorado(s) (editado manualmente).`);
    revalidatePath('/admin');
    return { ok: true, mensagem: `Banco Central atualizado: ${r.salvos} valores salvos.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    await logIngest(supabase, 'bcb', 'erro', msg);
    return { ok: false, mensagem: msg };
  }
}

export async function atualizarAnfavea(ano: number): Promise<AcaoResultado> {
  const supabase = await createClient();
  try {
    const r = await ingestAnfaveaYear(supabase, ano);
    await logIngest(supabase, 'anfavea', 'ok', `${r.mesesEncontrados} mês(es) de ${ano} processados, ${r.salvos} valores salvos.`);
    revalidatePath('/admin');
    return { ok: true, mensagem: `Anfavea ${ano} atualizado: ${r.mesesEncontrados} mês(es) processados.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    await logIngest(supabase, 'anfavea', 'erro', msg);
    return { ok: false, mensagem: msg };
  }
}

export async function atualizarAutoo(ano: number): Promise<AcaoResultado> {
  const supabase = await createClient();
  try {
    const r = await ingestAutooYear(supabase, ano);
    revalidatePath('/admin');
    return { ok: true, mensagem: `Autoo ${ano}: ${r.mesesSalvos} mês(es) salvos, ${r.mesesComAlerta} com alerta.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    await logIngest(supabase, 'autoo', 'erro', msg);
    return { ok: false, mensagem: msg };
  }
}
