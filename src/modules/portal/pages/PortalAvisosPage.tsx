import { useAvisosPortal } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Megaphone, BellRing } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeletorAluno } from '../components/SeletorAluno'

export function PortalAvisosPage() {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()
  const { data: avisos, isLoading } = useAvisosPortal()

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
        <Megaphone className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-[#1E293B]">Selecione um aluno</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">Mural de Avisos</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {avisos && avisos.length > 0 ? (
        <div className="space-y-4">
          {avisos.map((aviso) => {
            const isGeral = !(aviso as any).turma_id
            return (
              <Card key={aviso.id} className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch gap-0">
                    <div className={`w-1.5 shrink-0 ${isGeral ? 'bg-[#14B8A6]' : 'bg-[#3B82F6]'}`} />
                    <div className="p-6 flex items-start gap-5 flex-1">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${isGeral ? 'bg-[#CCFBF1]' : 'bg-blue-50'}`}>
                        {isGeral ? <Megaphone className="h-5 w-5 text-[#14B8A6]" /> : <BellRing className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <h3 className="text-lg font-bold text-[#1E293B] leading-tight tracking-tight">
                            {aviso.titulo}
                          </h3>
                          <Badge variant="outline" className={`whitespace-nowrap px-3 py-1 font-bold text-[10px] uppercase tracking-widest border ${isGeral ? 'bg-teal-50 text-[#14B8A6] border-teal-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {isGeral ? 'Comunicado Geral' : `Turma: ${(aviso as any).turma?.nome}`}
                          </Badge>
                        </div>
                        <p className="text-[#64748B] text-sm whitespace-pre-wrap leading-relaxed">
                          {aviso.conteudo}
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                             Publicado em {format(new Date(aviso.created_at), "dd 'de' MMMM", { locale: ptBR })} às {format(new Date(aviso.created_at), "HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-[#E2E8F0] border-dashed bg-slate-50/50">
          <CardContent className="py-20 text-center text-slate-500">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Megaphone className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B]">Mural Vazio</h3>
            <p className="mt-2 text-sm max-w-xs mx-auto">Não há comunicados recentes para a turma deste aluno.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
