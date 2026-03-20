import { useState, useMemo } from 'react'
import { useVinculosAtivos, useConfigPix, useConfigRecados } from '../../hooks'
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
} from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { BotaoVoltar } from '../../components/BotaoVoltar'
import { useQueries } from '@tanstack/react-query'
import { portalService } from '../../service'
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
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()

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
      return { ...v.aluno, is_financeiro: v.is_financeiro, faturas }
    })
    const allFaturas = alunosComFaturas.flatMap(a => a.faturas)
    const aVencer = allFaturas.filter(f => f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') >= new Date()).reduce((acc, f) => acc + Number(f.valor), 0)
    const atrasado = allFaturas.filter(f => f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < new Date())).reduce((acc, f) => acc + Number(f.valor), 0)
    const materiais = allFaturas.filter(f => f.status !== 'pago' && f.descricao?.toLowerCase().includes('item')).reduce((acc, f) => acc + Number(f.valor), 0)
    const proximoVenc = allFaturas.filter(f => f.status === 'a_vencer' || f.status === 'atrasado').sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0]?.data_vencimento
    return { resumo: { aVencer, atrasado, materiais, proximoVenc }, alunos: alunosComFaturas }
  }, [vinculos, cobrancasQueries, isLoadingCobrancas])

  if (loadingVinculos || isLoadingCobrancas) return <CobrancasSkeleton />

  return (
    <div className="flex flex-col gap-10 p-6 pt-6 pb-24 font-sans max-w-[1600px] mx-auto w-full">
      
      {/* Botão Voltar (Sobre o Título) */}
      <div className="flex flex-col gap-8">
        <BotaoVoltar />
        
        <header className="flex flex-col border-b border-slate-200 pb-10 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Financeiro</h1>
            <p className="text-base font-semibold text-slate-500">Gestão financeira consolidada da família.</p>
          </div>

          {/* Dashboard Cards Consolidados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <ResumoCard label="A Vencer" value={familyData?.resumo.aVencer} icon={Calendar} color="teal" />
            <ResumoCard label="Atrasado" value={familyData?.resumo.atrasado} icon={AlertTriangle} color="rose" isCritical />
            <ResumoCard label="Compras/Materiais" value={familyData?.resumo.materiais} icon={ShoppingBag} color="indigo" />
            <ResumoCard label="Próximo Vencimento" value={familyData?.resumo.proximoVenc} icon={CreditCard} color="amber" isDate />
          </div>
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
            onPagar={(fat: any) => { setCobrancaAtiva({ ...fat, alunoNome: selectedAluno.nome_completo, tenant_id: selectedAluno.tenant_id }); setShowCheckout(true); }}
          />
        </SheetContent>
      </Sheet>

      {/* Modal de Checkout (PIX) - Versão Clean com QR Code Real da Escola Específica (Isolamento de Contexto) */}
      <CheckoutModal 
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

function ResumoCard({ label, value, icon: Icon, color, isCritical, isDate }: any) {
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
        </div>
      </CardContent>
    </Card>
  )
}

function AlunoCard({ aluno, onClick }: any) {
  const pendentes = aluno.faturas.filter((f: any) => f.status !== 'pago' && f.status !== 'cancelado').length
  const atrasadas = aluno.faturas.filter((f: any) => f.status === 'atrasado' || (f.status === 'a_vencer' && new Date(f.data_vencimento + 'T12:00:00') < new Date())).length

  return (
    <div
      onClick={onClick}
      className="flex flex-col bg-white border border-slate-100 rounded-[48px] p-10 shadow-[0_10px_45px_rgba(0,0,0,0.04)] cursor-pointer hover:border-teal-300 hover:-translate-y-2 transition-all group"
    >
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex justify-center items-center text-3xl font-black shadow-2xl relative">
          {getInitials(aluno.nome_completo)}
          {atrasadas > 0 && <div className="absolute -top-1 -right-1 w-7 h-7 bg-rose-500 border-4 border-white rounded-full animate-pulse" />}
        </div>
        <div className="flex flex-col flex-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-3 group-hover:text-teal-600 transition-colors">
            {aluno.nome_completo || 'Aluno'}
          </h2>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{aluno.turma?.nome || 'Turma não informada'}</span>
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
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Acesso</span>
            <span className="text-xs font-bold text-slate-500">{aluno.is_financeiro ? 'Responsável Financeiro' : 'Acesso Acadêmico'}</span>
         </div>
         <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
            <ChevronRight size={24} />
         </div>
      </div>
    </div>
  )
}

