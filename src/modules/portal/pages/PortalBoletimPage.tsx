import { useState } from 'react'
import { usePortalContext } from '../context'
import { useBoletins } from '../hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  GraduationCap, TrendingUp, Activity, Award, Info, Calendar, Layers, FileText
} from 'lucide-react'
import type { DisciplinaBoletim } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SeletorAluno } from '../components/SeletorAluno'
import { BotaoVoltar } from '../components/BotaoVoltar'

const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
}

const BoletimSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
    <div className="h-64 bg-slate-50 rounded-2xl" />
  </div>
)

const DisciplinaCard = ({ disciplina }: { disciplina: DisciplinaBoletim }) => {
  const isAprovado = disciplina.nota >= 7
  const isRecuperacao = disciplina.nota >= 5 && disciplina.nota < 7

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group shadow-sm active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isAprovado ? 'bg-emerald-50 text-emerald-600' : 
          isRecuperacao ? 'bg-amber-50 text-amber-600' : 
          'bg-red-50 text-red-600'
        )}>
          <Award size={16} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">{disciplina.disciplina}</h4>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <Activity size={10} /> {disciplina.faltas} faltas
            </span>
            {disciplina.observacoes && (
              <span className="text-[9px] font-semibold text-teal-600 uppercase">Obs</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className={cn(
          "text-xl font-bold leading-none",
          isAprovado ? 'text-emerald-500' : isRecuperacao ? 'text-amber-500' : 'text-red-500'
        )}>
          {disciplina.nota.toFixed(1)}
        </div>
        <p className="text-[9px] font-medium text-slate-300 uppercase tracking-wider mt-0.5">nota</p>
      </div>
    </div>
  )
}

export function PortalBoletimPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { alunoSelecionado, isMultiAluno } = usePortalContext()
  const { data: boletins, isLoading } = useBoletins()
  
  const [anoSelecionado, setAnoSelecionado] = useState<string>(new Date().getFullYear().toString())
  const [bimestreSelecionado, setBimestreSelecionado] = useState<string>('todos')

  if (isLoading) return <BoletimSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-slate-200" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Boletim Escolar</h2>
          <p className="text-sm text-slate-400 max-w-xs">Selecione um aluno para ver as notas.</p>
        </div>
      </div>
    )
  }

  const boletinsFiltrados = (boletins || []).filter(b => b.ano_letivo.toString() === anoSelecionado)
  const boletimExibido = bimestreSelecionado === 'todos'
    ? boletinsFiltrados
    : boletinsFiltrados.filter(b => b.bimestre.toString() === bimestreSelecionado)

  const mediaGeral = (() => {
    if (boletinsFiltrados.length === 0) return 0
    let totalNotas = 0, totalDisciplinas = 0
    boletinsFiltrados.forEach(b => b.disciplinas.forEach((d: DisciplinaBoletim) => { totalNotas += d.nota; totalDisciplinas++ }))
    return totalDisciplinas > 0 ? (totalNotas / totalDisciplinas).toFixed(1) : '0'
  })()

  const totalFaltas = (() => {
    let sum = 0
    boletinsFiltrados.forEach(b => b.disciplinas.forEach((d: DisciplinaBoletim) => { sum += d.faltas }))
    return sum
  })()

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">

      {/* Header & Filtros */}
      {!hideHeader && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-3">
              <BotaoVoltar />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Boletim Escolar</h2>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Performance Acadêmica</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={anoSelecionado} onValueChange={v => { vibrate(15); setAnoSelecionado(v); }}>
                <SelectTrigger className="w-24 rounded-xl font-semibold text-xs bg-white border-slate-200 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bimestreSelecionado} onValueChange={v => { vibrate(15); setBimestreSelecionado(v); }}>
                <SelectTrigger className="w-36 rounded-xl font-semibold text-xs bg-white border-slate-200 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isMultiAluno && <SeletorAluno />}
        </div>
      )}

      {/* Stats */}
      {boletinsFiltrados.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex flex-col justify-between gap-4 border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp size={16} />
              </div>
              <div className="relative w-10 h-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
                  <motion.circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500" strokeWidth="3.5" strokeDasharray="100"
                    initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - (Number(mediaGeral) * 10) }}
                    transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-600">
                  {Math.round(Number(mediaGeral) * 10)}%
                </div>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Média</p>
              <h4 className="text-2xl font-bold text-slate-800 leading-none">{mediaGeral}</h4>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex flex-col justify-between gap-4 border border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <div>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Faltas</p>
              <h4 className="text-2xl font-bold text-slate-800 leading-none">{totalFaltas}</h4>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-900 rounded-2xl shadow-lg p-4 md:p-6 flex-col justify-between gap-4 text-white">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-teal-400">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-[9px] font-medium text-teal-400 uppercase tracking-wider">Períodos</p>
              <h4 className="text-2xl font-bold leading-none">{boletinsFiltrados.length}/4</h4>
            </div>
          </div>
        </div>
      )}

      {/* Bimestres */}
      <AnimatePresence mode="popLayout">
        {boletimExibido.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 p-10 md:p-16 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-4">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200">
              <GraduationCap size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Sem notas disponíveis</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">As notas para este período ainda não foram publicadas.</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {(boletimExibido as any[]).map((boletim, bIndex) => (
              <motion.div
                key={boletim.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: bIndex * 0.1 }}
                className="bg-slate-50 rounded-2xl md:rounded-3xl p-2 space-y-2"
              >
                {/* Header */}
                <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-800">{boletim.bimestre}º Bimestre</h3>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{boletim.ano_letivo}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-semibold px-3 py-1 rounded-full hidden sm:flex">
                    Ativo
                  </Badge>
                </div>

                {/* Disciplinas */}
                <div className="p-2 space-y-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {(boletim.disciplinas as DisciplinaBoletim[]).map((disc, dIdx) => (
                      <DisciplinaCard key={dIdx} disciplina={disc} />
                    ))}
                  </div>
                </div>

                {/* Observações */}
                {(boletim.observacoes_gerais || boletim.disciplinas.some((d: any) => d.observacoes)) && (
                  <div className="bg-slate-900 mx-2 mb-2 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-400 shrink-0">
                        <Info size={16} />
                      </div>
                      <div>
                        <h5 className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider mb-1">Observações</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {boletim.observacoes_gerais || "Desempenho consistente. Manter foco nas revisões."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
