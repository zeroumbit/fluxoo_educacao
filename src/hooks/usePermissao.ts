import { useAuth } from '@/modules/auth/AuthContext'

/**
 * Hook para verificar se usuário tem acesso a uma área específica
 * @param area - Área a verificar (ex: 'Financeiro', 'Pedagógico', 'Secretaria')
 * 
 * Uso em componentes:
 * 
 * ```tsx
 * const { temAcesso, isLoading } = usePermissao('Financeiro')
 * 
 * if (!temAcesso) return <Navigate to="/nao-autorizado" />
 * 
 * return <div>Só aparece para quem tem acesso</div>
 * ```
 */
export function usePermissao(area: string) {
  const { authUser, loading } = useAuth()

  // Super admin tem acesso a tudo
  if (authUser?.role === 'super_admin') {
    return { temAcesso: true, isLoading: false }
  }

  // Gestor tem acesso a tudo no seu tenant
  if (authUser?.role === 'gestor') {
    return { temAcesso: true, isLoading: false }
  }

  // Funcionário verifica áreas de acesso
  if (authUser?.role === 'funcionario') {
    const temAcesso = authUser.areasAcesso?.includes(area) ?? false
    return { temAcesso, isLoading: loading }
  }

  // Sem acesso padrão
  return { temAcesso: false, isLoading: false }
}

/**
 * Hook para verificar múltiplas áreas de acesso
 * @param areas - Array de áreas para verificar
 * @param operador - 'algum' (OR) ou 'todos' (AND)
 * 
 * Uso:
 * ```tsx
 * const { temAcesso } = useMultiPermissao(['Financeiro', 'Pedagógico'], 'algum')
 * ```
 */
export function useMultiPermissao(areas: string[], operador: 'algum' | 'todos' = 'algum') {
  const { authUser, loading } = useAuth()

  // Super admin e gestor têm acesso total
  if (authUser?.role === 'super_admin' || authUser?.role === 'gestor') {
    return { temAcesso: true, isLoading: false }
  }

  // Funcionário verifica áreas
  if (authUser?.role === 'funcionario') {
    const areasAcesso = authUser.areasAcesso || []
    
    if (operador === 'algum') {
      // Pelo menos uma área
      const temAcesso = areas.some(area => areasAcesso.includes(area))
      return { temAcesso, isLoading: loading }
    } else {
      // Todas as áreas
      const temAcesso = areas.every(area => areasAcesso.includes(area))
      return { temAcesso, isLoading: loading }
    }
  }

  return { temAcesso: false, isLoading: false }
}

/**
 * Hook para obter áreas de acesso do usuário atual
 */
export function useAreasAcesso() {
  const { authUser } = useAuth()

  // Super admin e gestor têm acesso total
  if (authUser?.role === 'super_admin') {
    return ['*'] // Acesso total
  }

  if (authUser?.role === 'gestor') {
    return ['*'] // Acesso total
  }

  // Funcionário retorna suas áreas
  return authUser?.areasAcesso || []
}

/**
 * HOC para proteger componentes com verificação de permissão
 * 
 * Uso:
 * ```tsx
 * const FinanceiroPageComPermissao = withPermissao('Financeiro')(FinanceiroPage)
 * ```
 */
export function withPermissao<P extends object>(area: string) {
  return function (Component: React.ComponentType<P>) {
    return function ComponentComPermissao(props: P) {
      const { temAcesso, isLoading } = usePermissao(area)

      if (isLoading) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )
      }

      if (!temAcesso) {
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p>Você não tem permissão para acessar esta página.</p>
          </div>
        )
      }

      return <Component {...props} />
    }
  }
}
