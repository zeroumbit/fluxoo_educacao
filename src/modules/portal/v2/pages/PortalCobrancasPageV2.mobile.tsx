import { Accordion,AccordionContent,AccordionItem,AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
Sheet,
SheetContent,
} from '@/components/ui/sheet'
import { Tabs,TabsContent,TabsList,TabsTrigger } from '@/components/ui/tabs'
import { cn,formatCurrency,formatDate } from '@/lib/utils'
import { useQueries,useQuery,useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence,motion } from 'framer-motion'
import {
AlertTriangle,
ArrowLeft,
Calendar,
CheckCircle2,
ChevronRight,
Copy,
FileText,
Loader2,
QrCode,
Receipt,
ShoppingBag,
TrendingDown,
Upload,
X
} from 'lucide-react'
import { useEffect,useMemo,useState } from 'react'
import { useLocation,useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePortalContext } from '../../context'
import { portalFinanceiroService } from '../../financeiro.service'
import { useVinculosAtivos } from '../../hooks'
import { portalService } from '../../service'
import { NativeHeader } from '../components/NativeHeader'

// Helper de vibração (Haptic Feedback - padrão nativo)
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// Helper to get initials
const getInitials = (name: string) => {
  return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'A';
};

// --- SKELETON LOADING (Padrão iOS/Android) ---
const CobrancasSkeleton = () => (
  <div className="space-y-6 animate-pulse p-4 pt-[env(safe-area-inset-top,24px)]">
    {/* Header Skeleton */}
    <div className="h-10 w-48 bg-slate-200/60 rounded-lg mb-4" />
    {/* Dashboard Cards Skeleton */}
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 w-40 bg-slate-100/80 rounded-[24px] shrink-0" />
      ))}
    </div>
    {/* Lista Skeleton */}
    <div className="flex flex-col gap-4 mt-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-28 bg-white border border-slate-100 rounded-[24px]" />
      ))}
    </div>
  </div>
)

