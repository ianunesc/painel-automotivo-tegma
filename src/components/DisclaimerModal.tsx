'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'painel-automotivo-disclaimer-ok';
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function getSnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}
function getServerSnapshot() {
  return true; // no servidor assume confirmado; o cliente corrige assim que montar, sem "flash"
}
function confirmar() {
  sessionStorage.setItem(STORAGE_KEY, '1');
  listeners.forEach((l) => l());
}

export default function DisclaimerModal() {
  const jaConfirmado = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (jaConfirmado) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-lg rounded-xl bg-surface p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-tegma-dark">Aviso importante</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Este painel é uma iniciativa do time de Relações com Investidores da Tegma, oferecido
          como cortesia ao mercado. As informações são compiladas de fontes públicas e a Tegma
          não se responsabiliza pela exatidão, completude ou atualização dos dados, que não
          substituem as publicações oficiais das respectivas fontes e não constituem
          recomendação de investimento.
        </p>
        <button
          onClick={confirmar}
          className="mt-5 w-full rounded-lg bg-tegma-orange px-4 py-2.5 font-medium text-white transition hover:bg-tegma-orange-dark"
        >
          OK, entendi
        </button>
      </div>
    </div>
  );
}
