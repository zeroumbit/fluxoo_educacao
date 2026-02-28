import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { UserRole } from '@/lib/database.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { authUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Super admin tem acesso total a todas as rotas
  if (authUser.role === 'super_admin') {
    return <>{children}</>
  }

  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    // Redireciona responsável para portal
    if (authUser.role === 'responsavel') {
      return <Navigate to="/portal" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
