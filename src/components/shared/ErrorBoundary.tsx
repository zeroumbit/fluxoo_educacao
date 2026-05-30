import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { AlertTriangle,Home,MessageCircle,RefreshCcw } from "lucide-react";
import { Component,type ErrorInfo,type ReactNode } from "react";

let _captureException: ((error: unknown, context?: Record<string, unknown>) => void) | null = null

async function getCaptureException() {
  if (_captureException) return _captureException

  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    const { captureException } = await import("@/lib/sentry")
    _captureException = captureException
  } else {
    _captureException = () => {}
  }

  return _captureException
}

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function isRecoverableChunkLoadError(error: Error): boolean {
  const message = `${error.name || ''} ${error.message || ''}`.toLowerCase();
  return message.includes('failed to fetch dynamically imported module')
    || message.includes('outdated optimize dep')
    || message.includes('importing a module script failed')
    || message.includes('chunkloaderror')
    || message.includes('loading chunk');
}

function getChunkRetryKey(error: Error): string {
  const message = `${error.name || ''}:${error.message || ''}:${window.location.pathname}`.toLowerCase();
  let hash = 0;

  for (let index = 0; index < message.length; index += 1) {
    hash = ((hash << 5) - hash) + message.charCodeAt(index);
    hash |= 0;
  }

  return `fluxoo:chunk-reload-retried:${Math.abs(hash)}`;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught error", error, errorInfo);
    getCaptureException().then(capture => capture(error, { action: 'global-error-boundary' }))

    if (isRecoverableChunkLoadError(error)) {
      const retryKey = getChunkRetryKey(error);
      const alreadyRetried = (() => {
        try {
          return sessionStorage.getItem(retryKey) === 'true';
        } catch {
          return true;
        }
      })();

      if (!alreadyRetried) {
        try {
          sessionStorage.setItem(retryKey, 'true');
        } catch {
          // Se storage estiver indisponivel, mantem o fallback visual.
        }
        window.location.reload();
      }
    } else {
      try {
        Object.keys(sessionStorage)
          .filter(key => key.startsWith('fluxoo:chunk-reload-retried:'))
          .forEach(key => sessionStorage.removeItem(key));
      } catch {
        // Sem acao: alguns browsers podem bloquear sessionStorage.
      }
    }
  }

  private handleBackToHome = () => {
    window.location.href = "/";
  };

  private handleReload = () => {
    try {
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('fluxoo:chunk-reload-retried:'))
        .forEach(key => sessionStorage.removeItem(key));
    } catch {
      // Sem acao: recarregar ainda e a melhor recuperacao.
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="h-20 w-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-xl shadow-rose-100/50">
            <AlertTriangle size={40} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight italic uppercase">Ops! Algo deu errado</h1>
          <p className="text-slate-500 font-bold mb-8 max-w-md italic leading-relaxed">
            Ocorreu um erro inesperado ao carregar esta página. Não se preocupe, seus dados estão seguros.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button 
              onClick={this.handleReload}
              className="h-14 rounded-2xl bg-slate-900 hover:bg-teal-600 text-white font-black uppercase tracking-widest gap-3 flex-1 shadow-xl shadow-slate-200"
            >
              <RefreshCcw size={18} /> Tentar Novamente
            </Button>
            
            <Button 
              variant="outline"
              onClick={this.handleBackToHome}
              className="h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest gap-3 flex-1"
            >
              <Home size={18} /> Início
            </Button>
          </div>

          <a
            href="https://wa.me/5585997277128?text=tem%20um%20problema%20no%20Fluxoo%20Educa%C3%A7%C3%A3o%20preciso%20de%20suporte%20urgente%21"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-sm transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
            Contate o suporte imediatamente pelo whatsapp: (85) 9 9727-7128
          </a>

          {!import.meta.env.PROD && (
            <div className="mt-12 p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-lg w-full">
              <p className="text-[10px] font-mono text-slate-400 text-left line-clamp-3 overflow-hidden break-all">
                {this.state.error?.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
