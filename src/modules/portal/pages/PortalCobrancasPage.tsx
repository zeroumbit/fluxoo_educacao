import { useState } from 'react'
import { useCobrancasAluno, useConfigPix } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Loader2, CreditCard, Copy, CheckCircle2, AlertCircle, Info, Calendar, Percent, DollarSign, BookOpen } from 'lucide-react'
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
      a_vencer: 'bg-amber-50 text-amber-700 border-amber-200',
      pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      atrasado: 'bg-red-50 text-red-700 border-red-200',
      cancelado: 'bg-slate-50 text-slate-500 border-slate-200',
    }
    const labels: Record<string, string> = {
      a_vencer: 'Pendente', pago: 'Pago', atrasado: 'Em Atraso', cancelado: 'Cancelada',
    }

    return (
      <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 text-xs ${styles[displayStatus] || ''}`}>
        {labels[displayStatus] || displayStatus}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CreditCard className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Selecione um aluno</h2>
      </div>
    )
  }

  const vinculoFinanceiro = vinculos?.find(v => v.aluno_id === alunoSelecionado.id)?.is_financeiro

  if (!vinculoFinanceiro) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-16 text-center text-slate-500">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Acesso Restrito</h3>
          <p className="mt-1 text-sm">Você não possui perfil de responsabilidade financeira para este aluno.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Financeiro</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {/* Layout em Grid: Cobranças (esquerda) + Info (direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Cobranças - 2 colunas */}
        <div className="lg:col-span-2 space-y-4">
          {cobrancas && cobrancas.length > 0 ? (
            <div className="space-y-3">
              {cobrancas.map((cobranca) => {
                const isAtrasado = cobranca.status === 'a_vencer' && new Date(cobranca.data_vencimento) < new Date(new Date().setHours(0,0,0,0))
                const isPendente = cobranca.status === 'a_vencer' || isAtrasado

                return (
                  <Card key={cobranca.id} className={`border shadow-sm overflow-hidden transition-all hover:shadow-md ${isAtrasado ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'}`}>
                    <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          cobranca.status === 'pago' ? 'bg-emerald-100' : isAtrasado ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                          {cobranca.status === 'pago' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <CreditCard className={`h-5 w-5 ${isAtrasado ? 'text-red-600' : 'text-amber-600'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-800 mb-1">{cobranca.descricao}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Vencimento: {format(new Date(cobranca.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end w-full sm:w-auto gap-2">
                        <p className="text-xl font-bold text-slate-800">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobranca.valor)}
                        </p>
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="hidden sm:block">{statusBadge(cobranca.status, cobranca.data_vencimento)}</div>
                          {isPendente && configPix?.pix_manual_ativo && (
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-medium" onClick={() => setCobrancaAtiva(cobranca)}>
                              Pagar via PIX
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
            <Card className="border border-dashed border-slate-300 bg-slate-50">
              <CardContent className="py-16 text-center text-slate-500">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Tudo em dia!</h3>
                <p className="mt-1 text-sm">Nenhuma cobrança pendente para este aluno.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Card Informativo - 1 coluna (lateral direita) */}
        <div className="lg:col-span-1">
          <Card className="border border-slate-200 shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-800">Informações de Pagamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="vencimento" className="border-b border-slate-100">
                  <AccordionTrigger className="text-xs font-semibold text-slate-700 hover:no-underline py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      <span>Vencimento</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-600 leading-relaxed px-4 pb-3">
                    <p className="mb-2">
                      <strong className="text-slate-800">Dia 10:</strong> Vencimento da mensalidade. Se cair em fim de semana ou feriado, transfira para o próximo dia útil.
                    </p>
                    <p>
                      <strong className="text-slate-800">5 dias de carência:</strong> Período extra para pagamento sem bloqueio do acesso.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="multa" className="border-b border-slate-100">
                  <AccordionTrigger className="text-xs font-semibold text-slate-700 hover:no-underline py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Percent className="h-3.5 w-3.5 text-teal-600" />
                      <span>Multa e Juros</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-600 leading-relaxed px-4 pb-3">
                    <p className="mb-2">
                      <strong className="text-slate-800">Multa:</strong> 2% sobre o valor (CDC).
                    </p>
                    <p>
                      <strong className="text-slate-800">Juros:</strong> 1% ao mês de atraso.
                    </p>
                    <p className="mt-2 text-slate-500 italic">Cálculo automático: quanto mais dias, maior o valor.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pagamento" className="border-b border-slate-100">
                  <AccordionTrigger className="text-xs font-semibold text-slate-700 hover:no-underline py-3 px-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                      <span>Pagamento</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-600 leading-relaxed px-4 pb-3">
                    <ul className="space-y-1.5 list-none pl-0">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span><strong>PIX:</strong> Imediato. Envie o comprovante.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span><strong>Presencial:</strong> Dinheiro ou cartão no caixa.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <span><strong>Não:</strong> Cheques ou terceiros.</span>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="atraso">
                  <AccordionTrigger className="text-xs font-semibold text-slate-700 hover:no-underline py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span>Atraso</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-600 leading-relaxed px-4 pb-3">
                    <p className="mb-2">
                      <strong className="text-amber-600">Consequências:</strong>
                    </p>
                    <ul className="space-y-1 list-none pl-0 text-slate-500">
                      <li>• Bloqueio do portal</li>
                      <li>• Impedimento de renovação</li>
                      <li>• SPC/Serasa</li>
                      <li>• Ação judicial</li>
                    </ul>
                    <Separator className="my-2 bg-slate-200" />
                    <p className="text-teal-700 italic text-[11px]">
                      <strong>Dica:</strong> Em caso de dificuldade, procure a secretaria antes do vencimento.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal PIX */}
      <Dialog open={!!cobrancaAtiva} onOpenChange={(v) => !v && setCobrancaAtiva(null)}>
        <DialogContent className="sm:max-w-[425px] border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Pagamento via PIX</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Transfira o valor exato para a conta da Instituição.
            </DialogDescription>
          </DialogHeader>

          {configPix ? (
            <div className="space-y-5 pt-2">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 text-center">
                <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-1">Valor Total</p>
                <p className="text-3xl font-black text-teal-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancaAtiva?.valor || 0)}
                </p>
              </div>

              {configPix.qr_code_url && (
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl">
                  <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-3">Escaneie para Pagar</p>
                  <div className="p-2 bg-white rounded-lg shadow-lg border border-slate-100">
                    <img src={configPix.qr_code_url} alt="QR Code PIX" className="w-40 h-40 object-contain" />
                  </div>
                </div>
              )}

              <div className="space-y-3 px-1">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Favorecido</label>
                  <p className="text-sm font-semibold text-slate-800">{configPix.favorecido || 'Instituição de Ensino'}</p>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Chave PIX</label>
                  <div className="flex gap-2">
                    <Input readOnly value={configPix.chave_pix || ''} className="font-mono text-xs bg-slate-50 h-9" />
                    <Button variant="outline" size="sm" onClick={handleCopiarChave} className="h-9 px-3">
                      {copiado ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {configPix.instrucoes_extras && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <p className="text-xs text-amber-800">
                      <span className="font-bold text-amber-900 block mb-0.5 uppercase text-[9px]">Instruções:</span>
                      {configPix.instrucoes_extras}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-500 text-sm font-medium">Configuração de PIX pendente pela instituição.</div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700 font-medium" onClick={() => setCobrancaAtiva(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
