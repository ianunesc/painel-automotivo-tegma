import { fetchIngestLog, fetchLastMonthByIndicator } from '@/lib/data';
import { atualizarBcb, atualizarAnfavea, atualizarAutoo } from './actions';
import UpdateSourceButton from '@/components/admin/UpdateSourceButton';

export default async function AdminHomePage() {
  const [log, lastMonth] = await Promise.all([fetchIngestLog(20), fetchLastMonthByIndicator()]);
  const anoAtual = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-tegma-dark">Atualizar fontes</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex flex-col gap-2">
          <p className="text-sm font-medium text-tegma-dark">Banco Central (crédito PF)</p>
          <p className="text-xs text-text-muted">Último mês: {lastMonth.get('credito_saldo')?.slice(0, 7) ?? '—'}</p>
          <UpdateSourceButton label="Atualizar BCB" action={atualizarBcb} />
        </div>
        <div className="card flex flex-col gap-2">
          <p className="text-sm font-medium text-tegma-dark">Anfavea (mercado)</p>
          <p className="text-xs text-text-muted">Último mês: {lastMonth.get('licenciamento')?.slice(0, 7) ?? '—'}</p>
          <UpdateSourceButton label={`Atualizar Anfavea ${anoAtual}`} action={atualizarAnfavea.bind(null, anoAtual)} />
        </div>
        <div className="card flex flex-col gap-2">
          <p className="text-sm font-medium text-tegma-dark">Autoo (montadoras)</p>
          <p className="text-xs text-text-muted">Depende do licenciamento Anfavea já carregado</p>
          <UpdateSourceButton label={`Atualizar Autoo ${anoAtual}`} action={atualizarAutoo.bind(null, anoAtual)} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-medium text-tegma-dark">Histórico de atualizações</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="py-1.5">Quando</th>
              <th className="py-1.5">Fonte</th>
              <th className="py-1.5">Status</th>
              <th className="py-1.5">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-text-muted">Nenhuma atualização registrada ainda.</td></tr>
            )}
            {log.map((l, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="py-1.5 text-text-muted">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                <td className="py-1.5">{l.source}</td>
                <td className={`py-1.5 ${l.status === 'ok' ? 'text-success' : l.status === 'alerta' ? 'text-tegma-orange-dark' : 'text-danger'}`}>
                  {l.status}
                </td>
                <td className="py-1.5 text-text-secondary">{l.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
