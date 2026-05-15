import { Button } from '@/components/ui/button';
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/modules/auth/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function useGestorGuard() {
  const { authUser } = useAuth();
  const [config, setConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const requireConfirmation = (title: string, description: string, onConfirm: () => void) => {
    if (authUser?.role === 'gestor') {
      setConfig({ isOpen: true, title, description, onConfirm });
    } else {
      onConfirm();
    }
  };

  const closeDialog = () => {
    setConfig(prev => prev ? { ...prev, isOpen: false } : null);
  };

  const GestorGuardModal = () => {
    if (!config) return null;

    return (
      <Dialog open={config.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">{config.title}</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              {config.description}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-2">
            <p className="text-sm text-amber-800 font-medium leading-relaxed">
              <strong>Atenção:</strong> Como gestor, esta ação gerará um registro de auditoria no sistema com a sua identificação.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="flex-1 sm:flex-none h-11 font-bold border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                config.onConfirm();
                closeDialog();
              }}
              className="flex-1 sm:flex-none h-11 font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirmar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return { requireConfirmation, GestorGuardModal };
}
