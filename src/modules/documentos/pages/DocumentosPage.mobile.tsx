import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  GraduationCap, 
  Scale, 
  HeartPulse, 
  Search, 
  Plus, 
  History, 
  Clock, 
  CheckCircle2, 
  X, 
  Printer, 
  Eye, 
  Download,
  ArrowLeft,
  ChevronRight,
  UserCircle,
  ClipboardCheck,
  FileCheck,
  FileOutput,
  LogOut,
  ArrowRight,
  Image as ImageIcon,
  Activity,
  Inbox,
  ShieldCheck,
  Package,
  Loader2,
  Settings2,
  Shield,
  Pencil,
  Copy,
  Globe,
  Building2,
  EyeOff,
  SwitchCamera
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/modules/auth/AuthContext'
import { 
  useTemplates, 
  useDocumentosEmitidos, 
  useEmitirDocumento, 
  useSolicitacoesDocumento, 
  useAtualizarSolicitacao 
} from '../hooks'
import { useAlunos } from '@/modules/alunos/hooks'
import { useModelosAutorizacaoAdmin } from '@/modules/autorizacoes/hooks'
import { ContratoTab } from '../components/ContratoTab'

// Components Mobile
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'secretaria', label: 'Secretaria', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { id: 'pedagogico', label: 'Pedagógico', icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 'juridico', label: 'Jurídico', icon: Scale, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  { id: 'saude', label: 'Saúde', icon: HeartPulse, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
]

const DOCUMENT_TYPES = [
  { id: 'ficha_matricula', label: 'Ficha de Matrícula', category: 'secretaria', icon: UserCircle },
  { id: 'ficha_individual', label: 'Ficha Individual do Aluno', category: 'pedagogico', icon: ClipboardCheck },
  { id: 'declaracao_matricula', label: 'Declaração de Matrícula', category: 'secretaria', icon: FileCheck },
  { id: 'historico', label: 'Histórico Escolar', category: 'pedagogico', icon: GraduationCap },
  { id: 'transferencia', label: 'Transferência', category: 'secretaria', icon: FileOutput },
  { id: 'desistencia', label: 'Desistência', category: 'juridico', icon: LogOut },
  { id: 'saida_antecipada', label: 'Saída Antecipada', category: 'secretaria', icon: ArrowRight },
  { id: 'termo_imagem', label: 'Uso de Imagem', category: 'juridico', icon: ImageIcon },
  { id: 'ficha_saude', label: 'Ficha de Saúde', category: 'saude', icon: Activity },
  { id: 'termo_material', label: 'Termo de Material', category: 'secretaria', icon: FileText },
]

type Tab = 'central' | 'contrato' | 'historico' | 'solicitacoes' | 'autorizacoes' | 'modelos'

export function DocumentosPageMobile() {
  const { authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('central')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: emitidos, isLoading: loadingEmitidos, refetch: refetchEmitidos } = useDocumentosEmitidos()
  const { data: solicitacoes, isLoading: loadingSolicitacoes, refetch: refetchSolicitacoes } = useSolicitacoesDocumento()
  const { data: templates, isLoading: loadingTemplates, refetch: refetchTemplates } = useTemplates()
  const { data: modelosAutorizacao, isLoading: loadingAutorizacoes, refetch: refetchAutorizacoes } = useModelosAutorizacaoAdmin()
  const { data: alunos } = useAlunos()
  const atualizarSolicitacao = useAtualizarSolicitacao()
  const emitir = useEmitirDocumento()

  // Emission states
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [selectedAlunoId, setSelectedAlunoId] = useState('')

  const filterDocs = useMemo(() => {
    return DOCUMENT_TYPES.filter(d => {
      const matchCategory = !selectedCategory || d.category === selectedCategory
      const matchSearch = d.label.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [selectedCategory, searchTerm])

  const dedupedEmitidos = useMemo(() => {
    if (!emitidos) return []
    const seen = new Set()
    return emitidos.filter((doc: any) => {
      const key = `${doc.titulo}-${doc.aluno_id}-${doc.conteudo_final}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [emitidos])

  const dedupedTemplates = useMemo(() => {
    if (!templates) return []
    const seen = new Set()
    return templates.filter((t: any) => {
      const key = `${t.titulo}-${t.tipo}-${t.corpo_html}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [templates])

  const getPreviewData = (alunoId: string) => {
    const aluno = alunos?.find((a: any) => a.id === alunoId) as any
    if (!aluno) return null

    const formatEndereco = (a: any) => {
      if (a.logradouro) return `${a.logradouro}, ${a.numero}${a.bairro ? ` - ${a.bairro}` : ''}${a.cidade ? ` - ${a.cidade}` : ''}`;
      return 'Endereço não informado';
    }

    const maeRel = aluno.aluno_responsavel?.find((r: any) => r.grau_parentesco?.toLowerCase().includes('mãe'))?.responsaveis;
    const financeiroRel = aluno.aluno_responsavel?.find((r: any) => r.is_financeiro)?.responsaveis;

    return {
      nome: aluno.nome_completo,
      rg: aluno.rg || '—',
      cpf: aluno.cpf || '—',
      dataNascimento: aluno.data_nascimento ? new Date(aluno.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
      endereco: formatEndereco(aluno),
      nomeMae: maeRel?.nome || aluno.nome_mae || 'Não informado',
      cpfResponsavel: financeiroRel?.cpf || aluno.cpf_responsavel || '—',
      telefoneEmergencia: aluno.telefone_contato || '—',
      naturalidade: aluno.naturalidade || '—',
      hashValidacao: 'VIVID-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    }
  }

  const handleEmitirConfirm = async () => {
    if (!authUser || !selectedDoc || !selectedAlunoId) {
      toast.error('Selecione um aluno e um documento')
      return
    }

    const dataSnapshot = getPreviewData(selectedAlunoId)
    if (!dataSnapshot) return

    try {
      await emitir.mutateAsync({
        tenant_id: authUser.tenantId,
        template_id: null,
        aluno_id: selectedAlunoId,
        titulo: selectedDoc.label,
        conteudo_final: JSON.stringify({ ...dataSnapshot, tipo_doc: selectedDoc.id }),
        status: 'gerado'
      })
      toast.success('Documento emitido com sucesso!')
      setIsEmitModalOpen(false)
      setActiveTab('historico')
      refetchEmitidos()
    } catch {
      toast.error('Erro ao emitir documento')
    }
  }

  const handleRefresh = async () => {
    if (activeTab === 'historico') await refetchEmitidos()
    if (activeTab === 'solicitacoes') await refetchSolicitacoes()
    if (activeTab === 'modelos') await refetchTemplates()
    if (activeTab === 'autorizacoes') await refetchAutorizacoes()
  }

  const handleEmit = (doc: any) => {
    setSelectedDoc(doc)
    setIsEmitModalOpen(true)
  }

  const handleDownloadPDF = (doc?: any) => {
    toast.info('Geração de PDF iniciada...')
    setTimeout(() => {
       toast.success('PDF pronto para download')
    }, 1500)
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pendente: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500',
      em_analise: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500',
      pronto: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500',
      entregue: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-500',
      recusado: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-500',
    }
    return (
      <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-black border-none", statusColors[status] || statusColors.pendente)}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <MobilePageLayout
      title="Documentos"
      leftAction={
        <button onClick={() => window.history.back()} className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
      }
    >
      {/* Tabs Navigation - Scrollable for more tabs */}
      <div className="sticky top-16 -mx-4 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 py-3 min-w-max">
            {[
              { id: 'central', label: 'Emitir', icon: FileText },
              { id: 'contrato', label: 'Contrato', icon: FileText },
              { id: 'historico', label: 'Histórico', icon: History },
              { id: 'solicitacoes', label: 'Solicitações', icon: Inbox },
              { id: 'autorizacoes', label: 'Autorizações', icon: ShieldCheck },
              { id: 'modelos', label: 'Modelos', icon: Settings2 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pt-4 pb-32">
          {activeTab === 'central' && (
            <div className="space-y-6">
              {/* Categories Scroll */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                    !selectedCategory 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500"
                  )}
                >
                  Todos
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                      selectedCategory === cat.id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500"
                    )}
                  >
                    <cat.icon className="h-3 w-3" />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar tipo de documento..." 
                  className="h-12 pl-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Document List */}
              <div className="grid grid-cols-1 gap-3">
                {filterDocs.map((doc, idx) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <NativeCard
                      onClick={() => handleEmit(doc)}
                      className="p-4 flex items-center justify-between group active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                          CATEGORIES.find(c => c.id === doc.category)?.bg || 'bg-slate-50'
                        )}>
                          <doc.icon className={cn(
                            "h-6 w-6",
                            CATEGORIES.find(c => c.id === doc.category)?.color || 'text-slate-400'
                          )} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                            {CATEGORIES.find(c => c.id === doc.category)?.label}
                          </p>
                          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                            {doc.label}
                          </h4>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </NativeCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contrato' && (
            <div className="pb-12">
              <ContratoTab />
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-4">
                {loadingEmitidos ? (
                  <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                  </div>
                ) : !dedupedEmitidos?.length ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <History className="h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Nenhum documento emitido</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-[240px]">Os documentos gerados pelo painel aparecerão aqui.</p>
                 </div>
               ) : (
                 dedupedEmitidos.map((doc: any, idx: number) => (
                    <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                      <NativeCard className="p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{doc.titulo}</h4>
                              <p className="text-xs font-bold text-indigo-600 mt-0.5 truncate">{doc.aluno?.nome_completo}</p>
                            </div>
                            <Badge variant="secondary" className="bg-slate-50 dark:bg-slate-800/50 border-none text-[8px] font-black uppercase tracking-widest shrink-0">
                              {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </Badge>
                        </div>
                        <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                            <Button size="sm" variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase text-slate-500 border-slate-100">
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase text-indigo-600 border-indigo-100 bg-indigo-50/50">
                              <Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimir
                            </Button>
                        </div>
                      </NativeCard>
                    </motion.div>
                 ))
               )}
            </div>
          )}

          {activeTab === 'solicitacoes' && (
            <div className="space-y-4">
               {loadingSolicitacoes ? (
                 <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                 </div>
               ) : !solicitacoes?.length ? (
                 <div className="py-20 text-center flex flex-col items-center">
                    <Inbox className="h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Sem solicitações</h3>
                    <p className="text-slate-500 text-sm mt-2">Novas solicitações de documentos aparecerão aqui.</p>
                 </div>
               ) : (
                 solicitacoes.map((sol: any, idx: number) => (
                    <motion.div key={sol.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <div className="relative group">
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20" 
                        style={{ backgroundColor: sol.status === 'pendente' ? '#f59e0b' : '#10b981' }} 
                      />
                      <NativeCard className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                                    {DOCUMENT_TYPES.find(d => d.id === sol.documento_tipo)?.label || sol.documento_tipo}
                                  </h4>
                                  {getStatusBadge(sol.status)}
                              </div>
                              <p className="text-xs font-bold text-indigo-600 mt-1 truncate">{sol.aluno?.nome_completo}</p>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase shrink-0">{new Date(sol.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        {sol.observacoes && (
                            <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                              <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5 leading-relaxed">
                                  <Clock className="h-3 w-3" /> {sol.observacoes}
                              </p>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                            <span className="flex items-center gap-1"><UserCircle className="h-3 w-3" /> {sol.responsavel?.nome}</span>
                        </div>

                        {sol.status === 'pendente' && (
                            <div className="flex gap-2 pt-1">
                              <Button 
                                onClick={() => atualizarSolicitacao.mutate({ id: sol.id, updates: { status: 'em_analise' } })}
                                className="flex-[2] bg-indigo-600 rounded-2xl h-11 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Atender
                              </Button>
                              <Button 
                                onClick={() => atualizarSolicitacao.mutate({ id: sol.id, updates: { status: 'recusado' } })}
                                variant="outline"
                                className="flex-1 rounded-2xl h-11 font-black uppercase text-[10px] tracking-widest text-rose-600 border-rose-100 bg-rose-50/50"
                              >
                                Recusar
                              </Button>
                            </div>
                        )}
                      </NativeCard>
                    </div>
                  </motion.div>
                 ))
               )}
            </div>
          )}

          {activeTab === 'autorizacoes' && (
            <div className="space-y-4">
               {loadingAutorizacoes ? (
                 <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                 </div>
               ) : !modelosAutorizacao?.length ? (
                 <div className="py-20 text-center flex flex-col items-center">
                    <Shield className="h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Sem autorizações</h3>
                    <p className="text-slate-500 text-sm mt-2">Configure os termos de aceite dos pais.</p>
                 </div>
               ) : (
                 modelosAutorizacao.map((m: any, idx: number) => (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
                      <NativeCard className={cn("p-4 flex flex-col gap-3 transition-opacity", !m.ativa && "opacity-60")}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{m.titulo}</h4>
                              {!m.tenant_id ? (
                                <Badge className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border-none uppercase">Sistema</Badge>
                              ) : (
                                <Badge className="text-[8px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold border-none uppercase">Escola</Badge>
                              )}
                              {m.obrigatoria && <Badge className="text-[8px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-bold border-none uppercase">Obrigatório</Badge>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{m.descricao_curta}</p>
                          </div>
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", m.ativa ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                             {m.ativa ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/50 mt-1">
                           <Button size="sm" variant="ghost" className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase text-slate-400">
                             <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver Texto
                           </Button>
                           {!m.tenant_id && (
                             <Button size="sm" variant="ghost" className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase text-indigo-600">
                               <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicar
                             </Button>
                           )}
                           {m.tenant_id && (
                             <Button size="sm" variant="ghost" className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase text-blue-600">
                               <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                             </Button>
                           )}
                        </div>
                      </NativeCard>
                    </motion.div>
                 ))
               )}
            </div>
          )}

          {activeTab === 'modelos' && (
            <div className="space-y-4">
               {loadingTemplates ? (
                 <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                 </div>
               ) : !dedupedTemplates?.length ? (
                 <div className="py-20 text-center flex flex-col items-center">
                    <Settings2 className="h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Nenhum modelo customizado</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-[240px]">Crie modelos de documentos personalizados para sua escola.</p>
                 </div>
               ) : (
                 dedupedTemplates.map((t: any, idx: number) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                      <NativeCard className="p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px]">{t.titulo}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t.tipo || 'Personalizado'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                           <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                              <Pencil className="h-4 w-4" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <X className="h-4 w-4" />
                           </Button>
                        </div>
                      </NativeCard>
                    </motion.div>
                 ))
               )}
               <Button className="w-full h-14 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest gap-2 shadow-sm mt-4">
                  <Plus className="h-4 w-4" /> Novo Modelo Customizado
               </Button>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* FAB for Quick Authorizations */}
      {activeTab === 'autorizacoes' && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center z-40"
        >
          <Plus className="h-7 w-7" />
        </motion.button>
      )}

      {/* Emission Sheet */}
      <BottomSheet 
        isOpen={isEmitModalOpen} 
        onClose={() => setIsEmitModalOpen(false)} 
        title="Emissão Rápida" 
        size="full"
      >
         <div className="space-y-6 pt-2 pb-12">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
               <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100 dark:shadow-none">
                  {selectedDoc?.icon && <selectedDoc.icon className="h-6 w-6" />}
               </div>
               <div>
                  <h3 className="font-black text-slate-900 dark:text-white leading-tight">{selectedDoc?.label}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{selectedDoc?.category}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Selecionar Aluno</Label>
                  <Select onValueChange={setSelectedAlunoId}>
                     <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm text-base font-bold">
                        <SelectValue placeholder="Toque para buscar aluno..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl">
                        {alunos?.map((a: any) => (
                           <SelectItem key={a.id} value={a.id} className="font-bold py-3">{a.nome_completo}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest">Document Engine v2</h4>
                  </div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
                    Ao confirmar, os dados do aluno serão extraídos automaticamente e o documento será gerado e salvo no histórico.
                  </p>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-50 dark:border-slate-800/50 mt-4">
               <div className="grid grid-cols-1 gap-3">
                 <Button 
                   onClick={handleEmitirConfirm}
                   disabled={!selectedAlunoId || emitir.isPending}
                   className="h-16 rounded-3xl bg-indigo-600 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                 >
                    {emitir.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'EMITIR DOCUMENTO AGORA'}
                 </Button>
                 <Button 
                   onClick={() => handleDownloadPDF()}
                   disabled={!selectedAlunoId || emitir.isPending}
                   variant="ghost"
                   className="h-12 text-slate-400 font-bold"
                 >
                    CANCELAR
                 </Button>
               </div>
            </div>
         </div>
      </BottomSheet>
    </MobilePageLayout>
  )
}
