import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShieldCheck, ShieldOff, Info, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface GatewayConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  gateway: string
  isAtivando: boolean
  isPending: boolean
}

const gatewayMap: Record<string, { nome: string; icon: string }> = {
  asaas: { nome: 'Asaas', icon: '🟢' },
  mercado_pago: { nome: 'Mercado Pago', icon: '🟡' },
  abacate_pay: { nome: 'Abacate Pay', icon: '🥑' },
  efi: { nome: 'EFI (EfiPay)', icon: '🔵' },
  pagseguro: { nome: 'PagSeguro', icon: '🟣' }
}

export function GatewayConfirmDialog({ open, onClose, onConfirm, gateway, isAtivando, isPending }: GatewayConfirmDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const gw = gatewayMap[gateway] || { nome: gateway, icon: '🔵' }

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setConfirmed(false)
    }
  }

  if (isAtivando) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[520px] rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{gw.icon}</span>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Ativar {gw.nome}
                </DialogTitle>
                <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-none">
                  Disponibilizar para todas as escolas
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Box informativa */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">O que acontece ao ativar?</p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>Todas as escolas poderão configurar seus tokens no painel <strong>Configurações &gt; Gateway</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>Pagamentos via {gw.nome} serão processados normalmente</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>Webhooks começarão a ser recebidos pela plataforma</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Campos que escola precisará */}
            <div className="rounded-lg bg-slate-100 dark:bg-slate-900 p-4 space-y-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Campos que cada escola precisará configurar:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">API Key*</Badge>
                <Badge variant="outline" className="text-xs">Webhook URL</Badge>
              </div>
            </div>

            {/* Checkbox de confirmação */}
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Confirmo que desejo ativar <strong>{gw.nome}</strong> para toda a plataforma.
              </span>
            </label>
          </div>

          <DialogFooter className="p-6 pt-0 gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmed || isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Ativar Gateway
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Desativando
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900">
              <ShieldOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-red-700 dark:text-red-300 leading-none">
                Desativar {gw.nome}?
              </DialogTitle>
              <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-none">
                Ação com impacto em toda a plataforma
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Box de atenção */}
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Atenção: consequências</p>
                <ul className="text-xs text-red-700 dark:text-red-300 mt-2 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold mt-px">1.</span>
                    <span>Nenhuma escola poderá receber pagamentos via {gw.nome}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold mt-px">2.</span>
                    <span>Webhooks deste gateway serão rejeitados pela plataforma</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold mt-px">3.</span>
                    <span>Configurações das escolas <strong>não serão perdidas</strong> (mantidas no banco)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Box de recomendação */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Recomendação</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Notifique as escolas antes de desativar um gateway em produção. 
                  Isso evita interrupções inesperadas nos recebimentos.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox de confirmação */}
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Entendo os impactos e confirmo a desativação de <strong>{gw.nome}</strong> para toda a plataforma.
            </span>
          </label>
        </div>

        <DialogFooter className="p-6 pt-0 gap-2 flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!confirmed || isPending}
            variant="destructive"
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Desativando...
              </>
            ) : (
              <>
                <ShieldOff className="h-4 w-4 mr-2" />
                Desativar Gateway
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
