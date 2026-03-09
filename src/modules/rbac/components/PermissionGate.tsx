/**
 * PermissionGate V2.2
 * Componente wrapper que oculta/desabilita conteúdo baseado em permissões RBAC.
 * 
 * Uso:
 * ```tsx
 * <PermissionGate permission="financeiro.cobrancas.create">
 *   <Button>Nova Cobrança</Button>
 * </PermissionGate>
 * 
 * <PermissionGate permission="gestao.funcionarios.desligar" fallback={<p>Sem acesso</p>}>
 *   <Button variant="destructive">Desligar</Button>
 * </PermissionGate>
 * 
 * <PermissionGate permissions={['financeiro.cobrancas.view', 'financeiro.fatura.view']} mode="any">
 *   <FinanceiroTab />
 * </PermissionGate>
 * ```
 */
import type { ReactNode } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useRBACStore } from '@/stores/rbac.store'

interface PermissionGateProps {
  /** Permissão única a ser verificada */
  permission?: string
  /** Lista de permissões a verificar (use com `mode`) */
  permissions?: string[]
  /** Modo de verificação: 'all' = todas necessárias, 'any' = qualquer uma */
  mode?: 'all' | 'any'
  /** Conteúdo a renderizar quando o usuário TEM permissão */
  children: ReactNode
  /** Conteúdo alternativo quando o usuário NÃO TEM permissão */
  fallback?: ReactNode
  /** Se true, desabilita o conteúdo ao invés de ocultar */
  disableInstead?: boolean
}

export function PermissionGate({
  permission,
  permissions,
  mode = 'any',
  children,
  fallback = null,
  disableInstead = false,
}: PermissionGateProps) {
  const { authUser } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBACStore()

  // Super admin e gestor = acesso total
  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return <>{children}</>
  }

  // Verificar permissão
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = mode === 'all'
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  if (!hasAccess) {
    if (disableInstead) {
      return (
        <div className="opacity-50 pointer-events-none select-none" aria-disabled="true">
          {children}
        </div>
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * PermissionGate.Tooltip — versão com tooltip de "sem permissão"
 */
interface PermissionGateTooltipProps extends Omit<PermissionGateProps, 'fallback' | 'disableInstead'> {
  tooltipText?: string
}

export function PermissionGateWithTooltip({
  tooltipText = 'Você não tem permissão para esta ação',
  children,
  ...props
}: PermissionGateTooltipProps) {
  return (
    <PermissionGate
      {...props}
      fallback={
        <div className="relative group inline-block">
          <div className="opacity-40 pointer-events-none select-none">
            {children}
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {tooltipText}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </div>
        </div>
      }
    >
      {children}
    </PermissionGate>
  )
}
