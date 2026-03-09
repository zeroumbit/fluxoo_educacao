import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Loader2, 
  BookOpen, 
  Pencil, 
  Trash2, 
  AlertTriangle,
  Search,
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  DollarSign,
  School,
  Calendar,
  ChevronRight,
  Building2,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { get, set } from 'idb-keyval'

import { useAuth } from '@/modules/auth/AuthContext'
import { useTurmas, useCriarTurma, useAtualizarTurma, useExcluirTurma } from '../hooks'
import { useFiliais } from '@/modules/filiais/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Skeleton } from '@/components/ui/skeleton'
import type { Turma } from '@/lib/database.types'

const CACHE_KEY = 'turmas_mobile_v3'

const turmaSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  turno: z.string().min(1, 'Turno é obrigatório'),
  horario_inicio: z.string().optional().or(z.literal('')),
  horario_fim: z.string().optional().or(z.literal('')),
  sala: z.string().optional().or(z.literal('')),
  capacidade_maxima: z.any().transform((val) => Number(val)).pipe(z.number().min(1)),
  filial_id: z.string().optional().or(z.literal('')),
  valor_mensalidade: z.any().transform((val) => val === '' ? 0 : Number(val)).pipe(z.number().min(0)),
})

type TurmaFormValues = z.infer<typeof turmaSchema>

