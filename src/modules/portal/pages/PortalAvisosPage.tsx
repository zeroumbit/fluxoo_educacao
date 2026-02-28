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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Megaphone className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecione um aluno</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Mural de Avisos</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {avisos && avisos.length > 0 ? (
        <div className="space-y-4">
          {avisos.map((aviso) => {
            const isGeral = !(aviso as any).turma_id
            return (
              <Card key={aviso.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isGeral ? 'bg-indigo-100' : 'bg-violet-100'}`}>
                      {isGeral ? <Megaphone className="h-6 w-6 text-indigo-600" /> : <BellRing className="h-6 w-6 text-violet-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-zinc-900 leading-tight">
                          {aviso.titulo}
                        </h3>
                        <Badge variant="secondary" className="whitespace-nowrap px-3 py-1 bg-zinc-100 font-semibold text-zinc-700">
                          {isGeral ? 'Comunicado Geral' : `Turma: ${(aviso as any).turma?.nome}`}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                        {aviso.conteudo}
                      </p>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-zinc-400 font-medium">
                        Publicado em {format(new Date(aviso.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-md border-dashed border-zinc-200">
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Mural Vazio</h3>
            <p className="mt-1">Não há comunicados recentes para a turma deste aluno.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
