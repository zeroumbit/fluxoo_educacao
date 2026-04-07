import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useGatewayConfig, useToggleGatewayGlobal } from '@/modules/super-admin/hooks'
import { Loader2, ShieldCheck, ShieldOff, Key, Info, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

/**
 * GatewayConfigPage - Super Admin
 *
 * Permite ao Super Admin ativar/desativar gateways de pagamento
 * globalmente. Quando ativo, as escolas podem configurar seus tokens.
 */
export function GatewayConfigPage() {
  const { data: gateways, isLoading } = useGatewayConfig()
  const toggleGateway = useToggleGatewayGlobal()

  const handleToggle = async (gateway: string, currentStatus: boolean) => {
    const novoStatus = !currentStatus

    if (novoStatus) {
      // Ativando: confirmar
      const confirmed = window.confirm(
        `Ativar o gateway "${gateway === 'asaas' ? 'Asaas' : gateway === 'mercado_pago' ? 'Mercado Pago' : gateway}" para todas as escolas?\n\n` +
        `As escolas poderão configurar seus tokens após a ativação.`
      )
      if (!confirmed) return
    } else {
      // Desativando: alertar
      const confirmed = window.confirm(
        `⚠️ ATENÇÃO: Desativar o gateway "${gateway === 'asaas' ? 'Asaas' : gateway === 'mercado_pago' ? 'Mercado Pago' : gateway}"?\n\n` +
        `- Nenhuma escola poderá receber pagamentos via este gateway\n` +
        `- Webhooks deste gateway serão rejeitados\n` +
        `- Configurações das escolas serão mantidas (não perdidas)\n\n` +
        `Deseja continuar?`
      )
      if (!confirmed) return
    }

    try {
      await toggleGateway.mutateAsync({ gateway, ativo: novoStatus })
      toast.success(
        novoStatus ? 'Gateway ativado com sucesso!' : 'Gateway desativado.',
        {
          description: novoStatus
            ? 'As escolas já podem configurar seus tokens.'
            : 'Webhooks deste gateway serão rejeitados.'
        }
      )
    } catch {
      toast.error('Erro ao alterar status do gateway.')
    }
  }

  const getGatewayIcon = (gateway: string) => {
    switch (gateway) {
      case 'asaas':
        return '🟢'
      case 'mercado_pago':
        return '🟡'
      default:
        return '🔵'
    }
  }

  const getGatewayNome = (gateway: string) => {
    switch (gateway) {
      case 'asaas':
        return 'Asaas'
      case 'mercado_pago':
        return 'Mercado Pago'
      case 'efi':
        return 'EFI (EfiPay)'
      case 'pagseguro':
        return 'PagSeguro'
      default:
        return gateway
    }
  }

  const getGatewayDocUrl = (gateway: string) => {
    switch (gateway) {
      case 'asaas':
        return 'https://docs.asaas.com/reference/introdução-1'
      case 'mercado_pago':
        return 'https://www.mercadopago.com.br/developers/pt/docs'
      default:
        return '#'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gateways de Pagamento</h1>
        <p className="text-muted-foreground mt-1">
          Ative ou desative gateways para toda a plataforma. Escolas configuram seus tokens individualmente.
        </p>
      </div>

      {/* Alerta */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="text-amber-800 dark:text-amber-200">
            <strong>1.</strong> Você (Super Admin) <strong>ativa</strong> o gateway aqui.
          </p>
          <p className="text-amber-800 dark:text-amber-200">
            <strong>2.</strong> Cada escola acessa <strong>Configurações &gt; Gateways de Pagamento</strong> e cola seus tokens.
          </p>
          <p className="text-amber-800 dark:text-amber-200">
            <strong>3.</strong> A Edge Function identifica o tenant automaticamente e usa as credenciais corretas.
          </p>
          <p className="text-amber-800 dark:text-amber-200">
            <strong>4.</strong> Se você <strong>desativar</strong>, todas as escolas perdem acesso imediatamente.
          </p>
        </CardContent>
      </Card>

      {/* Lista de Gateways */}
      <div className="grid gap-4">
        {gateways?.map((gw: any) => (
          <Card key={gw.gateway} className={!gw.ativo_global ? 'opacity-60' : ''}>
            <CardHeader className="pb-3 pt-[30px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getGatewayIcon(gw.gateway)}</span>
                  <div>
                    <CardTitle className="text-base">{getGatewayNome(gw.gateway)}</CardTitle>
                    <CardDescription>
                      {gw.ativo_global ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Ativo globalmente</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium">Desativado</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {gw.doc_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={gw.doc_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Docs
                      </a>
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={gw.ativo_global}
                      onCheckedChange={() => handleToggle(gw.gateway, gw.ativo_global)}
                      disabled={toggleGateway.isPending}
                    />
                    {toggleGateway.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : gw.ativo_global ? (
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Separator />

              {/* Campos de configuração necessários */}
              {gw.campos_config && gw.campos_config.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Campos que a escola precisará configurar:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {gw.campos_config.map((campo: any) => (
                      <Badge key={campo.key} variant="outline" className="text-xs">
                        {campo.label}
                        {campo.required && <span className="text-red-500 ml-1">*</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Info de webhook */}
              <div className="bg-muted rounded-md p-3 text-xs space-y-1">
                <p className="font-medium flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  URL do Webhook (para configurar no gateway):
                </p>
                <code className="block bg-background rounded px-2 py-1 text-[11px] break-all">
                  {import.meta.env.VITE_SUPABASE_URL?.replace('.co', '.co')?.replace('supabase', '') || 'https://SEU-PROJETO'}functions.supabase.co/webhook-gateway
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
