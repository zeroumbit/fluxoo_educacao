import { useState, useMemo } from 'react'
import { useVinculosAtivos } from '../../hooks'
import { usePortalContext } from '../../context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
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
  QrCode
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useQueries } from '@tanstack/react-query'
import { portalService } from '../../service'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
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
    {/* Alunos Cards Skeleton */}
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-28 bg-white border border-slate-100 rounded-[24px]" />
      ))}
    </div>
  </div>
)

export function PortalCobrancasPageV2Mobile() {
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()
  const { isLoading: isLoadingCtx } = usePortalContext()

  const [selectedAluno, setSelectedAluno] = useState<any>(null)
  const [cobrancaAtiva, setCobrancaAtiva] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Buscar cobranças para TODOS os alunos vinculados em paralelo
  const cobrancasQueries = useQueries({
    queries: (vinculos || []).map((v: any) => ({
      queryKey: ['portal', 'cobrancas', v.aluno?.id, v.aluno?.tenant_id],
      queryFn: () => portalService.buscarCobrancasPorAluno(v.aluno.id, v.aluno.tenant_id),
      enabled: !!v.aluno?.id && !!v.aluno?.tenant_id,
    })),
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
    
    // A Vencer: status 'a_vencer' E data_vencimento >= hoje
    const aVencer = allFaturas
      .filter(f => f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') >= hoje)
      .reduce((acc, f) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Atrasado: status 'atrasado' OU (status 'a_vencer' mas data_vencimento < hoje)
    const atrasado = allFaturas
      .filter(f => f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < hoje))
      .reduce((acc, f) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Materiais/Compras
    const materiais = allFaturas
      .filter(f => f.status !== 'pago' && f.descricao?.toLowerCase().includes('item'))
      .reduce((acc, f) => acc + Number(f.valor_total_projetado || f.valor_original || f.valor || 0), 0)
    
    // Próximo vencimento: APENAS cobranças a vencer (NÃO incluir atrasadas)
    // Mostrar a MENOR data de vencimento que seja >= hoje
    const proximoVenc = allFaturas
      .filter(f => f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') >= hoje)
      .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0]?.data_vencimento
    
    return { resumo: { aVencer, atrasado, materiais, proximoVenc }, alunos: alunosComFaturas }
  }, [vinculos, cobrancasQueries, isLoadingCobrancas])

  if (loadingVinculos || isLoadingCobrancas || isLoadingCtx) return <CobrancasSkeleton />

  return (
    <div className="flex flex-col gap-6 pb-24">
      <NativeHeader title="Financeiro" showBack />
      
      <div className="px-4 flex flex-col gap-6">

      {/* 2. Dashboard Cards - Scroll Horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar" role="region" aria-label="Resumo financeiro">
        <ResumoCardMobile
          label="A Vencer em 12 Meses"
          value={familyData?.resumo.aVencer}
          icon={Calendar}
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
        <ResumoCardMobile
          label="Próximo Venc."
          value={familyData?.resumo.proximoVenc}
          icon={CreditCard}
          color="amber"
          isDate
        />
      </div>

      {/* 3. Lista de Alunos - Cards */}
      <div className="flex flex-col gap-4">
        {/* Header da Seção */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-bold text-slate-800">
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
        <SheetContent side="bottom" className="rounded-t-[32px] p-0 border-t border-slate-100 focus:outline-none ring-0 max-h-[90vh] overflow-hidden">
          <DetailDrawerMobile
            aluno={selectedAluno}
            onClose={() => setSelectedAluno(null)}
            onPagar={(fat: any) => {
              setCobrancaAtiva({ ...fat, alunoNome: selectedAluno.nome_completo, tenant_id: selectedAluno.tenant_id });
              setShowCheckout(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* 5. Bottom Sheet - Checkout PIX */}
      <CheckoutModalMobile
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
}

function ResumoCardMobile({ label, value, icon: Icon, color, isCritical, isDate }: ResumoCardMobileProps) {
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
            "text-[18px] font-bold tracking-tight leading-tight truncate",
            isCritical && value > 0 ? "text-rose-600" : "text-slate-900"
          )}>
            {isDate ? (value ? formatDate(value) : '---') : formatCurrency(value || 0)}
          </span>
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

  if (!aluno) return null

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="px-4 py-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
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

            <TabsContent value="pendentes" className="flex-1 overflow-y-auto m-0 mt-3">
              <DrawerFaturaListMobile
                faturas={aluno.faturas.filter((f: any) => f.status !== 'pago' && f.status !== 'cancelado')}
                onAction={onPagar}
              />
            </TabsContent>

            <TabsContent value="pagos" className="flex-1 overflow-y-auto m-0 mt-3">
              <DrawerFaturaListMobile
                faturas={aluno.faturas.filter((f: any) => f.status === 'pago')}
                isHistorico
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function DrawerFaturaListMobile({ faturas, onAction, isHistorico }: any) {
  if (faturas.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-[14px] font-medium italic">Nenhuma fatura {isHistorico ? 'paga' : 'pendente'}.</p>
      </div>
    )
  }

  const sorted = [...faturas].sort((a, b) =>
    isHistorico
      ? new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime()
      : new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  )

  const getTipoBadge = (descricao: string) => {
    const desc = descricao?.toLowerCase() || ''
    if (desc.includes('matrícula') || desc.includes('matricula') || desc.includes('taxa')) {
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
                  {!isHistorico && getTipoBadge(fat.descricao)}
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-1">
                  Venc: {formatDate(fat.data_vencimento)}
                </p>
                <span className={cn(
                  "text-[18px] font-bold tracking-tight mt-2",
                  isHistorico ? "text-slate-400" : "text-slate-900"
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
                className="w-full h-12 rounded-[16px] font-bold text-[11px] uppercase tracking-wide border border-slate-200 text-slate-500 gap-2 hover:bg-slate-50"
              >
                <Download size={16} aria-hidden="true" />
                Baixar Recibo
              </Button>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function CheckoutModalMobile({ isOpen, onClose, cobranca, copiado, setCopiado }: any) {
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

  const handleCopy = () => {
    vibrate(40)
    if (configPix?.chave_pix) {
      navigator.clipboard.writeText(configPix.chave_pix)
      setCopiado(true)
      toast.success('Chave PIX copiada!')
      setTimeout(() => setCopiado(false), 3000)
    }
  }

  const handleComprovante = () => {
    vibrate(30)
    const numeroRaw = configRecados?.whatsapp_contato || ''
    const numero = numeroRaw.replace(/\D/g, '')
    if (!numero || numero.length < 8) return toast.error('WhatsApp não configurado pela escola.')
    const msg = encodeURIComponent(`Olá, envio comprovante de ${formatCurrency(cobranca?.valor_total_projetado || cobranca?.valor_original || cobranca?.valor || 0)} (${cobranca?.descricao} - ${cobranca?.alunoNome}).`)
    window.open(`https://wa.me/${numero.startsWith('55') ? numero : '55'+numero}?text=${msg}`, '_blank')
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent showCloseButton={false} side="bottom" className="rounded-t-[32px] p-0 border-t border-slate-100 focus:outline-none ring-0 max-h-[95vh] overflow-y-auto bg-white pb-safe">
        {/* Handle Indicator - iOS Sheet */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-6" aria-hidden="true" />

        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[20px] bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
                <TrendingDown size={24} aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-[18px] font-bold text-slate-800 tracking-tight leading-tight truncate">
                  Pagamento PIX
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Fluxo de Segurança
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px] min-w-[48px]"
              aria-label="Fechar"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Card de Valor - Padrão Material Design Card Elevated */}
          <div className="flex flex-col items-center justify-center gap-2 py-6 bg-zinc-900 rounded-[28px] text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4" aria-hidden="true">
              <DollarSign size={100} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-2 relative z-10 px-4 text-center">
              Total a Pagar
            </span>
            <h2 className="text-[32px] font-bold tracking-tight relative z-10 leading-none px-4 text-center">
              {formatCurrency(cobranca?.valor_total_projetado || cobranca?.valor_original || cobranca?.valor || 0)}
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-3 relative z-10 px-4 text-center truncate max-w-full">
              {cobranca?.descricao || ''}
            </p>
          </div>

          {/* Conteúdo PIX */}
          <div className="space-y-6">
            {(configPix?.qr_code_url || configPix?.chave_pix) ? (
              <div className="space-y-6">
                {/* QR Code */}
                {(configPix?.qr_code_url || configPix?.qr_code_auto) && (
                  <div className="p-6 rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-[20px] shadow-sm border border-slate-100">
                      {configPix?.qr_code_url ? (
                        <img
                          src={configPix.qr_code_url}
                          alt="QR Code PIX"
                          className="w-40 h-40 object-contain"
                        />
                      ) : (
                        <div className="w-40 h-40 flex flex-col items-center justify-center text-slate-300 gap-2">
                          <QrCode size={48} aria-hidden="true" />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-center">
                            Gerando...
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-teal-600">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        <span className="text-[11px] font-bold uppercase tracking-wide text-center">
                          QR Code Ativo
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400 text-center">
                        Escaneie com o app do banco
                      </p>
                    </div>
                  </div>
                )}

                {/* Copia e Cola */}
                {configPix?.chave_pix && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-slate-100 flex-1" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex-shrink-0">
                        Ou use o Copia e Cola
                      </span>
                      <div className="h-px bg-slate-100 flex-1" aria-hidden="true" />
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 rounded-[16px] bg-white border-2 border-slate-100 font-mono text-[11px] text-slate-500 break-all leading-relaxed shadow-inner text-center max-h-32 overflow-y-auto">
                        {configPix.chave_pix}
                      </div>
                      <Button
                        onClick={handleCopy}
                        className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-[16px] font-bold text-[11px] uppercase tracking-wide gap-2 shadow-sm active:scale-98 transition-transform"
                      >
                        {copiado ? (
                          <>
                            <CheckCircle2 size={18} className="text-teal-400" aria-hidden="true" />
                            Código Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={18} aria-hidden="true" />
                            Copiar Código PIX
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-3 bg-rose-50 rounded-[24px] border border-rose-100">
                <AlertCircle size={32} className="text-rose-500 mx-auto" aria-hidden="true" />
                <p className="text-[15px] font-bold text-rose-900 uppercase">
                  PIX Não Configurado
                </p>
                <p className="text-[13px] font-medium text-rose-700/60 leading-relaxed">
                  Esta instituição ainda não cadastrou os dados para pagamento via PIX.
                </p>
              </div>
            )}

            {/* Botão Confirmar */}
            <Button
              onClick={handleComprovante}
              variant="outline"
              className="w-full h-12 bg-teal-50 text-teal-600 border-2 border-teal-100 rounded-[16px] font-bold text-[11px] uppercase tracking-wide hover:bg-teal-100 active:scale-98 transition-transform shadow-sm"
            >
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
