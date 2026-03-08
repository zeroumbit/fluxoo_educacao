import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useAlunos } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
import { 
  Search, 
  Plus, 
  User, 
  ChevronRight, 
  Filter, 
  Loader2,
  GraduationCap,
  Sparkles,
  MoreVertical,
  UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * VERSÃO MOBILE DA LISTAGEM DE ALUNOS (MOBILE FIRST PRO)
 * Otimizada para escaneamento rápido, busca fluida e visual premium.
 */
export function AlunosListPageMobile() {
  const navigate = useNavigate()
  const { data: alunos, isLoading } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const [searchTerm, setSearchTerm] = useState('')

  const alunosComMatriculaIds = React.useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

  const filteredAlunos = (alunos as any[])?.filter(a => 
    a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.cpf?.includes(searchTerm)
  )

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { x: -10, opacity: 0 },
    show: { x: 0, opacity: 1 }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-10 w-10 text-indigo-500" />
        </motion.div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando alunos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
       {/* Top Bar Fixa / Glassmorphism */}
       <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <UserPlus className="h-5 w-5" />
               </div>
               <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Alunos</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                     {filteredAlunos?.length || 0} Registros
                  </p>
               </div>
            </div>
            <button 
               onClick={() => navigate('/alunos/novo')}
               className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 active:scale-90 transition-transform"
            >
               <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nome ou CPF..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-[1.2rem] border-0 shadow-none bg-slate-100/50 focus-visible:ring-indigo-500 font-medium text-sm"
              />
            </div>
            <Button variant="outline" className="h-12 w-12 rounded-[1.2rem] border-0 shadow-none bg-slate-100/50">
              <Filter className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
       </div>

       {/* Lista de Alunos */}
       <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="px-4 py-6 space-y-3"
       >
          <AnimatePresence>
            {(filteredAlunos as any[])?.map((aluno) => (
              <motion.div key={aluno.id} variants={item} layout>
                <Card 
                  onClick={() => navigate(`/alunos/${aluno.id}`)}
                  className="rounded-[2rem] border-0 shadow-sm overflow-hidden active:scale-[0.98] transition-all bg-white relative group border border-slate-50"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-indigo-600 shrink-0 border border-slate-100 overflow-hidden">
                      {aluno.foto_url ? (
                        <img src={aluno.foto_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="flex flex-col items-center">
                           <User className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate leading-none mb-1.5">{aluno.nome_completo}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`text-[8px] font-black uppercase tracking-tighter px-2 border-0 rounded-lg ${
                          aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {aluno.status}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 shrink-0 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-50">
                          <div className={`h-1.5 w-1.5 rounded-full ${alunosComMatriculaIds.has(aluno.id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'}`} />
                          <span className="truncate max-w-[80px]">{aluno.filiais?.nome_unidade || 'S/ Unidade'}</span>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-[0.1em]">CPF: {aluno.cpf || 'Não informado'}</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                       <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlunos?.length === 0 && !isLoading && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-24 text-center space-y-4"
            >
              <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200/50">
                 <Search className="h-10 w-10 text-slate-200" />
              </div>
              <div>
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Sem resultados</p>
                 <p className="text-xs text-slate-300 font-medium">Tente buscar por outro termo ou CPF.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="rounded-xl h-10 border-slate-200 text-indigo-600 font-black text-[10px] uppercase tracking-widest"
              >
                 Limpar Busca
              </Button>
            </motion.div>
          )}
       </motion.div>

       {/* Botão Flutuante (FAB) para Adicionar Aluno */}
       <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/alunos/novo')}
          className="fixed bottom-24 right-6 h-16 w-16 rounded-full bg-indigo-600 shadow-2xl shadow-indigo-300 flex items-center justify-center text-white z-50 border-4 border-white"
       >
          <Sparkles className="h-7 w-7" />
       </motion.button>
    </div>
  )
}
