'use client';

import { useState, useTransition } from 'react';
import type { AcaoResultado } from '@/app/admin/(protected)/actions';

export default function UpdateSourceButton({
  label, action,
}: {
  label: string;
  action: () => Promise<AcaoResultado>;
}) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<AcaoResultado | null>(null);

  function executar() {
    setResultado(null);
    startTransition(async () => {
      const r = await action();
      setResultado(r);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={executar} disabled={pending} className="btnPrimary">
        {pending ? 'Atualizando…' : label}
      </button>
      {resultado && (
        <p className={`text-xs ${resultado.ok ? 'text-success' : 'text-danger'}`}>{resultado.mensagem}</p>
      )}
    </div>
  );
}
