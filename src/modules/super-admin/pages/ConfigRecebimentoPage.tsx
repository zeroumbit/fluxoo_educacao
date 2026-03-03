import { useState, useEffect } from 'react'
import { useConfiguracaoRecebimento, useUpdateConfiguracaoRecebimento } from '../hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { QrCode, Save, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export function ConfigRecebimentoPage() {
  const { data: config, isLoading } = useConfiguracaoRecebimento()
  const updateConfig = useUpdateConfiguracaoRecebimento()

  const [form, setForm] = useState({
    id: '',
    pix_manual_ativo: false,
    tipo_chave_pix: '',
    chave_pix: '',
    favorecido: '',
    instrucoes_extras: '',
  })

  useEffect(() => {
    if (config) {
      setForm({
        id: config.id || '',
        pix_manual_ativo: config.pix_manual_ativo || false,
        tipo_chave_pix: config.tipo_chave_pix || '',
        chave_pix: config.chave_pix || '',
        favorecido: config.favorecido || '',
        instrucoes_extras: config.instrucoes_extras || '',
      })
    }
  }, [config])

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(form)
      toast.success('Configuração de recebimento salva!')
    } catch {
      toast.error('Erro ao salvar configuração.')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Configuração de Recebimento</h1>
        <p className="text-muted-foreground mt-1">Configure os dados de PIX Manual para recebimentos offline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-emerald-600" />
                    PIX Manual
                  </CardTitle>
                  <CardDescription>Quando ativo, os novos cadastros poderão pagar via PIX com envio de comprovante.</CardDescription>
                </div>
                <Switch
                  checked={form.pix_manual_ativo}
                  onCheckedChange={(val) => setForm(f => ({ ...f, pix_manual_ativo: val }))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo da Chave</Label>
                  <Select value={form.tipo_chave_pix} onValueChange={val => setForm(f => ({ ...f, tipo_chave_pix: val }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chave PIX</Label>
                  <Input
                    placeholder="Digite a chave PIX..."
                    value={form.chave_pix}
                    onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Favorecido</Label>
                <Input
                  placeholder="Nome que aparecerá na transferência"
                  value={form.favorecido}
                  onChange={e => setForm(f => ({ ...f, favorecido: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instruções para o Gestor</Label>
                <Textarea
                  placeholder="Ex: Após realizar o PIX, envie o comprovante pelo formulário abaixo. A ativação ocorrerá em até 24h."
                  value={form.instrucoes_extras}
                  onChange={e => setForm(f => ({ ...f, instrucoes_extras: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={updateConfig.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 shadow-lg shadow-indigo-200"
              >
                {updateConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card className="border-0 shadow-xl bg-gradient-to-b from-emerald-50 to-white sticky top-8">
            <CardHeader>
              <CardTitle className="text-sm">Pré-visualização no Checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.pix_manual_ativo ? (
                <>
                  <div className="p-4 rounded-xl bg-white border border-emerald-100 space-y-2">
                    <p className="text-xs font-bold text-emerald-700 uppercase">Dados do PIX</p>
                    <p className="text-sm"><span className="text-muted-foreground">Tipo:</span> <strong>{form.tipo_chave_pix || '—'}</strong></p>
                    <p className="text-sm"><span className="text-muted-foreground">Chave:</span> <strong>{form.chave_pix || '—'}</strong></p>
                    <p className="text-sm"><span className="text-muted-foreground">Favorecido:</span> <strong>{form.favorecido || '—'}</strong></p>
                  </div>
                  {form.instrucoes_extras && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-[10px] text-amber-800 leading-relaxed">{form.instrucoes_extras}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                  <ShieldCheck className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">PIX Manual desativado</p>
                  <p className="text-xs mt-1">Ative para exibir no checkout.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
