import { fetchSourceStatus } from '@/lib/data';

const FONTES = [
  { key: 'anfavea', label: 'Anfavea (licenciamento, produção, exportação, importados)' },
  { key: 'bcb', label: 'Banco Central — SGS (crédito PF)' },
  { key: 'fenabrave', label: 'Fenabrave (vendas por região)' },
  { key: 'autoo', label: 'Autoo (vendas por montadora)' },
  { key: 'sindipecas', label: 'Sindipeças (frota e idade média)' },
];

function formatarData(iso: string | undefined) {
  if (!iso) return 'ainda não carregado';
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default async function Footer() {
  let status = new Map<string, string>();
  try {
    status = await fetchSourceStatus();
  } catch {
    // Supabase ainda não configurado — rodapé exibe "ainda não carregado"
  }

  return (
    <footer className="border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-text-secondary">
        <p className="mb-2 font-medium text-text-secondary">Fontes e última atualização</p>
        <ul className="mb-4 grid gap-1 sm:grid-cols-2">
          {FONTES.map((f) => (
            <li key={f.key}>
              {f.label}: <span className="text-text-muted">{formatarData(status.get(f.key))}</span>
            </li>
          ))}
        </ul>
        <p className="max-w-3xl leading-relaxed text-text-muted">
          Este painel é uma iniciativa do time de Relações com Investidores da Tegma, oferecido
          como cortesia ao mercado. As informações são compiladas de fontes públicas e a Tegma
          não se responsabiliza pela exatidão, completude ou atualização dos dados, que não
          substituem as publicações oficiais das respectivas fontes e não constituem
          recomendação de investimento.
        </p>
      </div>
    </footer>
  );
}
