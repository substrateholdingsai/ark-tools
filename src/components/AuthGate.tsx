import { useState, type ReactNode } from 'react';
import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await login({ email, tenantName });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="max-w-md w-full p-8 rounded-3xl border border-line bg-white shadow-dome">
            <div className="flex items-center gap-3 mb-6">
              <Logo size={36} />
              <div>
                <h2 className="font-orbitron font-bold text-[14px] tracking-wider text-navy">
                  ARK TOOLS
                </h2>
                <p className="text-[10px] text-muted tracking-widest font-semibold uppercase">
                  Acceso Multi-Tenant
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5 font-orbitron">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contador@despacho.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface-2 text-[13px] text-ink outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5 font-orbitron">
                  Nombre del Despacho / Empresa
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Mi Firma Contable S.C."
                  className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface-2 text-[13px] text-ink outline-none focus:border-navy"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-navy hover:bg-navy-dark text-white font-orbitron font-bold text-[11px] tracking-wider transition shadow-sm"
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
