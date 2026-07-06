import FrotaForm from './FrotaForm';

export default function AdminFrotaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Frota — lançamento anual</h1>
        <p className="text-sm text-text-muted">Fonte: Sindipeças. Um lançamento por ano, quando o dado novo sair.</p>
      </div>
      <FrotaForm />
    </div>
  );
}