export function TurmasPageMobile() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { data: turmas, isLoading, refetch } = useTurmas()
  const { data: filiais } = useFiliais()
  const criarTurma = useCriarTurma()
  const atualizarTurma = useAtualizarTurma()
  const excluirTurma = useExcluirTurma()

  const [search, setSearch] = useState('')
  // Sheet states
  const [formOpen, setFormOpen] = useState(false)       // CRIAR / EDITAR
  const [verOpen, setVerOpen] = useState(false)          // VER
  const [excluirOpen, setExcluirOpen] = useState(false)  // EXCLUIR

  const [editando, setEditando] = useState<Turma | null>(null)
  const [vendo, setVendo] = useState<Turma | null>(null)
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<Turma | null>(null)
  const [cached, setCached] = useState<Turma[]>([])

  // Cache (Rule 21)
  useEffect(() => { get(CACHE_KEY).then(v => { if (v) setCached(v) }) }, [])
  useEffect(() => { if (turmas) set(CACHE_KEY, turmas) }, [turmas])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TurmaFormValues>({
    resolver: zodResolver(turmaSchema),
  })

  // ── CRIAR ──────────────────────────────────────────
  const abrirNovo = () => {
    setEditando(null)
    reset({ nome: '', turno: '', horario_inicio: '', horario_fim: '', sala: '', capacidade_maxima: 30, filial_id: '', valor_mensalidade: 0 })
    setFormOpen(true)
  }

  // ── EDITAR ─────────────────────────────────────────
  const abrirEdicao = (turma: Turma) => {
    setEditando(turma)
    const [inicio, fim] = ((turma as any).horario || '').split(' - ')
    reset({
      nome: turma.nome,
      turno: turma.turno || '',
      horario_inicio: inicio || '',
      horario_fim: fim || '',
      sala: turma.sala || '',
      capacidade_maxima: turma.capacidade_maxima || 30,
      filial_id: turma.filial_id || '',
      valor_mensalidade: turma.valor_mensalidade || 0,
    })
    setVerOpen(false)
    setFormOpen(true)
  }

  // ── VER ────────────────────────────────────────────
  const abrirVer = (turma: Turma) => {
    setVendo(turma)
    setVerOpen(true)
  }

  // ── EXCLUIR ────────────────────────────────────────
  const abrirExcluir = (turma: Turma) => {
    setTurmaParaExcluir(turma)
    setVerOpen(false)
    setExcluirOpen(true)
  }

  // ── SUBMIT FORM ────────────────────────────────────
  const onSubmit = async (data: TurmaFormValues) => {
    if (!authUser) return
    try {
      const payload = {
        nome: data.nome,
        turno: data.turno,
        horario: data.horario_inicio && data.horario_fim ? `${data.horario_inicio} - ${data.horario_fim}` : null,
        sala: data.sala || null,
        capacidade_maxima: Number(data.capacidade_maxima) || null,
        filial_id: data.filial_id && data.filial_id !== '' ? data.filial_id : null,
        valor_mensalidade: Number(data.valor_mensalidade) || 0,
      }
      if (editando) {
        await atualizarTurma.mutateAsync({ id: editando.id, turma: payload })
        toast.success('Turma atualizada!', { position: 'top-center' })
      } else {
        await criarTurma.mutateAsync({ ...payload, tenant_id: authUser.tenantId })
        toast.success('Turma cadastrada!', { position: 'top-center' })
      }
      setFormOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar', { position: 'top-center' })
    }
  }

  // ── CONFIRMAR EXCLUSÃO ─────────────────────────────
  const confirmarExclusao = async () => {
    if (!turmaParaExcluir) return
    try {
      await excluirTurma.mutateAsync(turmaParaExcluir.id)
      toast.success('Turma excluída!', { position: 'top-center' })
      setExcluirOpen(false)
      setTurmaParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir.', { position: 'top-center' })
    }
  }

  const displayTurmas = (turmas || cached) as Turma[]
  const filteredTurmas = useMemo(() =>
    displayTurmas.filter(t => t.nome.toLowerCase().includes(search.toLowerCase())),
    [displayTurmas, search]
  )

  // Skeleton
  if (isLoading && !cached.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">

      {/* ── STICKY HEADER (Rule 2) ─────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/dashboard')}
                className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </motion.button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Turmas</h1>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{filteredTurmas.length} cadastradas</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar turma..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-0 bg-slate-100/60 dark:bg-slate-800/60 text-base font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── LIST ──────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[640px] px-4 pt-5">
        <PullToRefresh onRefresh={async () => { await refetch() }}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTurmas.map((turma, idx) => (
                <motion.div key={turma.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} layout>
                  <NativeCard
                    swipeable
                    onClick={() => abrirVer(turma)}
                    onEdit={() => abrirEdicao(turma)}
                    onDelete={() => abrirExcluir(turma)}
                    className="p-0 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{turma.nome}</h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className="text-[8px] font-black uppercase rounded-lg px-2 h-5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-0">
                                {turma.turno}
                              </Badge>
                              {turma.sala && (
                                <span className="text-[9px] font-bold text-slate-300 flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />{turma.sala}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <motion.button whileTap={{ scale: 0.92 }} onClick={(e) => { e.stopPropagation(); abrirEdicao(turma) }}
                            className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700">
                            <Pencil className="h-4 w-4" />
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.92 }} onClick={(e) => { e.stopPropagation(); abrirExcluir(turma) }}
                            className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 border border-rose-100">
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-300 uppercase">{turma.capacidade_maxima || 30} vagas</span>
                        </div>
                        <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">
                          R$ {Number(turma.valor_mensalidade || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </NativeCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTurmas.length === 0 && (
              <div className="py-24 text-center">
                <div className="h-24 w-24 bg-slate-100/50 rounded-[3rem] flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Nenhuma Turma</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Toque no + para começar</p>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      {/* ── FAB (Rule 23) ─────────────────────────── */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
        onClick={abrirNovo}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950"
      >
        <Plus className="h-7 w-7" />
      </motion.button>


      {/* ═══════════════════════════════════════════════
          BOTTOM SHEET — VER (DETALHES DA TURMA)
      ═══════════════════════════════════════════════ */}
      <BottomSheet isOpen={verOpen} onClose={() => setVerOpen(false)} title="Detalhes da Turma" size="half">
        {vendo && (
          <div className="pt-4 space-y-7 pb-32">
            {/* Hero */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100/50 shrink-0">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">{vendo.nome}</h2>
                <Badge className="mt-1 text-[8px] font-black uppercase rounded-lg px-2 h-5 bg-indigo-50 text-indigo-600 border-0">
                  {vendo.turno}
                </Badge>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vagas</span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{vendo.capacidade_maxima || '—'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center text-center space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Mensalidade</span>
                </div>
                <p className="text-xl font-black text-emerald-600">R$ {Number(vendo.valor_mensalidade || 0).toFixed(2).replace('.', ',')}</p>
              </div>
              {vendo.sala && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sala</span>
                  </div>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate max-w-full uppercase">{vendo.sala}</p>
                </div>
              )}
              {(vendo as any).horario && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Horário</span>
                  </div>
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate max-w-full">{(vendo as any).horario}</p>
                </div>
              )}
            </div>

            {/* Fixed Footer Actions (Rule 11) — Com respiro extra (Rule 12/Regra de ergonomia) */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800">
              <div className="mx-auto w-full max-w-[640px] px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => abrirExcluir(vendo)}
                  className="flex-1 h-14 rounded-xl font-bold text-base text-rose-500 border-rose-100 active:scale-92 transition-all"
                >
                  Excluir
                </Button>
                <Button
                  onClick={() => abrirEdicao(vendo)}
                  className="flex-1 h-14 rounded-xl bg-indigo-600 font-bold text-base active:scale-92 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  Editar
                </Button>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>


      {/* ═══════════════════════════════════════════════
          BOTTOM SHEET — CRIAR / EDITAR TURMA (Rules 4, 7, 11, 12)
      ═══════════════════════════════════════════════ */}
      <BottomSheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editando ? 'Editar Turma' : 'Nova Turma'}
        size="full"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 pt-4 pb-32">

          {/* Nome */}
          <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome *</Label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                placeholder="Ex: 1º Ano A"
                {...register('nome')}
                className="h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {errors.nome && <p className="text-[10px] font-bold text-rose-500 ml-2">{errors.nome.message}</p>}
          </div>

          {/* Turno e capacidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Turno *</Label>
              <Select defaultValue={editando?.turno || ''} onValueChange={(v) => setValue('turno', v)}>
                <SelectTrigger className="h-14 rounded-2xl text-base font-black bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner">
                  <SelectValue placeholder="Escolher" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl border-slate-100 shadow-2xl">
                  <SelectItem value="matutino" className="py-4 font-black">Matutino</SelectItem>
                  <SelectItem value="vespertino" className="py-4 font-black">Vespertino</SelectItem>
                  <SelectItem value="noturno" className="py-4 font-black">Noturno</SelectItem>
                  <SelectItem value="integral" className="py-4 font-black">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vagas</Label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  type="number"
                  inputMode="numeric"
                  {...register('capacidade_maxima')}
                  className="h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Horário */}
          <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Horário (Início – Fim)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input type="time" {...register('horario_inicio')} className="h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner" />
              </div>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input type="time" {...register('horario_fim')} className="h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner" />
              </div>
            </div>
          </div>

          {/* Sala e Mensalidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sala</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input placeholder="Ex: Sala 01" {...register('sala')} className="h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner" />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mensalidade (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                <Input
                  type="number" step="0.01" inputMode="decimal"
                  {...register('valor_mensalidade')}
                  className="h-14 rounded-2xl text-base font-black pl-11 bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Filial */}
          {filiais && filiais.length > 0 && (
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unidade / Filial</Label>
              <Select defaultValue={editando?.filial_id || ''} onValueChange={(v) => setValue('filial_id', v)}>
                <SelectTrigger className="h-14 rounded-2xl text-base font-black bg-slate-50/70 dark:bg-slate-800/70 border-0 shadow-inner">
                  <SelectValue placeholder="Escolha a unidade" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl border-slate-100 shadow-2xl">
                  {(filiais as any[]).map(f => (
                    <SelectItem key={f.id} value={f.id} className="py-4 font-black">{f.nome_unidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── FIXED FOOTER (Rule 11) — Com respiro generoso ─── */}
          <div className="fixed bottom-0 left-0 right-0 px-6 pt-5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 flex gap-4 z-50">
            <Button
              type="button" variant="outline"
              onClick={() => setFormOpen(false)}
              className="flex-1 h-14 rounded-xl font-bold text-base text-slate-400 border-slate-100 active:scale-92 transition-all"
            >
              Cancelar
            </Button>
            <Button
              type="submit" disabled={isSubmitting}
              className="flex-1 h-14 rounded-xl bg-indigo-600 font-bold text-base active:scale-92 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editando ? 'Salvar' : 'Cadastrar')}
            </Button>
          </div>
        </form>
      </BottomSheet>


      {/* ═══════════════════════════════════════════════
          BOTTOM SHEET — EXCLUIR (Rule 4 - peek)
      ═══════════════════════════════════════════════ */}
      <BottomSheet isOpen={excluirOpen} onClose={() => setExcluirOpen(false)} title="Excluir Turma" size="peek">
        <div className="space-y-7 pt-4 text-center pb-32">
          <div className="h-20 w-20 bg-rose-50 dark:bg-rose-900/40 rounded-xl flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Excluir "{turmaParaExcluir?.nome}"?
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-3 max-w-[260px] mx-auto leading-relaxed italic">
              Esta ação é irreversível e removerá todos os vínculos desta turma permanentemente.
            </p>
          </div>

          {/* Fixed Footer Actions (Rule 11) — Respiro extra para prevenção de erro de toque */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
            <div className="mx-auto w-full max-w-[640px] px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex gap-3">
              <Button
                variant="outline"
                onClick={() => setExcluirOpen(false)}
                className="flex-1 h-14 rounded-xl font-bold text-base border-slate-100 active:scale-92 transition-all"
              >
                Manter
              </Button>
              <Button
                onClick={confirmarExclusao}
                className="flex-1 h-14 rounded-xl bg-rose-600 font-bold text-base active:scale-92 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>

    </div>
  )
}
