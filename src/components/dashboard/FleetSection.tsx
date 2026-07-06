export default function FleetSection({
  frota, idadeMedia, ano,
}: {
  frota: number | null;
  idadeMedia: number | null;
  ano: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-text-secondary">Frota circulante {ano ? `(${ano})` : ''}</p>
        <p className="text-xl font-semibold text-tegma-dark">
          {frota === null ? '—' : `${frota.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`}
        </p>
      </div>
      <div>
        <p className="text-xs text-text-secondary">Idade média da frota</p>
        <p className="text-xl font-semibold text-tegma-dark">
          {idadeMedia === null ? '—' : `${idadeMedia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos`}
        </p>
      </div>
    </div>
  );
}
