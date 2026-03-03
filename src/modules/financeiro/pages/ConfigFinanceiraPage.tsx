import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useConfigFinanceira, useUpsertConfigFinanceira } from '../hooks-avancado'
import { useTurmas } from '@/modules/turmas/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Settings, Save, QrCode, Upload, X, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

export function ConfigFinanceiraPage() {
  const { authUser } = useAuth()
  const { data: config, isLoading } = useConfigFinanceira()
  const upsert = useUpsertConfigFinanceira()
  const { data: turmas } = useTurmas()

  const [form, setForm] = useState({
    dia_vencimento_padrao: 10, dias_carencia: 5,
    multa_atraso_percentual: 2, multa_atraso_valor_fixo: 0,
    juros_mora_mensal: 1, desconto_irmaos: 0, desconto_pontualidade: 0,
    pix_habilitado: false, chave_pix: '', 
    nome_favorecido: '',
    instrucoes_responsavel: '',
    qr_code_auto: false,
    dinheiro_cartao_presencial: true,
    pix_qr_code_url: '',
    valores_mensalidade_turma: {} as Record<string, number>,
    id: undefined as string | undefined,
  })

  useEffect(() => {
    if (config) {
      setForm({
        dia_vencimento_padrao: config.dia_vencimento_padrao || 10,
        dias_carencia: config.dias_carencia || 5,
        multa_atraso_percentual: config.multa_atraso_percentual || 2,
        multa_atraso_valor_fixo: config.multa_atraso_valor_fixo || 0,
        juros_mora_mensal: config.juros_mora_mensal || 1,
        desconto_irmaos: config.desconto_irmaos || 0,
        desconto_pontualidade: config.desconto_pontualidade || 0,
        pix_habilitado: config.pix_habilitado || false,
        chave_pix: config.chave_pix || '',
        nome_favorecido: config.nome_favorecido || '',
        instrucoes_responsavel: config.instrucoes_responsavel || '',
        qr_code_auto: config.qr_code_auto || false,
        dinheiro_cartao_presencial: config.dinheiro_cartao_presencial ?? true,
        pix_qr_code_url: config.pix_qr_code_url || '',
        valores_mensalidade_turma: config.valores_mensalidade_turma || {},
        id: config.id,
      })
    }
  }, [config])

  const [confirmacaoPix, setConfirmacaoPix] = useState<{ show: boolean, destino: 'manual' | 'auto' }>({ show: false, destino: 'manual' })

  const handleToggleManual = (v: boolean) => {
    if (v && form.qr_code_auto) {
      setConfirmacaoPix({ show: true, destino: 'manual' })
    } else {
      setForm({ ...form, pix_habilitado: v })
    }
  }

  const handleToggleAuto = (v: boolean) => {
    if (v && form.pix_habilitado) {
      setConfirmacaoPix({ show: true, destino: 'auto' })
    } else {
      setForm({ ...form, qr_code_auto: v })
    }
  }

  const confirmarTroca = () => {
    if (confirmacaoPix.destino === 'manual') {
      setForm({ ...form, pix_habilitado: true, qr_code_auto: false })
    } else {
      setForm({ ...form, qr_code_auto: true, pix_habilitado: false })
    }
    setConfirmacaoPix({ ...confirmacaoPix, show: false })
  }

  const handleSave = async () => {
    if (!authUser) return
    try {
      await upsert.mutateAsync({ ...form, tenant_id: authUser.tenantId })
      toast.success('Configurações salvas!')
    } catch { toast.error('Erro ao salvar') }
  }

  const handleUploadQRCode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !authUser) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${authUser.tenantId}-qrcode-${Date.now()}.${fileExt}`
      const filePath = `qrcodes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath)

      setForm({ ...form, pix_qr_code_url: publicUrl })
      toast.success('QR Code enviado!')
    } catch (error) {
      toast.error('Erro ao enviar QR Code')
      console.error(error)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#14B8A6]" /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 animate-in fade-in duration-500">
      <div className="text-center py-4">
        <h1 className="text-3xl font-black tracking-tight text-[#1E293B]">Configurações Financeiras</h1>
        <p className="text-[#64748B] font-medium italic text-sm">Regras de recebimento, multas, juros e métodos de pagamento</p>
      </div>

      <Card className="border border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#134E4A]">
            <Settings className="h-4 w-4 text-[#14B8A6]" />
            Regras de Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-6 md:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dia Vencimento Padrão</Label>
              <div className="relative">
                <Input type="number" min="1" max="28" value={form.dia_vencimento_padrao} onChange={(e) => setForm({ ...form, dia_vencimento_padrao: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Dias de Carência</Label>
              <Input type="number" value={form.dias_carencia} onChange={(e) => setForm({ ...form, dias_carencia: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Multa Atraso (%)</Label>
              <Input type="number" step="0.01" value={form.multa_atraso_percentual} onChange={(e) => setForm({ ...form, multa_atraso_percentual: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Multa Fixa (R$)</Label>
              <Input type="number" step="0.01" value={form.multa_atraso_valor_fixo} onChange={(e) => setForm({ ...form, multa_atraso_valor_fixo: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Juros de Mora (%/mês)</Label>
              <Input type="number" step="0.01" value={form.juros_mora_mensal} onChange={(e) => setForm({ ...form, juros_mora_mensal: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Desconto Irmãos (%)</Label>
              <Input type="number" step="0.01" value={form.desconto_irmaos} onChange={(e) => setForm({ ...form, desconto_irmaos: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Desc. Pontualidade (%)</Label>
              <Input type="number" step="0.01" value={form.desconto_pontualidade} onChange={(e) => setForm({ ...form, desconto_pontualidade: +e.target.value })} className="h-11 bg-slate-50/50 focus:bg-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#134E4A]">Métodos de Recebimento</CardTitle>
          <CardDescription className="text-[10px] font-bold text-slate-400">Ative e configure as formas de pagamento disponíveis para os pais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6 md:p-8">
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-5 bg-slate-50/30 hover:bg-white transition-colors">
            <div>
              <Label className="font-bold text-[#1E293B]">PIX Manual</Label>
              <p className="text-[11px] text-[#64748B] font-medium">Exibir chave e imagem de QR Code fixa para conferência manual</p>
            </div>
            <Switch 
              checked={form.pix_habilitado} 
              onCheckedChange={handleToggleManual}
              className="data-[state=checked]:bg-[#14B8A6]"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-teal-100 p-5 bg-teal-50/20 hover:bg-white transition-colors group">
            <div>
              <Label className="font-bold text-[#134E4A] flex items-center gap-2">
                PIX Automático
                <Badge className="bg-[#14B8A6] border-0 text-[9px] h-4">Sugerido</Badge>
              </Label>
              <p className="text-[11px] text-[#14B8A6] font-bold italic">Integração avançada: Gera QR Codes dinâmicos vinculados à cobrança</p>
            </div>
            <Switch 
              checked={form.qr_code_auto} 
              onCheckedChange={handleToggleAuto}
              className="data-[state=checked]:bg-[#134E4A]"
            />
          </div>

          {(form.pix_habilitado || form.qr_code_auto) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-200 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input
                  value={form.chave_pix}
                  onChange={(e) => setForm({ ...form, chave_pix: e.target.value })}
                  placeholder="CPF, e-mail ou chave aleatória"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Favorecido</Label>
                <Input
                  value={form.nome_favorecido || ''}
                  onChange={(e) => setForm({ ...form, nome_favorecido: e.target.value })}
                  placeholder="Nome da escola ou dono da conta"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Instruções para o Responsável</Label>
                <Input
                  value={form.instrucoes_responsavel || ''}
                  onChange={(e) => setForm({ ...form, instrucoes_responsavel: e.target.value })}
                  placeholder="Ex: enviar comprovante para o whatsapp (85) 9 xxxx-xxxx"
                />
              </div>

              {form.pix_habilitado && (
                <div className="md:col-span-2 space-y-2 pt-2 border-t border-dashed mt-2 border-zinc-200">
                  <Label className="flex items-center gap-2 text-zinc-900 font-semibold">
                    <QrCode className="h-4 w-4" />
                    Upload da Imagem (QR Code Manual)
                  </Label>
                  <div className="flex items-start gap-4">
                    {form.pix_qr_code_url ? (
                      <div className="relative group">
                        <img src={form.pix_qr_code_url} alt="QR Code" className="h-24 w-24 object-contain border-2 border-indigo-200 rounded-lg bg-white p-2" />
                        <button onClick={() => setForm({...form, pix_qr_code_url: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" type="button"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" className="h-9 border-dashed" onClick={() => document.getElementById('qrcode-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Imagem do QR
                      </Button>
                    )}
                    <Input id="qrcode-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadQRCode} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div><Label className="font-bold">Dinheiro / Cartão Presencial</Label><p className="text-xs text-muted-foreground">Pagamento no caixa da escola</p></div>
            <Switch checked={form.dinheiro_cartao_presencial} onCheckedChange={(v) => setForm({ ...form, dinheiro_cartao_presencial: v })} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm">Mensalidades por Turma</CardTitle>
            <CardDescription>Defina o valor padrão da mensalidade para cada turma. Este valor será sugerido automaticamente ao criar novas cobranças no financeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
               {turmas?.map(turma => (
                 <div key={turma.id} className="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-zinc-50 transition-colors">
                   <Label className="text-xs truncate font-medium text-zinc-700">{turma.nome}</Label>
                   <div className="relative">
                     <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                     <Input 
                       type="number" 
                       className="w-28 h-8 pl-7 text-right text-xs"
                       placeholder="0,00"
                       value={form.valores_mensalidade_turma[turma.id] || ''} 
                       onChange={(e) => setForm({ 
                         ...form, 
                         valores_mensalidade_turma: { ...form.valores_mensalidade_turma, [turma.id]: +e.target.value } 
                       })} 
                     />
                   </div>
                 </div>
               ))}
               {(!turmas || turmas.length === 0) && (
                 <p className="text-xs text-muted-foreground italic py-4">Nenhuma turma cadastrada para configurar.</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending} className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-md min-w-[200px]">
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salvar Configurações
        </Button>
      </div>

      <Dialog open={confirmacaoPix.show} onOpenChange={(v) => !v && setConfirmacaoPix({...confirmacaoPix, show: false})}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Troca de PIX
            </DialogTitle>
            <DialogDescription className="py-2 text-zinc-600">
              O PIX <strong>{confirmacaoPix.destino === 'manual' ? 'Automático' : 'Manual'}</strong> já está ativo. 
              Deseja mesmo ativar o <strong>{confirmacaoPix.destino === 'manual' ? 'Manual' : 'Automático'}</strong>? 
              Se fizer isso, o outro método será desativado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmacaoPix({...confirmacaoPix, show: false})}>Cancelar</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={confirmarTroca}>Sim, Alternar Método</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
