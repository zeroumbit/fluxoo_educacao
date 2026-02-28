import { useAuth } from '@/modules/auth/AuthContext'
import { SUPER_ADMIN_EMAIL } from '@/lib/config'

/**
 * Hook para verificar se o usuário atual é o super admin
 */
export function useIsSuperAdmin() {
  const { authUser } = useAuth()
  
  return authUser?.role === 'super_admin' || 
         (authUser?.user?.email ? authUser.user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() : false)
}

/**
 * Hook para obter o e-mail do super admin
 */
export function useSuperAdminEmail() {
  return SUPER_ADMIN_EMAIL
}
