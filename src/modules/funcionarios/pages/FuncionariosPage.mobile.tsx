import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useFuncionarios,
  useCriarFuncionario,
  useAtualizarFuncionario,
  useExcluirFuncionario,
  useCriarUsuarioEscola,
  useFuncoes,
  useGerarFolhaPagamento,
} from '../hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Loader2, 
  UserPlus, 
  KeyRound, 
  Eye, 
  Wallet, 
  Calendar, 
  ArrowLeft,
  Search,
  Users,
  MoreVertical,
  Briefcase,
  Phone,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Building
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { MultiSelect } from '@/components/ui/multi-select'

// Schemas
const funcSchema = z.object({
  nome_completo: z.string().min(3, 'Nome obrigatório'),
  como_chamado: z.string().optional(),
  funcoes: z.array(z.string()).min(1, 'Selecione ao menos uma função'),
  salario_bruto: z.coerce.number().optional(),
  dia_pagamento: z.coerce.number().min(1).max(31).optional(),
  data_admissao: z.string().optional(),
})

type FuncFormData = z.infer<typeof funcSchema>

// Exibe apenas o cargo principal, sem a especialização (ex: "Professor de Ed. Física" → "Professor")
function normalizarCargo(nome: string): string {
  if (!nome) return nome
  const match = nome.match(/^([^\s]+(?:\s+[^\s]+)*?)\s+(de|do|da|dos|das)\s/i)
  if (match) return match[1]
  return nome
}

