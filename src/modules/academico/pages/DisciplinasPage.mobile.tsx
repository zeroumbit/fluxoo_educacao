
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  Library, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Settings2,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/modules/auth/AuthContext'
import { useCatalogoDisciplinas, useToggleDisciplinaAtiva, useCriarDisciplina } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function DisciplinasPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId || ''
  
  const { data: disciplinas, isLoading, refetch } = useCatalogoDisciplinas(tenantId)
  const toggleAtiva = useToggleDisciplinaAtiva()
  const criarDisciplina = useCriarDisciplina()
  
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  
  // Form States
  const [novoNome, setNovoNome] = useState('')
  const [novaEtapa, setNovaEtapa] = useState('TODAS')
  const [novaCategoria, setNovaCategoria] = useState('Outros')

  const handleToggle = async (id: string, isGlobal: boolean, ativa: boolean) => {
    try {
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(10)
      
      await toggleAtiva.mutateAsync({
        disciplinaId: id,
        tenantId: tenantId,
        isGlobal: isGlobal,
        ocultar: ativa
      })
      toast.success(ativa ? 'Disciplina ocultada' : 'Disciplina ativada', { position: 'top-center' })
    } catch {
      toast.error('Erro ao atualizar status', { position: 'top-center' })
    }
  }

  const handleCriar = async () => {
    if (!novoNome.trim()) {
      toast.error('Nome é obrigatório', { position: 'top-center' })
      return
    }
    try {
      await criarDisciplina.mutateAsync({
        nome: novoNome.trim(),
        tenantId,
        etapa: novaEtapa,
        categoria: novaCategoria
      })
      toast.success('Disciplina criada!', { position: 'top-center' })
      setNovoNome('')
      setFormOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar disciplina', { position: 'top-center' })
    }
  }

  const filtered = useMemo(() => 
    disciplinas?.filter(d => 
      d.nome.toLowerCase().includes(search.toLowerCase()) ||
      d.categoria.toLowerCase().includes(search.toLowerCase())
    ), [disciplinas, search]
  )

  if (isLoading && !disciplinas) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-4">
          <Skeleton className="h-20 w-full rounded-[24px]" />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-[24px]" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      
      {/* ── STICKY HEADER ─────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={() => navigate('/dashboard')}
                className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">Disciplinas</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Catálogo da Unidade</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-[20px] border-0 bg-slate-100/60 dark:bg-slate-800/60 text-base font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        <PullToRefresh onRefresh={async () => { await refetch() }}>
          
          <div className="mb-4 p-4 rounded-[24px] bg-indigo-50 border border-indigo-100/50">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-500">
                <Settings2 size={16} />
              </div>
              <p className="text-[11px] font-medium text-indigo-900/70 leading-relaxed italic">
                <strong className="text-indigo-900">Dica:</strong> Desative itens do catálogo oficial (BNCC) que não fazem parte do seu currículo atual.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered?.map((d, idx) => (
                <motion.div 
                  key={d.id} 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.02 }}
                  layout
                  className={cn(
                    "relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-[28px] border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]",
                    !d.ativa && "opacity-60 grayscale-[0.5]"
                  )}
                >
                  {/* Subject Color Block */}
                  <div 
                    className="h-14 w-14 rounded-[20px] flex items-center justify-center shrink-0 text-white font-black text-xs shadow-lg transition-transform"
                    style={{ backgroundColor: d.cor || '#6366f1' }}
                  >
                    {d.codigo || (d.nome.slice(0, 2).toUpperCase())}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-[15px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight leading-none">
                         {d.nome}
                       </h3>
                       {d.is_global && (
                         <Library size={12} className="text-indigo-400" />
                       )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="text-[8px] font-black uppercase rounded-lg px-2 h-5 bg-slate-50 dark:bg-slate-800 text-slate-500 border-0">
                        {d.etapa === 'TODAS' ? 'GERAL' : d.etapa}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 italic truncate max-w-[100px]">
                        {d.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex flex-col items-center gap-2 px-1">
                    <Switch 
                      checked={d.ativa}
                      onCheckedChange={() => handleToggle(d.id, d.is_global, d.ativa)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      d.ativa ? "text-emerald-500" : "text-slate-400"
                    )}>
                      {d.ativa ? 'ATIVA' : 'OCULTA'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered?.length === 0 && (
              <div className="py-20 text-center">
                <div className="h-20 w-20 bg-slate-100 rounded-[30px] flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Nada encontrado</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-12">
                   Não encontramos nenhuma disciplina com o termo "{search}"
                </p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      {/* ── FAB ─────────────────────────── */}
      <motion.button
        initial={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        whileTap={{ scale: 0.9 }}
        onClick={() => setFormOpen(true)}
        className="fixed bottom-24 right-5 h-16 w-16 rounded-[24px] bg-indigo-600 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950"
      >
        <Plus className="h-8 w-8" strokeWidth={3} />
      </motion.button>

      {/* ── MODAL: NOVA DISCIPLINA ─────────── */}
      <BottomSheet 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        title="Nova Disciplina"
      >
        <div className="space-y-6 pt-4 pb-32 px-1">
          
          <div className="h-16 w-16 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-500 mx-auto mb-6">
            <BookOpen size={32} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome da Disciplina</label>
              <Input 
                placeholder="Ex: Robótica, Empreendedorismo..." 
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-base font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Etapa</label>
                <Select value={novaEtapa} onValueChange={setNovaEtapa}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                    <SelectItem value="TODAS">Todas</SelectItem>
                    <SelectItem value="EI">Educação Infantil</SelectItem>
                    <SelectItem value="EF1">Fundamental 1</SelectItem>
                    <SelectItem value="EF2">Fundamental 2</SelectItem>
                    <SelectItem value="EM">Ensino Médio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria</label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                    <SelectItem value="Outros">Outros</SelectItem>
                    <SelectItem value="Linguagens">Linguagens</SelectItem>
                    <SelectItem value="Matemática">Matemática</SelectItem>
                    <SelectItem value="Ciências da Natureza">Ciências</SelectItem>
                    <SelectItem value="Ciências Humanas">Humanas</SelectItem>
                    <SelectItem value="Itinerários">Itinerários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 border-t border-slate-100 backdrop-blur-xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
             <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setFormOpen(false)}
                  className="h-14 flex-1 rounded-[20px] font-bold text-slate-500"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCriar}
                  disabled={criarDisciplina.isPending}
                  className="h-14 flex-1 rounded-[20px] bg-indigo-600 font-black text-white shadow-lg shadow-indigo-100"
                >
                  {criarDisciplina.isPending ? 'SALVANDO...' : 'CRIAR AGORA'}
                </Button>
             </div>
          </div>
        </div>
      </BottomSheet>

    </div>
  )
}
