import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { academicoService } from './service'

export function useMatriculas() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['matriculas', authUser?.tenantId], queryFn: () => academicoService.listarMatriculas(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarMatricula() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.criarMatricula(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['matriculas'] }) })
}

export function usePlanosAula() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['planos_aula', authUser?.tenantId], queryFn: () => academicoService.listarPlanosAula(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarPlanoAula() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.criarPlanoAula(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['planos_aula'] }) })
}

export function useAtividades() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['atividades', authUser?.tenantId], queryFn: () => academicoService.listarAtividades(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarAtividade() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.criarAtividade(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }) })
}

export function useSelos() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['selos', authUser?.tenantId], queryFn: () => academicoService.listarSelos(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useAtribuirSelo() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.atribuirSelo(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['selos'] }) })
}
