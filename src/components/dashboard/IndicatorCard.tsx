function formatNumber(value: number, decimals: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const NEUTRO = 0.0005; // até ±0,05% considera estável

export default function IndicatorCard({
  label, value, unit, decimals, deltaPct, mesReferencia, inverse = false,
}: {
  label: string;
  value: number | null;
  unit: string;
  decimals: number;
  deltaPct: number | null;
  mesReferencia: string;
  /** true = subir é ruim (juros, inadimplência) — inverte a cor verde/vermelha. */
  inverse?: boolean;
}) {
  const subiu = deltaPct !== null && deltaPct > NEUTRO;
  const caiu = deltaPct !== null && deltaPct < -NEUTRO;
  const bom = subiu !== inverse; // subir é bom, exceto nos invertidos (e cair é bom neles)
  const cor = !subiu && !caiu ? 'text-text-muted' : bom ? 'text-success' : 'text-danger';
  const seta = deltaPct === null ? '' : subiu ? '▲' : caiu ? '▼' : '—';

  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-2xl font-semibold text-tegma-dark">
        {value === null ? '—' : formatNumber(value, decimals)}
        <span className="ml-1 text-sm font-normal text-text-muted">{unit}</span>
      </p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{mesReferencia}</span>
        {deltaPct !== null && (
          <span className={cor}>{seta} {Math.abs(deltaPct * 100).toFixed(1)}% a.a.</span>
        )}
      </div>
    </div>
  );
}
