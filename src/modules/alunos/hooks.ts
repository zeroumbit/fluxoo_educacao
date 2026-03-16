import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { alunoService } from './service'
import { overrideService } from './overrides.service'
import type { AlunoInsert, AlunoUpdate, ResponsavelInsert, OverrideFinanceiroInsert } from '@/lib/database.types'
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
    mutationFn: ({ vinculoId, isFinanceiro, alunoId }: { vinculoId: string; isFinanceiro: boolean; alunoId?: string }) =>
      alunoService.alternarResponsavelFinanceiro(vinculoId, isFinanceiro, alunoId),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Responsável financeiro atualizado!')
    },
  })
}

export function useAtualizarResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, responsavel }: { id: string; responsavel: Partial<ResponsavelInsert> }) =>
      alunoService.atualizarResponsavel(id, responsavel),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Dados do responsável atualizados!')
    },
  })
}

export function useVincularResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alunoId, responsavelId, grauParentesco }: { alunoId: string, responsavelId: string, grauParentesco: string }) =>
      alunoService.vincularExistente(alunoId, responsavelId, grauParentesco),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Novo responsável vinculado!')
    },
  })
}

export function useCriarResponsavelAndVincular() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alunoId, responsavel, grauParentesco }: { alunoId: string, responsavel: Partial<ResponsavelInsert>, grauParentesco: string }) =>
      alunoService.criarResponsavelAndVincular(alunoId, responsavel, grauParentesco),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Novo responsável criado e vinculado!')
    },
  })
}

export function useDesvincularResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => alunoService.desvincularResponsavel(vinculoId),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast.success('Responsável desvinculado com sucesso.')
    },
    onError: (err: any) => {
      toast.error('Erro ao desvincular: ' + err.message)
    }
  })
}

// ========== MOTOR DE OVERRIDES FINANCEIROS ==========

export function useOverrideAtivo(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['overrides', alunoId, authUser?.tenantId],
    queryFn: () => overrideService.listarAtivosPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

export function useCriarOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (override: OverrideFinanceiroInsert) => overrideService.criar(override),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['overrides', variables.aluno_id] })
    },
  })
}

export function useRevogarOverrides() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alunoId: string) => overrideService.revogarTodosPorAluno(alunoId),
    onSuccess: (_, alunoId) => {
      queryClient.invalidateQueries({ queryKey: ['overrides', alunoId] })
    },
  })
}
