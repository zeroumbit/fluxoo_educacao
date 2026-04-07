import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  useGatewaysDisponiveis,
  useGatewayTenantConfig,
  useSalvarGatewayTenantConfig,
  useDesativarGatewayTenant
} from '@/modules/financeiro/hooks-avancado'
import {
  Loader2, Key, CheckCircle2, AlertTriangle, Info, ExternalLink,
  ShieldCheck, Settings2, Trash2, Signal, SignalZero
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * GatewayTenantConfigPage - Configuração de Gateways da Escola
 *
 * REGRA: Apenas 1 gateway pode ficar ativo por vez.
 * Ao ativar um gateway, os outros são desativados automaticamente.
 */
export function GatewayTenantConfigPage() {
  const { data: gateways, isLoading: loadingGateways, refetch } = useGatewaysDisponiveis()
  const salvarConfig = useSalvarGatewayTenantConfig()
  const desativarGateway = useDesativarGatewayTenant()
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({})
  const [modoTeste, setModoTeste] = useState(false)
  const [ativo, setAtivo] = useState(false)

  // Gateway atualmente ativo pela escola
  const gatewayAtivo = gateways?.find((g: any) => g.tenant_ativo)

  // Buscar config existente quando expandir
  const { data: existingConfig, isLoading: loadingConfig, refetch: refetchConfig } = useGatewayTenantConfig(
    expandedGateway || ''
  )

  // Quando expandir, carregar dados existentes
  useEffect(() => {
    if (expandedGateway) {
      refetchConfig()
    }
  }, [expandedGateway])

  useEffect(() => {
    if (existingConfig) {
      setAtivo(existingConfig.ativo || false)
      setModoTeste(existingConfig.modo_teste || false)
      const vals: Record<string, string | boolean> = {}
      if (existingConfig.configuracao) {
        Object.entries(existingConfig.configuracao as Record<string, unknown>).forEach(([key, value]) => {
          vals[key] = typeof value === 'boolean' ? value : String(value || '')
        })
      }
      setFormValues(vals)
    } else {
      setFormValues({})
      setAtivo(false)
      setModoTeste(false)
    }
  }, [existingConfig])

  const handleExpand = (gateway: string) => {
    if (expandedGateway === gateway) {
      setExpandedGateway(null)
      setFormValues({})
      setAtivo(false)
      setModoTeste(false)
      return
    }
    setExpandedGateway(gateway)
  }

  const handleSave = async (gateway: string) => {
    // Validar campos obrigatórios
    const gatewayDef = gateways?.find((g: any) => g.gateway === gateway)
    if (gatewayDef?.campos_config) {
      for (const campo of gatewayDef.campos_config) {
        if (campo.required && !formValues[campo.key]) {
          toast.error(`Campo obrigatório: ${campo.label}`)
          return
        }
      }
    }

    // Confirmar se vai substituir gateway ativo
    if (ativo && gatewayAtivo && gatewayAtivo.gateway !== gateway) {
      const confirmed = window.confirm(
        `⚠️ Atenção: Ao ativar "${getGatewayNome(gateway)}", o gateway "${getGatewayNome(gatewayAtivo.gateway)}" será desativado automaticamente.\n\n` +
        `Apenas 1 gateway pode ficar ativo por vez.\n\n` +
        `Deseja continuar?`
      )
      if (!confirmed) return
    }

    try {
      await salvarConfig.mutateAsync({
        gateway,
        configuracao: formValues,
        ativo,
        modoTeste
      })
      await refetch()
      toast.success('Configuração salva com sucesso!', {
        description: ativo
          ? `${getGatewayNome(gateway)} ativado. Outros gateways foram desativados.`
          : `Configuração salva. Gateway desativado.`
      })
    } catch (err: any) {
      toast.error('Erro ao salvar:', { description: err.message })
    }
  }

  const handleDesativar = async (gateway: string) => {
    try {
      await desativarGateway.mutateAsync(gateway)
      await refetch()
      toast.success('Gateway desativado.')
      setExpandedGateway(null)
    } catch (err: any) {
      toast.error('Erro ao desativar:', { description: err.message })
    }
  }

  const renderFormField = (gateway: string, campo: any) => {
    const value = formValues[campo.key] ?? (campo.default ?? '')

    if (campo.type === 'boolean') {
      return (
        <div key={campo.key} className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm font-medium">
              {campo.label}
              {campo.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {campo.help && <p className="text-xs text-muted-foreground mt-0.5">{campo.help}</p>}
          </div>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => setFormValues(prev => ({ ...prev, [campo.key]: checked }))}
          />
        </div>
      )
    }

    if (campo.type === 'textarea') {
      return (
        <div key={campo.key} className="space-y-1.5">
          <Label className="text-sm font-medium">
            {campo.label}
            {campo.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {campo.help && <p className="text-xs text-muted-foreground">{campo.help}</p>}
          <textarea
            value={String(value)}
            placeholder="Cole aqui o conteúdo..."
            onChange={(e) => setFormValues(prev => ({ ...prev, [campo.key]: e.target.value }))}
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none"
          />
        </div>
      )
    }

    return (
      <div key={campo.key} className="space-y-1.5">
        <Label className="text-sm font-medium">
          {campo.label}
          {campo.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {campo.help && <p className="text-xs text-muted-foreground">{campo.help}</p>}
        <Input
          type={campo.type === 'password' ? 'password' : 'text'}
          value={String(value)}
          placeholder={campo.type === 'password' ? '••••••••' : '...'}
          onChange={(e) => setFormValues(prev => ({ ...prev, [campo.key]: e.target.value }))}
          className="font-mono text-sm"
        />
      </div>
    )
  }

  const getGatewayNome = (gateway: string) => {
    const map: Record<string, string> = {
      asaas: 'Asaas',
      mercado_pago: 'Mercado Pago',
      abacate_pay: 'Abacate Pay',
      efi: 'EFI (EfiPay)',
      pagseguro: 'PagSeguro'
    }
    return map[gateway] || gateway
  }

  const getGatewayIcon = (gateway: string) => {
    const map: Record<string, string> = {
      asaas: '🟢',
      mercado_pago: '🟡',
      abacate_pay: '🥑',
      efi: '🔵',
      pagseguro: '🟣'
    }
    return map[gateway] || '🔵'
  }

  if (loadingGateways) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!gateways || gateways.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gateway de Pagamento</h1>
          <p className="text-muted-foreground mt-1">Recebimento automático de mensalidades</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhum gateway disponível</AlertTitle>
          <AlertDescription>
            O Super Admin ainda não ativou nenhum gateway de pagamento.
            Entre em contato para solicitar a ativação (Asaas, Mercado Pago, Abacate Pay, etc).
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gateway de Pagamento</h1>
        <p className="text-muted-foreground mt-1">
          Configure seu gateway para receber pagamentos automaticamente via PIX, Boleto ou Cartão.
        </p>
      </div>

      {/* Regra: 1 gateway ativo */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Signal className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">Apenas 1 gateway ativo por vez</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          {gatewayAtivo ? (
            <>
              Gateway ativo: <strong>{getGatewayNome(gatewayAtivo.gateway)}</strong>
              {gatewayAtivo.modo_teste && ' (Modo Teste)'}.
              Ao ativar outro, este será desativado automaticamente.
            </>
          ) : (
            'Selecione e configure um gateway abaixo para começar a receber pagamentos.'
          )}
        </AlertDescription>
      </Alert>

      {/* Gateway ativo destaque */}
      {gatewayAtivo && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-2 pt-[30px]">
            <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4" />
              Gateway Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getGatewayIcon(gatewayAtivo.gateway)}</span>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {getGatewayNome(gatewayAtivo.gateway)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {gatewayAtivo.modo_teste ? '🧪 Modo Sandbox (Teste)' : '✅ Produção'}
                  {gatewayAtivo.tenant_updated_at && ` · Atualizado em ${new Date(gatewayAtivo.tenant_updated_at).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <Signal className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Gateways */}
      <div className="grid gap-4">
        {gateways.map((gw: any) => {
          const isExpanded = expandedGateway === gw.gateway
          const isConfigured = gw.tenant_configurado
          const isAtivo = gw.tenant_ativo

          return (
            <Card key={gw.gateway} className={`${isExpanded ? 'ring-2 ring-blue-500' : ''} ${isAtivo ? 'border-green-300 dark:border-green-700' : ''}`}>
              <CardHeader className="pb-3 pt-[30px]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleExpand(gw.gateway)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getGatewayIcon(gw.gateway)}</span>
                    <div>
                      <CardTitle className="text-base">{getGatewayNome(gw.gateway)}</CardTitle>
                      <CardDescription>
                        {isAtivo ? (
                          <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ativo {gw.modo_teste && '(Modo Teste)'}
                          </span>
                        ) : isConfigured ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <SignalZero className="h-3 w-3" />
                            Configurado (Desativado)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Não configurado</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAtivo && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><Signal className="h-3 w-3 mr-1" />Ativo</Badge>}
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  <Separator />

                  {/* Toggle ativo/desativado */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Gateway ativo para recebimento
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ativo
                          ? `Pagamentos serão processados via ${getGatewayNome(gw.gateway)}. Outros gateways serão desativados.`
                          : 'Gateway configurado mas não processa pagamentos.'
                        }
                      </p>
                    </div>
                    <Switch checked={ativo} onCheckedChange={setAtivo} />
                  </div>

                  {/* Toggle modo teste */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="text-sm font-medium">Modo Sandbox (Teste)</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Use tokens de sandbox para testar antes de ir para produção.
                      </p>
                    </div>
                    <Switch checked={modoTeste} onCheckedChange={setModoTeste} />
                  </div>

                  <Separator />

                  {/* Campos do gateway */}
                  {loadingConfig ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {gw.campos_config?.map((campo: any) => renderFormField(gw.gateway, campo))}

                      {/* URL do webhook */}
                      <div className="bg-muted rounded-md p-3 text-xs space-y-1">
                        <p className="font-medium flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          URL do Webhook (configure no painel do {getGatewayNome(gw.gateway)}):
                        </p>
                        <code className="block bg-background rounded px-2 py-1 text-[11px] break-all">
                          {import.meta.env.VITE_SUPABASE_URL?.replace('api', '') || 'https://seu-projeto.'}functions.supabase.co/webhook-gateway
                        </code>
                      </div>

                      {/* Botões */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={() => handleSave(gw.gateway)}
                          disabled={salvarConfig.isPending}
                          size="sm"
                        >
                          {salvarConfig.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          {isAtivo ? 'Atualizar Configuração' : 'Salvar e Ativar'}
                        </Button>

                        {isConfigured && !isAtivo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDesativar(gw.gateway)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover Configuração
                          </Button>
                        )}

                        <Button variant="ghost" size="sm" asChild className="ml-auto">
                          <a href={gw.doc_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Documentação
                          </a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
