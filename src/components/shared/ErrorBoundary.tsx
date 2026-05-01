import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/sentry";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    captureException(error, { action: 'global-error-boundary' });
  }

  private handleBackToHome = () => {
    window.location.href = "/";
  };

  private handleReload = () => {
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

          <div className="mt-12 p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-lg w-full">
            <p className="text-[10px] font-mono text-slate-400 text-left line-clamp-3 overflow-hidden break-all">
              {this.state.error?.toString()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
