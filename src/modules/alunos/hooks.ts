import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { alunoService } from './service'
import type { AlunoInsert, AlunoUpdate } from '@/lib/database.types'

export function useAlunos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', authUser?.tenantId],
    queryFn: () => alunoService.listar(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAluno(id: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', id, authUser?.tenantId],
    queryFn: () => alunoService.buscarPorId(id, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!id,
  })
}

export function useAlunosAtivos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', 'ativos', authUser?.tenantId],
    queryFn: () => alunoService.contarAtivos(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAlunosPorTurma(turmaId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', 'turma', turmaId, authUser?.tenantId],
    queryFn: () => alunoService.listarPorTurma(turmaId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!turmaId,
  })
}

export function useAlunosPorResponsavel(responsavelId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', 'responsavel', responsavelId, authUser?.tenantId],
    queryFn: () => alunoService.listarPorResponsavel(responsavelId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!responsavelId,
  })
}

export function useCriarAluno() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (aluno: AlunoInsert) => alunoService.criar(aluno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    },
  })
}

export function useAtualizarAluno() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aluno }: { id: string; aluno: AlunoUpdate }) =>
      alunoService.atualizar(id, aluno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    },
  })
}
