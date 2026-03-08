import { useState } from 'react'
import { useCobrancasAluno, useConfigPix } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { 
  CreditCard, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Calendar, 
  DollarSign, 
  QrCode, 
  X,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { SeletorAluno } from '../components/SeletorAluno'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

// --- SKELETON LOADING ---
const CobrancasSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-40 bg-slate-100 rounded-lg" />
    <div className="h-28 bg-slate-900 rounded-2xl" />
    <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl" />)}
    </div>
  </div>
)

export function PortalCobrancasPage() {
  const { alunoSelecionado, isMultiAluno, vinculos } = usePortalContext()
  const { data: cobrancas, isLoading } = useCobrancasAluno()
  const { data: configPix } = useConfigPix()

  const [copiado, setCopiado] = useState(false)
  const [cobrancaAtiva, setCobrancaAtiva] = useState<any>(null)

  const handleCopiarChave = () => {
    vibrate(40)
    if (configPix?.chave_pix) {
      navigator.clipboard.writeText(configPix.chave_pix)
      setCopiado(true)
      toast.success('Chave PIX copiada!')
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const statusBadge = (status: string, vencimento: string) => {
    const isAtrasado = status === 'a_vencer' && new Date(vencimento) < new Date(new Date().setHours(0,0,0,0))
    const displayStatus = isAtrasado ? 'atrasado' : status

    const styles: Record<string, string> = {
      a_vencer: 'bg-amber-100 text-amber-700',
      pago: 'bg-teal-100 text-teal-700 font-bold',
      atrasado: 'bg-red-100 text-red-700 font-bold',
      cancelado: 'bg-slate-100 text-slate-500',
    }
    const labels: Record<string, string> = {
      a_vencer: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelada',
    }

    return (
      <Badge className={cn('font-semibold uppercase text-[8px] tracking-wider px-2 py-0.5 rounded-full border-0', styles[displayStatus] || '')}>
        {labels[displayStatus] || displayStatus}
      </Badge>
    )
  }

  if (isLoading) return <CobrancasSkeleton />

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-slate-200" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800">Cobranças</h2>
          <p className="text-sm text-slate-400">Selecione um aluno para ver as faturas.</p>
        </div>
      </div>
    )
  }

  const vinculoFinanceiro = vinculos?.find(v => (v.aluno_id || v.aluno?.id) === alunoSelecionado.id)?.is_financeiro

  if (!vinculoFinanceiro) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 p-8 rounded-2xl text-white text-center space-y-5 shadow-lg overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-5 -mr-8 -mt-8 pointer-events-none">
           <ShieldCheck size={150} />
        </div>
        <div className="h-14 w-14 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto">
          <ShieldCheck className="h-7 w-7 text-teal-400" />
        </div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-lg font-bold text-teal-400">Acesso Restrito</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Sem permissão financeira para este aluno.
          </p>
        </div>
        <Button variant="ghost" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white" onClick={() => window.history.back()}>Voltar</Button>
      </motion.div>
    )
  }

  const pendentes = cobrancas?.filter(c => c.status === 'a_vencer' || (c.status === 'a_vencer' && new Date(c.data_vencimento) < new Date())) || []
  const pagos = cobrancas?.filter(c => c.status === 'pago') || []

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Cobranças</h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Pagamentos & Boletos</p>
        </div>
        {isMultiAluno && <SeletorAluno />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          
          {/* 2. Pendentes / Timeline Flow */}
          {pendentes.length > 0 && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                     <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Em Aberto</h3>
                  </div>
                  <Badge className="bg-slate-900 text-white text-[8px] font-semibold tracking-wider uppercase rounded-full px-3 h-5 border-0">{pendentes.length}</Badge>
               </div>

               <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pendentes.map((cobranca, idx) => {
                      const isAtrasado = new Date(cobranca.data_vencimento) < new Date(new Date().setHours(0,0,0,0))
                      return (
                        <motion.div 
                          layout
                          key={cobranca.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer overflow-hidden relative active:scale-[0.98] transition-transform",
                            isAtrasado && "ring-2 ring-red-100"
                          )}
                          onClick={() => { vibrate(20); setCobrancaAtiva(cobranca); }}
                        >
                          {isAtrasado && (
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                               <AlertCircle size={60} />
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 relative z-10">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                 "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                 isAtrasado ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'
                              )}>
                                <CreditCard size={18} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-800 truncate">{cobranca.descricao}</h3>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                     <Calendar size={10} />
                                     {format(new Date(cobranca.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                  {statusBadge(cobranca.status, cobranca.data_vencimento)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                               <p className={cn("text-lg font-bold leading-none", isAtrasado ? 'text-red-600' : 'text-slate-900')}>
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobranca.valor)}
                               </p>
                               <ChevronRight size={16} className="text-slate-200" />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
               </div>
            </div>
          )}

          {/* 3. Pagos / Histórico Flow */}
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-teal-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico</h3>
             </div>
             <div className="space-y-2">
                {pagos.map(cobranca => (
                  <div key={cobranca.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between opacity-80">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center shrink-0">
                           <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0">
                           <h4 className="text-xs font-bold text-slate-700 truncate">{cobranca.descricao}</h4>
                           <p className="text-[10px] text-slate-300">{format(new Date(cobranca.data_vencimento + 'T12:00:00'), 'MMM yyyy', { locale: ptBR })}</p>
                        </div>
                     </div>
                     <p className="text-sm font-bold text-slate-300 shrink-0">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobranca.valor)}
                     </p>
                  </div>
                ))}
                {(!pagos || pagos.length === 0) && !isLoading && (
                  <div className="py-10 text-center space-y-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                     <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200">
                        <DollarSign size={28} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-800">Sem histórico</h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto">Nenhuma fatura quitada encontrada.</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* 4. Side Panels / Widgets */}
        <div className="space-y-5">
          
          <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm p-5 space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-800 flex items-center justify-center">
                   <Info size={16} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Informativo</h3>
             </div>

             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="vencimento" className="border-b border-slate-100 py-2">
                  <AccordionTrigger className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:no-underline px-0">
                     Vencimentos
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-400 leading-relaxed pt-1">
                    Fique atento aos prazos para evitar suspensão de serviços.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="atrasos" className="border-0 py-2">
                  <AccordionTrigger className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:no-underline px-0">
                     Encargos
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <span className="block text-[8px] font-semibold text-red-400 uppercase tracking-wider mb-1">Atraso</span>
                          <span className="text-lg font-bold text-red-600">2%</span>
                       </div>
                       <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                          <span className="block text-[8px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Mora</span>
                          <span className="text-lg font-bold text-amber-600">1%</span>
                       </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
             </Accordion>
          </Card>

          <div className="bg-slate-900 rounded-2xl shadow-lg p-5 text-white relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <TrendingDown size={150} />
             </div>
             <div className="relative z-10 space-y-4">
               <div>
                 <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3">
                    <Info size={16} />
                 </div>
                 <h4 className="text-sm font-bold text-teal-400 mb-1">Suporte</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                    Dúvidas sobre pagamentos? Fale com a tesouraria.
                 </p>
               </div>
               <Button className="w-full bg-white text-slate-900 hover:bg-teal-50 rounded-xl font-semibold uppercase text-[10px] tracking-wider h-11 active:scale-95">
                  Abrir Chamado
               </Button>
             </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Sheet PIX Checkout - Pro Max Style */}
      <Sheet open={!!cobrancaAtiva} onOpenChange={(open) => { if(!open) setCobrancaAtiva(null); vibrate(10); }}>
        <SheetContent side="bottom" className="rounded-t-3xl border-0 p-0 overflow-hidden bg-white shadow-2xl h-auto max-h-[90vh] focus:outline-none">
          <div className="px-5 pt-6 pb-8 space-y-5">
            
            <HeaderClose onClose={() => setCobrancaAtiva(null)} />
            
            <div className="flex flex-col gap-5">
               <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mx-auto">
                     <QrCode size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-slate-800">Checkout PIX</h3>
                    <p className="text-[10px] text-slate-400">{configPix?.favorecido || 'Portal Fluxoo EDU'}</p>
                  </div>
               </div>

               <div className="bg-slate-900 rounded-2xl p-5 text-center text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                     <DollarSign size={100} />
                 </div>
                 <p className="text-[10px] font-medium text-teal-400 uppercase tracking-wider mb-2">Total</p>
                 <h2 className="text-3xl font-bold leading-none">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancaAtiva?.valor || 0)}
                 </h2>
                 <p className="text-[10px] text-white/30 uppercase tracking-wider mt-3 border-t border-white/5 pt-3">{cobrancaAtiva?.descricao}</p>
               </div>

               {configPix?.qr_code_url ? (
                 <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-400 mb-4 flex items-center gap-2">Escaneie com seu banco</p>
                    <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
                       <img src={configPix.qr_code_url} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                    </div>
                 </div>
               ) : configPix?.chave_pix ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider text-center">Copia e Cola</p>
                       <div className="font-mono text-xs text-slate-600 break-all bg-white p-4 rounded-lg border border-slate-200 text-center">
                          {configPix.chave_pix}
                       </div>
                       <Button 
                         onClick={handleCopiarChave}
                         className="w-full bg-slate-900 text-white rounded-xl h-12 active:scale-95 font-semibold text-xs uppercase tracking-wider gap-2"
                       >
                         {copiado ? <CheckCircle2 size={18} className="text-teal-400" /> : <Copy size={18} />}
                         {copiado ? 'Copiado!' : 'Copiar Chave'}
                       </Button>
                    </div>

                    {configPix.instrucoes_extras && (
                      <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">{configPix.instrucoes_extras}</p>
                      </div>
                    )}
                  </div>
               ) : (
                  <div className="p-10 text-center space-y-3 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
                      <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                      <div className="space-y-1">
                         <h4 className="text-base font-bold text-red-900">Indisponível</h4>
                         <p className="text-xs text-red-800/80 max-w-xs mx-auto">PIX não ativado pela instituição.</p>
                      </div>
                  </div>
               )}
            </div>
            
            <div className="flex justify-center">
              <p className="text-[9px] text-slate-300 uppercase tracking-wider flex items-center gap-2">
                 <ShieldCheck size={12} className="text-teal-500" /> Conexão SSL/TLS
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manual Back Navigation */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={() => { vibrate(10); window.history.back(); }}
          className="text-slate-400 font-semibold uppercase text-[10px] tracking-widest hover:text-teal-600 h-11 px-6 rounded-full">
          Retornar
        </Button>
      </div>
    </div>
  )
}

function HeaderClose({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
             <DollarSign size={20} />
          </div>
          <div>
             <h3 className="text-lg font-bold text-slate-800">Checkout</h3>
             <p className="text-[10px] text-slate-400">Pagamento Seguro</p>
          </div>
       </div>
       <button 
          onClick={() => { vibrate(15); onClose(); }}
          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 active:scale-90"
       >
          <X size={16} />
       </button>
    </div>
  )
}
