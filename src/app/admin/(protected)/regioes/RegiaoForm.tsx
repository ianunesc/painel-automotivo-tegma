'use client';

import { useActionState } from 'react';
import { salvarRegiaoMensal } from './actions';
import { REGIOES } from '@/lib/indicators';

export default function RegiaoForm() {
  const [state, action, pending] = useActionState(salvarRegiaoMensal, null);

  return (
    <form action={action} className="card flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Mês de referência
        <input type="month" name="mes" required className="w-48 rounded-lg border border-border px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {REGIOES.map((r) => (
          <label key={r} className="flex flex-col gap-1 text-sm text-text-secondary">
            {r} (%)
            <input
              type="number" step="0.1" name={`pct_${r}`} required
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        Os percentuais devem somar aproximadamente 100%. O valor absoluto é calculado automaticamente
        a partir do licenciamento da Anfavea já carregado para o mês.
      </p>

      {state && <p className={`text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.mensagem}</p>}

      <button type="submit" disabled={pending} className="btnPrimary self-start">
        {pending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  );
}
