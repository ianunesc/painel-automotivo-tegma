'use client';

import { useState } from 'react';
import { mesLabel } from '@/lib/periods';

export type EditableRow = { key: string; label: string; decimals: number; valores: (number | null)[] };

export default function EditableGrid({
  meses, linhas, onSave,
}: {
  meses: string[];
  linhas: EditableRow[];
  onSave: (rowKey: string, mes: string, valor: number) => Promise<void>;
}) {
  const [status, setStatus] = useState<Record<string, 'salvando' | 'ok' | 'erro' | undefined>>({});
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    for (const l of linhas) {
      l.valores.forEach((v, i) => {
        inicial[`${l.key}|${meses[i]}`] = v === null ? '' : String(v);
      });
    }
    return inicial;
  });

  async function salvar(rowKey: string, mes: string) {
    const chave = `${rowKey}|${mes}`;
    const texto = valores[chave]?.replace(',', '.') ?? '';
    const numero = parseFloat(texto);
    if (Number.isNaN(numero)) return;
    setStatus((s) => ({ ...s, [chave]: 'salvando' }));
    try {
      await onSave(rowKey, mes, numero);
      setStatus((s) => ({ ...s, [chave]: 'ok' }));
    } catch {
      setStatus((s) => ({ ...s, [chave]: 'erro' }));
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-separate text-xs" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="min-w-[160px] py-1 text-left text-text-secondary">Indicador</th>
            {meses.map((m) => <th key={m} className="px-1 py-1 text-center text-text-secondary">{mesLabel(m)}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.key}>
              <td className="py-1 pr-2 text-foreground">{l.label}</td>
              {meses.map((m) => {
                const chave = `${l.key}|${m}`;
                const st = status[chave];
                return (
                  <td key={m} className="p-0.5">
                    <input
                      value={valores[chave] ?? ''}
                      onChange={(e) => setValores((v) => ({ ...v, [chave]: e.target.value }))}
                      onBlur={() => salvar(l.key, m)}
                      className={`w-20 rounded border px-1 py-1 text-right ${
                        st === 'ok' ? 'border-success' : st === 'erro' ? 'border-danger' : 'border-border'
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-text-muted">Edições são salvas ao sair do campo (Tab ou clique fora) e ficam marcadas como manuais.</p>
    </div>
  );
}
