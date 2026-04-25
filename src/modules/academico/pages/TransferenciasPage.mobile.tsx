import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/auth/AuthContext'
import { useAlunos } from '@/modules/alunos/hooks'
import { useEscolas } from '@/modules/escolas/hooks'
import {
  useTransferenciasEscola,
  useSolicitarTransferencia,
  useCheckPermissaoTransferencia,
  useAceitarTransferenciaDestino,
  useRecusarTransferenciaDestino,
  useConcluirTransferencia
} from '@/modules/academico/hooks'
import { supabase } from '@/lib/supabase'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LucideIcon, ArrowRightLeft, Plus, Search, Loader2, Eye, AlertTriangle, CheckCircle2, XCircle, Clock, User, School, ShieldCheck, FileText, ArrowLeft, ChevronRight, UserCheck, SearchCode, ArrowUpRight, ArrowDownLeft, ThumbsUp, ThumbsDown, Unlock } from 'lucide-react'

import { type TransferenciaRow, type TransferenciaEscolarStatus } from '../transferencias.service'

const statusConfig: Record<TransferenciaEscolarStatus, { label: string; color: string; bg: string; border: string; icon: LucideIcon }> = {
  aguardando_responsavel: { label: 'Aguardando Responsável', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  aguardando_aceite_destino: { label: 'Aguardando Destino', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: School },
  aguardando_liberacao_origem: { label: 'Aguardando Liberação', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: FileText },
  recusado: { label: 'Recusada', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle },
  cancelado: { label: 'Cancelada', color: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-200', icon: XCircle },
  concluido: { label: 'Concluída', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  expirado: { label: 'Expirada', color: 'text-stone-500', bg: 'bg-stone-50', border: 'border-stone-200', icon: XCircle },
}

export function TransferenciasPageMobile() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId
  const { data: transferencias, isLoading, refetch } = useTransferenciasEscola()
  const { data: escolas } = useEscolas()
  const { data: alunos } = useAlunos()
  const { data: permissao } = useCheckPermissaoTransferencia()
  
  const solicitar = useSolicitarTransferencia()
  const aceitarDestino = useAceitarTransferenciaDestino()
  const recusarDestino = useRecusarTransferenciaDestino()
  const concluirTransferencia = useConcluirTransferencia()

  const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas'>('recebidas')
  const [busca, setBusca] = useState('')
  const [detailTransferencia, setDetailTransferencia] = useState<TransferenciaRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [recusarDestinoDialog, setRecusarDestinoDialog] = useState<TransferenciaRow | null>(null)
  const [justificativaRecusa, setJustificativaRecusa] = useState('')
  
  // Form Logic Toggle
  const [formMode, setFormMode] = useState<'inbound' | 'outbound'>('inbound')
  
  // Form states (Inbound via Code)
  const [codigoAluno, setCodigoAluno] = useState('')
  const [verificacaoResponsavel, setVerificacaoResponsavel] = useState('')
  const [alunoEncontrado, setAlunoEncontrado] = useState<any>(null)
  const [responsavelEncontrado, setResponsavelEncontrado] = useState<any>(null)
  const [isSearchingCode, setIsSearchingCode] = useState(false)
  const [cpfErro, setCpfErro] = useState<string | null>(null)

  // Form states (Outbound via Select)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [motivo, setMotivo] = useState('')

  // Filter e separação por tipo
  const transferenciasList = useMemo(() => {
    if (!transferencias) return []
    return transferencias.filter((t) => {
      const q = busca.toLowerCase()
      return t.aluno_nome?.toLowerCase().includes(q) ||
             t.escola_origem?.toLowerCase().includes(q) ||
             t.escola_destino?.toLowerCase().includes(q)
    })
  }, [transferencias, busca])

  const recebidas = useMemo(() =>
    transferenciasList.filter((t) => t.destino_id === tenantId),
    [transferenciasList, tenantId]
  )

  const enviadas = useMemo(() =>
    transferenciasList.filter((t) => t.origem_id === tenantId),
    [transferenciasList, tenantId]
  )

  const pendentes = useMemo(() =>
    transferenciasList.filter((t) =>
      !['concluido', 'recusado', 'cancelado', 'expirado'].includes(t.status)
    ).length,
    [transferenciasList]
  )

  // Busca de Aluno por Código (Inbound)
  useEffect(() => {
    if (formMode === 'inbound' && codigoAluno.length === 8) {
      const buscar = async () => {
        setIsSearchingCode(true)
        try {
          const { data, error } = await (supabase as any)
            .rpc('buscar_aluno_transferencia', { p_codigo: codigoAluno.toUpperCase() })
          
          if (error) throw error
          
          if (data && data.length > 0) {
            const aluno = data[0]
            const parsedAluno = typeof aluno === 'string' ? JSON.parse(aluno) : aluno
            setAlunoEncontrado({
              ...parsedAluno,
              aluno_responsavel: parsedAluno.responsaveis?.map((r: any) => ({ responsaveis: r })) || []
            })
          } else {
            setAlunoEncontrado(null)
            toast.error('Código não localizado')
          }
        } catch (err) {
          console.error(err)
          setAlunoEncontrado(null)
        } finally {
          setIsSearchingCode(false)
        }
      }
      buscar()
    } else {
      setAlunoEncontrado(null)
      setResponsavelEncontrado(null)
      setCpfErro(null)
    }
  }, [codigoAluno, formMode])

  // Validação CPF Responsável (Inbound)
  useEffect(() => {
    if (!alunoEncontrado || !verificacaoResponsavel) return
    
    const docLimpo = verificacaoResponsavel.replace(/\D/g, '')
    if (docLimpo.length >= 11) {
      const resp = alunoEncontrado.aluno_responsavel?.find((v: any) => 
        (v.responsaveis?.cpf || '').replace(/\D/g, '') === docLimpo
      )
      if (resp) {
        setResponsavelEncontrado(resp.responsaveis)
        setCpfErro(null)
      } else {
        setResponsavelEncontrado(null)
        setCpfErro("CPF não confere com o ID informado")
      }
    }
  }, [verificacaoResponsavel, alunoEncontrado])

  const handleSolicitar = async () => {
    if (formMode === 'inbound') {
      if (!alunoEncontrado || !responsavelEncontrado || !motivo) {
        toast.error('Preencha as confirmações e o motivo')
        return
      }
      try {
        await solicitar.mutateAsync({
          alunoId: alunoEncontrado.id,
          origemId: alunoEncontrado.tenant_id,
          destinoId: tenantId!,
          responsavelId: responsavelEncontrado.id,
          motivo,
          iniciadoPor: 'destino'
        })
        toast.success('Solicitação enviada com sucesso!')
        resetForm()
        refetch()
      } catch (error: any) {
        toast.error(error.message || 'Erro ao processar solicitação')
      }
    } else {
      // Outbound Logic
      if (!selectedAlunoId || !destinoId || !motivo) {
        toast.error('Preencha aluno, escola e motivo')
        return
      }
      try {
        await solicitar.mutateAsync({
          alunoId: selectedAlunoId,
          origemId: tenantId!,
          destinoId,
          motivo,
          iniciadoPor: 'origem',
          responsavelId: null // Será buscado no backend/trigger se necessário ou definido na modal
        })
        toast.success('Transferência iniciada!')
        resetForm()
        refetch()
      } catch (error: any) {
        toast.error(error.message || 'Erro ao iniciar transferência')
      }
    }
  }

  const handleAceitarDestino = async (id: string) => {
    try {
      await aceitarDestino.mutateAsync(id)
      toast.success('Transferência aceita!')
      setDetailTransferencia(null)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao aceitar')
    }
  }

  const handleRecusarDestino = async () => {
    if (!recusarDestinoDialog || !justificativaRecusa.trim()) {
      toast.error('Informe a justificativa')
      return
    }
    try {
      await recusarDestino.mutateAsync({ id: recusarDestinoDialog.transferencia_id, justificativa: justificativaRecusa })
      toast.success('Recusada com sucesso.')
      setRecusarDestinoDialog(null)
      setJustificativaRecusa('')
      setDetailTransferencia(null)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao recusar')
    }
  }

  const handleConcluir = async (id: string) => {
    try {
      await concluirTransferencia.mutateAsync(id)
      toast.success('Concluído com sucesso! Dados integrados.')
      setDetailTransferencia(null)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao concluir')
    }
  }

  const resetForm = () => {
    setIsFormOpen(false)
    setCodigoAluno('')
    setVerificacaoResponsavel('')
    setAlunoEncontrado(null)
    setResponsavelEncontrado(null)
    setSelectedAlunoId('')
    setDestinoId('')
    setMotivo('')
    setCpfErro(null)
  }

  const currentList = activeTab === 'recebidas' ? recebidas : enviadas

  if (isLoading) {
    return (
      <MobilePageLayout title="Transferências">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 font-medium animate-pulse text-sm uppercase tracking-widest font-black">Sincronizando...</p>
        </div>
      </MobilePageLayout>
    )
  }

  return (
    <MobilePageLayout
      title="Transferências"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
      rightAction={
        <button onClick={() => setIsFormOpen(true)} className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <Plus className="h-5 w-5 text-white" />
        </button>
      }
    >
      {/* KPI Cards - Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pt-4 pb-4 -mx-4 px-4">
        {/* Pendentes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-w-[160px] bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Clock className="h-12 w-12 text-amber-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pendentes</p>
          <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-900 dark:text-white">{pendentes}</span>
             <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </motion.div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="min-w-[160px] bg-indigo-600 rounded-[28px] p-5 shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Total</p>
          <p className="text-3xl font-black text-white">{transferenciasList.length}</p>
        </motion.div>

        {/* Concluídas */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
          className="min-w-[160px] bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-emerald-500">Concluídas</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
            {transferenciasList.filter((t) => t.status === 'concluido').length}
          </p>
        </motion.div>
      </div>

      {/* Compliance Banner */}
      {permissao && !permissao.permissao_solicitacao_ativa && (
        <Alert className="bg-rose-50 border-rose-100 rounded-[22px] mb-4">
          <ShieldCheck className="h-5 w-5 text-rose-500" />
          <AlertTitle className="text-rose-900 font-bold">Solicitações Bloqueadas</AlertTitle>
          <AlertDescription className="text-rose-700 text-xs">
            Sua escola está temporariamente impedida de realizar solicitações ativas.
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab('recebidas')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'recebidas' 
              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
              : "text-slate-400"
          )}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Recebidas ({recebidas.length})
        </button>
        <button
          onClick={() => setActiveTab('enviadas')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
            activeTab === 'enviadas' 
              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
              : "text-slate-400"
          )}
        >
          <ArrowUpRight className="h-4 w-4" />
          Enviadas ({enviadas.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        <Input
          placeholder="Buscar transferência..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-12 h-14 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl text-base shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* List */}
      <PullToRefresh onRefresh={async () => { await refetch() }}>
        <div className="space-y-4 pb-32">
          {currentList.length === 0 ? (
            <div className="py-20 flex flex-col items-center opacity-40">
               <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <ArrowRightLeft className="h-10 w-10 text-slate-300" />
               </div>
               <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Sem dados hoje</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {currentList.map((t, idx) => {
                const cfg = statusConfig[t.status] || statusConfig.aguardando_responsavel
                const isActionableDestino = t.status === 'aguardando_aceite_destino' && t.destino_id === tenantId
                const isActionableOrigem = t.status === 'aguardando_liberacao_origem' && t.origem_id === tenantId

                return (
                  <motion.div
                    key={t.transferencia_id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <NativeCard
                      onClick={() => setDetailTransferencia(t)}
                      className={cn(
                        "p-5 border-none bg-white dark:bg-slate-800 shadow-sm relative overflow-hidden group transition-all active:scale-98",
                        (isActionableDestino || isActionableOrigem) && "ring-2 ring-indigo-500/10 bg-indigo-50/5"
                      )}
                    >
                      <div className={cn("absolute top-0 left-0 w-1.5 h-full", cfg.bg)} />
                      
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="h-7 w-7" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-black text-slate-800 dark:text-white text-sm truncate">
                              {t.aluno_nome}
                            </h4>
                            {(isActionableDestino || isActionableOrigem) ? (
                              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-200" />
                            )}
                          </div>
                          
                          <p className="text-[10px] text-slate-400 mb-4 flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                            <School className="h-3.5 w-3.5" />
                            {activeTab === 'recebidas' ? `De: ${t.escola_origem}` : `Para: ${t.escola_destino}`}
                          </p>

                          <div className="flex items-center justify-between mt-auto">
                            <Badge className={cn("rounded-lg px-2.5 py-1 font-black text-[9px] uppercase tracking-wider border-none", cfg.bg, cfg.color)}>
                               {cfg.label}
                            </Badge>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                               {t.data_solicitacao ? format(new Date(t.data_solicitacao), 'dd MMM', { locale: ptBR }) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </NativeCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </PullToRefresh>

      {/* BottomSheet Form */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={resetForm}
        title="Nova Transferência"
        size="full"
      >
        <div className="space-y-8 pt-4 pb-12">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
            <button
               onClick={() => setFormMode('inbound')}
               className={cn(
                 "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 formMode === 'inbound' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
               )}
            >
              Receber Aluno
            </button>
            <button
               onClick={() => setFormMode('outbound')}
               className={cn(
                 "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 formMode === 'outbound' ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-400"
               )}
            >
              Enviar Aluno
            </button>
          </div>

          <div className="space-y-6">
            {formMode === 'inbound' ? (
              <>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID de Transferência (8 dígitos)</Label>
                   <div className="relative">
                      <Input
                        placeholder="ABC12345"
                        value={codigoAluno}
                        onChange={(e) => setCodigoAluno(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="h-16 rounded-[22px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xl tracking-[0.3em] uppercase pl-6"
                      />
                      {isSearchingCode ? (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-indigo-500" />
                      ) : (codigoAluno.length === 8 && alunoEncontrado) ? (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-500" />
                      ) : <SearchCode className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />}
                   </div>
                </div>

                <AnimatePresence>
                   {alunoEncontrado && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="space-y-6 overflow-hidden"
                     >
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-[22px] border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-white dark:bg-indigo-800 flex items-center justify-center text-indigo-600 shadow-sm">
                              <UserCheck size={20} />
                           </div>
                           <div>
                              <p className="text-[9px] font-black uppercase text-indigo-400 mb-0.5">Aluno Identificado</p>
                              <p className="font-bold text-indigo-900 dark:text-indigo-100 text-sm leading-tight">{alunoEncontrado.nome_completo}</p>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verificação CPF do Responsável</Label>
                           <Input
                             placeholder="000.000.000-00"
                             value={verificacaoResponsavel}
                             onChange={(e) => setVerificacaoResponsavel(e.target.value)}
                             className={cn(
                                "h-14 rounded-[20px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                                responsavelEncontrado ? "border-emerald-500 bg-emerald-50/20" : cpfErro ? "border-rose-500 bg-rose-50/20" : ""
                             )}
                           />
                           {responsavelEncontrado && (
                             <p className="text-[10px] font-black text-emerald-600 ml-1 uppercase">✓ Confere: {responsavelEncontrado.nome}</p>
                           )}
                           {cpfErro && (
                              <p className="text-[10px] font-black text-rose-600 ml-1 uppercase">⚠ {cpfErro}</p>
                           )}
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selecione o Aluno</Label>
                  <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                      <SelectValue placeholder="Buscar aluno interno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Escola Destino</Label>
                  <Select value={destinoId} onValueChange={setDestinoId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                      <SelectValue placeholder="Selecione a escola destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {escolas?.map((e: any) => (
                         (e.id !== tenantId) && 
                         <SelectItem key={e.id} value={e.id}>{e.razao_social || e.nome || 'Escola Virtual'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Motivo da Solicitação</Label>
              <Textarea
                placeholder="Descreva brevemente o motivo..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-h-[100px] rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 resize-none text-base"
              />
            </div>
          </div>

          <Button
            onClick={handleSolicitar}
            disabled={solicitar.isPending}
            className="w-full h-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
          >
            {solicitar.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Solicitação'}
          </Button>
        </div>
      </BottomSheet>

      {/* Details BottomSheet */}
      <BottomSheet
         isOpen={!!detailTransferencia}
         onClose={() => setDetailTransferencia(null)}
         title="Detalhes"
      >
         {detailTransferencia && (
           <div className="space-y-6 pb-12">
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-700">
                       <User size={32} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Aluno</p>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {detailTransferencia.aluno_nome}
                       </h3>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                       <p className="text-[9px] font-black uppercase text-slate-300 mb-2">Origem</p>
                       <p className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200 uppercase">{detailTransferencia.escola_origem || '—'}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                       <p className="text-[9px] font-black uppercase text-slate-300 mb-2">Destino</p>
                       <p className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200 uppercase">{detailTransferencia.escola_destino || '—'}</p>
                    </div>
                 </div>
              </div>

              {detailTransferencia.motivo_solicitacao && (
                <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Motivo</p>
                   <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{detailTransferencia.motivo_solicitacao}"
                   </p>
                </div>
              )}

              {(() => {
                const cfg = statusConfig[detailTransferencia.status] || statusConfig.aguardando_responsavel
                const StatusIcon = cfg.icon
                return (
                  <div className={cn("p-5 rounded-2xl border flex items-center gap-4", cfg.bg, cfg.border)}>
                     <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", cfg.color.replace('text-', 'bg-').split(' ')[0], "bg-opacity-10")}>
                        <StatusIcon className={cfg.color} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Status Atual</p>
                        <p className={cn("font-black uppercase tracking-tighter text-sm", cfg.color)}>{cfg.label}</p>
                     </div>
                  </div>
                )
              })()}

              {/* Ações Mobile */}
              <div className="flex flex-col gap-3 pt-4">
                 {detailTransferencia.status === 'aguardando_aceite_destino' && detailTransferencia.destino_id === tenantId && (
                   <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                        onClick={() => handleAceitarDestino(detailTransferencia.transferencia_id)}
                        disabled={aceitarDestino.isPending}
                      >
                         <ThumbsUp className="mr-2 h-5 w-5" />
                         Aceitar
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 rounded-2xl text-rose-600 border-rose-100 font-bold"
                        onClick={() => setRecusarDestinoDialog(detailTransferencia)}
                      >
                         <ThumbsDown className="mr-2 h-5 w-5" />
                         Recusar
                      </Button>
                   </div>
                 )}

                 {detailTransferencia.status === 'aguardando_liberacao_origem' && detailTransferencia.origem_id === tenantId && (
                    <Button
                      className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold"
                      onClick={() => handleConcluir(detailTransferencia.transferencia_id)}
                      disabled={concluirTransferencia.isPending}
                    >
                       <Unlock className="mr-2 h-5 w-5" />
                       Liberar e Concluir
                    </Button>
                 )}
              </div>
           </div>
         )}
      </BottomSheet>

      {/* Recusar BottomSheet */}
      <BottomSheet
        isOpen={!!recusarDestinoDialog}
        onClose={() => { setRecusarDestinoDialog(null); setJustificativaRecusa(''); }}
        title="Recusar Solicitação"
      >
         <div className="space-y-6 pb-12">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
               <p className="text-xs text-rose-800 font-medium">Você está recusando o ingresso deste aluno. Descreva o motivo abaixo.</p>
            </div>
            <Textarea 
               placeholder="Motivo da recusa..."
               value={justificativaRecusa}
               onChange={(e) => setJustificativaRecusa(e.target.value)}
               className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 text-base"
            />
            <Button
              className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold"
              onClick={handleRecusarDestino}
              disabled={recusarDestino.isPending}
            >
               Confirmar Recusa
            </Button>
         </div>
      </BottomSheet>
    </MobilePageLayout>
  )
}

export default TransferenciasPageMobile
