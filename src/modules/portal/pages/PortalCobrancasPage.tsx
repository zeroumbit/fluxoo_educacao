import { useState } from 'react'
import { useCobrancasAluno, useConfigPix } from '../hooks'
import { usePortalContext } from '../context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, CreditCard, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
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
      cancelado: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    }
    const labels: Record<string, string> = {
      a_vencer: 'Pendente', pago: 'Pago', atrasado: 'Em Atraso', cancelado: 'Cancelada',
    }

    return (
      <Badge variant="outline" className={`font-bold px-3 py-1 uppercase tracking-wider text-xs ${styles[displayStatus] || ''}`}>
        {labels[displayStatus] || displayStatus}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!alunoSelecionado) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CreditCard className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Selecione um aluno</h2>
      </div>
    )
  }

  // Filtrar apenas se é financeiramente responsável
  const vinculoFinanceiro = vinculos?.find(v => v.aluno_id === alunoSelecionado.id)?.is_financeiro
  
  if (!vinculoFinanceiro) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-16 text-center text-muted-foreground">
          <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">Acesso Restrito</h3>
          <p className="mt-1">Você não possui perfil de responsabilidade financeira para este aluno.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Financeiro</h2>
      </div>

      {isMultiAluno && <SeletorAluno />}

      {cobrancas && cobrancas.length > 0 ? (
        <div className="grid gap-4">
          {cobrancas.map((cobranca) => {
            const isAtrasado = cobranca.status === 'a_vencer' && new Date(cobranca.data_vencimento) < new Date(new Date().setHours(0,0,0,0))
            const isPendente = cobranca.status === 'a_vencer' || isAtrasado
            
            return (
              <Card key={cobranca.id} className={`border-0 shadow-md overflow-hidden transition-all ${isAtrasado ? 'ring-2 ring-red-500/50' : ''}`}>
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                      cobranca.status === 'pago' ? 'bg-emerald-100' : isAtrasado ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      {cobranca.status === 'pago' ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <CreditCard className={`h-6 w-6 ${isAtrasado ? 'text-red-600' : 'text-amber-600'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-1 leading-tight">{cobranca.descricao}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium bg-zinc-100 px-2 py-0.5 rounded-md">
                          Vencimento: {format(new Date(cobranca.data_vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0">
                    <div className="flex items-center justify-between sm:justify-end w-full gap-4 mb-3">
                      <p className="text-2xl font-black text-zinc-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobranca.valor)}
                      </p>
                      <div className="sm:hidden">{statusBadge(cobranca.status, cobranca.data_vencimento)}</div>
                    </div>
                    
                    <div className="flex items-center justify-end w-full gap-3">
                      <div className="hidden sm:block mr-2">{statusBadge(cobranca.status, cobranca.data_vencimento)}</div>
                      {isPendente && configPix?.pix_manual_ativo && (
                        <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" onClick={() => setCobrancaAtiva(cobranca)}>
                          Pagar via PIX
                        </Button>
                      )}
                      {cobranca.status === 'pago' && cobranca.recibo_url && (
                        <Button variant="outline" className="w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50">
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
        <Card className="border-0 shadow-md border-dashed border-zinc-200">
          <CardContent className="py-16 text-center text-muted-foreground">
            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">Tudo em dia!</h3>
            <p className="mt-1">Não encontramos nenhuma cobrança pendente para este aluno.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal PIX */}
      <Dialog open={!!cobrancaAtiva} onOpenChange={(v) => !v && setCobrancaAtiva(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pagamento Antecipado via PIX</DialogTitle>
            <DialogDescription>
              Transfira o valor exato no PIX abaixo para a conta da Instituição de Ensino.
            </DialogDescription>
          </DialogHeader>
          
          {configPix ? (
            <div className="space-y-6 pt-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
                <p className="text-sm font-medium text-indigo-900 uppercase tracking-wider mb-2">Valor Total</p>
                <p className="text-4xl font-black text-indigo-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancaAtiva?.valor || 0)}
                </p>
              </div>

              {configPix.qr_code_url && (
                <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-indigo-100 rounded-3xl animate-in zoom-in-95 duration-500">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Escaneie para Pagar</p>
                  <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-zinc-100">
                    <img 
                      src={configPix.qr_code_url} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 mt-3 font-medium">QR Code Estático da Instituição</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Favorecido (Escola)</label>
                  <p className="text-sm font-medium text-zinc-900">{configPix.favorecido || 'Inst. Ensino'}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Chave PIX</label>
                  <div className="flex gap-2">
                    <Input readOnly value={configPix.chave_pix || ''} className="font-mono text-sm bg-zinc-50 border-zinc-200 h-10" />
                    <Button variant="secondary" onClick={handleCopiarChave} className="h-10 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 shadow-sm">
                      {copiado ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {configPix.instrucoes_extras && (
                   <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                     <p className="text-xs text-amber-800 leading-relaxed"><span className="font-bold block mb-1">Atenção:</span>{configPix.instrucoes_extras}</p>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-red-600">Configuração de PIX não encontrada pela instituição.</div>
          )}

          <DialogFooter className="mt-6 sm:justify-center">
            <Button variant="outline" className="w-full sm:w-auto border-zinc-200" onClick={() => setCobrancaAtiva(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
