import { useState, type ReactNode } from 'react';
import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-surface p-4">
          <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 shadow-dome">
            <div className="mb-6 flex items-center gap-3">
              <Logo size={36} />
              <div>
                <h2 className="font-orbitron text-[14px] font-bold tracking-wider text-navy">
                  ARK LEDGER
                </h2>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Acceso Multi-Tenant
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contador@despacho.com"
                  className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[13px] text-ink outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[13px] text-ink outline-none focus:border-navy"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-navy font-orbitron text-[11px] font-bold tracking-wider text-white shadow-sm transition hover:bg-navy-dark"
              >
                {loading ? 'INGRESANDO...' : 'ENTRAR AL SISTEMA'}
              </button>
            </form>
          </div>
        </div>
      </SignedOut>

      <SignedIn>{children}</SignedIn>
    </>
  );
}

export default AuthGate;
