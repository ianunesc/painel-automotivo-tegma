import Link from 'next/link';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/comparativo', label: 'Análise comparativa' },
  { href: '/historico', label: 'Análise histórica' },
  { href: '/regioes', label: 'Regiões' },
  { href: '/montadoras', label: 'Montadoras' },
];

export default function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/" className="text-lg font-semibold text-tegma-dark">
              Painel do Mercado Automotivo <span className="text-tegma-orange">— Tegma RI</span>
            </Link>
            <p className="text-xs text-text-muted">Uma iniciativa do RI da Tegma (B3: TGMA3)</p>
          </div>
          <a
            href="https://ri.tegma.com.br"
            className="flex items-center gap-1 text-sm font-medium text-tegma-blue hover:underline"
          >
            ← Voltar ao RI da Tegma
          </a>
        </div>
        <nav className="flex flex-wrap gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition hover:bg-surface-muted hover:text-tegma-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
