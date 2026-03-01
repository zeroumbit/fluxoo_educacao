import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useConfigFinanceira, useUpsertConfigFinanceira } from '../hooks-avancado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, Settings, Save, QrCode, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ConfigFinanceiraPage() {
  const { authUser } = useAuth()
  const { data: config, isLoading } = useConfigFinanceira()
  const upsert = useUpsertConfigFinanceira()

  const [form, setForm] = useState({
    dia_vencimento_padrao: 10, dias_carencia: 5,
    multa_atraso_percentual: 2, multa_atraso_valor_fixo: 0,
    juros_mora_mensal: 1, desconto_irmaos: 0, desconto_pontualidade: 0,
    pix_habilitado: false, chave_pix: '', 
    nome_favorecido: '', instrucoes_responsavel: '',
    qr_code_auto: false,
    dinheiro_cartao_presencial: true,
    pix_qr_code_url: '',
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
      })
    }
  }, [config])

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

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Configurações Financeiras</h1>
        <p className="text-muted-foreground">Defina regras de vencimento, multas, juros e descontos</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-indigo-600" />Regras de Cobrança</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Dia Vencimento Padrão</Label><Input type="number" min="1" max="28" value={form.dia_vencimento_padrao} onChange={(e) => setForm({ ...form, dia_vencimento_padrao: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Dias de Carência</Label><Input type="number" value={form.dias_carencia} onChange={(e) => setForm({ ...form, dias_carencia: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Multa por Atraso (%)</Label><Input type="number" step="0.01" value={form.multa_atraso_percentual} onChange={(e) => setForm({ ...form, multa_atraso_percentual: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Multa Atraso (R$ fixo)</Label><Input type="number" step="0.01" value={form.multa_atraso_valor_fixo} onChange={(e) => setForm({ ...form, multa_atraso_valor_fixo: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Juros de Mora (%/mês)</Label><Input type="number" step="0.01" value={form.juros_mora_mensal} onChange={(e) => setForm({ ...form, juros_mora_mensal: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Desconto Irmãos (%)</Label><Input type="number" step="0.01" value={form.desconto_irmaos} onChange={(e) => setForm({ ...form, desconto_irmaos: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Desconto Pontualidade (%)</Label><Input type="number" step="0.01" value={form.desconto_pontualidade} onChange={(e) => setForm({ ...form, desconto_pontualidade: +e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Formas de Pagamento</CardTitle><CardDescription>Configure os métodos aceitos pela escola</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div><Label className="font-bold">PIX</Label><p className="text-xs text-muted-foreground">Receba via PIX com chave cadastrada</p></div>
            <Switch checked={form.pix_habilitado} onCheckedChange={(v) => setForm({ ...form, pix_habilitado: v })} />
          </div>
          {form.pix_habilitado && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 animate-in slide-in-from-top-2 duration-300">
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
              {/* Imagem do QR Code - SEMPRE VISÍVEL */}
              <div className="md:col-span-2 space-y-2 pt-2">
                <Label className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Imagem do QR Code PIX
                </Label>
                <div className="flex items-start gap-4">
                  {form.pix_qr_code_url ? (
                    <div className="relative group">
                      <img
                        src={form.pix_qr_code_url}
                        alt="QR Code"
                        className="h-32 w-32 object-contain border-2 border-indigo-200 rounded-lg bg-white p-2 shadow-sm"
                      />
                      <button
                        onClick={() => setForm({...form, pix_qr_code_url: ''})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 border-dashed border-indigo-300"
                        onClick={() => document.getElementById('qrcode-upload')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload QR Code
                      </Button>
                      <Input
                        id="qrcode-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadQRCode}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground leading-tight max-w-[250px] pt-1">
                    Imagem do QR Code da chave PIX para facilitar o pagamento pelos responsáveis.
                  </p>
                </div>
              </div>

              {/* Separador */}
              <div className="md:col-span-2">
                <div className="border-t border-gray-200 my-4" />
              </div>

              {/* PIX Automático - OPÇÃO SEPARADA */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <Switch
                    checked={form.qr_code_auto}
                    onCheckedChange={(v) => setForm({ ...form, qr_code_auto: v })}
                  />
                  <div>
                    <Label className="font-semibold text-indigo-900">QR Code Automático</Label>
                    <p className="text-xs text-muted-foreground">
                      Gerar QR Code automaticamente a partir da chave PIX cadastrada
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div><Label className="font-bold">Dinheiro / Cartão Presencial</Label><p className="text-xs text-muted-foreground">Pagamento no caixa da escola</p></div>
            <Switch checked={form.dinheiro_cartao_presencial} onCheckedChange={(v) => setForm({ ...form, dinheiro_cartao_presencial: v })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending} className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-md min-w-[200px]">
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
