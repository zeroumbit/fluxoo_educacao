import { useState } from 'react'
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
  ShieldCheck, Settings2, Trash2
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * GatewayTenantConfigPage - Configuração de Gateways da Escola
 *
 * Mostra gateways ativados pelo Super Admin e permite que a escola
 * configure seus tokens individualmente.
 */
export function GatewayTenantConfigPage() {
  const { data: gateways, isLoading: loadingGateways } = useGatewaysDisponiveis()
  const salvarConfig = useSalvarGatewayTenantConfig()
  const desativarGateway = useDesativarGatewayTenant()
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({})
  const [modoTeste, setModoTeste] = useState(false)
  const [ativo, setAtivo] = useState(false)

  // Buscar config existente quando expandir
  const { data: existingConfig, isLoading: loadingConfig } = useGatewayTenantConfig(
    expandedGateway || ''
  )

  // Inicializar form quando carregar config existente
  useState(() => {
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
    }
  })

  const handleExpand = (gateway: string) => {
    if (expandedGateway === gateway) {
      setExpandedGateway(null)
      setFormValues({})
      setAtivo(false)
      setModoTeste(false)
      return
    }
    setExpandedGateway(gateway)
    setFormValues({})
    setAtivo(false)
    setModoTeste(false)
  }

  const handleSave = async (gateway: string) => {
    try {
      await salvarConfig.mutateAsync({
        gateway,
        configuracao: formValues,
        ativo,
        modoTeste
      })
      toast.success('Configuração salva com sucesso!', {
        description: ativo
          ? 'Gateway ativado e pronto para receber pagamentos.'
          : 'Configuração salva mas gateway desativado.'
      })
    } catch (err: any) {
      toast.error('Erro ao salvar:', { description: err.message })
    }
  }

  const handleDesativar = async (gateway: string) => {
    const confirmed = window.confirm(
      'Desativar este gateway?\n\n' +
      '- Novos pagamentos não serão processados\n' +
      '- A configuração será mantida (pode reativar depois)\n' +
      '- Webhooks deste gateway serão ignorados'
    )
    if (!confirmed) return

    try {
      await desativarGateway.mutateAsync(gateway)
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
          placeholder={`Ex: ${campo.type === 'password' ? '••••••••' : '...'}`}
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
      efi: 'EFI (EfiPay)',
      pagseguro: 'PagSeguro'
    }
    return map[gateway] || gateway
  }

  const getGatewayIcon = (gateway: string) => {
    const map: Record<string, string> = {
      asaas: '🟢',
      mercado_pago: '🟡',
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
          <h1 className="text-2xl font-bold tracking-tight">Gateways de Pagamento</h1>
          <p className="text-muted-foreground mt-1">Configuração de recebimento automático</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhum gateway disponível</AlertTitle>
          <AlertDescription>
            O Super Admin ainda não ativou nenhum gateway de pagamento.
            Entre em contato para solicitar a ativação do Asaas ou Mercado Pago.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gateways de Pagamento</h1>
        <p className="text-muted-foreground mt-1">
          Configure seus tokens para receber pagamentos automaticamente via PIX, Boleto ou Cartão.
        </p>
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription>
          1. Escolha um gateway abaixo e clique para configurar.
          2. Cole seus tokens de API (obtidos no painel do gateway).
          3. Ative o gateway para começar a receber pagamentos.
        </AlertDescription>
      </Alert>

      {/* Lista de Gateways */}
      <div className="grid gap-4">
        {gateways.map((gw: any) => {
          const isExpanded = expandedGateway === gw.gateway
          const isConfigured = gw.tenant_configurado
          const isAtivo = gw.tenant_ativo

          return (
            <Card key={gw.gateway} className={isExpanded ? 'ring-2 ring-blue-500' : ''}>
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
                            {gw.modo_teste ? 'Ativo (Modo Teste)' : 'Ativo (Produção)'}
                          </span>
                        ) : isConfigured ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Configurado (Desativado)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Não configurado</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  <Separator />

                  {/* Campos de configuração */}
                  {loadingConfig ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Toggle ativo/desativado */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Gateway ativo para recebimento
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ativo ? 'Pagamentos serão processados automaticamente.' : 'Gateway configurado mas não processa pagamentos.'}
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
                      {gw.campos_config?.map((campo: any) => renderFormField(gw.gateway, campo))}

                      {/* URL do webhook para a escola configurar no gateway */}
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
                          Salvar Configuração
                        </Button>

                        {isConfigured && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDesativar(gw.gateway)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Desativar
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
