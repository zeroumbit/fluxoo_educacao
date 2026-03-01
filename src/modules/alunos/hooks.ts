import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { alunoService } from './service'
import type { AlunoInsert, AlunoUpdate, ResponsavelInsert } from '@/lib/database.types'
import { toast } from 'sonner'

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

export function useCriarAluno() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (aluno: AlunoInsert) => alunoService.criar(aluno),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCriarAlunoComResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      responsavel,
      aluno,
      grauParentesco,
      isFinanceiro,
    }: {
      responsavel: ResponsavelInsert
      aluno: AlunoInsert
      grauParentesco: string | null
      isFinanceiro?: boolean
    }) => alunoService.criarComResponsavel(responsavel, aluno, grauParentesco, isFinanceiro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useExcluirAluno() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alunoService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
export function useAtivarAcessoPortal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ responsavelId, senha }: { responsavelId: string; senha: string }) =>
      alunoService.ativarAcessoPortal(responsavelId, senha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    },
  })
}

export function useAlternarFinanceiro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vinculoId, isFinanceiro }: { vinculoId: string; isFinanceiro: boolean }) =>
      alunoService.alternarResponsavelFinanceiro(vinculoId, isFinanceiro),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Responsabilidade atualizada!')
    },
  })
}
