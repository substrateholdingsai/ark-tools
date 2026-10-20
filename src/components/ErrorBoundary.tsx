import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  toolName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ARK ErrorBoundary] Error no controlado capturado:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="my-8 flex min-h-[400px] items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 rounded-[24px] border border-amber-200/80 bg-surface p-8 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-amber-600">
                Aislamiento de Error — ARK
              </span>
              <h2 className="text-xl font-black tracking-tight text-navy">
                {this.props.toolName
                  ? `Interrupción en ${this.props.toolName}`
                  : 'Ocurrió un error inesperado'}
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                El sistema aisló una excepción para proteger la integridad de tus datos. Puedes
                reintentar la acción o volver al inicio.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-canvas rounded-xl border border-line p-3 text-left">
                <p className="mb-1 font-mono text-[10px] font-bold uppercase text-muted">
                  Detalle técnico:
                </p>
                <p className="line-clamp-3 break-words font-mono text-xs text-ink/80">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90 active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.props.onReset}
                  className="hover:bg-canvas inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-navy transition active:scale-[0.98]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Catálogo
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
