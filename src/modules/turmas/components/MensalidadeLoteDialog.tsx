import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTurmaBilling } from '../hooks'
import { useAuth } from '@/modules/auth/AuthContext'

interface MensalidadeLoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  turmaId: string;
  turmaNome: string;
  valorAtual?: number;
}

export function MensalidadeLoteDialog({ 
  isOpen, 
  onClose, 
  turmaId, 
  turmaNome,
  valorAtual 
}: MensalidadeLoteDialogProps) {
  const { authUser } = useAuth()
  const [valor, setValor] = useState<string>(valorAtual?.toString() || '')
  const { updateMensalidadeTurma, isUpdating } = useTurmaBilling()

  const handleConfirmar = async () => {
    if (!authUser?.tenantId) return

    const valorNum = parseFloat(valor.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error('Informe um valor válido maior que zero')
      return
    }

    try {
      await updateMensalidadeTurma.mutateAsync({
        turmaId,
        tenantId: authUser.tenantId,
        valor: valorNum
      })
      onClose()
    } catch (error) {
      // toast error is handled in useTurmaBilling
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden bg-white">
        <div className="bg-emerald-500 p-8 flex items-center justify-center">
            <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl">
                <Calculator size={32} className="text-white" />
            </div>
        </div>

        <div className="p-8 space-y-6">
            <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Mensalidade em Lote
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-sm">
                    Atualize o valor de mensalidade para todos os alunos matriculados na turma <span className="font-bold text-emerald-600">{turmaNome}</span>.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="valor" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Novo Valor da Mensalidade (R$)</Label>
                    <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 450,00"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                    />
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Esta ação alterará o valor das cobranças futuras e pode impactar o planejamento financeiro destes alunos.
                    </p>
                </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between pt-4">
                <Button 
                    variant="ghost" 
                    onClick={onClose}
                    className="h-12 px-6 rounded-2xl font-bold text-slate-400 uppercase tracking-widest text-[10px]"
                >
                    Cancelar
                </Button>
                <Button 
                    onClick={handleConfirmar}
                    disabled={isUpdating}
                    className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 flex gap-2"
                >
                    {isUpdating && <Loader2 size={16} className="animate-spin" />}
                    Confirmar Alteração
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
