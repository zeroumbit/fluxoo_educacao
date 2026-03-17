import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { academicoService } from './service'

export function useMatriculas() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['matriculas', authUser?.tenantId], queryFn: () => academicoService.listarMatriculas(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useMatricula(id: string | null) {
  const { authUser } = useAuth()
  return useQuery({ 
    queryKey: ['matricula', id, authUser?.tenantId], 
    queryFn: () => academicoService.listarMatriculas(authUser!.tenantId).then(list => list.find((m: any) => m.id === id)), 
    enabled: !!authUser?.tenantId && !!id 
  })
}
export function useCriarMatricula() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => academicoService.criarMatricula(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['matriculas'] }) })
}
export function useAtualizarMatricula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarMatricula(id, authUser!.tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      qc.invalidateQueries({ queryKey: ['portal'] }) // Força o Portal a atualizar valores e turmas
    }
  })
}
export function useExcluirMatricula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academicoService.excluirMatricula(id, authUser!.tenantId),
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
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarPlanoAula(id, authUser!.tenantId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['planos_aula'] }) })
}
export function useExcluirPlanoAula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => academicoService.excluirPlanoAula(id, authUser!.tenantId), onSuccess: () => qc.invalidateQueries({ queryKey: ['planos_aula'] }) })
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
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarAtividade(id, authUser!.tenantId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }) })
}
export function useExcluirAtividade() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => academicoService.excluirAtividade(id, authUser!.tenantId), onSuccess: () => qc.invalidateQueries({ queryKey: ['atividades'] }) })
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

export function useBoletinsPorTurma(turmaId: string, anoLetivo: number, bimestre: number) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['boletins_turma', authUser?.tenantId, turmaId, anoLetivo, bimestre],
    queryFn: () => academicoService.listarBoletinsPorTurma(authUser!.tenantId, turmaId, anoLetivo, bimestre),
    enabled: !!authUser?.tenantId && !!turmaId,
  })
}

export function useUpsertNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boletimBase, disciplina, nota, faltas, observacoes }: any) =>
      academicoService.upsertNota(boletimBase, disciplina, nota, faltas, observacoes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletins_turma'] })
      qc.invalidateQueries({ queryKey: ['portal', 'boletins'] })
    }
  })
}

export function useHistoricoNotasAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['historico_notas_aluno', authUser?.tenantId, alunoId],
    queryFn: () => academicoService.listarHistoricoNotasAluno(authUser!.tenantId, alunoId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}
