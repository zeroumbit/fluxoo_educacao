import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  useRelatorioMensalFrequencia 
} from '../hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { useAlunosDaTurma } from '../hooks' // I'll need this one
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  FileDown, 
  Printer, 
  Filter,
  Users,
  Check,
  X,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function RelatorioMensalFrequenciaPage() {
  const navigate = useNavigate()
  const [turmaId, setTurmaId] = useState<string>('')
  const [mesAno, setMesAno] = useState<string>(format(new Date(), 'yyyy-MM'))
  
  const { data: turmas } = useTurmas()
  const { data: historico, isLoading: loadingHist } = useRelatorioMensalFrequencia(turmaId, mesAno)
  
  // Extrai dias do mês selecionado
  const [ano, mes] = mesAno.split('-').map(Number)
  const dataRef = new Date(ano, mes - 1, 1)
  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(dataRef),
    end: endOfMonth(dataRef)
  })

  // Agrupa faltas por aluno e dia para a matriz
  const matrizFrequencia = React.useMemo(() => {
    if (!historico) return {}
    const matriz: Record<string, Record<string, string>> = {}
    
    historico.forEach((reg: any) => {
      if (!matriz[reg.aluno_id]) matriz[reg.aluno_id] = {}
      matriz[reg.aluno_id][reg.data_aula] = reg.status
    })
    
    return matriz
  }, [historico])

  // Lista única de alunos que aparecem no histórico ou estão na turma
  const alunosUnicos = React.useMemo(() => {
    if (!historico) return []
    const map = new Map()
    historico.forEach((reg: any) => {
      if (reg.alunos) {
        map.set(reg.aluno_id, reg.alunos.nome_completo)
      }
    })
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [historico])

  const handlePrint = () => window.print()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/frequencia')}
            className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2 transition-colors"
          >
            <ChevronLeft size={14} /> Voltar para Chamada
          </button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
            Relatório <span className="text-indigo-600">Mensal</span>
          </h1>
          <p className="text-slate-500 font-medium">Visão consolidada da frequência da turma</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2">
            <FileDown size={16} /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Turma</label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger className="rounded-2xl border-slate-100 h-12">
                  <SelectValue placeholder="Selecione a Turma" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {turmas?.map(t => (
                    <SelectItem key={t.id} value={t.id} className="rounded-xl">{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mês de Referência</label>
              <div className="flex items-center gap-2">
                 <input 
                  type="month" 
                  value={mesAno}
                  onChange={(e) => setMesAno(e.target.value)}
                  className="flex h-12 w-full rounded-2xl border border-slate-100 bg-white px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-end">
              <div className="bg-indigo-50 p-4 rounded-2xl w-full flex items-center justify-between border border-indigo-100/50">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Users size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Total Alunos</span>
                </div>
                <span className="text-2xl font-black text-indigo-600 tracking-tighter">
                  {alunosUnicos.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Frequência */}
      <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden print:shadow-none print:border-none">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black tracking-tight text-slate-800">Mapa de Presença - {format(dataRef, 'MMMM yyyy', { locale: ptBR })}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Presença</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Falta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Justificada</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {!turmaId ? (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <Filter size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-700">Selecione uma turma</h3>
                <p className="text-slate-400 text-sm">Escolha uma turma para visualizar o mapa mensal</p>
              </div>
            </div>
          ) : loadingHist ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-20 bg-slate-100 p-4 text-left border-r border-slate-200 min-w-[240px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aluno</span>
                  </th>
                  {diasDoMes.map(dia => (
                    <th key={dia.toISOString()} className={cn(
                      "p-2 text-center border-r border-slate-100 min-w-[36px]",
                      (dia.getDay() === 0 || dia.getDay() === 6) && "bg-slate-200/50"
                    )}>
                      <span className="text-[9px] font-bold block text-slate-400 uppercase leading-none mb-1">
                        {format(dia, 'eee', { locale: ptBR })}
                      </span>
                      <span className="text-xs font-black text-slate-600 block">
                        {format(dia, 'dd')}
                      </span>
                    </th>
                  ))}
                  <th className="p-4 text-center bg-indigo-50 border-l border-indigo-100 min-w-[60px]">
                    <span className="text-[9px] font-black uppercase text-indigo-500 block">Faltas</span>
                  </th>
                  <th className="p-4 text-center bg-indigo-50 min-w-[60px]">
                    <span className="text-[9px] font-black uppercase text-indigo-500 block">%</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alunosUnicos.map((aluno) => {
                  let totalFaltas = 0
                  let totalDiasComHistorico = 0

                  return (
                    <tr key={aluno.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-4 border-r border-slate-200 font-bold text-sm text-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        {aluno.nome}
                      </td>
                      {diasDoMes.map(dia => {
                        const dataStr = format(dia, 'yyyy-MM-dd')
                        const status = matrizFrequencia[aluno.id]?.[dataStr]
                        
                        if (status) totalDiasComHistorico++
                        if (status === 'falta') totalFaltas++

                        return (
                          <td key={dia.toISOString()} className={cn(
                            "p-0 text-center border-r border-slate-50",
                            (dia.getDay() === 0 || dia.getDay() === 6) && "bg-slate-50/50"
                          )}>
                            <div className="flex items-center justify-center p-2">
                              {status === 'presente' ? (
                                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              ) : status === 'falta' ? (
                                <div className="w-5 h-5 rounded-md bg-red-100 text-red-600 flex items-center justify-center shadow-sm shadow-red-100/50">
                                  <X size={12} strokeWidth={4} />
                                </div>
                              ) : status === 'justificada' ? (
                                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                                  <AlertCircle size={12} strokeWidth={4} />
                                </div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                              )}
                            </div>
                          </td>
                        )
                      })}
                      <td className="p-4 text-center bg-indigo-50/30 border-l border-indigo-100 font-black text-rose-600 italic">
                        {totalFaltas}
                      </td>
                      <td className="p-4 text-center bg-indigo-50/30 font-black text-indigo-700">
                        {totalDiasComHistorico > 0 ? Math.round(((totalDiasComHistorico - totalFaltas) / totalDiasComHistorico) * 100) : 100}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
