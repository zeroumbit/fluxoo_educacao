import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { assinaturaService } from './service'

export function useEscola() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['escola', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarEscola(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useLimiteAlunos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['escola', 'limite', authUser?.tenantId],
    queryFn: () => assinaturaService.buscarLimiteAlunos(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}
