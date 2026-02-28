import { useFilaVirtual, useEntrarNaFila, useCancelarFila } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, CarFront, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { SeletorAluno } from '../components/SeletorAluno'

export function PortalFilaVirtualPage() {
  const { alunoSelecionado, tenantId, responsavel, isMultiAluno } = usePortalContext()
  const { data: historicoFila, isLoading } = useFilaVirtual()
  
  const entrarMut = useEntrarNaFila()
  const cancelarMut = useCancelarFila()

  // Verifica se há alguma fila ativa (aguardando)
  const filaAtiva = historicoFila?.find(f => f.status === 'aguardando')

  const handleEntrarFila = async () => {
    if (!alunoSelecionado || !tenantId || !responsavel) return

    try {
      await entrarMut.mutateAsync({
        tenant_id: tenantId,
        aluno_id: alunoSelecionado.id,
        responsavel_id: responsavel.id,
      })
      toast.success('Você entrou na Fila Virtual!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao entrar na fila.')
    }
  }

  const handleCancelar = async (id: string) => {
    try {
      await cancelarMut.mutateAsync(id)
      toast.success('Entrada cancelada da fila.')
    } catch {
      toast.error('Erro ao cancelar a fila.')
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'aguardando': return <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase px-3 py-1 font-bold">Aguardando na Portaria</Badge>
      case 'atendido': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase px-3 py-1 font-bold">Aluno Entregue</Badge>
      case 'cancelado': return <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 uppercase px-3 py-1 font-bold">Cancelado</Badge>
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <TrendingUp className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecione um aluno</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Fila Virtual</h2>
      </div>
      
      <p className="text-muted-foreground">Avise a escola que você está chegando para buscar o aluno.</p>

      {isMultiAluno && <SeletorAluno />}

      {/* Ação Principal */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
          <CarFront className="h-48 w-48" />
        </div>
        <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-black mb-2">
              {filaAtiva ? 'Escola Avisada!' : 'Chegando na escola?'}
            </h3>
            <p className="text-blue-100 max-w-sm text-sm opacity-90 leading-relaxed font-medium">
              {filaAtiva 
                ? 'Seu nome já está no painel da zeladoria/portaria. Aguarde o aluno na saída.'
                : 'Pressione o botão para que a portaria prepare a saída do aluno com antecedência.'}
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-auto flex flex-col gap-3">
            {!filaAtiva ? (
              <Button 
                size="lg" 
                className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold h-14 shadow-xl border-0"
                onClick={handleEntrarFila}
                disabled={entrarMut.isPending}
              >
                {entrarMut.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CarFront className="h-6 w-6 mr-2 opacity-80" />}
                ESTOU CHEGANDO
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-14 shadow-xl border-0"
                onClick={() => handleCancelar(filaAtiva.id)}
                disabled={cancelarMut.isPending}
              >
                {cancelarMut.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <XCircle className="h-6 w-6 mr-2 opacity-70" />}
                CANCELAR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico Recente */}
      <h3 className="text-lg font-bold mt-10 mb-4 text-zinc-800 px-1">Histórico Recente</h3>
      
      {historicoFila && historicoFila.length > 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0 divide-y divide-zinc-100">
            {historicoFila.slice(0, 5).map((registro) => (
              <div key={registro.id} className="flex items-center justify-between p-5 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start gap-4">
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    registro.status === 'aguardando' ? 'bg-amber-100 text-amber-600' :
                    registro.status === 'atendido' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {registro.status === 'aguardando' ? <CarFront className="h-5 w-5" /> :
                     registro.status === 'atendido' ? <CheckCircle className="h-5 w-5" /> : 
                     <XCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 leading-none mb-1.5">
                      {format(new Date(registro.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </h4>
                    {alunoSelecionado.nome_social || alunoSelecionado.nome_completo}
                  </div>
                </div>
                <div>{statusBadge(registro.status)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-zinc-200">
          <p className="text-muted-foreground text-sm">Nenhum evento registrado hoje.</p>
        </div>
      )}
    </div>
  )
}
