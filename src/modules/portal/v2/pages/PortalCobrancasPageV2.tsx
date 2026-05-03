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
      // 1. Upload do arquivo
      const filename = `comprovante_${cobranca?.id}_${Date.now()}`
      const url = await portalService.uploadComprovante(arquivo, cobranca?.tenant_id!, filename)

      // 2. Registra no banco (suporta ID único ou array de IDs para pagamento unificado)
      await portalService.registrarPagamentoComComprovante(cobranca?.ids || cobranca?.id!, url, responsavel?.id!)

      // 3. Envia WhatsApp
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
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Header - Compacto */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg shrink-0">
          <TrendingDown size={20} />
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-none truncate">Pagamento PIX</h3>
          <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Fluxo de Segurança</p>
        </div>
      </div>

      {/* Card de Valor - Mais compacto */}
      <div className="flex flex-col items-center justify-center py-3 sm:py-4 bg-slate-900 rounded-[18px] sm:rounded-[22px] text-white shadow-lg relative overflow-hidden mx-1 sm:mx-0">
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-teal-400 mb-1 relative z-10">Total a Pagar</span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter relative z-10 leading-none">
          {formatCurrency(cobranca?.valor_total_projetado || cobranca?.valor_original || cobranca?.valor || 0)}
        </h2>
        <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 relative z-10 truncate max-w-full px-2">{cobranca?.descricao || ''}</p>
      </div>

      {/* PIX Content - Otimizado para caber */}
      {configPix ? (
        <div className="flex flex-col gap-3">
          {/* QR Code - Reduzido */}
          {(configPix?.qr_code_url || configPix?.qr_code_auto) && (
            <div className="p-3 rounded-[16px] bg-slate-50 border border-slate-200 flex flex-col items-center gap-2">
              <div className="p-2 bg-white rounded-[12px] shadow-md flex items-center justify-center">
                {configPix?.qr_code_url ? (
                  configPix.qr_code_url.toLowerCase().endsWith('.pdf') ? (
                    <div 
                      onClick={() => window.open(configPix.qr_code_url, '_blank')}
                      className="flex flex-col items-center gap-2 p-2 cursor-pointer hover:bg-slate-50 transition-all rounded-xl border border-dashed border-rose-200"
                    >
                      <FileText size={40} className="text-rose-500" />
                      <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest text-center">Ver QR Code (PDF)</span>
                    </div>
                  ) : (
                    <img src={configPix.qr_code_url} alt="QR Code PIX" className="w-32 h-32 sm:w-40 sm:h-40 object-contain" />
                  )
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center text-slate-300">
                    <QrCode size={48} className="opacity-30" />
                  </div>
                )}
              </div>
              <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">QR Code Ativo</span>
            </div>
          )}

          {/* Favorecido e Instruções - Adicionado */}
          {(configPix?.favorecido || configPix?.instrucoes_pix) && (
            <div className="flex flex-col gap-1 px-1">
              {configPix?.favorecido && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-tight">Favorecido:</span>
                  <span className="font-black text-slate-700">{configPix.favorecido}</span>
                </div>
              )}
              {configPix?.instrucoes_pix && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2 mt-1">
                  <p className="text-[9px] font-bold text-amber-700 leading-tight">
                    {configPix.instrucoes_pix}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chave PIX - Reduzida */}
          {(configPix?.chave_pix || configPix?.pix_chave) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mt-1">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Ou copie e cole</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>
              <div className="p-2 rounded-[12px] bg-white border border-slate-100 font-mono text-[9px] text-slate-500 break-all leading-relaxed text-center max-h-16 overflow-y-auto">
                {configPix.chave_pix || configPix.pix_chave}
              </div>
              <Button onClick={handleCopy} className="w-full h-10 sm:h-12 bg-slate-900 hover:bg-black text-white rounded-[16px] font-black text-[9px] sm:text-[10px] uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all">
                {copiado ? <CheckCircle2 size={14} className="text-teal-400" /> : <Copy size={14} />}
                {copiado ? 'Copiado!' : 'Copiar PIX'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center space-y-2 bg-rose-50 rounded-[20px] border border-rose-100 mx-1">
          <AlertCircle size={28} className="text-rose-500 mx-auto" />
          <p className="text-sm font-black text-rose-900 uppercase">PIX Não Configurado</p>
          <p className="text-[9px] font-semibold text-rose-700/60">Esta escola ainda não cadastrou os dados para pagamento via PIX.</p>
        </div>
      )}

      {/* Upload - Fluxo de Segurança */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px bg-slate-100 flex-1" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fluxo de Segurança</span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
          <p className="text-[10px] font-bold text-indigo-900 leading-tight">
            Após o pagamento com pix, envie o comprovante para a escola logo abaixo.
          </p>
        </div>

        <label className={cn(
          "relative cursor-pointer flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed rounded-[16px] transition-all",
          arquivo ? "bg-teal-50 border-teal-200" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
        )}>
          <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleFileChange} disabled={enviando} />
          {arquivo ? (
            <>
              <FileText className="text-teal-500" size={24} />
              <span className="text-[10px] font-bold text-teal-700 truncate max-w-full">{arquivo.name}</span>
              <span className="text-[8px] text-teal-600/60 uppercase font-black">Trocar Arquivo</span>
            </>
          ) : (
            <>
              <Upload className="text-slate-400" size={24} />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Selecionar Comprovante</span>
              <span className="text-[8px] text-slate-400 uppercase font-black">PDF, PNG ou WebP</span>
            </>
          )}
        </label>

        {/* Chave para conferência logo abaixo do upload */}
        {(configPix?.chave_pix || configPix?.pix_chave) && (
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Chave PIX da Escola</p>
              <p className="text-[10px] font-mono text-slate-700 truncate font-bold">{configPix.chave_pix || configPix.pix_chave}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600 shrink-0" onClick={handleCopy}>
              {copiado ? <CheckCircle2 size={16} className="text-teal-500" /> : <Copy size={16} />}
            </Button>
          </div>
        )}
      </div>

      {/* Botão Confirmar - Sempre visível */}
      <Button 
        onClick={handleComprovante} 
        disabled={!arquivo || enviando}
        className={cn(
          "w-full h-11 sm:h-12 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95",
          arquivo 
            ? "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20" 
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        )}
      >
        {enviando ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
        {enviando ? 'Processando...' : 'Confirmar Pagamento'}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent showCloseButton={false} side="bottom" className="rounded-t-[32px] p-4 sm:p-8 pb-6 sm:pb-12 focus:outline-none ring-0 h-auto max-h-[95vh] overflow-y-auto bg-white">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
          {ModalContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[340px] max-h-[85vh] p-0 overflow-hidden border-0 rounded-[24px] bg-white gap-0">
        <DialogTitle className="sr-only">Pagamento PIX - {formatCurrency(cobranca?.valor || 0)}</DialogTitle>
        <DialogDescription className="sr-only">
          Página de pagamento PIX com QR Code e instrução para upload de comprovante.
        </DialogDescription>
        <div className="p-4">
          {ModalContent}
        </div>
      </DialogContent>
    </Dialog>
  )
}
