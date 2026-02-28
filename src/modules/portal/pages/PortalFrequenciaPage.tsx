import { useFrequenciaAluno } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CalendarCheck, Check, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeletorAluno } from '../components/SeletorAluno'

export function PortalFrequenciaPage() {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()
  const { data: frequencias, isLoading } = useFrequenciaAluno()

  const statusIcon = (status: string) => {
    switch (status) {
      case 'presente': return <Check className="h-4 w-4 text-emerald-600" />
      case 'falta': return <X className="h-4 w-4 text-red-600" />
      case 'justificada': return <AlertCircle className="h-4 w-4 text-amber-600" />
      default: return null
    }
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case 'presente': return 'bg-emerald-100 text-emerald-800'
      case 'falta': return 'bg-red-100 text-red-800'
      case 'justificada': return 'bg-amber-100 text-amber-800'
      default: return ''
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
        <CalendarCheck className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecione um aluno</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Frequência Escolar</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {frequencias && frequencias.length > 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0 divide-y divide-zinc-100">
            {frequencias.map((freq) => (
              <div key={freq.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${statusStyle(freq.status)} opacity-80`}>
                    {statusIcon(freq.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">
                      {format(new Date(freq.data_aula + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    {freq.justificativa && (
                      <p className="text-sm text-muted-foreground mt-1 bg-amber-50 p-2 rounded-md border text-amber-800">
                        {freq.justificativa}
                      </p>
                    )}
                  </div>
                </div>
                <div className="sm:text-right flex items-center sm:block gap-3">
                  <Badge className={`${statusStyle(freq.status)} uppercase tracking-wider text-xs font-bold border-0 shadow-sm px-3 py-1`}>
                    {freq.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md border-dashed border-zinc-200">
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Sem registros</h3>
            <p className="mt-1">Não encontramos dados recentes de frequência para este aluno.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
