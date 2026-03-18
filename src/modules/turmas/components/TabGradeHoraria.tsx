import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Pencil, 
  Save, 
  X, 
  Trash2, 
  AlertTriangle,
  Info,
  CalendarDays,
  Download,
  Printer,
  Copy,
  Plus
} from 'lucide-react'
import { useTurmaStore } from '../store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { GradeHoraria } from '../types'

interface TabGradeHorariaProps {
  turmaId: string;
}

const DIAS_SEMANA = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' }
]

const HORARIOS = [
  { inicio: '07:30', fim: '08:15', label: '1ª Aula' },
  { inicio: '08:15', fim: '09:00', label: '2ª Aula' },
  { inicio: '09:00', fim: '09:45', label: '3ª Aula' },
  { inicio: '09:45', fim: '10:00', label: 'INTERVALO', isBreak: true },
  { inicio: '10:00', fim: '10:45', label: '4ª Aula' },
  { inicio: '10:45', fim: '11:30', label: '5ª Aula' }
]

export function TabGradeHoraria({ turmaId }: TabGradeHorariaProps) {
  const { disciplinas, professores, professor_turma, grade_horaria, atualizarGrade } = useTurmaStore()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | null>(null)

  // Filtrar grade desta turma
  const gradeTurma = grade_horaria.filter(g => g.turma_id === turmaId)

  const handleCellClick = (dia: number, horario: any) => {
    if (!isEditing) return
    if (!selectedDisciplinaId) {
      toast.info('Selecione uma disciplina na lista acima')
      return
    }

    // Achar professor vinculado a essa disciplina nesta turma
    const vinculo = professor_turma.find(at => at.turma_id === turmaId && at.disciplina_id === selectedDisciplinaId)
    const professorId = vinculo?.professor_id || null

    atualizarGrade({
      id: '', // handle in store
      turma_id: turmaId,
      disciplina_id: selectedDisciplinaId,
      professor_id: professorId,
      dia_semana: dia as any,
      hora_inicio: horario.inicio,
      hora_fim: horario.fim,
      sala: 'Sala 08',
      status: 'ativo'
    })

    toast.success('Horário atualizado')
  }

  const getCellContent = (dia: number, horario: any) => {
    const item = gradeTurma.find(g => g.dia_semana === dia && g.hora_inicio === horario.inicio)
    if (!item) return null

    const disciplina = disciplinas.find(d => d.id === item.disciplina_id)
    const professor = professores.find(p => p.id === item.professor_id)

    return { disciplina, professor }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Grade Horária</h3>
           <p className="text-slate-500 text-sm font-medium">Cronograma semanal de aulas e professores</p>
        </div>
        
        <div className="flex items-center gap-2">
           {!isEditing ? (
             <>
               <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl h-10 font-bold text-[10px] uppercase tracking-widest gap-2 bg-white shadow-sm border border-slate-100"
               >
                 <Printer size={16} />
                 Imprimir
               </Button>
               <Button 
                onClick={() => setIsEditing(true)}
                className="h-10 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-indigo-100"
               >
                 <Pencil size={16} />
                 Editar Grade
               </Button>
             </>
           ) : (
             <>
               <Button 
                variant="ghost" 
                onClick={() => setIsEditing(false)}
                className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 gap-2"
               >
                 <X size={16} />
                 Cancelar
               </Button>
               <Button 
                onClick={() => {
                  setIsEditing(false)
                  toast.success('Grade salva com sucesso!')
                }}
                className="h-10 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-teal-100"
               >
                 <Save size={16} />
                 Salvar Grade
               </Button>
             </>
           )}
        </div>
      </div>

      {isEditing && (
        <Card className="border-0 shadow-lg shadow-indigo-100 rounded-[2.5rem] bg-white p-6 border-2 border-indigo-100 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 ml-4 flex items-center gap-2">
              <Plus size={12} />
              Disciplinas Disponíveis
            </h4>
            <div className="flex flex-wrap gap-2">
              {disciplinas.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDisciplinaId(d.id)}
                  className={cn(
                    "px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                    selectedDisciplinaId === d.id 
                      ? "ring-4 ring-indigo-100 text-white shadow-lg" 
                      : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-white"
                  )}
                  style={{ backgroundColor: selectedDisciplinaId === d.id ? d.cor : undefined }}
                >
                  {d.codigo}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-medium text-slate-400 italic ml-4 flex items-center gap-2">
               <Info size={12} className="text-indigo-400" />
               Selecione uma disciplina e clique no horário desejado para preencher a grade.
            </p>
          </div>
        </Card>
      )}

      {/* Tabela de Grade */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left bg-slate-100/30 sticky left-0 z-10 min-w-[120px]">
                  Horário
                </th>
                {DIAS_SEMANA.map(dia => (
                  <th key={dia.id} className="p-6 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 text-center min-w-[150px]">
                    {dia.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((h, hIndex) => (
                <tr key={hIndex} className={cn(h.isBreak ? "bg-slate-50/30" : "hover:bg-slate-50/20 transition-colors")}>
                  <td className="p-6 border-b border-r border-slate-100 sticky left-0 z-10 bg-white">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 tracking-tighter">{h.inicio} - {h.fim}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{h.label}</span>
                    </div>
                  </td>
                  
                  {DIAS_SEMANA.map(dia => {
                    const content = getCellContent(dia.id, h)
                    
                    if (h.isBreak) {
                       return (
                         <td key={dia.id} className="p-6 border-b border-slate-100 text-center font-black text-[10px] uppercase tracking-widest text-slate-300 pointer-events-none italic">
                           {(dia.id === 3) ? 'INTERVALO' : ''}
                         </td>
                       )
                    }

                    return (
                      <td 
                        key={dia.id} 
                        onClick={() => handleCellClick(dia.id, h)}
                        className={cn(
                          "p-4 border-b border-slate-100 text-center relative transition-all",
                          isEditing ? "cursor-pointer hover:bg-slate-100/50 group" : ""
                        )}
                      >
                         {content ? (
                           <div 
                              className="p-3 rounded-2xl text-white shadow-md animate-in zoom-in-95 duration-300 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: content.disciplina?.cor }}
                           >
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                {content.disciplina?.nome}
                              </p>
                              <p className="text-[9px] font-bold opacity-80 uppercase tracking-tighter truncate">
                                {content.professor?.nome || 'Sem professor'}
                              </p>
                              {isEditing && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Trash2 size={12} className="text-white hover:text-red-200" />
                                </div>
                              )}
                           </div>
                         ) : (
                           <div className={cn(
                             "h-12 border-2 border-dashed border-slate-100 rounded-2xl",
                             isEditing ? "group-hover:border-indigo-200 flex items-center justify-center text-slate-200" : ""
                           )}>
                              {isEditing && <Plus size={16} />}
                           </div>
                         )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 mt-8 px-4">
        <div className="flex items-center gap-2">
           <Download size={14} className="text-slate-400" />
           <button className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">Exportar PDF</button>
        </div>
        <div className="flex items-center gap-2">
           <Copy size={14} className="text-slate-400" />
           <button className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">Duplicar Grade</button>
        </div>
      </div>
    </div>
  )
}
