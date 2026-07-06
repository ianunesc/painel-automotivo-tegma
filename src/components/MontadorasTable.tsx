'use client';

import { useState } from 'react';

export type MontadoraLinha = {
  brand: string;
  unitsA: number;
  unitsB: number;
  shareA: number;
  shareB: number;
  deltaUnitsPct: number | null;
  deltaSharePP: number;
};

export default function MontadorasTable({ linhas }: { linhas: MontadoraLinha[] }) {
  const [modo, setModo] = useState<'top' | 'all'>('top');
  const [busca, setBusca] = useState('');

  const semOutras = linhas.filter((l) => l.brand !== 'Outras');
  const outras = linhas.find((l) => l.brand === 'Outras');
  const maxShare = Math.max(...linhas.map((l) => l.shareA), 0.0001);

  const filtro = busca.trim().toLowerCase();
  let visiveis = semOutras;
  if (filtro) {
    visiveis = semOutras.filter((l) => l.brand.toLowerCase().includes(filtro));
  } else if (modo === 'top') {
    visiveis = semOutras.slice(0, 20);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          <button
            onClick={() => setModo('top')}
            className={`px-3 py-1.5 text-sm ${modo === 'top' ? 'btnToggleActive' : 'bg-surface text-foreground hover:bg-surface-muted'}`}
          >
            Top 20
          </button>
          <button
            onClick={() => setModo('all')}
            className={`px-3 py-1.5 text-sm ${modo === 'all' ? 'btnToggleActive' : 'bg-surface text-foreground hover:bg-surface-muted'}`}
          >
            Todas
          </button>
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar marca"
          className="w-40 rounded-lg border border-border px-2.5 py-1.5 text-sm"
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-secondary">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-4">Marca</th>
            <th className="py-2 pr-6 text-right">Unidades</th>
            <th className="py-2 pr-4 min-w-[140px]">Share</th>
            <th className="py-2 pl-4 text-right">Δ volume</th>
            <th className="py-2 pl-4 text-right">Δ share</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((l, i) => <Linha key={l.brand} linha={l} pos={i + 1} maxShare={maxShare} />)}
          {!filtro && outras && <Linha linha={outras} pos="—" maxShare={maxShare} apagada />}
          {visiveis.length === 0 && (
            <tr><td colSpan={6} className="py-4 text-center text-text-muted">Nenhuma marca encontrada</td></tr>
          )}
        </tbody>
      </table>

      {!filtro && modo === 'top' && semOutras.length > 20 && (
        <button onClick={() => setModo('all')} className="mt-3 text-sm font-medium text-tegma-blue hover:underline">
          Ver todas as {semOutras.length} marcas →
        </button>
      )}
    </div>
  );
}

function Linha({ linha, pos, maxShare, apagada }: { linha: MontadoraLinha; pos: number | string; maxShare: number; apagada?: boolean }) {
  const corVol = linha.deltaUnitsPct === null ? 'text-text-muted' : linha.deltaUnitsPct > 0.001 ? 'text-success' : linha.deltaUnitsPct < -0.001 ? 'text-danger' : 'text-text-muted';
  const corShare = Math.abs(linha.deltaSharePP) < 0.0005 ? 'text-text-muted' : linha.deltaSharePP > 0 ? 'text-success' : 'text-danger';
  const largura = Math.max(2, Math.min(100, (linha.shareA / maxShare) * 100));
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-1.5 pr-2 text-text-muted">{pos}</td>
      <td className={`py-1.5 pr-4 ${apagada ? 'italic text-text-secondary' : 'text-foreground'}`}>{linha.brand}</td>
      <td className="py-1.5 pr-6 text-right">{Math.round(linha.unitsA).toLocaleString('pt-BR')}</td>
      <td className="py-1.5 pr-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded bg-surface-muted">
            <div className="h-1.5 rounded bg-tegma-blue" style={{ width: `${largura}%` }} />
          </div>
          <span className="w-12 text-right text-text-secondary">{(linha.shareA * 100).toFixed(1)}%</span>
        </div>
      </td>
      <td className={`py-1.5 pl-4 text-right ${corVol}`}>
        {linha.deltaUnitsPct === null ? '—' : `${linha.deltaUnitsPct > 0 ? '+' : ''}${(linha.deltaUnitsPct * 100).toFixed(1)}%`}
      </td>
      <td className={`py-1.5 pl-4 text-right ${corShare}`}>
        {`${linha.deltaSharePP > 0 ? '+' : ''}${(linha.deltaSharePP * 100).toFixed(2)} p.p.`}
      </td>
    </tr>
  );
}
