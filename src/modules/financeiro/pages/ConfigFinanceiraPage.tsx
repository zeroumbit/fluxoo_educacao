import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useConfigFinanceira, useUpsertConfigFinanceira } from '../hooks-avancado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, Settings, Save } from 'lucide-react'

export function ConfigFinanceiraPage() {
  const { authUser } = useAuth()
  const { data: config, isLoading } = useConfigFinanceira()
  const upsert = useUpsertConfigFinanceira()

  const [form, setForm] = useState({
    dia_vencimento_padrao: 10, dias_carencia: 5,
    multa_atraso_percentual: 2, multa_atraso_valor_fixo: 0,
    juros_mora_mensal: 1, desconto_irmaos: 0, desconto_pontualidade: 0,
    pix_habilitado: false, chave_pix: '', qr_code_auto: false,
    dinheiro_cartao_presencial: true,
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
        qr_code_auto: config.qr_code_auto || false,
        dinheiro_cartao_presencial: config.dinheiro_cartao_presencial ?? true,
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Configurações Financeiras</h1><p className="text-muted-foreground">Defina regras de vencimento, multas, juros e descontos</p></div>

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
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div className="space-y-2"><Label>Chave PIX</Label><Input value={form.chave_pix} onChange={(e) => setForm({ ...form, chave_pix: e.target.value })} placeholder="CPF, e-mail ou chave aleatória" /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={form.qr_code_auto} onCheckedChange={(v) => setForm({ ...form, qr_code_auto: v })} /><Label>QR Code Automático</Label></div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div><Label className="font-bold">Dinheiro / Cartão Presencial</Label><p className="text-xs text-muted-foreground">Pagamento no caixa da escola</p></div>
            <Switch checked={form.dinheiro_cartao_presencial} onCheckedChange={(v) => setForm({ ...form, dinheiro_cartao_presencial: v })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending} className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-md">
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
