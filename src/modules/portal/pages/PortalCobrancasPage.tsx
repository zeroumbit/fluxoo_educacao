import { useState } from 'react'
import { useCobrancasAluno, useConfigPix } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Loader2, CreditCard, Copy, CheckCircle2, AlertCircle, Info, Calendar, Percent, DollarSign, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeletorAluno } from '../components/SeletorAluno'

export function PortalCobrancasPage() {
  const { alunoSelecionado, isMultiAluno, vinculos } = usePortalContext()
  const { data: cobrancas, isLoading } = useCobrancasAluno()
  const { data: configPix } = useConfigPix()

  const [copiado, setCopiado] = useState(false)
  const [cobrancaAtiva, setCobrancaAtiva] = useState<any>(null)

  const handleCopiarChave = () => {
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
      a_vencer: 'bg-amber-100 text-amber-800 border-amber-200',
      pago: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      atrasado: 'bg-red-100 text-red-800 border-red-200',
      cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
    }
    const labels: Record<string, string> = {
      a_vencer: 'Pendente', pago: 'Pago', atrasado: 'Em Atraso', cancelado: 'Cancelada',
    }

    return (
      <Badge variant="outline" className={`font-bold px-3 py-1 uppercase tracking-wider text-[10px] ${styles[displayStatus] || ''}`}>
        {labels[displayStatus] || displayStatus}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CreditCard className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-[#1E293B]">Selecione um aluno</h2>
      </div>
    )
  }

  // Filtrar apenas se é financeiramente responsável
  const vinculoFinanceiro = vinculos?.find(v => v.aluno_id === alunoSelecionado.id)?.is_financeiro
  
  if (!vinculoFinanceiro) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-16 text-center text-slate-500">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E293B]">Acesso Restrito</h3>
          <p className="mt-1">Você não possui perfil de responsabilidade financeira para este aluno.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">Financeiro</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {/* Card Informativo - Regras e Informações */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#134E4A] to-[#0F3937] text-white overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <FileText className="h-32 w-32 text-white" />
        </div>
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Informações Importantes sobre Pagamentos</CardTitle>
              <CardDescription className="text-white/70 text-xs">
                Conheça as regras e evite transtornos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="vencimento" className="border-white/20">
              <AccordionTrigger className="text-sm font-bold hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#14B8A6]" />
                  <span>Vencimento e Carência</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/80 leading-relaxed pt-2 pb-3">
                <p className="mb-2">
                  <strong className="text-white">📅 Dia de Vencimento:</strong> A mensalidade vence todo dia <strong>10</strong>. 
                  Caso caia em fim de semana ou feriado, transfira para o próximo dia útil.
                </p>
                <p>
                  <strong className="text-white">⏳ Período de Carência:</strong> Você tem <strong>5 dias de carência</strong> após o vencimento 
                  para realizar o pagamento sem bloqueio do acesso. Após esse período, o acesso ao portal pode ser restringido.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="multa" className="border-white/20">
              <AccordionTrigger className="text-sm font-bold hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-[#14B8A6]" />
                  <span>Multa e Juros por Atraso</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/80 leading-relaxed pt-2 pb-3">
                <p className="mb-2">
                  <strong className="text-white">💰 Multa Fixa:</strong> <strong>2%</strong> sobre o valor da mensalidade 
                  (conforme Código de Defesa do Consumidor).
                </p>
                <p className="mb-2">
                  <strong className="text-white">📈 Juros de Mora:</strong> <strong>1% ao mês</strong> de atraso (proporcional aos dias).
                </p>
                <p>
                  <strong className="text-white">⚠️ Importante:</strong> O cálculo é automático. Quanto mais dias de atraso, 
                  maior o valor final. Regularize o quanto antes para evitar acúmulo.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pagamento" className="border-white/20">
              <AccordionTrigger className="text-sm font-bold hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#14B8A6]" />
                  <span>Formas de Pagamento</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/80 leading-relaxed pt-2 pb-3">
                <ul className="space-y-2 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-[#14B8A6] font-bold">✓</span>
                    <span><strong>PIX:</strong> Aprovação imediata. Use a chave PIX ou QR Code da escola. <strong>Envie o comprovante</strong> para confirmação.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#14B8A6] font-bold">✓</span>
                    <span><strong>Dinheiro/Cartão:</strong> Pagamento presencial no caixa da escola (horário de funcionamento).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span><strong>Não aceitamos:</strong> Cheques ou transferências de terceiros (sempre identifique o responsável).</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="consequencias" className="border-white/20">
              <AccordionTrigger className="text-sm font-bold hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>Consequências do Atraso</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/80 leading-relaxed pt-2 pb-3">
                <p className="mb-2">
                  <strong className="text-amber-400">⚠️ Atenção:</strong> O não pagamento pode resultar em:
                </p>
                <ul className="space-y-1 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Bloqueio de acesso ao portal do aluno</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Impedimento de renovação de matrícula</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Inclusão em órgãos de proteção ao crédito (SPC/Serasa)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>Ação judicial para cobrança da dívida</span>
                  </li>
                </ul>
                <p className="mt-3 pt-3 border-t border-white/20 text-[11px] italic">
                  <strong className="text-[#14B8A6]">💡 Dica:</strong> Em caso de dificuldade financeira, procure a secretaria da escola 
                  para negociar antes do vencimento. Estamos aqui para ajudar!
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Lista de Cobranças */}
      {cobrancas && cobrancas.length > 0 ? (
        <div className="grid gap-4">
          {cobrancas.map((cobranca) => {
            const isAtrasado = cobranca.status === 'a_vencer' && new Date(cobranca.data_vencimento) < new Date(new Date().setHours(0,0,0,0))
            const isPendente = cobranca.status === 'a_vencer' || isAtrasado
            
            return (
              <Card key={cobranca.id} className={`border border-[#E2E8F0] shadow-sm overflow-hidden transition-all hover:shadow-md ${isAtrasado ? 'border-red-200' : ''}`}>
                <div className="p-6 sm:p-7 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      cobranca.status === 'pago' ? 'bg-[#CCFBF1]' : isAtrasado ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      {cobranca.status === 'pago' ? (
                        <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                      ) : (
                        <CreditCard className={`h-5 w-5 ${isAtrasado ? 'text-red-500' : 'text-amber-500'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1E293B] mb-1 leading-tight">{cobranca.descricao}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                        <span className="font-medium">
                          Vencimento: {format(new Date(cobranca.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-[#E2E8F0] sm:border-0">
                    <div className="flex items-center justify-between sm:justify-end w-full gap-4 mb-3">
                      <p className="text-2xl font-black text-[#1E293B]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobranca.valor)}
                      </p>
                      <div className="sm:hidden">{statusBadge(cobranca.status, cobranca.data_vencimento)}</div>
                    </div>
                    
                    <div className="flex items-center justify-end w-full gap-3">
                      <div className="hidden sm:block mr-2">{statusBadge(cobranca.status, cobranca.data_vencimento)}</div>
                      {isPendente && configPix?.pix_manual_ativo && (
                        <Button className="w-full sm:w-auto bg-[#14B8A6] hover:bg-[#134E4A] text-white font-bold shadow-md shadow-teal-100" onClick={() => setCobrancaAtiva(cobranca)}>
                          Pagar via PIX
                        </Button>
                      )}
                      {cobranca.status === 'pago' && cobranca.recibo_url && (
                        <Button variant="outline" className="w-full sm:w-auto border-[#CCFBF1] text-[#14B8A6] hover:bg-teal-50 font-semibold">
                          Recibo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-[#E2E8F0] border-dashed bg-slate-50/50">
          <CardContent className="py-20 text-center text-slate-500">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <CreditCard className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B]">Tudo em dia!</h3>
            <p className="mt-2 max-w-xs mx-auto text-sm">Não encontramos nenhuma cobrança pendente para este aluno.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal PIX */}
      <Dialog open={!!cobrancaAtiva} onOpenChange={(v) => !v && setCobrancaAtiva(null)}>
        <DialogContent className="sm:max-w-[425px] border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1E293B]">Pagamento via PIX</DialogTitle>
            <DialogDescription className="text-slate-500">
              Transfira o valor exato no PIX abaixo para a conta da Instituição.
            </DialogDescription>
          </DialogHeader>
          
          {configPix ? (
            <div className="space-y-6 pt-4">
              <div className="bg-[#CCFBF1]/50 border border-[#CCFBF1] rounded-2xl p-6 text-center shadow-inner">
                <p className="text-[11px] font-bold text-[#134E4A] uppercase tracking-[0.2em] mb-2 opacity-70">Valor Total</p>
                <p className="text-4xl font-black text-[#134E4A]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancaAtiva?.valor || 0)}
                </p>
              </div>

              {configPix.qr_code_url && (
                <div className="flex flex-col items-center justify-center p-6 bg-white border border-[#E2E8F0] rounded-3xl shadow-sm animate-in zoom-in-95 duration-500">
                  <p className="text-[10px] font-black text-[#14B8A6] uppercase tracking-[0.2em] mb-4">Escaneie para Pagar</p>
                  <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-teal-500/10 border border-slate-100">
                    <img 
                      src={configPix.qr_code_url} 
                      alt="QR Code PIX" 
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-semibold uppercase tracking-widest">QR Code da Escola</p>
                </div>
              )}

              <div className="space-y-5 px-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Favorecido (Escola)</label>
                  <p className="text-sm font-bold text-[#1E293B]">{configPix.favorecido || 'Inst. Ensino'}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chave PIX</label>
                  <div className="flex gap-2">
                    <Input readOnly value={configPix.chave_pix || ''} className="font-mono text-xs bg-slate-50 border-[#E2E8F0] h-11 focus-visible:ring-[#14B8A6]" />
                    <Button variant="secondary" onClick={handleCopiarChave} className="h-11 px-4 bg-slate-100 hover:bg-slate-200 text-[#1E293B] border border-[#E2E8F0] shadow-sm">
                      {copiado ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {configPix.instrucoes_extras && (
                   <div className="bg-amber-50 p-4 rounded-xl border border-amber-100/50">
                     <p className="text-xs text-amber-800 leading-relaxed font-medium"><span className="font-bold text-amber-900 block mb-1 uppercase text-[10px] tracking-wider">Instruções:</span>{configPix.instrucoes_extras}</p>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-red-500 font-medium">Configuração de PIX pendente pela instituição.</div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-800 font-bold" onClick={() => setCobrancaAtiva(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
