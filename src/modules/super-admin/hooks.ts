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
export function useFaturas(filters?: { status?: string }) {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'config-recebimento'] }),
  })
}