export function PortalCobrancasPageV2Mobile() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()
  const { isLoading: isLoadingCtx } = usePortalContext()

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
    if (!vinculos || isLoadingCobrancas || isLoadingCtx) return null
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
    
    const isAtrasada = (f: any) => {
       const hoje = new Date()
       return f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < hoje)
     }
    
    // Total Pago: Soma as faturas marcadas como 'pago' ou onde pago === true, usando valor_pago prioritariamente
    const totalPago = allFaturas
      .filter((f: any) => f.status === 'pago' || f.pago === true)
      .reduce((acc: number, f: any) => acc + Number(f.valor_pago || f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Atrasado: status 'atrasado' OU data vencida, e NAO pago
    const atrasado = allFaturas
      .filter((f: any) => isAtrasada(f) && f.status !== 'pago' && f.pago !== true)
      .reduce((acc: number, f: any) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
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
      : `Nada para ${nomeMesAlvo}`
    
    // Faturas para Checkout Unificado (A vencer e Atrasadas, exceto pagas/canceladas)
    const faturasParaCarrinho = allFaturas.filter(f => f.status !== 'pago' && f.pago !== true && f.status !== 'cancelado')

    return { 
      resumo: { 
        totalPago, 
        atrasado, 
        materiais, 
        proximoVencValor, 
        proximoVencSubtitle 
      }, 
      alunos: alunosComFaturas,
      faturasParaCarrinho,
      totalCarrinho: faturasParaCarrinho.reduce((acc, f) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    }
  }, [vinculos, isLoadingCobrancas, isLoadingCtx, ...cobrancasQueries.map(q => q.data)])

  // Lógica para abrir fatura específica vinda do Dashboard
  useEffect(() => {
    const targetId = location.state?.selectedCobrancaId;
    if (!targetId || !familyData?.alunos) return;
    
    // Encontra qual aluno tem essa fatura
    for (const aluno of familyData.alunos) {
      const found = aluno.faturas?.find((f: any) => f.id === targetId)
      if (found) {
        setSelectedAluno(aluno)
        setCobrancaAtiva({ ...found, alunoNome: aluno.nome_completo, tenant_id: found.tenant_id || aluno.tenant_id })
        setShowCheckout(true)
        
        // Limpa o state de navegação de forma reativa para evitar loop infinito
        navigate(location.pathname, { replace: true, state: {} })
        break
      }
    }
  }, [location.state?.selectedCobrancaId, !!familyData?.alunos, location.pathname, navigate])

  if (loadingVinculos || isLoadingCobrancas || isLoadingCtx) return <CobrancasSkeleton />

  return (
    <div className="flex flex-col gap-6 pb-24">
      <NativeHeader title="Financeiro" showBack />
      
      <div className="px-4 flex flex-col gap-6">

      {/* 2. Dashboard Cards - Scroll Horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar" role="region" aria-label="Resumo financeiro">
        <ResumoCardMobile
          label="Próximo Venc."
          value={familyData?.resumo.proximoVencValor}
          subtitle={familyData?.resumo.proximoVencSubtitle}
          icon={Calendar}
          color="amber"
        />
        <ResumoCardMobile
          label="Total Pago"
          value={familyData?.resumo.totalPago}
          icon={CheckCircle2}
          color="teal"
        />
        <ResumoCardMobile
          label="Atrasado"
          value={familyData?.resumo.atrasado}
          icon={AlertTriangle}
          color="rose"
          isCritical
        />
        {familyData?.resumo.materiais > 0 && (
          <ResumoCardMobile
            label="Materiais"
            value={familyData?.resumo.materiais}
            icon={ShoppingBag}
            color="indigo"
          />
        )}
      </div>

      {/* 3. Checkout Unificado Mobile */}
      {familyData && familyData.faturasParaCarrinho.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Checkout Rápido</h2>
            <Badge className="bg-slate-900 text-white border-none text-[10px] font-black px-2 py-0.5 rounded-full">
              {familyData.faturasParaCarrinho.length} ITENS
            </Badge>
          </div>
          <Button 
            onClick={() => {
              vibrate(25);
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
            className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-[24px] shadow-lg shadow-teal-500/20 flex items-center justify-between px-6 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-teal-200" />
              <span className="text-[12px] font-black uppercase tracking-widest">Pagar Todas</span>
            </div>
            <span className="text-[16px] font-black tracking-tight tracking-[-0.5px]">
              {formatCurrency(familyData.totalCarrinho)}
            </span>
          </Button>
        </div>
      )}

      {/* Cards Alunos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
            Alunos
          </h2>
          <span className="text-[12px] font-bold text-slate-400">
            {familyData?.alunos.length} {familyData?.alunos.length === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>

        {/* Cards */}
        {familyData?.alunos.map((aluno: any) => (
          <AlunoCardMobile
            key={aluno.id}
            aluno={aluno}
            onClick={() => {
              vibrate(15);
              setSelectedAluno(aluno);
            }}
          />
        ))}
      </div>

      {/* 4. Bottom Sheet - Detalhes do Aluno */}
      <Sheet open={!!selectedAluno} onOpenChange={(open) => !open && setSelectedAluno(null)}>
        <SheetContent 
          side="bottom" 
          className="rounded-t-[32px] p-0 border-t border-slate-100 focus:outline-none ring-0 h-[92vh] max-h-[92vh] overflow-hidden flex flex-col bg-white"
          style={{ height: '92vh' }}
        >
          <DetailDrawerMobile
            aluno={selectedAluno}
            onClose={() => setSelectedAluno(null)}
            onPagar={(fat: any) => { setCobrancaAtiva({ ...fat, alunoNome: selectedAluno.nome_completo, tenant_id: fat.tenant_id || selectedAluno.tenant_id }); setShowCheckout(true); }}
          />
        </SheetContent>
      </Sheet>

      {/* 5. Bottom Sheet - Checkout PIX */}
      <PagamentoPixManualMobile
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cobranca={cobrancaAtiva}
        copiado={copiado}
        setCopiado={setCopiado}
      />
      </div>
    </div>
  )
}

// --- COMPONENTES MOBILE NATIVOS ---

interface ResumoCardMobileProps {
  label: string;
  value: any;
  icon: any;
  color: 'teal' | 'rose' | 'indigo' | 'amber';
  isCritical?: boolean;
  isDate?: boolean;
  subtitle?: string;
}

function ResumoCardMobile({ label, value, icon: Icon, color, isCritical, isDate, subtitle }: ResumoCardMobileProps) {
  const colors: any = {
    teal: 'bg-teal-500 text-white',
    rose: 'bg-rose-500 text-white',
    indigo: 'bg-indigo-600 text-white',
    amber: 'bg-amber-500 text-white'
  }

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="flex-shrink-0 w-[180px] bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm touch-manipulation"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0", colors[color])}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="flex flex-col min-w-0">
          {/* Label - iOS Caption / Material Label Small */}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight">
            {label}
          </span>
          {/* Value - iOS Title / Material Title Medium */}
          <span className={cn(
            "text-[18px] font-bold tracking-tight leading-loose truncate",
            isCritical && value > 0 ? "text-rose-600" : "text-slate-900"
          )}>
            {isDate ? (value ? formatDate(value) : '---') : formatCurrency(value || 0)}
          </span>
          {subtitle && <span className="text-[9px] font-bold text-slate-400 truncate tracking-tight">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  )
}


function AlunoCardMobile({ aluno, onClick }: any) {
  const pendentes = aluno.faturas.filter((f: any) => f.status !== 'pago' && f.status !== 'cancelado').length
  const atrasadas = aluno.faturas.filter((f: any) => f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < new Date())).length

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col bg-white border border-slate-100 rounded-[24px] p-4 shadow-sm active:scale-97 transition-transform touch-manipulation w-full text-left"
      aria-label={`Ver detalhes financeiros de ${aluno.nome_completo}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar - Foto ou Iniciais */}
        <div className="w-16 h-16 rounded-[20px] bg-slate-900 text-white flex justify-center items-center text-xl font-bold shadow-sm relative flex-shrink-0 overflow-hidden" aria-hidden="true">
          {aluno.foto_url ? (
            <img
              src={aluno.foto_url}
              alt={aluno.nome_completo}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback para iniciais se a imagem falhar
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.textContent = getInitials(aluno.nome_completo);
              }}
            />
          ) : (
            getInitials(aluno.nome_completo)
          )}
          {atrasadas > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          {/* Nome - iOS Body / Material Body Medium */}
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight leading-tight mb-1 truncate">
            {aluno.nome_completo || 'Aluno'}
          </h2>
          
          {/* Turma - Caption */}
          <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wide">
            {aluno.turma?.nome || 'Sem turma'}
          </span>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mt-2">
            {atrasadas > 0 ? (
              <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide min-h-[24px]">
                {atrasadas} {atrasadas === 1 ? 'Atraso' : 'Atrasos'}
              </Badge>
            ) : pendentes > 0 ? (
              <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide min-h-[24px]">
                {pendentes} {pendentes === 1 ? 'Pendente' : 'Pendentes'}
              </Badge>
            ) : (
              <Badge className="bg-teal-50 text-teal-600 border-teal-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide min-h-[24px]">
                Em Dia
              </Badge>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0" aria-hidden="true">
          <ChevronRight size={20} />
        </div>
      </div>
    </motion.button>
  )
}

function DetailDrawerMobile({ aluno, onClose, onPagar }: any) {
  const [activeTab, setActiveTab] = useState<'pendentes' | 'pagos'>('pendentes')
  const [exibirTodas, setExibirTodas] = useState(false)

  if (!aluno) return null

  // Total Geral de todas as faturas em aberto
  const pendentesFaturas = aluno.faturas.filter((f: any) => f.status !== 'pago' && f.pago !== true && f.status !== 'cancelado')
  const totalGeral = pendentesFaturas.reduce((acc: number, f: any) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header do Bottom Sheet */}
      <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
        {/* Handle Indicator - iOS Sheet */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full" aria-hidden="true" />

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
            aria-label="Fechar"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex flex-col">
            <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">
              {aluno.nome_completo}
            </h3>
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">
              Detalhes Financeiros
            </p>
          </div>
        </div>
      </header>

      {/* Tabs - Pendentes / Histórico */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex flex-col h-full">
          <div className="px-4 py-3 border-b border-slate-50 shrink-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-[16px] h-12">
              <TabsTrigger
                value="pendentes"
                className="rounded-[12px] font-bold uppercase text-[11px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm h-full transition-all"
              >
                Em Aberto
              </TabsTrigger>
              <TabsTrigger
                value="pagos"
                className="rounded-[12px] font-bold uppercase text-[11px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm h-full transition-all"
              >
                Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <div 
            className="overflow-y-auto px-4 pt-4 pb-32" 
            style={{ 
              height: 'calc(92vh - 180px)',
              minHeight: '400px',
              WebkitOverflowScrolling: 'touch' 
            }}
          >
            <TabsContent value="pendentes" className="m-0 outline-none">
              <div className="mb-6 p-6 bg-slate-900 rounded-[28px] text-white flex flex-col items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mb-1">Total do Ano Letivo</span>
                <h4 className="text-2xl font-black tracking-tighter">{formatCurrency(totalGeral)}</h4>
              </div>

              <DrawerFaturaListMobile
                faturas={pendentesFaturas}
                onAction={onPagar}
                exibirTodas={exibirTodas}
                onToggleTodas={() => setExibirTodas(true)}
              />
            </TabsContent>

            <TabsContent value="pagos" className="m-0 outline-none">
              <DrawerFaturaListMobile
                faturas={aluno.faturas.filter((f: any) => f.status === 'pago' || f.pago === true)}
                isHistorico
                exibirTodas
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

function DrawerFaturaListMobile({ faturas, onAction, isHistorico, exibirTodas, onToggleTodas }: any) {
  if (faturas.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-[14px] font-medium italic">Nenhuma fatura {isHistorico ? 'paga' : 'pendente'}.</p>
      </div>
    )
  }

  const rawSorted = [...faturas].sort((a, b) =>
    isHistorico
      ? new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime()
      : new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  )

  // O slice e temMais já mostram min. 3 se disponíveis
  const sorted = exibirTodas ? rawSorted : rawSorted.slice(0, 3)
  const temMais = !exibirTodas && rawSorted.length > 3

  const getTipoBadge = (fatura: any) => {
    if (fatura.subtipo_cobranca === 'matricula_rematricula') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-600 shrink-0">
          🎓 Matrícula
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[9px] font-black uppercase tracking-widest text-blue-600 shrink-0">
        📚 Mensalidade
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-safe">
      {sorted.map((fat: any) => {
        const isVencida = fat.status === 'atrasado' || (fat.status === 'a_vencer' && new Date(fat.data_vencimento + 'T12:00:00') < new Date())

        return (
          <motion.div
            key={fat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-[20px] border transition-all flex flex-col gap-4",
              isHistorico
                ? "bg-slate-50/30 border-slate-100"
                : isVencida
                  ? "bg-rose-50/40 border-rose-100 shadow-sm"
                  : "bg-white border-slate-100 shadow-sm"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-[16px] flex items-center justify-center border shrink-0",
                  isHistorico
                    ? "bg-white text-teal-500"
                    : isVencida
                      ? "bg-white text-rose-500"
                      : "bg-teal-50 text-teal-600 border-teal-100"
                )}
                aria-hidden="true"
              >
                {isHistorico ? <CheckCircle2 size={20} /> : <Receipt size={20} />}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-[14px] font-bold text-slate-800 tracking-tight leading-tight line-clamp-2">
                    {fat.descricao}
                  </h5>
                  {!isHistorico && getTipoBadge(fat)}
                  {!isHistorico && isVencida && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[9px] font-black uppercase tracking-widest text-rose-700 shrink-0">
                      ⚠️ Atrasada
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-1">
                  Venc: {formatDate(fat.data_vencimento)}
                </p>
                <span className={cn(
                  "text-[18px] font-bold tracking-tight mt-2",
                  isHistorico ? "text-slate-400" : isVencida ? "text-rose-600" : "text-slate-900"
                )}>
                  {formatCurrency(fat.valor_total_projetado || fat.valor_original || fat.valor || 0)}
                </span>
              </div>
            </div>

            {!isHistorico && (
              <Button
                onClick={() => onAction(fat)}
                className={cn(
                  "w-full h-12 rounded-[16px] font-bold text-[11px] uppercase tracking-wide shadow-sm active:scale-98 transition-transform",
                  isVencida
                    ? "bg-rose-600 hover:bg-rose-700 font-black"
                    : "bg-slate-900 hover:bg-black font-black"
                )}
              >
                Pagar Agora
              </Button>
            )}
            {isHistorico && (
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); fat.comprovante_url && window.open(fat.comprovante_url, '_blank') }}
                className={cn(
                  "w-full h-12 rounded-[16px] font-bold text-[11px] uppercase tracking-wide border-2 transition-all flex items-center justify-center gap-2",
                  fat.comprovante_url 
                    ? "border-teal-100 bg-teal-50/50 text-teal-600" 
                    : "border-slate-100 text-slate-300"
                )}
              >
                {fat.comprovante_url ? (
                  <>
                    <FileText size={16} />
                    Ver Comprovante
                  </>
                ) : (
                  'Recibo não disponível'
                )}
              </Button>
            )}
          </motion.div>
        )
      })}

      {temMais && (
        <Button
          variant="ghost"
          onClick={onToggleTodas}
          className="w-full h-16 rounded-[20px] border-2 border-dashed border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-[2px] mt-2 mb-10"
        >
          Ver todas as parcelas do ano
        </Button>
      )}
    </div>
  )
}

function PagamentoPixManualMobile({ isOpen, onClose, cobranca, copiado, setCopiado }: any) {
  const [activeTab, setActiveTab] = useState<'chave' | 'qrcode'>('qrcode')
  const queryClient = useQueryClient()
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
      await queryClient.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })

      const numeroRaw = configRecados?.whatsapp_contato || ''
      const numero = numeroRaw.replace(/\D/g, '')
      const msg = encodeURIComponent(`Olá, confirmo o pagamento de ${formatCurrency(cobranca?.valor_total_projetado || cobranca?.valor_original || cobranca?.valor || 0)} (${cobranca?.descricao} - ${cobranca?.alunoNome}). Comprovante: ${url}`)
      
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent showCloseButton={false} side="bottom" className="rounded-t-[40px] p-0 border-t border-slate-100 focus:outline-none ring-0 max-h-[95vh] overflow-y-auto bg-white pb-safe">
        {/* Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-6" aria-hidden="true" />

        <div className="flex flex-col gap-6 px-6 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Pagar com pix manual</h3>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Seletor de Abas Estilizado */}
          <div className="flex bg-slate-50 p-1.5 rounded-[24px] h-14 relative shrink-0">
            <button
              onClick={() => { vibrate(10); setActiveTab('chave'); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all z-10",
                activeTab === 'chave' ? "bg-white text-teal-600 shadow-xl" : "text-slate-400"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", activeTab === 'chave' ? "bg-teal-500" : "bg-slate-200")} />
              Copiar chave
            </button>
            <button
              onClick={() => { vibrate(10); setActiveTab('qrcode'); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all z-10",
                activeTab === 'qrcode' ? "bg-white text-teal-600 shadow-xl" : "text-slate-400"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", activeTab === 'qrcode' ? "bg-teal-500" : "bg-slate-200")} />
              Ler QRcode
            </button>
          </div>

          {/* Banner de Valor */}
          <div className="bg-[#0c1322] rounded-[24px] p-6 flex flex-col gap-1 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5" aria-hidden="true">
              <TrendingDown size={80} className="text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[3px] text-teal-400/70">Total à pagar</span>
            <h2 className="text-3xl font-black text-white tracking-tighter">
              {formatCurrency(cobranca?.valor_total_projetado || cobranca?.valor_original || cobranca?.valor || 0)}
            </h2>
          </div>

          {/* Conteúdo Dinâmico */}
          <div className="min-h-[220px] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'qrcode' ? (
                <motion.div 
                  key="qrcode"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="p-4 bg-white rounded-[32px] shadow-2xl border border-slate-50 flex items-center justify-center">
                    {configPix?.qr_code_url ? (
                      configPix.qr_code_url.toLowerCase().endsWith('.pdf') ? (
                        <div onClick={() => window.open(configPix.qr_code_url, '_blank')} className="flex flex-col items-center gap-3 p-6 cursor-pointer border border-dashed border-teal-200 rounded-3xl bg-teal-50/30 active:bg-teal-50 transition-colors">
                          <FileText size={64} className="text-teal-500" />
                          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Abrir QR Code (PDF)</span>
                        </div>
                      ) : (
                        <img src={configPix.qr_code_url} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                      )
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-200 gap-4">
                        <QrCode size={80} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">QR Code não disponível</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escaneie o código acima</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="chave"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
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
              arquivo ? "bg-teal-50/50 border-teal-200" : "bg-slate-50 border-slate-200 active:bg-slate-100/80"
            )}>
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleFileChange} disabled={enviando} />
              {arquivo ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xl shadow-teal-500/30">
                     <CheckCircle2 size={32} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[12px] font-black text-teal-700 text-center px-4 truncate max-w-[240px]">{arquivo.name}</span>
                    <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest mt-1">Toque para trocar o arquivo</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-[13px] font-black text-slate-500 uppercase tracking-tight text-center">Enviar comprovante</span>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
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
              <AccordionTrigger className="hover:no-underline py-4 px-6 bg-slate-50 rounded-[20px] text-slate-700 font-black uppercase text-[10px] tracking-widest transition-all">
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
                  <li key={i} className="flex items-center gap-3 text-[12px] font-semibold text-slate-500 leading-relaxed">
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
              "w-full h-16 rounded-[28px] text-[13px] font-black uppercase tracking-[3px] transition-all shadow-2xl active:scale-95 mt-2",
              arquivo 
                ? "bg-[#00c59e] text-white hover:bg-[#00b08d] shadow-[#00c59e]/20" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            )}
          >
            {enviando ? <Loader2 className="animate-spin mr-3" size={20} /> : null}
            {enviando ? 'ENVIANDO...' : 'FINALIZAR PAGAMENTO'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
