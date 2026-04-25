import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useEscolaNotifications, useNotificacoesActions } from '@/hooks/useNotifications'
import { CreditCard, Phone, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function PixManualBannerNotification() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { data } = useEscolaNotifications(authUser?.tenantId)
  const { marcarComoLida } = useNotificacoesActions()
  
  // Filtra apenas notificações de pix manual que não foram resolvidas
  const pixNotifications = useMemo(() => {
    if (!data?.notificacoes) return []
    return data.notificacoes.filter(n => n.tipo === 'PAGAMENTO_PIX_MANUAL' && !n.resolvida && !n.lida)
  }, [data?.notificacoes])
  
  if (pixNotifications.length === 0) return null

  return (
    <div className="space-y-4 mb-6">
      {pixNotifications.map((n) => (
        <div 
          key={n.id} 
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-50 via-white to-blue-50 border border-indigo-200 shadow-md shadow-indigo-100/30 transition-all hover:shadow-lg"
        >
          {/* Badge Flutuante */}
          <div className="absolute top-4 left-6 z-10">
            <Badge className="bg-indigo-600 text-white border-0 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full">
              PIX MANUAL
            </Badge>
          </div>

          <div className="p-6 pt-12 flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
               <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-black text-indigo-900 text-lg tracking-tight mb-1">
                Comprovante pendente de conferência
              </h3>
              <p className="text-sm font-medium text-indigo-700/80 mb-4 leading-relaxed">
                <strong className="text-indigo-900">{n.metadata?.responsavel_nome}</strong> enviou comprovante de 
                <strong className="text-indigo-600"> R$ {Number(n.metadata?.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                <br />
                Aluno: {n.metadata?.aluno_nome} ({n.metadata?.turma_nome}) | Ref: {n.metadata?.meses_referencia}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-indigo-100">
                  <Phone className="h-3.5 w-3.5 text-indigo-500" />
                  <p className="text-[10px] font-bold text-indigo-600">
                    Valide se o valor caiu na conta e veja o WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => marcarComoLida.mutate(n.id)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-all text-indigo-400 hover:text-indigo-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
