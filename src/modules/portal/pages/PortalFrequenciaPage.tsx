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
      case 'presente': return <Check className="h-4 w-4 text-[#10B981]" />
      case 'falta': return <X className="h-4 w-4 text-red-500" />
      case 'justificada': return <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
      default: return null
    }
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case 'presente': return 'bg-[#CCFBF1] text-[#134E4A] border-teal-200'
      case 'falta': return 'bg-red-50 text-red-700 border-red-100'
      case 'justificada': return 'bg-amber-50 text-amber-700 border-amber-100'
      default: return ''
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
        <CalendarCheck className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-[#1E293B]">Selecione um aluno</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">Frequência Escolar</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {frequencias && frequencias.length > 0 ? (
        <Card className="border border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0 divide-y divide-slate-100">
            {frequencias.map((freq) => (
              <div key={freq.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-slate-50 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${statusStyle(freq.status)} shadow-sm`}>
                    {statusIcon(freq.status)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] first-letter:uppercase">
                      {format(new Date(freq.data_aula + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    {freq.justificativa && (
                      <p className="text-xs text-amber-800 mt-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100 font-medium">
                        <span className="font-bold mr-1 uppercase text-[9px]">Justificativa:</span>{freq.justificativa}
                      </p>
                    )}
                  </div>
                </div>
                <div className="sm:text-right flex items-center sm:block gap-3">
                  <Badge variant="outline" className={`${statusStyle(freq.status)} uppercase tracking-widest text-[10px] font-black border shadow-none px-3 py-1`}>
                    {freq.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-[#E2E8F0] border-dashed bg-slate-50/50">
          <CardContent className="py-20 text-center text-slate-500">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <CalendarCheck className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B]">Sem registros</h3>
            <p className="mt-2 text-sm max-w-xs mx-auto">Não encontramos dados recentes de frequência para este aluno.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
