import RegiaoForm from './RegiaoForm';

export default function AdminRegioesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-tegma-dark">Regiões — lançamento mensal</h1>
        <p className="text-sm text-text-muted">
          Fonte: relatório mensal da Fenabrave. Digite o % de cada região (Ian já recebe esses números prontos).
        </p>
      </div>
      <RegiaoForm />
    </div>
  );
}
