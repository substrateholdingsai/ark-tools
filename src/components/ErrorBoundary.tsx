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
        <div className="min-h-[400px] flex items-center justify-center p-6 my-8">
          <div className="max-w-md w-full rounded-[24px] border border-amber-200/80 bg-surface p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Aislamiento de Error — ARK
              </span>
              <h2 className="text-xl font-black text-navy tracking-tight">
                {this.props.toolName
                  ? `Interrupción en ${this.props.toolName}`
                  : 'Ocurrió un error inesperado'}
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                El sistema aisló una excepción para proteger la integridad de tus datos. Puedes reintentar la acción o volver al inicio.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="rounded-xl bg-canvas border border-line p-3 text-left">
                <p className="text-[10px] font-mono text-muted uppercase font-bold mb-1">
                  Detalle técnico:
                </p>
                <p className="text-xs font-mono text-ink/80 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-navy/90 transition shadow-sm active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.props.onReset}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-navy hover:bg-canvas transition active:scale-[0.98]"
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
