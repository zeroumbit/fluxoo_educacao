import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CarFront, Clock, UserCheck, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { toast } from 'sonner'

export function FilaVirtualAdminPage() {
  const { authUser } = useAuth()
  const queryClient = useQueryClient()

  // Buscar Fila de Hoje da Escola (BI Zero Cost em tempo real)
  const { data: filaData, isLoading } = useQuery({
    queryKey: ['fila_virtual_admin', authUser?.tenantId],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('fila_virtual')
        .select(`
          *,
          alunos (nome_completo),
          responsaveis (nome_completo)
        `)
        .eq('tenant_id', authUser!.tenantId)
        .gte('created_at', `${hoje}T00:00:00.000Z`)
        .order('created_at', { ascending: true }) // Quem chegou antes, aparece primeiro
      
      if (error) throw error
      return data || []
    },
    enabled: !!authUser?.tenantId,
    refetchInterval: 10000 // Polling a cada 10s para a portaria
  })

  // Marcar como atendido/entregue
  const liberarMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('fila_virtual' as any) as any)
        .update({ 
          status: 'atendido', 
          data_atendimento: new Date().toISOString() 
        } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Aluno liberado da fila!')
      queryClient.invalidateQueries({ queryKey: ['fila_virtual_admin'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }) // Opcional, pode atualizar média móvel
    }
  })

  // Consulta Inteligência de Tempo Médio (Zero Cost)
  const { data: tempoMedioData } = useQuery({
    queryKey: ['fila_tempo_medio', authUser?.tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_fila_tempo_medio')
        .select('*')
        .eq('tenant_id', authUser!.tenantId)
        .maybeSingle()
      
      if (error) {
        console.warn('View vw_fila_tempo_medio não encontrada ou com erro', error)
        return null
      }
      return data
    },
    enabled: !!authUser?.tenantId
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const aguardando = (filaData as any[])?.filter((f: any) => f.status === 'aguardando') || []
  const concluidos = (filaData as any[])?.filter((f: any) => f.status === 'atendido') || []
  const minMedio = (tempoMedioData as any)?.tempo_medio_minutos ? Math.round(Number((tempoMedioData as any).tempo_medio_minutos)) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portaria Expresso</h1>
          <p className="text-muted-foreground">Fila de saída de alunos em tempo real</p>
        </div>
        
        {minMedio !== null && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-800 rounded-full border border-blue-100 shadow-sm">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Tempo Médio de Liberação: <strong>{minMedio} min</strong></span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Painel de Chamada Principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-blue-200 shadow-lg overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CarFront className="h-6 w-6" />
                Painel de Chamada
              </h2>
              <Badge variant="outline" className="bg-blue-500/20 text-white border-blue-400">
                {aguardando.length} Aguardando
              </Badge>
            </div>
            <CardContent className="p-0 bg-blue-50/10 min-h-[400px]">
              {aguardando.length > 0 ? (
                <div className="divide-y divide-blue-50">
                  {aguardando.map((registro: any) => (
                    <div key={registro.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-zinc-50 transition-colors animate-in slide-in-from-left duration-300">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-3xl font-black text-zinc-900 tracking-tight">
                            {(registro.alunos as any)?.nome_completo || 'Aluno'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-md">
                            <UserCheck className="h-4 w-4" /> Resp: {(registro.responsaveis as any)?.nome_completo || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                            <Clock className="h-4 w-4" /> Chegou às {format(new Date(registro.created_at), "HH:mm")}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        size="lg" 
                        onClick={() => liberarMut.mutate(registro.id)}
                        disabled={liberarMut.isPending}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl h-14 sm:w-40 w-full rounded-xl text-lg font-bold"
                      >
                        <CheckCircle2 className="mr-2 h-6 w-6" />
                        LIBERAR
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center h-full text-zinc-400">
                  <CarFront className="h-20 w-20 mb-4 opacity-10" />
                  <p className="text-xl font-medium text-zinc-600">Fila Limpa</p>
                  <p className="mt-1">Nenhum responsável informou aproximação no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico do Dia */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md flex flex-col max-h-[500px]">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base flex justify-between items-center">
                <span>Alunos Liberados Hoje</span>
                <Badge variant="secondary">{concluidos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {concluidos.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                  {concluidos.map((registro: any) => {
                    const chegada = new Date(registro.created_at).getTime()
                    const saida = new Date(registro.data_atendimento).getTime()
                    const minsEspera = Math.round((saida - chegada) / 60000)

                    return (
                      <div key={registro.id} className="p-4 text-sm flex items-center justify-between">
                        <div>
                          <p className="font-bold text-zinc-800 line-clamp-1">
                            {(registro.alunos as any)?.nome_completo || 'Aluno'}
                          </p>
                          <p className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                            <span>Saiu {format(new Date(registro.data_atendimento), 'HH:mm')}</span>
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={minsEspera > 10 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                        >
                          {minsEspera} min
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma liberação registrada hoje.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200 shadow-sm">
            <CardContent className="p-4 flex gap-3 text-amber-800 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Mantenha esta tela aberta em um tablet ou monitor na portaria para gerenciar as saídas em tempo real.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