export function FuncionariosPageMobile() {
  const { authUser } = useAuth()
  const { data: funcionarios, isLoading, refetch } = useFuncionarios()
  const { data: funcoesCatalogo = [] } = useFuncoes()
  const criar = useCriarFuncionario()
  const atualizar = useAtualizarFuncionario()
  const excluir = useExcluirFuncionario()
  const gerarFolha = useGerarFolhaPagamento()

  // Estados UI
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'ativos' | 'inativos'>('ativos')
  const [selectedFolder, setSelectedFolder] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [folhaOpen, setFolhaOpen] = useState(false)
  
  // Estados Folha
  const [mesFolha, setMesFolha] = useState(new Date().getMonth() + 1)
  const [anoFolha, setAnoFolha] = useState(new Date().getFullYear())

  const funcForm = useForm<FuncFormData>({ 
    resolver: zodResolver(funcSchema) as any,
    defaultValues: { funcoes: [], dia_pagamento: 5 }
  })

  // Filtros
  const filtered = useMemo(() => {
    let list = funcionarios || []
    list = list.filter((f: any) => f.status === (activeTab === 'ativos' ? 'ativo' : 'inativo'))
    if (search) {
      list = list.filter((f: any) => 
        f.nome_completo.toLowerCase().includes(search.toLowerCase()) || 
        f.como_chamado?.toLowerCase().includes(search.toLowerCase())
      )
    }
    return list
  }, [funcionarios, search, activeTab])

// Normalizar e dedupar funções para display
  const getFuncaoDisplay = (f: any): string => {
    if (!f) return 'Sem função'
    const funcs = (Array.isArray(f.funcoes) && f.funcoes.length > 0) ? f.funcoes : (f.funcao ? [f.funcao] : ([] as string[]))
    if (funcs.length === 0) return 'Sem função'
    const normalizeFn = (fn: string) => {
      if (!fn) return ''
      const match = fn.match(/^([^\s]+(?:\s+[^\s]+)*?)\s+(de|do|da|dos|das)\s/i)
      return match ? match[1] : fn
    }
    const unicas = [...new Set(funcs.map(normalizeFn))]
    const result = unicas[0]
    return (typeof result === 'string' ? result : 'Sem função') || 'Sem função'
  }

  const handleEdit = (f: any) => {
    setSelectedFolder(f)
    funcForm.reset({
      nome_completo: f.nome_completo,
      como_chamado: f.como_chamado || '',
      funcoes: Array.isArray(f.funcoes) ? f.funcoes : [f.funcao],
      salario_bruto: f.salario_bruto,
      dia_pagamento: f.dia_pagamento,
      data_admissao: f.data_admissao,
    })
    setEditOpen(true)
  }

  const onSubmit = async (data: any) => {
    if (!authUser) return
    try {
      if (selectedFolder?.id) {
        await atualizar.mutateAsync({ id: selectedFolder.id, data: { ...data, funcao: data.funcoes[0] } })
        toast.success('Atualizado!')
      } else {
        await criar.mutateAsync({ ...data, funcao: data.funcoes[0], tenant_id: authUser.tenantId, status: 'ativo' })
        toast.success('Cadastrado!')
      }
      setEditOpen(false)
      setSelectedFolder(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const handleToggleStatus = async (f: any) => {
    try {
        const newStatus = f.status === 'ativo' ? 'inativo' : 'ativo'
        await atualizar.mutateAsync({ id: f.id, data: { status: newStatus } })
        toast.success(`Funcionário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`)
    } catch {
        toast.error('Erro')
    }
  }

  const handleGerarFolha = async () => {
    try {
      await gerarFolha.mutateAsync({ mes: mesFolha, ano: anoFolha })
      toast.success('Folha enviada ao Contas a Pagar')
      setFolhaOpen(false)
    } catch {
      toast.error('Erro ao gerar folha')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">Acessando Equipe...</p>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch() }}>
      <MobilePageLayout
        title="Equipe"
      >
        <div className="space-y-6 pb-20 pt-2">
            {/* Quick Filter & Actions */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input 
                        placeholder="Buscar funcionário..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm text-sm"
                    />
                </div>
                <button 
                    onClick={() => setFolhaOpen(true)}
                    className="h-14 w-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50"
                >
                    <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {['ativos', 'inativos'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            activeTab === tab ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-400"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Staff List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((f: any, idx: number) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <NativeCard onClick={() => handleEdit(f)} className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 relative">
                                            <Users size={24} className="text-slate-300" />
                                            {f.user_id && (
                                                <div className="absolute -top-1 -right-1 bg-indigo-600 p-1 rounded-lg shadow-lg">
                                                    <KeyRound size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-white text-base">
                                                {f.como_chamado || f.nome_completo.split(' ')[0]}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                                {getFuncaoDisplay(f)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {f.salario_bruto && (
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                {formatCurrency(f.salario_bruto).split(',')[0]}
                                            </span   >
                                        )}
                                        <MoreVertical size={16} className="text-slate-300" />
                                    </div>
                                </div>
                            </NativeCard>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Users size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum registro encontrado</p>
                    </div>
                )}
            </div>
        </div>

        {/* FAB - Novo Funcionário */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setSelectedFolder(null); funcForm.reset({ funcoes: [], dia_pagamento: 5 }); setEditOpen(true); }}
          className="fixed bottom-28 right-6 h-18 w-18 rounded-[24px] bg-indigo-600 shadow-2xl shadow-indigo-200 text-white z-40 flex items-center justify-center"
        >
          <Plus className="h-7 w-7" />
        </motion.button>

        {/* Edit / Create Form BottomSheet */}
        <BottomSheet 
            isOpen={editOpen} 
            onClose={() => setEditOpen(false)} 
            title={selectedFolder ? "Editar Membro" : "Novo Membro"}
        >
            <div className="px-1 pb-24 space-y-6">
                <form onSubmit={funcForm.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
                            <Input placeholder="Nome Completo" {...funcForm.register('nome_completo')} className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Como é chamado</Label>
                            <Input placeholder="Nome Curto" {...funcForm.register('como_chamado')} className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Funções</Label>
                            <Controller
                                control={funcForm.control}
                                name="funcoes"
                                render={({ field }) => (
                                    <MultiSelect
                                        options={(funcoesCatalogo as any[]).map(f => ({ value: f.nome, label: f.nome }))}
                                        selected={field.value || []}
                                        onChange={field.onChange}
                                        placeholder="Selecione as funções..."
                                        className="rounded-2xl bg-slate-50 border-none min-h-[64px]"
                                    />
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Salário Bruto</Label>
                                <Input type="number" placeholder="0,00" {...funcForm.register('salario_bruto')} className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pagamento (Dia)</Label>
                                <Input type="number" {...funcForm.register('dia_pagamento')} className="h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Button
                            type="submit"
                            disabled={funcForm.formState.isSubmitting}
                            className="w-full h-20 rounded-[32px] bg-slate-900 border-4 border-white dark:border-slate-800 text-white font-black uppercase text-sm tracking-widest shadow-2xl"
                        >
                            {funcForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'SALVAR CADASTRO'}
                        </Button>
                        
                        {selectedFolder && (
                            <button 
                                type="button"
                                onClick={() => handleToggleStatus(selectedFolder)}
                                className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 text-rose-500 bg-rose-50/50"
                            >
                                <Trash2 size={16} className="inline mr-2" />
                                {activeTab === 'ativos' ? 'DESATIVAR MEMBRO' : 'REATIVAR MEMBRO'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </BottomSheet>

        {/* Payroll BottomSheet */}
        <BottomSheet isOpen={folhaOpen} onClose={() => setFolhaOpen(false)} title="Folha de Pagamento">
           <div className="px-1 pb-24 space-y-8">
                <div className="p-8 bg-emerald-600 rounded-[40px] text-white flex flex-col items-center justify-center text-center shadow-2xl shadow-emerald-100">
                    <Wallet size={48} className="mb-4 opacity-50" />
                    <h2 className="text-2xl font-black tracking-tight leading-none uppercase">Gerar Salários</h2>
                    <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest mt-2 px-10">Lança automaticamente as contas a pagar de toda a equipe ativa.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês Ref.</Label>
                        <select 
                            value={mesFolha} 
                            onChange={(e) => setMesFolha(Number(e.target.value))}
                            className="w-full h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm font-black appearance-none"
                        >
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano Ref.</Label>
                        <select 
                            value={anoFolha} 
                            onChange={(e) => setAnoFolha(Number(e.target.value))}
                            className="w-full h-16 rounded-2xl bg-slate-50 border-none px-6 text-sm font-black appearance-none"
                        >
                            {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                     </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-50">
                        <ShieldCheck size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 leading-normal uppercase">
                        O sistema verifica retroativamente e evita lançamentos duplicados para o mesmo mês/ano.
                    </p>
                </div>

                <Button 
                    onClick={handleGerarFolha}
                    disabled={gerarFolha.isPending}
                    className="w-full h-20 rounded-[32px] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-100"
                >
                    {gerarFolha.isPending ? <Loader2 size={24} className="animate-spin" /> : 'PROCESSAR FOLHA'}
                </Button>
           </div>
        </BottomSheet>
      </MobilePageLayout>
    </PullToRefresh>
  )
}
