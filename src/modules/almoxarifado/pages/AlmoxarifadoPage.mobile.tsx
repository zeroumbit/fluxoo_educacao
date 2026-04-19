import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import { 
  useItensAlmoxarifado, 
  useMovimentacoes, 
  useCriarMovimentacao, 
  useDeletarItemAlmoxarifado,
  useCriarItemAlmoxarifado
} from '../hooks'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

export function AlmoxarifadoPageMobile() {
  const { authUser } = useAuth()
  const { data: itens, isLoading, refetch } = useItensAlmoxarifado()
  const { data: movs, refetch: refetchMovs } = useMovimentacoes()
  const criarMov = useCriarMovimentacao()
  const criarItem = useCriarItemAlmoxarifado()
  const deletarItem = useDeletarItemAlmoxarifado()

  // UI States
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'estoque' | 'historico'>('estoque')
  const [isMovOpen, setIsMovOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isNewItemOpen, setIsNewItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Movimentação State
  const [movType, setMovType] = useState<'entrada' | 'saida'>('entrada')
  const [movQty, setMovQty] = useState('')
  const [movJustificativa, setMovJustificativa] = useState('')
  const [gerarFinanceiro, setGerarFinanceiro] = useState(false)
  const [fornecedor, setFornecedor] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [vencimento, setVencimento] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)

  // Novo Item State
  const [newItem, setNewItem] = useState({ nome: '', categoria: '', alerta_estoque_minimo: 0 })

  const handleOpenMov = (item: any, type: 'entrada' | 'saida') => {
    setSelectedItem(item)
    setMovType(type)
    setIsMovOpen(true)
    setIsDetailOpen(false)
  }

  const handleConfirmMov = async () => {
    if (!authUser || !selectedItem || !movQty) return
    setIsSaving(true)
    try {
      await criarMov.mutateAsync({
        tenant_id: authUser.tenantId,
        item_id: selectedItem.id,
        tipo: movType,
        quantidade: Number(movQty),
        justificativa: movJustificativa,
        gerar_financeiro: gerarFinanceiro,
        fornecedor: movType === 'entrada' ? fornecedor : '',
        valor_total: movType === 'entrada' ? Number(valorTotal) : 0,
        vencimento_financeiro: movType === 'entrada' ? vencimento : undefined
      })
      toast.success('Movimentação registrada!')
      resetMovForm()
      setIsMovOpen(false)
      refetch()
    } catch (e: any) {
      toast.error('Erro ao registrar: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateItem = async () => {
    if (!authUser || !newItem.nome) return
    try {
        await criarItem.mutateAsync({ ...newItem, tenant_id: authUser.tenantId, quantidade: 0 })
        toast.success('Material cadastrado!')
        setIsNewItemOpen(false)
        setNewItem({ nome: '', categoria: '', alerta_estoque_minimo: 0 })
        refetch()
    } catch {
        toast.error('Erro ao criar item')
    }
  }

  const resetMovForm = () => {
    setMovQty('')
    setMovJustificativa('')
    setGerarFinanceiro(false)
    setFornecedor('')
    setValorTotal('')
  }

  const filteredItens = (itens || []).filter((i: any) => 
    i.nome.toLowerCase().includes(search.toLowerCase()) || 
    (i.categoria || '').toLowerCase().includes(search.toLowerCase())
  )

  const getStockStatus = (item: any) => {
    if (item.quantidade <= (item.alerta_estoque_minimo || 0)) return 'critico'
    if (item.quantidade <= (item.alerta_estoque_minimo || 0) * 1.5) return 'baixo'
    return 'normal'
  }

  return (
    <PullToRefresh onRefresh={async () => { await refetch(); await refetchMovs(); }}>
      <MobilePageLayout title="Almoxarifado">
        <div className="space-y-6 pt-2">
          {/* Busca e Filtros - Regra Padronizada */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="Buscar no estoque..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm text-sm"
              />
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {['estoque', 'historico'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    activeTab === tab ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  {tab === 'estoque' ? 'Meu Estoque' : 'Histórico'}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="pb-32">
            <AnimatePresence mode="wait">
              {activeTab === 'estoque' ? (
                <motion.div 
                  key="estoque"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-3"
                >
                  {filteredItens.map((item: any) => {
                    const status = getStockStatus(item)
                    return (
                      <NativeCard 
                        key={item.id} 
                        onClick={() => { setSelectedItem(item); setIsDetailOpen(true); }}
                        className="p-5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center border",
                            status === 'critico' ? "bg-red-50 border-red-100 text-red-500" :
                            status === 'baixo' ? "bg-amber-50 border-amber-100 text-amber-600" :
                            "bg-slate-50 border-slate-100 text-indigo-500"
                          )}>
                            <Package size={28} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-slate-800 dark:text-white truncate uppercase tracking-tight leading-none mb-1.5">{item.nome}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] h-5 border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                                {item.categoria || 'Sem categoria'}
                              </Badge>
                              {status === 'critico' && (
                                <Badge className="bg-red-500 text-white text-[8px] h-4 font-black border-none px-2 animate-pulse">CRÍTICO</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={cn(
                            "text-xl font-black italic tracking-tighter leading-none",
                            status === 'critico' ? "text-red-600" : "text-slate-900 dark:text-white"
                          )}>
                            {item.quantidade}
                          </p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Unidades</p>
                        </div>
                      </NativeCard>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="historico"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-3"
                >
                  {(movs || []).map((m: any) => (
                    <NativeCard key={m.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center",
                          m.tipo === 'entrada' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                           <div className="h-6 w-6">
                             {m.tipo === 'entrada' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                           </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs truncate uppercase dark:text-white">{m.item?.nome}</p>
                          <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-tighter">{m.justificativa || 'Uso Interno'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "font-black text-sm",
                          m.tipo === 'entrada' ? "text-emerald-600" : "text-red-600"
                        )}>
                          {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400">{new Date(m.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </NativeCard>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FAB PADRONIZADO (Estilo Financeiro) */}
        <motion.button
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => setIsNewItemOpen(true)}
          className="fixed bottom-28 right-6 h-18 w-18 rounded-[24px] bg-indigo-600 shadow-2xl shadow-indigo-200 text-white z-40 flex items-center justify-center"
        >
          <Plus className="h-8 w-8" strokeWidth={3} />
        </motion.button>
      </MobilePageLayout>

      {/* Detail Sheet */}
      <BottomSheet isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalhes do Item">
        {selectedItem && (
          <div className="px-1 pb-16 space-y-8">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800">
              <div className="h-20 w-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                <Package size={36} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{selectedItem.nome}</h2>
                <Badge className="bg-indigo-600/10 text-indigo-600 border-none font-black text-[9px] uppercase tracking-widest mt-1">
                  {selectedItem.categoria || 'Geral'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-6 rounded-[32px] text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Quantidade</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black italic">{selectedItem.quantidade}</span>
                  <span className="text-xs font-bold opacity-50 uppercase">und</span>
                </div>
              </div>
              <div className={cn(
                "p-6 rounded-[32px] flex flex-col justify-between border-2",
                selectedItem.quantidade <= (selectedItem.alerta_estoque_minimo || 0) 
                  ? "bg-red-50 border-red-100 text-red-600" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
              )}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Ponto de Alerta</p>
                <p className="text-2xl font-black">{selectedItem.alerta_estoque_minimo || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleOpenMov(selectedItem, 'entrada')}
                className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs"
              >
                <ArrowUpCircle className="mr-2 h-5 w-5" /> Entrada
              </Button>
              <Button 
                onClick={() => handleOpenMov(selectedItem, 'saida')}
                className="h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs"
              >
                <ArrowDownCircle className="mr-2 h-5 w-5" /> Saída
              </Button>
            </div>
            
            <Button variant="ghost" className="w-full text-slate-400 font-bold hover:text-red-500" size="sm" onClick={() => { if(confirm('Excluir?')) deletarItem.mutate(selectedItem.id); setIsDetailOpen(false); }}>
               <Trash2 size={16} className="mr-2" /> Excluir item permanentemente
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Novo Item Sheet */}
      <BottomSheet isOpen={isNewItemOpen} onClose={() => setIsNewItemOpen(false)} title="Novo Material">
          <div className="px-1 pb-16 space-y-6">
              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Nome do Item</Label>
                    <Input value={newItem.nome} onChange={e => setNewItem({...newItem, nome: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-bold" placeholder="Ex: Papel Sulfite A4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Categoria</Label>
                    <Input value={newItem.categoria} onChange={e => setNewItem({...newItem, categoria: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-bold" placeholder="Ex: Papelaria" />
                  </div>
                  <div className="space-y-2 text-center">
                    <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Alerta de Estoque Mínimo</Label>
                    <Input type="number" value={newItem.alerta_estoque_minimo} onChange={e => setNewItem({...newItem, alerta_estoque_minimo: Number(e.target.value)})} className="h-20 rounded-3xl text-center text-4xl font-black text-indigo-600 bg-slate-50 border-none" />
                  </div>
              </div>
              <Button onClick={handleCreateItem} className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl">
                  CADASTRAR MATERIAL
              </Button>
          </div>
      </BottomSheet>

      <BottomSheet 
        isOpen={isMovOpen} 
        onClose={() => setIsMovOpen(false)} 
        title={movType === 'entrada' ? "Registrar Entrada" : "Registrar Saída"}
        size="full"
      >
        <div className="px-1 pb-16 space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
             <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">Item selecionado</p>
             <p className="font-black text-sm uppercase dark:text-white">{selectedItem?.nome}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Qtd a {movType === 'entrada' ? 'adicionar' : 'retirar'}</Label>
              <Input 
                type="number" 
                value={movQty}
                onChange={e => setMovQty(e.target.value)}
                className="h-20 rounded-3xl text-center text-4xl font-black text-indigo-600 bg-slate-50 border-none"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Justificativa</Label>
              <Input 
                value={movJustificativa}
                onChange={e => setMovJustificativa(e.target.value)}
                placeholder="Ex: Nota Fiscal, Uso em Sala..."
                className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-bold"
              />
            </div>

            {movType === 'entrada' && (
              <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 space-y-4">
                <div className="flex items-center gap-3">
                  <Wallet className="text-indigo-600" size={20} />
                  <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Integração Financeira</p>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox 
                    checked={gerarFinanceiro}
                    onCheckedChange={(c) => setGerarFinanceiro(!!c)}
                    className="h-6 w-6 rounded-lg border-indigo-200"
                  />
                  <span className="text-xs font-black text-indigo-900 uppercase">Gerar Conta a Pagar</span>
                </label>

                {gerarFinanceiro && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} className="h-12 rounded-xl bg-white border-none font-bold" placeholder="Fornecedor" />
                      <Input value={valorTotal} onChange={e => setValorTotal(e.target.value)} className="h-12 rounded-xl bg-white border-none font-bold" type="number" placeholder="Valor Total" />
                    </div>
                    <Input value={vencimento} onChange={e => setVencimento(e.target.value)} className="h-12 rounded-xl bg-white border-none font-black text-center" type="date" />
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <Button 
            onClick={handleConfirmMov}
            disabled={isSaving || !movQty}
            className={cn(
              "w-full h-20 rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl",
              movType === 'entrada' ? "bg-emerald-600" : "bg-red-600"
            )}
          >
            {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : `CONFIRMAR ${movType}`}
          </Button>
        </div>
      </BottomSheet>
    </PullToRefresh>
  )
}
