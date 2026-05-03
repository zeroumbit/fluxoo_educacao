import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useEscolaNotifications, useNotificacoesActions } from '@/hooks/useNotifications'
import { CreditCard, ExternalLink, CheckCircle2, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function PixManualBannerNotification() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { data } = useEscolaNotifications(authUser?.tenantId)
  const { marcarComoLida, marcarComoResolvida } = useNotificacoesActions()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)

  const pixNotifications = useMemo(() => {
    if (!data?.notificacoes) return []
    return data.notificacoes.filter(n => n.tipo === 'PAGAMENTO_PIX_MANUAL' && !n.resolvida && !n.lida)
  }, [data?.notificacoes])

  if (pixNotifications.length === 0) return null

  const cardsPerView = 4
  const showArrows = pixNotifications.length > cardsPerView

  const handleValidate = (n: any) => {
    navigate('/financeiro')
  }

  const handleWhatsApp = (n: any) => {
    const phone = n.metadata?.responsavel_telefone || n.metadata?.telefone
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')
    }
  }

  const goToPrev = () => {
    setCurrentIndex(prev => {
      const next = prev - cardsPerView
      return next < 0 ? Math.max(0, pixNotifications.length - cardsPerView) : next
    })
  }

  const goToNext = () => {
    setCurrentIndex(prev => {
      const next = prev + cardsPerView
      return next >= pixNotifications.length ? 0 : next
    })
  }

  const maxStartIndex = Math.max(0, pixNotifications.length - cardsPerView)
  const boundedIndex = Math.min(currentIndex, maxStartIndex)
  const cardWidth = 320
  const gap = 12
  const offset = -(boundedIndex * (cardWidth + gap))

  const totalPages = Math.ceil(pixNotifications.length / cardsPerView)
  const currentPage = Math.floor(currentIndex / cardsPerView)

  return (
    <div className="relative mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmação de pagamentos</h2>
      <div className={`relative ${pixNotifications.length === 1 ? 'flex justify-start' : 'flex items-center justify-center'} w-full px-4`}>
        {showArrows && (
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 shrink-0 h-10 w-10 rounded-full bg-white border border-indigo-200 shadow-md flex items-center justify-center hover:bg-indigo-50 transition-all text-indigo-600 hover:text-indigo-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className={`overflow-hidden ${pixNotifications.length === 1 ? 'w-auto' : 'w-full max-w-[1300px] mx-auto'}`}>
          <div 
            className="flex gap-3 flex-nowrap transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${offset}px)` }}
          >
            {pixNotifications.map((n) => (
              <div
                key={n.id}
                className="shrink-0 w-80 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative"
                onClick={() => setSelectedNotification(n)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-indigo-600 text-white border-0 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full">
                      {n.metadata?.tipo_cobranca || 'MENSALIDADE'}
                    </Badge>
                    <span className="text-sm font-bold text-indigo-900">
                      {Number(n.metadata?.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-indigo-900 text-sm truncate" title={n.metadata?.responsavel_nome}>
                        {n.metadata?.responsavel_nome}
                      </h4>
                      <p className="text-xs text-indigo-700/70 truncate" title={n.metadata?.aluno_nome}>
                        {n.metadata?.aluno_nome}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-600/60 truncate max-w-[150px]">
                      Ref: {n.metadata?.meses_referencia}
                    </span>
                    <span className="text-[10px] font-medium text-indigo-600">
                      Detalhes
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    marcarComoLida.mutate(n.id)
                  }}
                  className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-all text-indigo-400 hover:text-indigo-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {showArrows && (
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 shrink-0 h-10 w-10 rounded-full bg-white border border-indigo-200 shadow-md flex items-center justify-center hover:bg-indigo-50 transition-all text-indigo-600 hover:text-indigo-800"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {showArrows && totalPages > 1 && (
        <div className="flex justify-center mt-2 gap-1">
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * cardsPerView)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentPage ? 'w-6 bg-indigo-600' : 'w-1.5 bg-indigo-200'
              }`}
            />
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Dashboard</h2>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <CreditCard className="h-5 w-5" />
              Comprovante Pendente
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">
                      {selectedNotification.metadata?.responsavel_nome}
                    </p>
                    <p className="text-xs text-indigo-700">
                      {selectedNotification.metadata?.aluno_nome} • {selectedNotification.metadata?.turma_nome}
                    </p>
                  </div>
                  <Badge className="bg-indigo-600 text-white border-0 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full">
                    PIX MANUAL
                  </Badge>
                </div>
                <div className="pt-2 border-t border-indigo-100">
                  <p className="text-xs text-indigo-700">
                    <strong>Valor:</strong> {Number(selectedNotification.metadata?.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    <br />
                    <strong>Ref:</strong> {selectedNotification.metadata?.meses_referencia}
                    <br />
                    <strong>Tipo:</strong> <span className="capitalize">{selectedNotification.metadata?.tipo_cobranca || 'mensalidade'}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    handleValidate(selectedNotification)
                    setSelectedNotification(null)
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Validar no Financeiro
                </Button>
              </div>

              <div className="flex gap-2">
                {selectedNotification.metadata?.responsavel_telefone && (
                  <Button
                    variant="outline"
                    className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => handleWhatsApp(selectedNotification)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={() => {
                    marcarComoLida.mutate(selectedNotification.id)
                    marcarComoResolvida.mutate(selectedNotification.id)
                    setSelectedNotification(null)
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar lida
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
