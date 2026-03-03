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
export function useAtualizarMatricula() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarMatricula(id, data), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matriculas'] }) 
  })
}
export function useExcluirMatricula() {
  const qc = useQueryClient()
  return useMutation({ 
    mutationFn: (id: string) => academicoService.excluirMatricula(id), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matriculas'] }) 
  })
}
export function useMatriculasAtivas() {
  const { authUser } = useAuth()
  return useQuery({ 
    queryKey: ['matriculas_ativas', authUser?.tenantId], 
    queryFn: () => academicoService.listarMatriculasAtivasPorAluno(authUser!.tenantId), 
    enabled: !!authUser?.tenantId 
  })
}
export function useVerificarMatricula(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({ 
    queryKey: ['matricula_ativa', alunoId, authUser?.tenantId], 
    queryFn: () => academicoService.verificarMatriculaAtiva(alunoId, authUser!.tenantId), 
    enabled: !!authUser?.tenantId && !!alunoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function usePlanosAula() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['planos_aula', authUser?.tenantId], queryFn: () => academicoService.listarPlanosAula(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarPlanoAula() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.criarPlanoAula(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['planos_aula'] }) })
}
export function useAtualizarPlanoAula() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarPlanoAula(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['planos_aula'] }) })
}
export function useExcluirPlanoAula() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => academicoService.excluirPlanoAula(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['planos_aula'] }) })
}

export function useAtividades() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['atividades', authUser?.tenantId], queryFn: () => academicoService.listarAtividades(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarAtividade() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.criarAtividade(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }) })
}
export function useAtualizarAtividade() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarAtividade(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }) })
}
export function useExcluirAtividade() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => academicoService.excluirAtividade(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }) })
}

export function useSelos() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['selos', authUser?.tenantId], queryFn: () => academicoService.listarSelos(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useAtribuirSelo() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.atribuirSelo(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['selos'] }) })
}
export function useMatriculaAtivaDoAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['matricula_ativa_detalhe', alunoId, authUser?.tenantId],
    queryFn: () => academicoService.buscarMatriculaAtiva(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}
