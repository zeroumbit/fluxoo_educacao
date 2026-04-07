import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useGatewayConfig, useToggleGatewayGlobal } from '@/modules/super-admin/hooks'
import { Loader2, ShieldCheck, ShieldOff, Key, Info, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

/**
 * GatewayConfigPage - Super Admin
 *
 * Lista TODOS os gateways disponíveis (Asaas, Mercado Pago, Abacate Pay, etc.)
 * Permite ativar/desativar para toda a plataforma.
 */
export function GatewayConfigPage() {
  const { data: gateways, isLoading } = useGatewayConfig()
  const toggleGateway = useToggleGatewayGlobal()

  const handleToggle = async (gateway: string, currentStatus: boolean) => {
    const novoStatus = !currentStatus

    if (novoStatus) {
      const confirmed = window.confirm(
        `Ativar o gateway "${getGatewayNome(gateway)}" para todas as escolas?\n\n` +
        `As escolas poderão configurar seus tokens na página Configurações > Gateway.`
      )
      if (!confirmed) return
    } else {
      const confirmed = window.confirm(
        `⚠️ ATENÇÃO: Desativar o gateway "${getGatewayNome(gateway)}"?\n\n` +
        `- Nenhuma escola poderá receber pagamentos via este gateway\n` +
        `- Webhooks deste gateway serão rejeitados\n` +
        `- As configurações das escolas serão mantidas (não perdidas)\n\n` +
        `Deseja continuar?`
      )
      if (!confirmed) return
    }

    try {
      await toggleGateway.mutateAsync({ gateway, ativo: novoStatus })
      toast.success(
        novoStatus ? `Gateway ${getGatewayNome(gateway)} ativado!` : `Gateway ${getGatewayNome(gateway)} desativado.`,
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

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription className="space-y-1">
          <p><strong>1.</strong> Você (Super Admin) <strong>ativa</strong> o gateway aqui.</p>
          <p><strong>2.</strong> Cada escola acessa <strong>Configurações &gt; Gateway</strong> e configura seus tokens.</p>
          <p><strong>3.</strong> A escola escolhe apenas <strong>1 gateway ativo por vez</strong>.</p>
          <p><strong>4.</strong> Se você <strong>desativar</strong>, todas as escolas perdem acesso a este gateway.</p>
        </AlertDescription>
      </Alert>

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
                        <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Ativo para todas as escolas
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                          <ShieldOff className="h-3 w-3" />
                          Desativado
                        </span>
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

              {/* Campos necessários */}
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

              {/* URL do webhook */}
              <div className="bg-muted rounded-md p-3 text-xs space-y-1">
                <p className="font-medium flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  URL do Webhook (para configurar no painel do gateway):
                </p>
                <code className="block bg-background rounded px-2 py-1 text-[11px] break-all">
                  https://SEU-PROJETO.functions.supabase.co/webhook-gateway
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
