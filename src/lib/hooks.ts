import { useAuth } from '@/modules/auth/AuthContext'

/**
 * Checks whether the current user has the server-owned Super Admin claim.
 */
export function useIsSuperAdmin() {
  const { authUser } = useAuth()
  return authUser?.isSuperAdmin === true || authUser?.role === 'super_admin'
}

/**
 * Deprecated compatibility hook. Super Admin is intentionally not configured
 * through a frontend email variable anymore.
 */
export function useSuperAdminEmail() {
  return null
}
