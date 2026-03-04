import { usePortalContext } from '../context'
import { useQuery } from '@tanstack/react-query'
import { portalService } from '../service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, MapPin, Users, Clock, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PortalAgendaPage() {
  const { tenantId } = usePortalContext()
  
  const { data: eventos, isLoading } = useQuery({
    queryKey: ['portal', 'eventos', tenantId],
    queryFn: () => portalService.buscarEventos(tenantId!),
    enabled: !!tenantId
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  const formatarData = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), "dd 'de' MMMM", { locale: ptBR })
    } catch {
      return dataStr
    }
  }

  const formatarDiaSemana = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), "eeee", { locale: ptBR })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#134E4A] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#14B8A6]" />
            Agenda e Eventos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fique por dentro de tudo o que acontece na escola
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {eventos && eventos.length > 0 ? (
          eventos.map((evento: any) => (
            <Card key={evento.id} className="border-none shadow-md overflow-hidden bg-white group hover:shadow-xl transition-all duration-300 rounded-2xl">
              <div className="flex flex-col md:flex-row">
                {/* Data Block */}
                <div className="md:w-32 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] p-6 flex flex-col items-center justify-center text-white shrink-0">
                  <span className="text-3xl font-black mb-1">
                    {evento.data_inicio.split('-')[2]}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-tighter opacity-80">
                    {formatarData(evento.data_inicio).split(' de ')[1]}
                  </span>
                </div>

                {/* Content */}
                <CardContent className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                       <h3 className="text-xl font-black text-[#134E4A] group-hover:text-[#14B8A6] transition-colors leading-tight">
                         {evento.nome}
                       </h3>
                       <Badge variant="secondary" className="bg-[#F0FDFA] text-[#0D9488] border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                         {evento.publico_alvo === 'toda_escola' ? 'Geral' : 'Específico'}
                       </Badge>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                      {evento.description || evento.descricao || 'Nenhuma descrição fornecida para este evento.'}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-4 w-4 text-[#14B8A6]" />
                        <span className="text-xs font-bold">{formatarDiaSemana(evento.data_inicio)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="h-4 w-4 text-[#14B8A6]" />
                        <span className="text-xs font-bold capitalize">{evento.publico_alvo?.replace('_', ' ') || 'Toda Escola'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 md:mt-0">
                    <Button variant="ghost" className="text-[#14B8A6] font-bold text-xs gap-1 hover:bg-[#F0FDFA] rounded-full group/btn">
                      Ver detalhes
                      <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200">
              <Calendar size={40} />
            </div>
            <div className="max-w-xs transition-all animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-lg font-bold text-slate-700">Sem eventos próximos</h3>
              <p className="text-slate-500 text-sm mt-1">No momento não há eventos programados para os próximos dias.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="border-[#14B8A6] text-[#14B8A6] hover:bg-[#14B8A6]/10 rounded-full font-bold px-8"
        >
          Voltar
        </Button>
      </div>
    </div>
  )
}
