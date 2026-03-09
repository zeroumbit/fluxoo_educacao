/**
 * Hooks React para RBAC V2.2
 * Conecta o Zustand Store de permissões com componentes React.
 */
import { useEffect, useMemo } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useRBACStore, subscribeToRBACChanges, unsubscribeFromRBACChanges } from '@/stores/rbac.store'
import type { ScopeType } from '@/modules/rbac/types'

/**
 * Hook principal: inicializa o RBAC e configura Realtime.
 * Deve ser chamado uma vez no AuthContext ou layout raiz.
 */
export function useRBACInit() {
  const { authUser } = useAuth()
  const { loadPermissions, clearPermissions, isInitialized, isLoading } = useRBACStore()

  useEffect(() => {
    if (!authUser) {
      clearPermissions()
      unsubscribeFromRBACChanges()
      return
    }

    // Super admin e gestor têm acesso total — skip RBAC
    if (authUser.role === 'super_admin' || authUser.role === 'gestor') {
      return
    }

    // Responsável não precisa de RBAC
    if (authUser.role === 'responsavel') {
      return
    }

    // Funcionário → carregar permissões RBAC
    const userId = authUser.user.id
    const tenantId = authUser.tenantId

    if (userId && tenantId) {
      loadPermissions(userId, tenantId)

      // Subscrever a mudanças em tempo real
      const unsubscribe = subscribeToRBACChanges(tenantId)
      return () => {
        unsubscribe()
      }
    }
  }, [authUser, loadPermissions, clearPermissions])

  return { isInitialized, isLoading }
}

/**
 * Verifica se o usuário tem uma permissão específica.
 * Super admin e gestor sempre retornam true.
 */
export function useHasPermission(key: string): boolean {
  const { authUser } = useAuth()
  const hasPermission = useRBACStore(state => state.hasPermission)

  // Super admin e gestor = acesso total
  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return true
  }

  return hasPermission(key)
}

/**
 * Verifica se o usuário tem ALGUMA das permissões listadas (OR).
 */
export function useHasAnyPermission(keys: string[]): boolean {
  const { authUser } = useAuth()
  const hasAnyPermission = useRBACStore(state => state.hasAnyPermission)

  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return true
  }

  return hasAnyPermission(keys)
}

/**
 * Verifica se o usuário tem TODAS as permissões listadas (AND).
 */
export function useHasAllPermissions(keys: string[]): boolean {
  const { authUser } = useAuth()
  const hasAllPermissions = useRBACStore(state => state.hasAllPermissions)

  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return true
  }

  return hasAllPermissions(keys)
}

/**
 * Verifica se o usuário tem permissão com escopo suficiente.
 */
export function useHasScope(key: string, requiredScope: ScopeType): boolean {
  const { authUser } = useAuth()
  const hasScope = useRBACStore(state => state.hasScope)

  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return true
  }

  return hasScope(key, requiredScope)
}

/**
 * Retorna o escopo da permissão do usuário.
 */
export function usePermissionScope(key: string): ScopeType | null {
  const { authUser } = useAuth()
  const getPermissionScope = useRBACStore(state => state.getPermissionScope)

  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return 'rede'
  }

  return getPermissionScope(key)
}

/**
 * Verifica se o usuário pode acessar um módulo específico.
 */
export function useCanAccessModule(moduleKey: string): boolean {
  const { authUser } = useAuth()
  const canAccessModule = useRBACStore(state => state.canAccessModule)

  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return true
  }

  return canAccessModule(moduleKey)
}

/**
 * Verifica se uma permissão requer aprovação dupla.
 * (Consultado do catálogo, não do cache)
 */
export function useRequiresApproval(key: string): boolean {
  // Por enquanto hardcoded - futuramente consultar approval_workflows
  const APPROVAL_KEYS = [
    'financeiro.fatura.discount',
    'financeiro.fatura.estorno',
    'financeiro.cobrancas.baixa_manual',
    'financeiro.cobrancas.cancel',
    'academico.matriculas.cancel',
    'gestao.funcionarios.desligar',
  ]
  return APPROVAL_KEYS.includes(key)
}

/**
 * Retorna todas as permissões resolvidas do usuário atual.
 */
export function useUserPermissions() {
  const { authUser } = useAuth()
  const { permissions, isLoading, isInitialized } = useRBACStore()

  const isFullAccess = authUser?.role === 'super_admin' || authUser?.role === 'gestor'

  return useMemo(() => ({
    permissions: isFullAccess ? [] : permissions,
    isFullAccess,
    isLoading,
    isInitialized,
    role: authUser?.role,
  }), [permissions, isFullAccess, isLoading, isInitialized, authUser?.role])
}
