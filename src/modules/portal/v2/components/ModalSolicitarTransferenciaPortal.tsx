import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEscolas } from '@/modules/escolas/hooks'
import { useSolicitarTransferenciaResponsavel } from '@/modules/portal/hooks'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

interface ModalSolicitarTransferenciaPortalProps {
  isOpen: boolean
  onClose: () => void
  aluno: {
    id: string
    nome_completo: string
    tenant_id: string
  } | null
}

export function ModalSolicitarTransferenciaPortal({
  isOpen,
  onClose,
  aluno
}: ModalSolicitarTransferenciaPortalProps) {
  const { data: escolas } = useEscolas()
  const solicitar = useSolicitarTransferenciaResponsavel()
  const [destinoId, setDestinoId] = useState('')
  const [motivo, setMotivo] = useState('')

  const handleSolicitar = async () => {
    if (!aluno || !destinoId || !motivo.trim()) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      await solicitar.mutateAsync({
        alunoId: aluno.id,
        origemId: aluno.tenant_id,
        destinoId,
        motivo
      })
      toast.success('Solicitação enviada com sucesso!')
      onClose()
      setDestinoId('')
      setMotivo('')
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar solicitação')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[450px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
            <Send className="h-5 w-5 text-indigo-600" />
            Solicitar Transferência
          </DialogTitle>
          <DialogDescription>
            Inicie um pedido de transferência para {aluno?.nome_completo}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Escola de Destino</Label>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100">
                <SelectValue placeholder="Para qual escola deseja transferir?" />
              </SelectTrigger>
              <SelectContent>
                {escolas?.map((e) => (
                  e.id !== aluno?.tenant_id && (
                    <SelectItem key={e.id} value={e.id}>
                      {e.razao_social || e.nome}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Motivo da Solicitação</Label>
            <Textarea
              placeholder="Ex: Mudança de endereço, preferência pedagógica..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-100 resize-none"
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
             <p className="text-xs text-amber-800 leading-relaxed font-medium">
                <strong>Importante:</strong> Ao solicitar, a escola de origem será notificada e terá até 30 dias para efetivar a transferência. A escola de destino também precisará aceitar o aluno.
             </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button
            onClick={handleSolicitar}
            disabled={solicitar.isPending}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8"
          >
            {solicitar.isPending ? <Loader2 className="animate-spin" /> : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
