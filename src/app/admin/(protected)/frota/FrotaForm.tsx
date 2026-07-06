'use client';

import { useActionState } from 'react';
import { salvarFrotaAnual } from './actions';

export default function FrotaForm() {
  const [state, action, pending] = useActionState(salvarFrotaAnual, null);

  return (
    <form action={action} className="card flex flex-col gap-4 max-w-md">
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Ano
        <input type="number" name="ano" required min={2015} className="rounded-lg border border-border px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Frota circulante (milhões de veículos)
        <input type="number" step="0.001" name="frota" required className="rounded-lg border border-border px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Idade média da frota (anos) — deixe em branco se não disponível
        <input type="number" step="0.01" name="idade" className="rounded-lg border border-border px-3 py-2 text-sm" />
      </label>

      {state && <p className={`text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.mensagem}</p>}

      <button type="submit" disabled={pending} className="btnPrimary self-start">
        {pending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  );
}
