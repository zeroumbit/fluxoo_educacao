import { useState, useEffect, useCallback } from 'react'
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Settings2,
  Trash2,
  Signal,
  SignalZero,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Save,
  X,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useGatewaysDisponiveis,
  useGatewayTenantConfig,
  useSalvarGatewayTenantConfig,
  useDesativarGatewayTenant
} from '@/modules/financeiro/hooks-avancado'
import { toast } from 'sonner'

export function GatewayTenantConfigPageMobile() {
  const { data: gateways, isLoading: loadingGateways, refetch } = useGatewaysDisponiveis()
  const salvarConfig = useSalvarGatewayTenantConfig()
  const desativarGateway = useDesativarGatewayTenant()
  
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({})
  const [modoTeste, setModoTeste] = useState(false)
  const [ativo, setAtivo] = useState(false)
  const [confirmDesativacao, setConfirmDesativacao] = useState<string | null>(null)

  // Gateway atualmente ativo pela escola
  const gatewayAtivo = gateways?.find((g: any) => g.tenant_ativo)

  // Buscar config existente quando abrir BottomSheet
  const { data: existingConfig, isLoading: loadingConfig, refetch: refetchConfig } = useGatewayTenantConfig(
    selectedGateway || ''
  )

  // Quando abrir BottomSheet, carregar dados existentes
  useEffect(() => {
    if (selectedGateway) {
      refetchConfig()
    }
  }, [selectedGateway])

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

  const handleOpenGateway = (gateway: string) => {
    setSelectedGateway(gateway)
  }

  const handleCloseGateway = () => {
    setSelectedGateway(null)
    setFormValues({})
    setAtivo(false)
    setModoTeste(false)
  }

  const handleSave = async () => {
    if (!selectedGateway) return

    // Validar campos obrigatórios
    const gatewayDef = gateways?.find((g: any) => g.gateway === selectedGateway)
    if (gatewayDef?.campos_config) {
      for (const campo of gatewayDef.campos_config) {
        if (campo.required && !formValues[campo.key]) {
          toast.error(`Campo obrigatório: ${campo.label}`)
          return
        }
      }
    }

    // Confirmar se vai substituir gateway ativo
    if (ativo && gatewayAtivo && gatewayAtivo.gateway !== selectedGateway) {
      const confirmed = window.confirm(
        `⚠️ Atenção: Ao ativar "${getGatewayNome(selectedGateway)}", o gateway "${getGatewayNome(gatewayAtivo.gateway)}" será desativado automaticamente.\n\n` +
        `Apenas 1 gateway pode ficar ativo por vez.\n\n` +
        `Deseja continuar?`
      )
      if (!confirmed) return
    }

    try {
      await salvarConfig.mutateAsync({
        gateway: selectedGateway,
        configuracao: formValues,
        ativo,
        modoTeste
      })
      await refetch()
      toast.success('Configuração salva com sucesso!', {
        description: ativo
          ? `${getGatewayNome(selectedGateway)} ativado. Outros gateways foram desativados.`
          : `Configuração salva. Gateway desativado.`
      })
      handleCloseGateway()
    } catch (err: any) {
      toast.error('Erro ao salvar:', { description: err.message })
    }
  }

  const handleDesativar = async (gateway: string) => {
    try {
      await desativarGateway.mutateAsync(gateway)
      await refetch()
      toast.success('Gateway desativado.')
      setConfirmDesativacao(null)
      handleCloseGateway()
    } catch (err: any) {
      toast.error('Erro ao desativar:', { description: err.message })
    }
  }

  const renderFormField = (campo: any) => {
    const value = formValues[campo.key] ?? (campo.default ?? '')

    if (campo.type === 'boolean') {
      return (
        <div key={campo.key} className="flex items-center justify-between py-4 px-1">
          <div className="flex-1 mr-4">
            <Label className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              {campo.label}
              {campo.required && <span className="text-rose-500">*</span>}
            </Label>
            {campo.help && <p className="text-xs text-slate-400 mt-1 font-medium">{campo.help}</p>}
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
        <div key={campo.key} className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            {campo.label}
            {campo.required && <span className="text-rose-500 ml-1">*</span>}
          </Label>
          {campo.help && <p className="text-xs text-slate-400 font-medium ml-1">{campo.help}</p>}
          <textarea
            value={String(value)}
            placeholder="Cole aqui o conteúdo..."
            onChange={(e) => setFormValues(prev => ({ ...prev, [campo.key]: e.target.value }))}
            className="w-full min-h-[120px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-mono resize-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
          />
        </div>
      )
    }

    return (
      <div key={campo.key} className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          {campo.label}
          {campo.required && <span className="text-rose-500 ml-1">*</span>}
        </Label>
        {campo.help && <p className="text-xs text-slate-400 font-medium ml-1">{campo.help}</p>}
        <Input
          type={campo.type === 'password' ? 'password' : 'text'}
          value={String(value)}
          placeholder={campo.type === 'password' ? '••••••••' : '...'}
          onChange={(e) => setFormValues(prev => ({ ...prev, [campo.key]: e.target.value }))}
          className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-mono px-4"
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

  const getGatewayColor = (gateway: string) => {
    const map: Record<string, string> = {
      asaas: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      mercado_pago: 'bg-amber-50 text-amber-600 border-amber-100',
      abacate_pay: 'bg-green-50 text-green-600 border-green-100',
      efi: 'bg-blue-50 text-blue-600 border-blue-100',
      pagseguro: 'bg-purple-50 text-purple-600 border-purple-100'
    }
    return map[gateway] || 'bg-slate-50 text-slate-600 border-slate-100'
  }

  const handleRefresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Loading state
  if (loadingGateways) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">Carregando Gateways...</p>
      </div>
    )
  }

  // Empty state
  if (!gateways || gateways.length === 0) {
    return (
      <MobilePageLayout
        title="Gateway"
        leftAction={
          <button onClick={() => window.history.back()} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
        }
      >
        <div className="space-y-6 pb-20 pt-2">
          <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[32px] border border-amber-100 dark:border-amber-900/50 flex flex-col items-center text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
            <h3 className="text-lg font-black text-amber-900 dark:text-amber-200 mb-2">
              Nenhum gateway disponível
            </h3>
            <p className="text-xs text-amber-600/70 font-medium">
              O Super Admin ainda não ativou nenhum gateway de pagamento. Entre em contato para solicitar a ativação.
            </p>
          </div>
        </div>
      </MobilePageLayout>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <MobilePageLayout
        title="Gateway"
        leftAction={
          <button onClick={() => window.history.back()} className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
        }
      >
        <div className="space-y-6 pb-20 pt-2">
          {/* Info Card - Regra 1 gateway ativo */}
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/50 flex gap-4">
            <div className="shrink-0 h-10 w-10 text-blue-600 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
              <Signal size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest leading-normal">
                Apenas 1 gateway ativo por vez
              </p>
              <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed mt-1">
                {gatewayAtivo ? (
                  <>
                    Gateway ativo: <strong>{getGatewayNome(gatewayAtivo.gateway)}</strong>
                    {gatewayAtivo.modo_teste && ' (Modo Teste)'}. Ao ativar outro, este será desativado automaticamente.
                  </>
                ) : (
                  'Selecione e configure um gateway abaixo para começar a receber pagamentos.'
                )}
              </p>
            </div>
          </div>

          {/* Gateway Ativo - Destaque */}
          {gatewayAtivo && (
            <NativeCard className="p-0 overflow-hidden border-2 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="p-6 flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center shadow-sm">
                  <span className="text-4xl">{getGatewayIcon(gatewayAtivo.gateway)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-base font-black text-green-900 dark:text-green-200">
                      Gateway Ativo
                    </h3>
                  </div>
                  <p className="text-sm font-black text-green-800 dark:text-green-100">
                    {getGatewayNome(gatewayAtivo.gateway)}
                  </p>
                  <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider mt-0.5">
                    {gatewayAtivo.modo_teste ? '🧪 Modo Sandbox (Teste)' : '✅ Produção'}
                    {gatewayAtivo.tenant_updated_at && ` · ${new Date(gatewayAtivo.tenant_updated_at).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-green-200 dark:bg-green-800 rounded-xl">
                  <Signal className="h-4 w-4 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </NativeCard>
          )}

          {/* Lista de Gateways Disponíveis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Gateways Disponíveis
              </h3>
              <Settings2 size={14} className="text-slate-300" />
            </div>

            {gateways.map((gw: any, idx: number) => {
              const isConfigured = gw.tenant_configurado
              const isAtivo = gw.tenant_ativo
              const statusLabel = isAtivo
                ? { text: 'Ativo', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' }
                : isConfigured
                ? { text: 'Configurado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' }
                : { text: 'Não configurado', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' }

              return (
                <motion.button
                  key={gw.gateway}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleOpenGateway(gw.gateway)}
                  className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:scale-95 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                      isAtivo ? 'bg-green-50 border-green-100' : getGatewayColor(gw.gateway)
                    )}>
                      <span className="text-3xl">{getGatewayIcon(gw.gateway)}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-slate-900 dark:text-white text-base">
                        {getGatewayNome(gw.gateway)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", statusLabel.color)}>
                          {isAtivo && <Signal className="h-2 w-2 inline mr-1" />}
                          {statusLabel.text}
                        </span>
                        {gw.modo_teste && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            Teste
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* BottomSheet - Configuração do Gateway */}
        <BottomSheet
          isOpen={!!selectedGateway}
          onClose={handleCloseGateway}
          title={selectedGateway ? getGatewayNome(selectedGateway) : ''}
          size="full"
        >
          <AnimatePresence>
            {selectedGateway && (
              <motion.div
                key={selectedGateway}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1 pb-20 space-y-8"
              >
                {/* Status do Gateway */}
                <div className={cn(
                  "p-6 rounded-[32px] border flex items-center gap-4",
                  ativo
                    ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                )}>
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    ativo ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-400"
                  )}>
                    {ativo ? <CheckCircle2 size={24} /> : <SignalZero size={24} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {ativo ? 'Gateway Ativo' : 'Gateway Desativado'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {ativo
                        ? `Pagamentos serão processados via ${getGatewayNome(selectedGateway)}`
                        : 'Gateway configurado mas não processa pagamentos'
                      }
                    </p>
                  </div>
                </div>

                {/* Toggles */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] space-y-6 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck size={16} />
                        Gateway ativo para recebimento
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        Ao ativar, outros gateways serão desativados
                      </p>
                    </div>
                    <Switch
                      checked={ativo}
                      onCheckedChange={setAtivo}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Modo Sandbox (Teste)
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        Use tokens de sandbox para testar antes de ir para produção
                      </p>
                    </div>
                    <Switch
                      checked={modoTeste}
                      onCheckedChange={setModoTeste}
                    />
                  </div>
                </div>

                {/* Campos do Gateway */}
                {loadingConfig ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {gateways
                        ?.find((g: any) => g.gateway === selectedGateway)
                        ?.campos_config?.map((campo: any) => renderFormField(campo))
                      }
                    </div>

                    {/* URL do Webhook */}
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600">
                          <KeyRound size={20} />
                        </div>
                        <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">
                          URL do Webhook
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-600/70 ml-1">
                        Configure esta URL no painel do {getGatewayNome(selectedGateway)}:
                      </p>
                      <code className="block bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all border border-indigo-200 dark:border-indigo-900/50">
                        {import.meta.env.VITE_SUPABASE_URL?.replace('api', '') || 'https://seu-projeto.'}functions.supabase.co/webhook-gateway
                      </code>
                    </div>

                    {/* Botão de Documentação */}
                    {gateways?.find((g: any) => g.gateway === selectedGateway)?.doc_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full h-14 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-black uppercase text-xs tracking-widest"
                      >
                        <a
                          href={gateways.find((g: any) => g.gateway === selectedGateway)?.doc_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} />
                          Documentação do {getGatewayNome(selectedGateway)}
                        </a>
                      </Button>
                    )}
                  </>
                )}

                {/* Botões Fixos no Rodapé */}
                <div className="fixed bottom-0 left-0 right-0 max-w-[640px] mx-auto p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,8px)+24px)] z-[1002] space-y-3">
                  <Button
                    onClick={handleSave}
                    disabled={salvarConfig.isPending || loadingConfig}
                    className="w-full h-16 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-200 dark:shadow-none disabled:opacity-30"
                  >
                    {salvarConfig.isPending ? (
                      <Loader2 size={20} className="animate-spin mr-2" />
                    ) : (
                      <Save size={20} className="mr-2" />
                    )}
                    {ativo ? 'Atualizar Configuração' : 'Salvar e Ativar'}
                  </Button>

                  {gateways?.find((g: any) => g.gateway === selectedGateway)?.tenant_configurado && !ativo && (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmDesativacao(selectedGateway)}
                      className="w-full h-14 rounded-[24px] border-2 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-black uppercase text-xs tracking-widest"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Remover Configuração
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </BottomSheet>

        {/* BottomSheet - Confirmação de Desativação */}
        <BottomSheet
          isOpen={!!confirmDesativacao}
          onClose={() => setConfirmDesativacao(null)}
          size="half"
        >
          <div className="px-1 pb-8 space-y-8">
            <div className="flex flex-col items-center justify-center p-8 bg-rose-50 dark:bg-rose-900/20 rounded-[40px] border border-rose-100 dark:border-rose-900/50">
              <AlertTriangle className="h-16 w-16 text-rose-600 mb-4" />
              <h2 className="text-2xl font-black tracking-tighter text-rose-950 dark:text-rose-200 text-center">
                Atenção
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mt-2 text-center">
                Ação Destrutiva
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[32px] border border-amber-100 dark:border-amber-900/50">
                <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest mb-3">
                  O que acontece?
                </h4>
                <ol className="space-y-2 text-xs font-bold text-amber-700 dark:text-amber-300 ml-4 list-decimal">
                  <li>A configuração do gateway será removida</li>
                  <li>Tokens e credenciais serão excluídos</li>
                  <li>Pagamentos automáticos serão interrompidos</li>
                  <li>Você precisará reconfigurar tudo do zero</li>
                </ol>
              </div>

              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/50">
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest mb-3">
                  Quando usar?
                </h4>
                <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed">
                  Use esta opção apenas quando desejar trocar permanentemente de gateway ou limpar configurações inválidas.
                </p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    <strong>Importante:</strong> Esta ação não pode ser desfeita. Certifique-se de ter um gateway alternativo configurado antes de prosseguir.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => confirmDesativacao && handleDesativar(confirmDesativacao)}
                className="w-full h-16 rounded-[24px] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-rose-200 dark:shadow-none"
              >
                <Trash2 size={20} className="mr-2" />
                Sim, Remover Configuração
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDesativacao(null)}
                className="w-full h-14 rounded-[24px] border-2 border-slate-200 dark:border-slate-700 font-black uppercase text-xs tracking-widest"
              >
                <X size={16} className="mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </BottomSheet>
      </MobilePageLayout>
    </PullToRefresh>
  )
}
