import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  User, 
  ChevronRight, 
  GraduationCap, 
  Calendar,
  Layers,
  Clock,
  Plus
} from 'lucide-react'
import { motion } from 'framer-motion'

interface MatriculasListPageMobileProps {
  matriculas: any[]
  onNew: () => void
  onEdit: (m: any) => void
}

export function MatriculasListPageMobile({ matriculas, onNew, onEdit }: MatriculasListPageMobileProps) {
  const navigate = useNavigate()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header com Ação Principal */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Matrículas</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Fluxo Acadêmico</p>
        </div>
        <button
          onClick={onNew}
          className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-90 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Lista de Matrículas (App Style) */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {matriculas?.map((m, idx) => (
          <motion.div key={m.id} variants={item}>
            <Card 
              onClick={() => onEdit(m)}
              className="rounded-[2rem] border-0 shadow-sm overflow-hidden active:scale-[0.98] transition-all bg-white group border border-slate-50"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar do Aluno */}
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                    <User className="h-7 w-7 opacity-80" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 truncate pr-2 leading-tight">
                        {m.aluno?.nome_completo || 'Sem Nome'}
                      </h3>
                      <Badge 
                        variant={m.tipo === 'nova' ? 'default' : 'outline'} 
                        className="text-[8px] font-black uppercase tracking-tighter shrink-0 rounded-lg px-2"
                      >
                        {m.tipo === 'nova' ? 'NOVA' : 'REMAT'}
                      </Badge>
                    </div>

                    {/* Detalhes do Curso em Chips */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/50">
                        <Layers className="h-3 w-3 text-indigo-500" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter">{m.serie_ano}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{m.ano_letivo}</span>
                      </div>
                    </div>

                    {/* Footer do Card com Status e CTA */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full shadow-[0_0_8px]",
                          m.status === 'ativa' ? "bg-emerald-500 shadow-emerald-200" : "bg-red-400 shadow-red-100"
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.status}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/alunos/${m.aluno_id}`)
                          }}
                          className="text-[10px] font-black uppercase text-indigo-600 active:opacity-50"
                        >
                          Perfil
                        </button>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-active:text-indigo-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {(!matriculas || matriculas.length === 0) && (
          <div className="py-20 text-center space-y-4">
            <div className="h-20 w-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-50">
               <GraduationCap className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Nenhuma Matrícula</h3>
            <p className="text-xs font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">
              Inicie um novo processo acadêmico clicando no botão acima.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
