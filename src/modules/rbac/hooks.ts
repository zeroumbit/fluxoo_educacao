/**
 * React Query Hooks para RBAC V2.2
 * Hooks para gerenciar perfis, permissões, cargos e auditoria via TanStack Query.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rbacService } from './service'
import { useAuth } from '@/modules/auth/AuthContext'
import type { PerfilAcessoInsert, PerfilAcessoUpdate, ScopeType } from './types'

// ========== MÓDULOS ==========
export function useSystemModules() {
  return useQuery({
    queryKey: ['rbac', 'modules'],
    queryFn: () => rbacService.listarModulos(),
    staleTime: 60 * 60 * 1000, // 1 hora — raramente muda
  })
}

// ========== PERMISSÕES (Catálogo Global) ==========
export function usePermissions() {
  return useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: () => rbacService.listarPermissoes(),
    staleTime: 60 * 60 * 1000,
  })
}

export function usePermissionsByModule(moduloKey: string) {
  return useQuery({
    queryKey: ['rbac', 'permissions', moduloKey],
    queryFn: () => rbacService.listarPermissoesPorModulo(moduloKey),
    enabled: !!moduloKey,
    staleTime: 60 * 60 * 1000,
  })
}

// ========== PERFIS DE ACESSO ==========
export function usePerfis() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['rbac', 'perfis', tenantId],
    queryFn: () => rbacService.listarPerfis(tenantId || undefined),
    enabled: !!tenantId,
  })
}

export function usePerfil(id: string) {
  return useQuery({
    queryKey: ['rbac', 'perfil', id],
    queryFn: () => rbacService.buscarPerfil(id),
    enabled: !!id,
  })
}

export function usePerfilPermissions(perfilId: string) {
  return useQuery({
    queryKey: ['rbac', 'perfil-permissions', perfilId],
    queryFn: () => rbacService.listarPermissoesDoPerfil(perfilId),
    enabled: !!perfilId,
  })
}

export function useCriarPerfil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (perfil: PerfilAcessoInsert) => rbacService.criarPerfil(perfil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'perfis'] })
    },
  })
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PerfilAcessoUpdate }) =>
      rbacService.atualizarPerfil(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'perfis'] })
      queryClient.invalidateQueries({ queryKey: ['rbac', 'perfil'] })
    },
  })
}

export function useExcluirPerfil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rbacService.excluirPerfil(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'perfis'] })
    },
  })
}

export function useDefinirPermissoesPerfil() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ perfilId, permissoes }: { perfilId: string; permissoes: { permissionId: string; scope: ScopeType }[] }) =>
      rbacService.definirPermissoesDoPerfil(perfilId, permissoes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'perfil-permissions', variables.perfilId] })
    },
  })
}

// ========== CARGOS V2 ==========
export function useCargosV2() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['rbac', 'cargos', tenantId],
    queryFn: () => rbacService.listarCargos(tenantId!),
    enabled: !!tenantId,
  })
}

// ========== USUÁRIOS DO SISTEMA ==========
export function useUsuariosSistema() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['rbac', 'usuarios', tenantId],
    queryFn: () => rbacService.listarUsuarios(tenantId!),
    enabled: !!tenantId,
  })
}

// ========== OVERRIDES ==========
export function useOverrides() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['rbac', 'overrides', tenantId],
    queryFn: () => rbacService.listarOverrides(tenantId!),
    enabled: !!tenantId,
  })
}

export function useCriarOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rbacService.criarOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'overrides'] })
    },
  })
}

export function useRemoverOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rbacService.removerOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'overrides'] })
    },
  })
}

// ========== AUDIT LOGS V2 ==========
export function useAuditLogs(options?: { limit?: number; offset?: number; acao?: string }) {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['rbac', 'audit-logs', tenantId, options],
    queryFn: () => rbacService.listarAuditLogs(tenantId!, options),
    enabled: !!tenantId,
  })
}

// ========== APPROVAL WORKFLOWS ==========
export function useApprovalWorkflows() {
  const { authUser } = useAuth()
  const tenantId = authUser?.tenantId

  return useQuery({
    queryKey: ['rbac', 'workflows', tenantId],
    queryFn: () => rbacService.listarWorkflows(tenantId!),
    enabled: !!tenantId,
  })
}
