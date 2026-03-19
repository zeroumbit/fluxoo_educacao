import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlunos, useExcluirAluno, useAtualizarAluno } from '../hooks'
import { useMatriculasAtivas } from '@/modules/academico/hooks'
import {
  Search,
  Plus,
  User,
  ChevronRight,
  Filter,
  ArrowLeft,
  X,
  MoreVertical,
  Percent,
  Shield,
  Eye,
  Edit2,
  UserMinus,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { get, set } from 'idb-keyval'
import { cn } from '@/lib/utils'
import { ModalDescontoAluno } from '../components/ModalDescontoAluno'
import { ModalAutorizacoesAluno } from '@/modules/autorizacoes/components/ModalAutorizacoesAluno'

const CACHE_KEY = 'alunos_list_cache'

export function AlunosListPageMobile() {
  const navigate = useNavigate()
  const { data: alunos, isLoading, refetch } = useAlunos()
  const { data: matriculasAtivas } = useMatriculasAtivas()
  const excluirAluno = useExcluirAluno()
  const atualizarAluno = useAtualizarAluno()

  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [cachedAlunos, setCachedAlunos] = useState<any[]>([])

  // Estados para Ações
  const [selectedAluno, setSelectedAluno] = useState<any | null>(null)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isDescontoOpen, setIsDescontoOpen] = useState(false)
  const [isAutorizacoesOpen, setIsAutorizacoesOpen] = useState(false)
  
  // Estados para Diálogos de Confirmação
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDesativarDialog, setShowDesativarDialog] = useState(false)
  const [confirmacaoDesativar, setConfirmacaoDesativar] = useState(false)

  useEffect(() => {
    get(CACHE_KEY).then(val => { if (val) setCachedAlunos(val) })
  }, [])

  useEffect(() => {
    if (alunos) set(CACHE_KEY, alunos)
  }, [alunos])

  const displayAlunos = (alunos || cachedAlunos) as any[]

  const alunosComMatriculaIds = useMemo(() => {
    return new Set(matriculasAtivas?.map(m => m.aluno_id) || [])
  }, [matriculasAtivas])

  const filteredAlunos = useMemo(() => {
    return displayAlunos?.filter(a =>
      a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.cpf?.includes(searchTerm)
    )
  }, [displayAlunos, searchTerm])

  const onRefresh = async () => { await refetch() }

  // Handlers de Ação
  const handleOpenActions = (aluno: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAluno(aluno)
    setIsActionsOpen(true)
  }

  const handleDesativar = () => {
    setIsActionsOpen(false)
    setShowDesativarDialog(true)
    setConfirmacaoDesativar(false)
  }

  const confirmarDesativacao = async () => {
    if (!selectedAluno || !confirmacaoDesativar) return
    try {
      await atualizarAluno.mutateAsync({ 
        id: selectedAluno.id, 
        aluno: { status: 'inativo' } 
      })
      toast.success('Aluno desativado!', { position: 'top-center' })
      setShowDesativarDialog(false)
      setSelectedAluno(null)
    } catch (err: any) {
      toast.error('Erro ao desativar: ' + err.message, { position: 'top-center' })
    }
  }

  const handleExcluir = () => {
    setIsActionsOpen(false)
    if (selectedAluno.status === 'ativo') {
      toast.error('Não é possível excluir um aluno ativo.', {
        description: 'Desative-o primeiro.',
        position: 'top-center'
      })
      return
    }
    setShowDeleteDialog(true)
  }

  const confirmarExclusao = async () => {
    if (!selectedAluno) return
    try {
      await excluirAluno.mutateAsync(selectedAluno.id)
      toast.success('Aluno removido!', { position: 'top-center' })
      setShowDeleteDialog(false)
      setSelectedAluno(null)
      refetch()
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message, { position: 'top-center' })
    }
  }

  // Skeleton Loading
  if (isLoading && !cachedAlunos.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-[88px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      {/* ── Sticky Top: Search ── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Alunos</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {filteredAlunos?.length || 0} registros
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFilterOpen(true)}
              className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            >
              <Filter className="h-4 w-4 text-slate-500" />
            </motion.button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-0 bg-slate-100/80 dark:bg-slate-800/80 focus-visible:ring-indigo-500 text-base font-medium"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        <PullToRefresh onRefresh={onRefresh}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAlunos?.map((aluno, idx) => (
                <motion.div
                  key={aluno.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  layout
                >
                  <NativeCard
                    swipeable
                    onClick={() => navigate(`/alunos/${aluno.id}`)}
                    onDelete={() => { setSelectedAluno(aluno); handleExcluir(); }}
                    onEdit={() => navigate(`/alunos/${aluno.id}?edit=true`)}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600 overflow-hidden">
                        {aluno.foto_url ? (
                          <img src={aluno.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-slate-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-[14px] truncate leading-tight">
                            {aluno.nome_completo}
                          </h3>
                          <Badge className={cn("text-[8px] font-black h-[18px] px-1.5 rounded-md border-0 shrink-0", 
                            aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          )}>
                            {aluno.status?.toUpperCase() || 'ATIVO'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                           <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100/50">
                              <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase">
                                {alunosComMatriculaIds.has(aluno.id) ? 'MATRICULADO' : 'SEM MATRÍCULA'}
                              </span>
                           </div>
                           <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                 {aluno.cpf || 'Sem CPF'}
                              </span>
                           </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => handleOpenActions(aluno, e)}
                        className="h-9 w-9 -mr-2 rounded-xl flex items-center justify-center text-slate-300 active:bg-slate-100"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {filteredAlunos?.length === 0 && (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-50">
                  <User className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Nenhum Aluno</h3>
                <p className="text-xs font-medium text-slate-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
                   Refine sua busca ou cadastre um novo aluno no botão abaixo.
                </p>
                <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6 rounded-xl text-xs font-bold px-8">
                  Limpar busca
                </Button>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/alunos/novo')}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200/60 flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Action Sheet */}
      <BottomSheet
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        title={selectedAluno?.nome_completo}
        size="peek"
      >
        <div className="space-y-1.5 pb-8">
           <button 
            onClick={() => { setIsActionsOpen(false); navigate(`/alunos/${selectedAluno.id}`); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
           >
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Eye size={20} /></div>
              <span className="font-bold text-slate-700">Ver Detalhes do Aluno</span>
           </button>

           <button 
            onClick={() => { setIsActionsOpen(false); navigate(`/alunos/${selectedAluno.id}?edit=true`); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
           >
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><Edit2 size={18} /></div>
              <span className="font-bold text-slate-700">Editar Cadastro</span>
           </button>

           <div className="h-px bg-slate-100 mx-4 my-1" />

           <button
            onClick={() => { setIsActionsOpen(false); setIsDescontoOpen(true); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
           >
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Percent size={18} /></div>
              <span className="font-bold text-slate-700">Gerenciar Descontos</span>
           </button>

           <button 
            onClick={() => { setIsActionsOpen(false); setIsAutorizacoesOpen(true); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-slate-50 transition-colors"
           >
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Shield size={18} /></div>
              <span className="font-bold text-slate-700">Gerenciar Autorizações</span>
           </button>

           <div className="h-px bg-slate-100 mx-4 my-1" />

           {selectedAluno?.status === 'ativo' && (
             <button 
              onClick={handleDesativar}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-amber-50 transition-colors text-amber-600"
             >
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center"><UserMinus size={18} /></div>
                <span className="font-bold">Desativar Aluno</span>
             </button>
           )}

           <button 
            onClick={handleExcluir}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-rose-50 transition-colors text-rose-600"
           >
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center"><Trash2 size={18} /></div>
              <span className="font-bold">Excluir Registro</span>
           </button>
        </div>
      </BottomSheet>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filtrar Alunos"
        size="half"
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
            <div className="flex gap-2">
              {['Todos', 'Ativos', 'Inativos'].map(s => (
                <Button key={s} variant="outline" className="flex-1 rounded-xl h-12 text-xs font-bold active:bg-indigo-50 active:text-indigo-700 active:border-indigo-200">
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-bold" onClick={() => setIsFilterOpen(false)}>
            Aplicar
          </Button>
        </div>
      </BottomSheet>

      {/* Modais de Negócio */}
      <ModalDescontoAluno 
        open={isDescontoOpen} 
        aluno={selectedAluno} 
        onClose={() => setIsDescontoOpen(false)} 
      />

      <ModalAutorizacoesAluno 
        open={isAutorizacoesOpen} 
        onClose={() => setIsAutorizacoesOpen(false)} 
        alunoId={selectedAluno?.id} 
        alunoNome={selectedAluno?.nome_completo}
      />

      {/* Delete Confirmation Sheet (Rule 4 - peek) */}
      <BottomSheet 
        isOpen={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)} 
        title="Excluir Registro"
        size="peek"
      >
        <div className="space-y-7 pt-4 text-center pb-32">
          <div className="h-20 w-20 bg-rose-50 dark:bg-rose-900/40 rounded-xl flex items-center justify-center mx-auto transition-transform active:scale-95 shadow-sm border border-rose-100/50">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[14px] font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Excluir "{selectedAluno?.nome_completo}"?
            </h3>
            <p className="text-[11px] text-slate-500 font-medium max-w-[260px] mx-auto leading-relaxed">
              Esta ação é <strong>definitiva</strong>. Considere apenas desativar para manter o histórico.
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
            <div className="mx-auto w-full max-w-[640px] px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl font-bold text-base border-slate-100 active:scale-92 transition-all"
                onClick={() => setShowDeleteDialog(false)}
              >
                Manter
              </Button>
              <Button
                className="flex-[2] h-14 rounded-2xl bg-rose-600 font-bold text-base active:scale-92 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
                onClick={confirmarExclusao}
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Deactivation Confirmation Sheet (Rule 4 - peek) */}
      <BottomSheet 
        isOpen={showDesativarDialog} 
        onClose={() => { setShowDesativarDialog(false); setConfirmacaoDesativar(false); }} 
        title={confirmacaoDesativar ? 'Último Passo' : 'Confirmar Desativação'}
        size="peek"
      >
        <div className="space-y-7 pt-4 text-center pb-32">
          <div className="h-20 w-20 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mx-auto transition-transform active:scale-95 shadow-sm border border-amber-100/50">
            <UserMinus className="h-10 w-10 text-amber-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-[14px] font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
              {confirmacaoDesativar 
                ? `Revise os impactos da desativação` 
                : `Desativar ${selectedAluno?.nome_completo}?`}
            </h3>
            
            {!confirmacaoDesativar ? (
              <p className="text-[11px] text-slate-500 font-medium max-w-[260px] mx-auto leading-relaxed">
                O aluno perderá acesso ao portal, mas os registros financeiros e acadêmicos serão preservados.
              </p>
            ) : (
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 mx-2">
                 <p className="text-[10px] text-rose-700 font-black uppercase tracking-widest leading-relaxed">
                   Deseja confirmar a desativação imediata do acesso acadêmico?
                 </p>
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
            <div className="mx-auto w-full max-w-[640px] px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex gap-3">
              {!confirmacaoDesativar ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl font-bold text-base border-slate-100 active:scale-92 transition-all text-slate-400"
                    onClick={() => setShowDesativarDialog(false)}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-[2] h-14 rounded-2xl bg-amber-600 font-bold text-base active:scale-92 transition-all shadow-lg shadow-amber-200 dark:shadow-none"
                    onClick={() => setConfirmacaoDesativar(true)}
                  >
                    Continuar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl font-bold text-base border-slate-100 active:scale-92 transition-all text-slate-400"
                    onClick={() => setConfirmacaoDesativar(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-[2] h-14 rounded-2xl bg-rose-600 font-bold text-base active:scale-92 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
                    onClick={confirmarDesativacao}
                  >
                    Confirmar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

