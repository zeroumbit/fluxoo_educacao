import { cacheEvents } from "@/lib/cache-events"
import { QueryKeys } from "@/lib/query-keys"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { alunoService } from './service'
import { overrideService } from './overrides.service'
import type { AlunoInsert, AlunoUpdate, ResponsavelInsert, OverrideFinanceiroInsert } from '@/lib/database.types'
import { toast } from 'sonner'

export function useAlunos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => alunoService.listar(
      authUser!.tenantId, 
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
  })
}

export function useAluno(id: string) {
  const { authUser } = useAuth()

  return useQuery({
    queryKey: ['alunos', id, authUser?.tenantId],
    queryFn: () => alunoService.buscarPorId(id, authUser!.tenantId, authUser?.isProfessor || false),
    enabled: !!authUser?.tenantId && !!id,
  })
}

export function useAlunosAtivos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['alunos', 'ativos', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => alunoService.contarAtivos(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarAluno() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (aluno: AlunoInsert) => alunoService.criar(aluno, authUser?.user.id, authUser?.isProfessor),
    onSuccess: (data: any) => {
      if(data) cacheEvents.publish('ALUNO_CRIADO', { alunoId: data.id, tenantId: data.tenant_id });
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    },
  })
}

export function useCriarAlunoComResponsavel() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
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
    }) => alunoService.criarComResponsavel(responsavel, aluno, grauParentesco, isFinanceiro, authUser?.user.id, authUser?.isProfessor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    },
  })
}

export function useAtualizarAluno() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: ({ id, aluno }: { id: string; aluno: AlunoUpdate }) =>
      alunoService.atualizar(id, aluno, authUser?.user.id, authUser?.tenantId, authUser?.isProfessor),
    onSuccess: (data: any, variables) => {
      if(data) cacheEvents.publish('ALUNO_ATUALIZADO', { alunoId: variables.id, tenantId: data.tenant_id });
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: ['portal', 'aluno-completo', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
    },
  })
}

export function useExcluirAluno() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (id: string) => alunoService.excluir(id, authUser?.user.id, authUser?.tenantId, authUser?.isProfessor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
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
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
    },
  })
}

export function useAlternarFinanceiro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vinculoId, isFinanceiro, alunoId }: { vinculoId: string; isFinanceiro: boolean; alunoId?: string }) =>
      alunoService.alternarResponsavelFinanceiro(vinculoId, isFinanceiro, alunoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
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
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'aluno-completo'] })
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
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
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
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      toast.success('Novo responsável criado e vinculado!')
    },
  })
}

export function useDesvincularResponsavel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vinculoId: string) => alunoService.desvincularResponsavel(vinculoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
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

export function useImportacoesPendentes() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['staging', 'pendentes', authUser?.tenantId],
    queryFn: () => alunoService.contarImportacoesPendentes(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useDeletarLoteImportacao() {
  const queryClient = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (loteId?: string) => alunoService.deletarLoteImportacao(authUser!.tenantId, loteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staging'] })
      toast.success('Lote de importação removido com sucesso.')
    },
  })
}
