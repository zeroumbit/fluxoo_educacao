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
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <TrendingUp className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-[#1E293B]">Selecione um aluno</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">Fila Virtual</h2>
      </div>
      
      <p className="text-[#64748B] font-medium text-sm px-1">Avise a escola que você está chegando para buscar o aluno.</p>

      {isMultiAluno && <SeletorAluno />}

      {/* Ação Principal - Teal Gradient */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-[#14B8A6] via-[#108A7D] to-[#134E4A] text-white overflow-hidden relative rounded-3xl">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-10">
          <CarFront className="h-64 w-64 text-white" />
        </div>
        <CardContent className="p-8 md:p-10 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-3xl font-black mb-3 tracking-tighter leading-none">
              {filaAtiva ? 'Escola Alertada!' : 'Já está chegando?'}
            </h3>
            <p className="text-teal-50 max-w-sm text-sm opacity-90 leading-relaxed font-semibold italic">
              {filaAtiva 
                ? 'Seu nome já foi para o painel da portaria. A saída do aluno está sendo preparada.'
                : 'Pressione o botão ao entrar no perímetro da escola para agilizar a entrega do aluno.'}
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-auto flex flex-col gap-3 min-w-[220px]">
            {!filaAtiva ? (
              <Button 
                size="lg" 
                className="w-full bg-white text-[#134E4A] hover:bg-teal-50 font-black h-16 shadow-2xl border-0 rounded-2xl text-sm tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
                onClick={handleEntrarFila}
                disabled={entrarMut.isPending}
              >
                {entrarMut.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <CarFront className="h-7 w-7 mr-2 opacity-90" />}
                ESTOU CHEGANDO
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full bg-red-500/90 hover:bg-red-600 text-white font-black h-16 shadow-2xl border-0 rounded-2xl text-sm tracking-widest uppercase transition-all hover:scale-103"
                onClick={() => handleCancelar(filaAtiva.id)}
                disabled={cancelarMut.isPending}
              >
                {cancelarMut.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <XCircle className="h-6 w-6 mr-2 opacity-80" />}
                CANCELAR
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico Recente */}
      <div className="flex items-center gap-2 mt-12 mb-5 px-1">
         <div className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]" />
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#64748B]">Histórico Recente</h3>
      </div>
      
      {historicoFila && historicoFila.length > 0 ? (
        <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            {historicoFila.slice(0, 5).map((registro) => (
              <div key={registro.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-4">
                   <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110 ${
                    registro.status === 'aguardando' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    registro.status === 'atendido' ? 'bg-[#CCFBF1] text-[#14B8A6] border-teal-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {registro.status === 'aguardando' ? <CarFront className="h-5 w-5" /> :
                     registro.status === 'atendido' ? <CheckCircle className="h-5 w-5" /> : 
                     <XCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1E293B] leading-none mb-2 text-sm">
                      {format(new Date(registro.created_at), "dd 'de' MMM", { locale: ptBR })} às {format(new Date(registro.created_at), "HH:mm")}
                    </h4>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                       {alunoSelecionado.nome_social || alunoSelecionado.nome_completo}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-none border ${
                    registro.status === 'aguardando' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    registro.status === 'atendido' ? 'bg-teal-50 text-[#14B8A6] border-teal-100' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {registro.status === 'aguardando' ? 'Aguardando na Saída' :
                     registro.status === 'atendido' ? 'Aluno Entregue' : 'Cancelado'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-24 bg-slate-50 border border-dashed border-[#E2E8F0] rounded-3xl flex flex-col items-center gap-4">
           <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <CarFront className="h-8 w-8 text-slate-200" />
           </div>
           <div className="space-y-1">
             <p className="text-base font-bold text-[#1E293B]">Nenhum evento registrado</p>
             <p className="text-[#64748B] text-xs font-medium">Os registros de hoje aparecerão aqui.</p>
           </div>
        </div>
      )}
    </div>
  )
}
