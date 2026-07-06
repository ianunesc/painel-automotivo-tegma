function formatNumber(value: number, decimals: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function IndicatorCard({
  label, value, unit, decimals, deltaPct, mesReferencia,
}: {
  label: string;
  value: number | null;
  unit: string;
  decimals: number;
  deltaPct: number | null;
  mesReferencia: string;
}) {
  const cor = deltaPct === null ? 'text-text-muted' : deltaPct > 0.05 ? 'text-success' : deltaPct < -0.05 ? 'text-danger' : 'text-text-muted';
  const seta = deltaPct === null ? '' : deltaPct > 0.05 ? '▲' : deltaPct < -0.05 ? '▼' : '—';

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