function DetailDrawer({ aluno, onClose, onPagar }: any) {
  if (!aluno) return null
  
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

      {!aluno.is_financeiro ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6">
           <div className="w-24 h-24 rounded-[40px] bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
             <AlertCircle size={48} />
           </div>
           <div className="space-y-2">
             <h4 className="text-xl font-black text-slate-800 tracking-tight">Sem Permissão</h4>
             <p className="text-sm font-semibold text-slate-500 max-w-xs leading-relaxed">Você não foi designado como responsável financeiro deste aluno.</p>
           </div>
        </div>
      ) : (
        <Tabs defaultValue="pendentes" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-10 py-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1.5 rounded-[24px] h-14">
              <TabsTrigger value="pendentes" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl h-full transition-all">Em Aberto</TabsTrigger>
              <TabsTrigger value="pagos" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl h-full transition-all">Histórico</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="pendentes" className="flex-1 overflow-y-auto px-10 pb-10 m-0 custom-scrollbar">
             <DrawerFaturaList faturas={aluno.faturas.filter((f: any) => f.status !== 'pago' && f.status !== 'cancelado')} onAction={onPagar} />
          </TabsContent>
          
          <TabsContent value="pagos" className="flex-1 overflow-y-auto px-10 pb-10 m-0 custom-scrollbar">
             <DrawerFaturaList faturas={aluno.faturas.filter((f: any) => f.status === 'pago')} isHistorico />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function DrawerFaturaList({ faturas, onAction, isHistorico }: any) {
  if (faturas.length === 0) return <div className="py-20 text-center text-slate-300 font-bold italic uppercase tracking-widest text-xs">Vazio</div>
  
  const sorted = [...faturas].sort((a,b) => isHistorico ? new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime() : new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())

  return (
    <div className="flex flex-col gap-5">
      {sorted.map((fat) => {
        const isVencida = fat.status === 'atrasado' || (fat.status === 'a_vencer' && new Date(fat.data_vencimento + 'T12:00:00') < new Date())
        return (
          <div key={fat.id} className={cn("p-6 rounded-[32px] border transition-all flex flex-col gap-6", isHistorico ? "bg-slate-50/30 border-slate-100" : (isVencida ? "bg-rose-50/40 border-rose-100 shadow-sm" : "bg-white border-slate-100 shadow-sm hover:shadow-md"))}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", isHistorico ? "bg-white text-teal-500" : (isVencida ? "bg-white text-rose-500" : "bg-teal-50 text-teal-600 border-teal-100"))}>
                    {isHistorico ? <CheckCircle2 size={24} /> : <Receipt size={24} />}
                 </div>
                 <div className="flex flex-col">
                   <h5 className="font-black text-slate-800 tracking-tight leading-none mb-1">{fat.descricao}</h5>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimento: {formatDate(fat.data_vencimento)}</p>
                 </div>
              </div>
              <span className={cn("text-xl font-black tracking-tight", isHistorico ? "text-slate-400" : "text-slate-900")}>{formatCurrency(fat.valor)}</span>
            </div>
            
            {!isHistorico && (
              <Button onClick={() => onAction(fat)} className={cn("w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-xl transition-all active:scale-95", isVencida ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-slate-900 hover:bg-black shadow-slate-100")}>
                Pagar Agora
              </Button>
            )}
            {isHistorico && (
              <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-slate-100 text-slate-500 gap-2 hover:bg-slate-50">
                <Download size={18} /> Baixar Recibo
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CheckoutModal({ isOpen, onClose, cobranca, copiado, setCopiado }: any) {
  const isMobile = useIsMobile()
  
  // ISOLAMENTO DE CONTEXTO: Buscar configuração da escola do aluno ESPECÍFICO da cobrança
  const { data: configPix } = useConfigPix(cobranca?.tenant_id)
  const { data: configRecados } = useConfigRecados(cobranca?.tenant_id)

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
    const msg = encodeURIComponent(`Olá, envio comprovante de ${formatCurrency(cobranca?.valor || 0)} (${cobranca?.descricao} - ${cobranca?.alunoNome}).`)
    window.open(`https://wa.me/${numero.startsWith('55') ? numero : '55'+numero}?text=${msg}`, '_blank')
  }

  const ModalContent = (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-2xl shadow-teal-500/20">
             <TrendingDown size={28} />
           </div>
           <div className="flex flex-col">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none pt-1">Pagamento PIX</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Fluxo de Segurança</p>
           </div>
         </div>
         <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
           <X size={24} />
         </button>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 py-8 bg-slate-900 rounded-[48px] text-white shadow-3xl relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-10 -mr-8 -mt-8"><DollarSign size={150} /></div>
         <span className="text-[10px] font-black uppercase tracking-[5px] text-teal-400 mb-2 relative z-10">Total a Pagar</span>
         <h2 className="text-5xl font-black tracking-tighter relative z-10 leading-none">{formatCurrency(cobranca?.valor || 0)}</h2>
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 relative z-10">{cobranca?.descricao}</p>
      </div>

      <div className="space-y-8">
        {(configPix?.qr_code_url || configPix?.chave_pix) ? (
          <div className="space-y-8">
             {(configPix?.qr_code_url || configPix?.qr_code_auto) ? (
               <div className="p-10 rounded-[48px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center gap-8 group transition-all">
                  <div className="p-6 bg-white rounded-[40px] shadow-2xl border border-slate-100 flex items-center justify-center">
                    {configPix?.qr_code_url ? (
                      <img src={configPix.qr_code_url} alt="QR Code PIX Escolar" className="w-48 h-48 object-contain" />
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-300 gap-3">
                        <QrCode size={64} className="opacity-20" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Gerando Código...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className="flex items-center gap-2 text-teal-600">
                        <CheckCircle2 size={16} />
                        <span className="text-[11px] font-black uppercase tracking-[2px]">QR Code Ativo</span>
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Escaneie com o app do seu banco</p>
                  </div>
               </div>
             ) : null}

             {configPix?.chave_pix && (
               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ou use o Copia e Cola</span>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-6 rounded-[32px] bg-white border-2 border-slate-100 font-mono text-xs text-slate-500 break-all leading-relaxed shadow-inner text-center">
                       {configPix.chave_pix}
                    </div>
                    <Button onClick={handleCopy} className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[28px] font-black text-xs uppercase tracking-[3px] gap-4 shadow-2xl active:scale-95 transition-all">
                       {copiado ? <CheckCircle2 size={20} className="text-teal-400" /> : <Copy size={20} />}
                       {copiado ? 'Código Copiado!' : 'Copiar Código PIX'}
                    </Button>
                  </div>
               </div>
             )}
          </div>
        ) : (
          <div className="p-14 text-center space-y-4 bg-rose-50 rounded-[48px] border border-rose-100 shadow-inner">
             <AlertCircle size={56} className="text-rose-500 mx-auto" />
             <p className="text-lg font-black text-rose-900 uppercase">PIX Não Configurado</p>
             <p className="text-xs font-semibold text-rose-700/60 leading-relaxed px-4">Esta instituição ainda não cadastrou os dados necessários para pagamento via PIX.</p>
          </div>
        )}

        <Button onClick={handleComprovante} variant="outline" className="w-full h-16 bg-teal-50 text-teal-600 border-2 border-teal-100 rounded-[28px] text-[10px] font-black uppercase tracking-[3px] hover:bg-teal-100 active:scale-95 transition-all shadow-sm">
           Confirmar Pagamento
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-[60px] p-8 pb-12 focus:outline-none ring-0 h-auto max-h-[95vh] overflow-y-auto">
          {ModalContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] rounded-[60px] p-12 focus:outline-none ring-0 overflow-hidden">
        <DialogTitle className="sr-only">Checkout PIX</DialogTitle>
        {ModalContent}
      </DialogContent>
    </Dialog>
  )
}
