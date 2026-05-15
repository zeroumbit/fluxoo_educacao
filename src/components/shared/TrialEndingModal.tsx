import { Button } from '@/components/ui/button'
import { Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from '@/components/ui/dialog'
import { Clock,CreditCard } from 'lucide-react'
import { useEffect,useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface TrialEndingModalProps {
  assinatura: {
    isTrial: boolean
    diasRestantes: number
    totalDiasTeste: number
    dataFimTeste: string | null
    valorPlano: number
  } | null
  isGestorOrFinanceiro: boolean
}

export function TrialEndingModal({ assinatura, isGestorOrFinanceiro }: TrialEndingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Apenas mostra se tiver dados de assinatura e o usuário tiver permissão (Gestor ou Financeiro)
    if (!assinatura || !isGestorOrFinanceiro) return

    // Se estiver em período de teste e faltarem 7 dias ou menos para o fim
    if (assinatura.isTrial && assinatura.diasRestantes <= 7) {
      // Verifica se já foi fechado nesta sessão para não ser muito intrusivo a cada navegação
      const alreadySeen = sessionStorage.getItem('trial_ending_modal_seen')
      if (!alreadySeen) {
        setIsOpen(true)
      }
    }
  }, [assinatura, isGestorOrFinanceiro])

  const handleClose = () => {
    sessionStorage.setItem('trial_ending_modal_seen', 'true')
    setIsOpen(false)
  }

  const handleGoToPlanos = () => {
    handleClose()
    navigate('/plano')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose()
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">Seu período de teste está acabando!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Faltam apenas <strong className="text-amber-600">{assinatura?.diasRestantes} dias</strong> para o fim do seu plano gratuito de {assinatura?.totalDiasTeste} dias.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center text-sm text-zinc-600">
          <p>
            Para continuar aproveitando todas as funcionalidades do Fluxoo Educacional sem interrupções, 
            escolha um plano pago agora mesmo.
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">
          <Button onClick={handleGoToPlanos} className="w-full gap-2" size="lg">
            <CreditCard className="h-4 w-4" />
            Ver Planos e Assinar
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full">
            Lembrar mais tarde
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
