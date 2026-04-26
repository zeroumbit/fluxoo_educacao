import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from './service'

// ========== DASHBOARD ==========
export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => superAdminService.getDashboardStats(),
  })
}

// ========== PLANOS ==========
export function usePlanos() {
  return useQuery({
    queryKey: ['admin', 'planos'],
    queryFn: () => superAdminService.getPlanos(),
  })
}

export function useUpsertPlano() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (plano: any) => superAdminService.upsertPlano(plano),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'planos'] }),
  })
}

export function useDeletePlano() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superAdminService.deletePlano(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'planos'] }),
  })
}

// ========== MÓDULOS ==========
export function useModulos() {
  return useQuery({
    queryKey: ['admin', 'modulos'],
    queryFn: () => superAdminService.getModulos(),
  })
}

export function useUpsertModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (modulo: any) => superAdminService.upsertModulo(modulo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modulos'] }),
  })
}

export function useDeleteModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superAdminService.deleteModulo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modulos'] }),
  })
}

// ========== PLANO_MODULO ==========
export function usePlanoModulos(planoId: string) {
  return useQuery({
    queryKey: ['admin', 'plano-modulos', planoId],
    queryFn: () => superAdminService.getPlanoModulos(planoId),
    enabled: !!planoId,
  })
}

export function useSetPlanoModulos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planoId, moduloIds }: { planoId: string; moduloIds: string[] }) =>
      superAdminService.setPlanoModulos(planoId, moduloIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plano-modulos'] })
      qc.invalidateQueries({ queryKey: ['admin', 'planos'] })
    },
  })
}

// ========== ESCOLAS ==========
export function useEscolas() {
  return useQuery({
    queryKey: ['admin', 'escolas'],
    queryFn: () => superAdminService.getEscolas(),
  })
}

export function useUpdateEscolaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      superAdminService.updateEscolaStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escolas'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useSuspenderEscola() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      superAdminService.suspenderEscola(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escolas'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useEscolaDetalhes(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'escola-detalhes', id],
    queryFn: () => superAdminService.getEscolaDetalhes(id!),
    enabled: !!id,
  })
}

// ========== ASSINATURAS ==========
export function useAssinaturas() {
  return useQuery({
    queryKey: ['admin', 'assinaturas'],
    queryFn: () => superAdminService.getAssinaturas(),
  })
}

export function useCreateAssinatura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assinatura: any) => superAdminService.createAssinatura(assinatura),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'assinaturas'] }),
  })
}

// ========== FATURAS ==========
export function useFaturas(filters?: { status?: string; tenant_id?: string }) {
  return useQuery({
    queryKey: ['admin', 'faturas', filters],
    queryFn: () => superAdminService.getFaturas(filters),
  })
}

export function useConfirmarFatura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminId }: { id: string; adminId: string }) =>
      superAdminService.confirmarFatura(id, adminId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faturas'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useCreateFatura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fatura: any) => superAdminService.createFatura(fatura),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faturas'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useDeleteFatura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superAdminService.deleteFatura(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faturas'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

// ========== ESCOLAS DEVEDORAS ==========
export function useEscolasDevedoras() {
  return useQuery({
    queryKey: ['admin', 'escolas-devedoras'],
    queryFn: () => superAdminService.getEscolasDevedoras(),
  })
}

export function useConfirmarPagamentoEscola() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, adminId }: { tenantId: string; adminId: string }) =>
      superAdminService.confirmarPagamentoEscola(tenantId, adminId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escolas-devedoras'] })
      qc.invalidateQueries({ queryKey: ['admin', 'faturas'] })
    },
  })
}

export function useEnviarCobranca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, mensagem }: { tenantId: string; mensagem?: string }) =>
      superAdminService.enviarCobranca(tenantId, mensagem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escolas-devedoras'] })
    },
  })
}

export function useCancelarAcessoEscola() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, motivo }: { tenantId: string; motivo: string }) =>
      superAdminService.cancelarAcessoEscola(tenantId, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escolas-devedoras'] })
      qc.invalidateQueries({ queryKey: ['admin', 'escolas'] })
    },
  })
}

// ========== SOLICITAÇÕES DE UPGRADE ==========
export function useSolicitacoesUpgrade() {
  return useQuery({
    queryKey: ['admin', 'upgrades'],
    queryFn: () => superAdminService.getSolicitacoesUpgrade(),
  })
}

export function useAprovarUpgrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; tenantId: string; novoLimite: number; novoValor: number }) =>
      superAdminService.aprovarUpgrade(params.id, params.tenantId, params.novoLimite, params.novoValor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'upgrades'] })
      qc.invalidateQueries({ queryKey: ['admin', 'assinaturas'] })
    },
  })
}

export function useRecusarUpgrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superAdminService.recusarUpgrade(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'upgrades'] }),
  })
}

// ========== CONFIGURAÇÃO DE RECEBIMENTO ==========
export function useConfiguracaoRecebimento() {
  return useQuery({
    queryKey: ['admin', 'config-recebimento'],
    queryFn: () => superAdminService.getConfiguracaoRecebimento(),
  })
}

export function useUpdateConfiguracaoRecebimento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (config: any) => superAdminService.updateConfiguracaoRecebimento(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'config-recebimento'] })
      qc.invalidateQueries({ queryKey: ['portal', 'config-pix'] })
      qc.invalidateQueries({ queryKey: ['portal', 'config-recados'] })
    },
  })
}

// ========== INTELIGÊNCIA ZERO COST ==========
export function useTenantHealthScores() {
  return useQuery({
    queryKey: ['admin', 'health-scores'],
    queryFn: () => superAdminService.getTenantHealthScores(),
  })
}

export function useRadarEvasaoGeral() {
  return useQuery({
    queryKey: ['admin', 'radar-evasao'],
    queryFn: () => superAdminService.getRadarEvasaoGeral(),
  })
}

// ========== GATEWAYS DE PAGAMENTO (Super Admin) ==========
export function useGatewayConfig() {
  return useQuery({
    queryKey: ['admin', 'gateway-config'],
    queryFn: () => superAdminService.getGatewayConfig(),
  })
}

export function useToggleGatewayGlobal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ gateway, ativo }: { gateway: string; ativo: boolean }) =>
      superAdminService.toggleGatewayGlobal(gateway, ativo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'gateway-config'] })
      qc.invalidateQueries({ queryKey: ['gateway', 'disponiveis'] })
    },
  })
}

export function useUpdateGatewayCamposConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ gateway, campos }: { gateway: string; campos: any[] }) =>
      superAdminService.updateGatewayCamposConfig(gateway, campos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'gateway-config'] }),
  })
}
