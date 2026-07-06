import Link from 'next/link';
import { logout } from '../login/actions';

const NAV = [
  { href: '/admin', label: 'Atualizar fontes' },
  { href: '/admin/regioes', label: 'Regiões (mensal)' },
  { href: '/admin/frota', label: 'Frota (anual)' },
  { href: '/admin/editar', label: 'Editar dados' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <nav className="flex flex-wrap gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-muted hover:text-tegma-dark">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="text-sm text-text-muted hover:text-danger">Sair</button>
        </form>
      </div>
      {children}
    </div>
  );
}
