import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

interface ModalCopyConfirmProps {
  isOpen: boolean
  onClose: () => void
  value: string
}

export function ModalCopyConfirm({ isOpen, onClose, value }: ModalCopyConfirmProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[380px] rounded-3xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 pb-8 text-center border-b border-amber-200/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center mx-auto mb-4">
            <Copy className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-lg font-black text-slate-800 mb-1">
            Copiar ID do Aluno
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-medium">
            Confirme a cópia do código de transferência
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center">
              Código
            </p>
            <p className="font-mono font-bold text-sm text-slate-800 text-center tracking-widest">
              {value}
            </p>
          </div>

          <DialogFooter className="!gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl text-slate-500 font-bold hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCopy}
              className="flex-1 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2 shadow-lg shadow-amber-500/20"
            >
              <Check className="h-4 w-4" />
              Copiar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}