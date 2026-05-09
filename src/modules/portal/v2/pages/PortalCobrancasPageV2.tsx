import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useVinculosAtivos } from '../../hooks'
import { usePortalContext } from '../../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  Copy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  X,
  ShoppingBag,
  Download,
  AlertTriangle,
  Receipt,
  TrendingDown,
  ArrowLeft,
  QrCode,
  Upload,
  FileText,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { BotaoVoltarWeb } from '../../components/BotaoVoltarWeb'
import { useQueries } from '@tanstack/react-query'
import { portalService } from '../../service'
import { portalFinanceiroService } from '../../financeiro.service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// Helper to get initials
const getInitials = (name: string) => {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'A';
};

// --- SKELETON LOADING ---
const CobrancasSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4 pt-10 max-w-7xl mx-auto">
    <div className="h-20 w-full bg-slate-50 border border-slate-100 rounded-[40px]" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white border border-slate-100 rounded-[40px]" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white border border-slate-100 rounded-[48px]" />)}
    </div>
  </div>
)

export function PortalCobrancasPageV2() {
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()

  const [selectedAluno, setSelectedAluno] = useState<any>(null)
  const [cobrancaAtiva, setCobrancaAtiva] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Buscar cobranças para TODOS os alunos vinculados em paralelo
  const queriesConfig = useMemo(() => (vinculos || []).map((v: any) => ({
    queryKey: ['portal', 'cobrancas', v.aluno?.id, v.aluno?.tenant_id],
    queryFn: () => portalFinanceiroService.obterFaturasDoAluno(v.aluno.id, v.aluno.tenant_id),
    enabled: !!v.aluno?.id && !!v.aluno?.tenant_id,
  })), [vinculos]);

  const cobrancasQueries = useQueries({
    queries: queriesConfig,
  })

  const isLoadingCobrancas = cobrancasQueries.some(q => q.isLoading)
  
  const familyData = useMemo(() => {
    if (!vinculos || isLoadingCobrancas) return null
    const alunosComFaturas = vinculos.map((v: any, index: number) => {
      const faturas = cobrancasQueries[index]?.data || []
      // Normalizar estrutura da turma (pode vir como array ou objeto)
      const turmaRaw = v.aluno?.turma
      const turma = Array.isArray(turmaRaw) ? turmaRaw[0] : turmaRaw
      return {
        ...v.aluno,
        is_financeiro: v.is_financeiro,
        faturas,
        turma: turma || null
      }
    })
    const allFaturas = alunosComFaturas.flatMap(a => a.faturas)
    
    // Data atual para comparação (meia-dia para evitar problemas de fuso)
    const hoje = new Date()
    hoje.setHours(12, 0, 0, 0)

    const isAtrasada = (f: any) =>
      f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < hoje)
    
    // Total Pago: Soma as notas pagas usando valor_pago se existir (pagamentos manuais) 
    const totalPago = allFaturas
      .filter(f => f.status === 'pago' || f.pago === true)
      .reduce((acc, f) => acc + Number(f.valor_pago || f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Atrasado: status 'atrasado' OU data vencida, desde que não esteja pago
    const atrasado = allFaturas
      .filter(f => isAtrasada(f) && f.status !== 'pago' && f.pago !== true)
      .reduce((acc, f) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Materiais/Compras
    const materiais = allFaturas
      .filter(f => f.status !== 'pago' && f.descricao?.toLowerCase().includes('item'))
      .reduce((acc, f) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Proximo vencimento: TOTAL DO PRÓXIMO MÊS (ex: se hoje é abril, soma tudo de maio)
    const dataRef = new Date()
    const mesAlvo = (dataRef.getMonth() + 1) % 12
    const anoAlvo = dataRef.getMonth() === 11 ? dataRef.getFullYear() + 1 : dataRef.getFullYear()

    const faturasProximoMes = allFaturas.filter(f => {
      if (f.status === 'pago' || f.pago === true || f.status === 'cancelado') return false
      // Parsing manual para evitar flutuações de timezone
      const parts = f.data_vencimento.split('-')
      if (parts.length < 2) return false
      const fAno = parseInt(parts[0], 10)
      const fMes = parseInt(parts[1], 10) - 1
      return fMes === mesAlvo && fAno === anoAlvo
    })

    const proximoVencValor = faturasProximoMes.reduce((acc, f) => 
      acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    const nomeMesAlvo = format(new Date(anoAlvo, mesAlvo, 1), 'MMMM', { locale: ptBR })
    const proximoVencSubtitle = proximoVencValor > 0 
      ? `Total de ${nomeMesAlvo.charAt(0).toUpperCase() + nomeMesAlvo.slice(1)}` 
      : `Nenhuma fatura para ${nomeMesAlvo}`
    const proximoVencLabelMes = nomeMesAlvo.charAt(0).toUpperCase() + nomeMesAlvo.slice(1)
    
    // Faturas para Checkout Unificado (Apenas próximo mês, conforme solicitado)
    // Refinamento extra de proteção para o status 'pago' via valor_pago
    const isPaga = (f: any) => f.status === 'pago' || f.pago === true || Number(f.valor_pago || 0) > 0
    
    // Filtro mais robusto
    const faturasAbertas = allFaturas.filter(f => !isPaga(f) && f.status !== 'cancelado')
    
    // Carrinho recebe APENAS as do próximo mês (ex: 1200 reais)
    const faturasParaCarrinho = faturasProximoMes.filter(f => !isPaga(f) && f.status !== 'cancelado')

    return { 
      resumo: { 
        totalPago, 
        atrasado, 
        materiais, 
        proximoVencValor, 
        proximoVencSubtitle: proximoVencValor > 0 ? `Total de ${proximoVencLabelMes}` : 'Nenhuma fatura para o próximo mês' 
      }, 
      alunos: alunosComFaturas,
      faturasParaCarrinho,
      // Total carrinho passa a ser igual ao Total do Proximo Vencimento
      totalCarrinho: proximoVencValor
    }
  }, [vinculos, isLoadingCobrancas, ...cobrancasQueries.map(q => q.data)])

  // Lógica para abrir fatura específica vinda do Dashboard
  const lastProcessedId = useRef<string | null>(null)

  useEffect(() => {
    const targetId = location.state?.selectedCobrancaId;
    if (!targetId || !familyData?.alunos || lastProcessedId.current === targetId) return;
    
    // Encontra qual aluno tem essa fatura
    for (const aluno of familyData.alunos) {
      const found = aluno.faturas?.find((f: any) => f.id === targetId)
      if (found) {
        lastProcessedId.current = targetId
        setSelectedAluno(aluno)
        setCobrancaAtiva({ ...found, alunoNome: aluno.nome_completo, tenant_id: aluno.tenant_id })
        setShowCheckout(true)
        
        // Limpa o state de navegação
        navigate(location.pathname, { replace: true, state: {} })
        break
      }
    }
  }, [location.state?.selectedCobrancaId, !!familyData?.alunos, location.pathname, navigate])

  if (loadingVinculos || isLoadingCobrancas) return <CobrancasSkeleton />

  return (
    <div className="flex flex-col gap-10 p-6 pt-6 pb-24 font-sans max-w-[1600px] mx-auto w-full">

      {/* Botão Voltar (Sobre o Título) */}
      <div className="flex flex-col gap-8">
        <BotaoVoltarWeb />

        <header className="flex flex-col border-b border-slate-200 pb-10 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Financeiro</h1>
            <p className="text-base font-semibold text-slate-500">Gestão financeira consolidada da família.</p>
          </div>

          {/* Dashboard Cards Consolidados */}
          <div className={`grid gap-6 mt-6 ${familyData?.resumo.materiais > 0 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            <ResumoCard 
              label="Próximo Vencimento" 
              value={familyData?.resumo.proximoVencValor} 
              subtitle={familyData?.resumo.proximoVencSubtitle}
              icon={CreditCard} 
              color="amber" 
            />
            <ResumoCard 
              label="Total Pago" 
              value={familyData?.resumo.totalPago} 
              icon={CheckCircle2} 
              color="teal" 
            />
            <ResumoCard 
              label="Atrasado" 
              value={familyData?.resumo.atrasado} 
              icon={AlertTriangle} 
              color="rose" 
              isCritical 
            />
            {familyData?.resumo.materiais > 0 && (
              <ResumoCard label="Compras/Materiais" value={familyData?.resumo.materiais} icon={ShoppingBag} color="indigo" />
            )}
          </div>

          {/* Carrinho Unificado (Checkout Multi) - Vindo da V1 */}
          {familyData && familyData.faturasParaCarrinho.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[28px] bg-white/20 flex items-center justify-center shadow-inner">
                   <ShoppingBag size={32} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-[4px] text-indigo-200 mb-1">Carrinho Unificado</span>
                  <h3 className="text-3xl font-black tracking-tighter leading-none mb-1">
                    {formatCurrency(familyData.totalCarrinho)}
                  </h3>
                  <p className="text-xs font-bold text-indigo-100/70">
                    Pagar {familyData.faturasParaCarrinho.length} faturas de toda a família de uma vez.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  vibrate(40);
                  setCobrancaAtiva({
                    id: 'multi',
                    ids: familyData.faturasParaCarrinho.map(f => f.id),
                    valor: familyData.totalCarrinho,
                    descricao: `Pagamento Consolidado (${familyData.faturasParaCarrinho.length} faturas)`,
                    alunoNome: 'Família',
                    tenant_id: familyData.faturasParaCarrinho[0]?.tenant_id || familyData.alunos[0]?.tenant_id
                  });
                  setShowCheckout(true);
                }}
                className="bg-white text-indigo-600 hover:bg-slate-50 font-black uppercase text-xs tracking-[2px] rounded-3xl h-16 px-10 shadow-xl active:scale-95 transition-all w-full md:w-auto"
              >
                Pagar Tudo Agora
              </Button>
            </motion.div>
          )}
        </header>
      </div>

      {/* Grid de Alunos Estilo /portal/alunos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {familyData?.alunos.map((aluno) => (
          <AlunoCard 
            key={aluno.id}
            aluno={aluno}
            onClick={() => { vibrate(15); setSelectedAluno(aluno); }}
          />
        ))}
      </div>

      {/* Slide-over Lateral (Modal Direita) */}
      <Sheet open={!!selectedAluno} onOpenChange={(open) => !open && setSelectedAluno(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[550px] p-0 border-l border-slate-100 shadow-2xl flex flex-col bg-white focus:outline-none ring-0">
          <DetailDrawer 
            aluno={selectedAluno} 
            onClose={() => setSelectedAluno(null)}
            onPagar={(fat: any) => { setCobrancaAtiva({ ...fat, alunoNome: selectedAluno.nome_completo, tenant_id: fat.tenant_id || selectedAluno.tenant_id }); setShowCheckout(true); }}
          />
        </SheetContent>
      </Sheet>

      {/* Modal de Checkout (PIX) - Versão Clean com QR Code Real da Escola Específica (Isolamento de Contexto) */}
      <PagamentoPixManual 
         isOpen={showCheckout} 
         onClose={() => setShowCheckout(false)}
         cobranca={cobrancaAtiva}
         copiado={copiado}
         setCopiado={setCopiado}
      />
    </div>
  )
}

// --- COMPONENTES AUXILIARES ---

function ResumoCard({ label, value, icon: Icon, color, isCritical, isDate, subtitle }: any) {
  const colors: any = {
    teal: 'bg-teal-500 text-white shadow-teal-500/10',
    rose: 'bg-rose-500 text-white shadow-rose-500/10',
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/10',
    amber: 'bg-amber-500 text-white shadow-amber-500/10'
  }
  return (
    <Card className={cn("border-0 rounded-[40px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] overflow-hidden transition-transform hover:-translate-y-1")}>
      <CardContent className="p-7 flex items-center gap-6">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", colors[color])}>
          <Icon size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
          <span className={cn("text-2xl font-black tracking-tighter leading-none", isCritical && value > 0 ? "text-rose-600" : "text-slate-900")}>
            {isDate ? (value ? formatDate(value) : '---') : formatCurrency(value || 0)}
          </span>
          {subtitle && <span className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

function AlunoCard({ aluno, onClick }: any) {
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
  const pendentes = aluno.faturas.filter((f: any) => f.status !== 'pago' && f.status !== 'cancelado').length
  const atrasadas = aluno.faturas.filter((f: any) =>
    f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < hoje)
  ).length

  return (
    <div
      onClick={onClick}
      className="flex flex-col bg-white border border-slate-100 rounded-[34px] p-10 shadow-[0_10px_45px_rgba(0,0,0,0.04)] cursor-pointer hover:border-teal-300 hover:-translate-y-2 transition-all group"
    >
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex justify-center items-center text-3xl font-black shadow-2xl relative overflow-hidden">
          {aluno.foto_url ? (
            <img
              src={aluno.foto_url}
              alt={aluno.nome_completo}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.textContent = getInitials(aluno.nome_completo);
              }}
            />
          ) : (
            getInitials(aluno.nome_completo)
          )}
          {atrasadas > 0 && <div className="absolute -top-1 -right-1 w-7 h-7 bg-rose-500 border-4 border-white rounded-full animate-pulse" />}
        </div>
        <div className="flex flex-col flex-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-3 group-hover:text-teal-600 transition-colors">
            {aluno.nome_completo || 'Aluno'}
          </h2>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{aluno.turma?.nome || 'Sem turma'}</span>
            <div className="flex items-center gap-2 mt-1">
              {atrasadas > 0 ? (
                <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {atrasadas} Em Atraso
                </Badge>
              ) : pendentes > 0 ? (
                <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {pendentes} Pendentes
                </Badge>
              ) : (
                <Badge className="bg-teal-50 text-teal-600 border-teal-100 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  Em Dia
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Turma</span>
            <span className="text-sm font-bold text-slate-500">{aluno.turma?.nome || 'Sem turma'}</span>
         </div>
         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
            <ChevronRight size={24} />
         </div>
      </div>
    </div>
  )
}

function DetailDrawer({ aluno, onClose, onPagar }: any) {
  const [exibirTodas, setExibirTodas] = useState(false)
  if (!aluno) return null

  // Total Geral de todas as faturas em aberto (para transparência total)
  const isPagaLocal = (f: any) => f.status === 'pago' || f.pago === true || Number(f.valor_pago || 0) > 0
  const pendentesFaturas = aluno.faturas.filter((f: any) => !isPagaLocal(f) && f.status !== 'cancelado')
  const totalGeral = pendentesFaturas.reduce((acc: number, f: any) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-10 pb-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-5">
           <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
             <ArrowLeft size={24} />
           </button>
           <div className="flex flex-col">
             <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{aluno.nome_completo}</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detalhamento Financeiro</p>
           </div>
        </div>
      </div>

      <Tabs defaultValue="pendentes" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 py-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1.5 rounded-[24px] h-14">
            <TabsTrigger value="pendentes" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl h-full transition-all">Em Aberto</TabsTrigger>
            <TabsTrigger value="pagos" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl h-full transition-all">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pendentes" className="flex-1 overflow-y-auto px-10 pb-10 m-0 custom-scrollbar">
           <div className="mb-8 p-6 bg-slate-900 rounded-[32px] text-white flex flex-col items-center justify-center">
              <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mb-1">Total até Dezembro</span>
              <h4 className="text-3xl font-black tracking-tighter">{formatCurrency(totalGeral)}</h4>
           </div>

           <DrawerFaturaList 
              faturas={pendentesFaturas} 
              onAction={onPagar} 
              exibirTodas={exibirTodas}
              onToggleTodas={() => setExibirTodas(true)}
           />
        </TabsContent>

        <TabsContent value="pagos" className="flex-1 overflow-y-auto px-10 pb-10 m-0 custom-scrollbar">
           <DrawerFaturaList faturas={aluno.faturas.filter((f: any) => isPagaLocal(f))} isHistorico exibirTodas />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DrawerFaturaList({ faturas, onAction, isHistorico, exibirTodas, onToggleTodas }: any) {
  if (faturas.length === 0) return <div className="py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest text-xs">Vazio</div>

  const rawSorted = [...faturas].sort((a,b) => isHistorico ? new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime() : new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
  
  // SEMPRE exibe ao menos as proximas 3 NO MINIMO a menos que exibirTodas esteja ativo
  const sorted = exibirTodas ? rawSorted : rawSorted.slice(0, 3)
  const temMais = !exibirTodas && rawSorted.length > 3

  const getTipoBadge = (descricao: string) => {
    const desc = descricao?.toLowerCase() || ''
    if (desc.includes('matrícula') || desc.includes('matricula') || desc.includes('taxa')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-600">
          🎓 Taxa de Matrícula
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[9px] font-black uppercase tracking-widest text-blue-600">
        📚 Mensalidade
      </span>
    )
  }

  const hoje = new Date(); hoje.setHours(12, 0, 0, 0)

  return (
    <div className="flex flex-col gap-5">
      {sorted.map((fat) => {
        const isVencida = fat.status === 'atrasado' || (fat.status === 'a_vencer' && new Date(fat.data_vencimento + 'T12:00:00') < hoje)
        
        // Parsing data para exibir Mês/Ano
        const parts = fat.data_vencimento.split('-')
        const dataRef = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
        const mesExtenso = format(dataRef, 'MMMM/yyyy', { locale: ptBR })
        const labelMes = mesExtenso.charAt(0).toUpperCase() + mesExtenso.slice(1)

        return (
          <div key={fat.id} className={cn("p-8 rounded-[22px] border transition-all flex flex-col gap-6", isHistorico ? "bg-slate-50/30 border-slate-100" : (isVencida ? "bg-rose-50/40 border-rose-100 shadow-sm" : "bg-white border-slate-100 shadow-sm hover:shadow-md"))}>
            <div className="flex items-start gap-4">
                 <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0", isHistorico ? "bg-white text-teal-500" : (isVencida ? "bg-white text-rose-500" : "bg-teal-50 text-teal-600 border-teal-100"))}>
                    {isHistorico ? <CheckCircle2 size={24} /> : <Receipt size={24} />}
                 </div>
                 <div className="flex flex-col flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-2 flex-wrap">
                     <h5 className="font-black text-slate-800 tracking-tight leading-none">{labelMes}</h5>
                     {!isHistorico && getTipoBadge(fat.descricao)}
                     {fat.comprovante_url && (
                       <Button 
                         variant="outline" 
                         onClick={(e) => { e.stopPropagation(); window.open(fat.comprovante_url, '_blank') }} 
                         className="h-14 px-8 rounded-xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-600 font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center gap-2"
                       >
                         <FileText size={16} />
                         Ver Comprovante
                       </Button>
                     )}
                     {!isHistorico && isVencida && (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[9px] font-black uppercase tracking-widest text-rose-700">
                         ⚠️ Atrasada
                       </span>
                     )}
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fat.descricao} • Vencimento: {formatDate(fat.data_vencimento)}</p>
                   <span className={cn("text-xl font-black tracking-tight mt-2", isHistorico ? "text-slate-400" : isVencida ? "text-rose-600" : "text-slate-900")}>
                     {formatCurrency(fat.valor_total_projetado || fat.valor_original || fat.valor || 0)}
                   </span>
                 </div>
            </div>

            {!isHistorico && (
              <Button onClick={() => onAction(fat)} className={cn("w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-xl transition-all active:scale-95", isVencida ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-slate-900 hover:bg-black shadow-slate-100")}>
                Pagar Agora
              </Button>
            )}
            {isHistorico && (
               <Button
                 variant="outline"
                 onClick={() => fat.comprovante_url && window.open(fat.comprovante_url, '_blank')}
                 disabled={!fat.comprovante_url}
                 className={cn(
                   "w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2",
                   fat.comprovante_url 
                     ? "border-teal-100 bg-teal-50/50 text-teal-600 hover:bg-teal-100" 
                     : "border-slate-100 text-slate-300"
                 )}
               >
                 {fat.comprovante_url ? (
                   <>
                     <FileText size={18} />
                     Visualizar Comprovante
                   </>
                 ) : (
                   'Sem comprovante anexo'
                 )}
               </Button>
            )}
          </div>
        )
      })}

      {temMais && (
        <Button
          variant="ghost"
          onClick={onToggleTodas}
          className="w-full h-16 rounded-[24px] border-2 border-dashed border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-[2px] hover:bg-slate-50 hover:text-slate-600"
        >
          Ver todas as parcelas do ano
        </Button>
      )}
    </div>
  )
}


function PagamentoPixManual({ isOpen, onClose, cobranca, copiado, setCopiado }: any) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<'chave' | 'qrcode'>('qrcode')

  // ISOLAMENTO DE CONTEXTO: Buscar configuração da escola do aluno ESPECÍFICO da cobrança
  const { data: configPix } = useQuery({
    queryKey: ['portal', 'config-pix', cobranca?.tenant_id],
    queryFn: () => portalService.buscarConfigPixEscola(cobranca?.tenant_id!),
    enabled: !!cobranca?.tenant_id,
  })
  const { data: configRecados } = useQuery({
    queryKey: ['portal', 'config-recados', cobranca?.tenant_id],
    queryFn: () => portalService.buscarConfigRecados(cobranca?.tenant_id!),
    enabled: !!cobranca?.tenant_id,
  })

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const { responsavel } = usePortalContext()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('Arquivo muito grande. Máximo 5MB.')
      setArquivo(file)
    }
  }

  const handleCopy = () => {
    vibrate(40)
    if (configPix?.chave_pix) {
      navigator.clipboard.writeText(configPix.chave_pix)
      setCopiado(true)
      toast.success('Chave PIX copiada!')
      setTimeout(() => setCopiado(false), 3000)
    }
  }

  const handleComprovante = async () => {
    if (!arquivo) return toast.error('Por favor, anexe o comprovante de pagamento.')
    
    setEnviando(true)
    vibrate(30)
    
    try {
      const filename = `comprovante_${cobranca?.id}_${Date.now()}`
      const url = await portalService.uploadComprovante(arquivo, cobranca?.tenant_id!, filename)
      await portalService.registrarPagamentoComComprovante(cobranca?.ids || cobranca?.id!, url, responsavel?.id!)

      const numeroRaw = configRecados?.whatsapp_contato || ''
      const numero = numeroRaw.replace(/\D/g, '')
      const msg = encodeURIComponent(`Olá, confirmo o pagamento de ${formatCurrency(cobranca?.valor || 0)} (${cobranca?.descricao} - ${cobranca?.alunoNome}). Comprovante: ${url}`)
      
      toast.success('Comprovante enviado com sucesso!')
      onClose()
      
      if (numero && numero.length >= 8) {
        window.open(`https://wa.me/${numero.startsWith('55') ? numero : '55'+numero}?text=${msg}`, '_blank')
      }
    } catch (error: any) {
      console.error(error)
      toast.error('Erro ao processar comprovante.')
    } finally {
      setEnviando(false)
    }
  }

  const ModalContent = (
    <div className="flex flex-col gap-6">
      {/* Header com Título e Fechar */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">Pagar com pix manual</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Seletor de Abas Estilizado */}
      <div className="flex bg-slate-50 p-1.5 rounded-[24px] h-14 relative">
        <button
          onClick={() => { vibrate(10); setActiveTab('chave'); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all z-10",
            activeTab === 'chave' ? "bg-white text-teal-600 shadow-xl" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", activeTab === 'chave' ? "bg-teal-500" : "bg-slate-200")} />
          Copiar chave
        </button>
        <button
          onClick={() => { vibrate(10); setActiveTab('qrcode'); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all z-10",
            activeTab === 'qrcode' ? "bg-white text-teal-600 shadow-xl" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", activeTab === 'qrcode' ? "bg-teal-500" : "bg-slate-200")} />
          Ler QRcode
        </button>
      </div>

      {/* Banner de Valor */}
      <div className="bg-[#0c1322] rounded-[24px] p-6 flex flex-col gap-1 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <TrendingDown size={80} className="text-white" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[3px] text-teal-400/70">Total à pagar</span>
        <h2 className="text-3xl font-black text-white tracking-tighter">
          {formatCurrency(cobranca?.valor_total_projetado || cobranca?.valor_original || cobranca?.valor || 0)}
        </h2>
      </div>

      {/* Conteúdo Dinâmico (Chave vs QR Code) */}
      <div className="min-h-[220px] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'qrcode' ? (
            <motion.div 
              key="qrcode"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <div className="p-4 bg-white rounded-[32px] shadow-2xl border border-slate-50 flex items-center justify-center group hover:scale-[1.02] transition-transform">
                {configPix?.qr_code_url ? (
                  configPix.qr_code_url.toLowerCase().endsWith('.pdf') ? (
                    <div onClick={() => window.open(configPix.qr_code_url, '_blank')} className="flex flex-col items-center gap-3 p-6 cursor-pointer border border-dashed border-teal-200 rounded-3xl bg-teal-50/30 hover:bg-teal-50 transition-colors">
                      <FileText size={64} className="text-teal-500" />
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Abrir QR Code (PDF)</span>
                    </div>
                  ) : (
                    <img src={configPix.qr_code_url} alt="QR Code PIX" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                  )
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-slate-200 gap-4">
                    <QrCode size={80} className="opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">QR Code não disponível</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posicione a câmera no QR Code acima</p>
            </motion.div>
          ) : (
            <motion.div 
              key="chave"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex flex-col gap-4"
            >
              <div className="bg-teal-50/50 border border-teal-100 rounded-[28px] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-teal-600/70">Chave pix - {configPix?.tipo_chave_pix || 'Chave'}</span>
                    <div className="flex items-center gap-3">
                       <span className="text-lg font-black text-slate-800 tracking-tight truncate">{configPix?.chave_pix || configPix?.pix_chave || 'Não configurada'}</span>
                       <button onClick={handleCopy} className="text-teal-500 hover:text-teal-600 transition-colors active:scale-90 transform shrink-0">
                         <Copy size={20} />
                       </button>
                    </div>
                  </div>
                </div>
                
                {configPix?.favorecido && (
                  <div className="flex flex-col border-t border-teal-100 pt-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Quem vai receber</span>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{configPix.favorecido}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Área de Upload */}
      <div className="flex flex-col gap-4">
        <label className={cn(
          "relative cursor-pointer flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-[32px] transition-all min-h-[160px]",
          arquivo ? "bg-teal-50/50 border-teal-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
        )}>
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleFileChange} disabled={enviando} />
          {arquivo ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xl shadow-teal-500/30">
                 <CheckCircle2 size={32} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-black text-teal-700 text-center px-4 truncate max-w-[280px]">{arquivo.name}</span>
                <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest mt-1">Clique para trocar o arquivo</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="text-[13px] font-black text-slate-500 uppercase tracking-tight text-center">Selecione o comprovante para envio</span>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-500 group-hover:border-teal-200 transition-colors">
                <Upload size={24} />
              </div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">PDF, PNG OU WEBP</span>
            </div>
          )}
        </label>
      </div>

      {/* Accordion de Instruções */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="instrucoes" className="border-0">
          <AccordionTrigger className="hover:no-underline py-4 px-6 bg-slate-50 rounded-[20px] text-slate-700 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-100">
            Instruções
          </AccordionTrigger>
          <AccordionContent className="pt-4 px-6">
            <ul className="flex flex-col gap-3">
              {[
                "Clique para copiar a chave pix",
                "Abra seu app de banco preferido",
                "Finalize o pagamento no banco",
                "Anexe o comprovante de pagamento",
                "Clique no botão FINALIZAR PAGAMENTO abaixo"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-black shrink-0">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Botão Finalizar */}
      <Button 
        onClick={handleComprovante} 
        disabled={!arquivo || enviando}
        className={cn(
          "w-full h-16 rounded-[28px] text-[13px] font-black uppercase tracking-[3px] transition-all shadow-2xl active:scale-95",
          arquivo 
            ? "bg-[#00c59e] text-white hover:bg-[#00b08d] shadow-[#00c59e]/20" 
            : "bg-slate-100 text-slate-300 cursor-not-allowed"
        )}
      >
        {enviando ? <Loader2 className="animate-spin mr-3" size={20} /> : null}
        {enviando ? 'ENVIANDO...' : 'FINALIZAR PAGAMENTO'}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent showCloseButton={false} side="bottom" className="rounded-t-[40px] p-8 pb-10 focus:outline-none ring-0 h-auto max-h-[95vh] overflow-y-auto bg-white border-t border-slate-100">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
          {ModalContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[480px] max-h-[90vh] p-8 overflow-y-auto border-0 rounded-[48px] bg-white gap-0 hide-scrollbar shadow-[0_32px_80px_rgba(0,0,0,0.1)]">
        <DialogTitle className="sr-only">Pagamento PIX - {formatCurrency(cobranca?.valor || 0)}</DialogTitle>
        <DialogDescription className="sr-only">
          Página de pagamento PIX com QR Code e instrução para upload de comprovante.
        </DialogDescription>
        {ModalContent}
      </DialogContent>
    </Dialog>
  )
}
