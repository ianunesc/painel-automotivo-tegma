import { login } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const erro = sp.erro as string | undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form action={login} className="card w-full max-w-sm flex flex-col gap-3">
        <h1 className="text-lg font-semibold text-tegma-dark">Acesso Admin</h1>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          E-mail
          <input name="email" type="email" required className="rounded-lg border border-border px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Senha
          <input name="password" type="password" required className="rounded-lg border border-border px-3 py-2 text-sm" />
        </label>
        {erro && <p className="text-sm text-danger">E-mail ou senha inválidos.</p>}
        <button type="submit" className="btnPrimary mt-2">Entrar</button>
      </form>
    </div>
  );
}
