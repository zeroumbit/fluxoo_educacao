import { cacheEvents } from "@/lib/cache-events"
import { QueryKeys } from "@/lib/query-keys"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { alunoService } from './service'
import { overrideService } from './overrides.service'
import type { AlunoInsert, AlunoUpdate, ResponsavelInsert, OverrideFinanceiroInsert } from '@/lib/database.types'
import { toast } from 'sonner'

/**
 * Hook utilitário para centralizar a invalidação de queries de Alunos
 * Evita duplicação de chamadas ao `queryClient.invalidateQueries`
 */
export function useInvalidateAlunos() {
  const queryClient = useQueryClient()
  return (alunoId?: string, responsavelId?: string) => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.ALUNOS.ROOT })
    queryClient.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
    queryClient.invalidateQueries({ queryKey: QueryKeys.PORTAL.ROOT })
    if (alunoId) {
      queryClient.invalidateQueries({ queryKey: ['portal', 'aluno-completo', alunoId] })
    }
  }
}

export function useAlunos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: QueryKeys.ALUNOS.LIST(authUser?.tenantId, authUser?.isProfessor, authUser?.funcionarioId),
    queryFn: () => alunoService.listar(
      authUser!.tenantId, 
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
    // Permite que a query fique em cache por mais tempo por não mudar com tanta frequência
    staleTime: 5 * 60 * 1000, 
  })
}

export function useAluno(id: string) {
  const { authUser } = useAuth()

  return useQuery({
    queryKey: QueryKeys.ALUNOS.DETAIL(id, authUser?.tenantId),
    queryFn: () => alunoService.buscarPorId(id, authUser!.tenantId, authUser?.isProfessor || false),
    enabled: !!authUser?.tenantId && !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAlunosAtivos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: QueryKeys.ALUNOS.ATIVOS(authUser?.tenantId, authUser?.isProfessor, authUser?.funcionarioId),
    queryFn: () => alunoService.contarAtivos(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
  })
}

export function useCriarAluno() {
  const invalidateAlunos = useInvalidateAlunos()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (aluno: AlunoInsert) => alunoService.criar(aluno, authUser?.user.id, authUser?.isProfessor),
    onSuccess: (data) => {
      if(data) {
        cacheEvents.publish('ALUNO_CRIADO', { alunoId: data.id, tenantId: data.tenant_id });
        invalidateAlunos(data.id)
      } else {
        invalidateAlunos()
      }
    },
  })
}

export function useCriarAlunoComResponsavel() {
  const invalidateAlunos = useInvalidateAlunos()
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
    onSuccess: (data) => {
      if(data?.alunoId) {
        cacheEvents.publish('ALUNO_CRIADO', { alunoId: data.alunoId, tenantId: authUser?.tenantId });
        invalidateAlunos(data.alunoId)
      } else {
        invalidateAlunos()
      }
    },
  })
}

export function useAtualizarAluno() {
  const invalidateAlunos = useInvalidateAlunos()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: ({ id, aluno }: { id: string; aluno: AlunoUpdate }) =>
      alunoService.atualizar(id, aluno, authUser?.user.id, authUser?.tenantId, authUser?.isProfessor),
    onSuccess: (data, variables) => {
      if(data) cacheEvents.publish('ALUNO_ATUALIZADO', { alunoId: variables.id, tenantId: data.tenant_id });
      invalidateAlunos(variables.id)
    },
  })
}

export function useExcluirAluno() {
  const invalidateAlunos = useInvalidateAlunos()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (id: string) => alunoService.excluir(id, authUser?.user.id, authUser?.tenantId, authUser?.isProfessor),
    onSuccess: () => invalidateAlunos(),
  })
}

export function useAtivarAcessoPortal() {
  const invalidateAlunos = useInvalidateAlunos()
  return useMutation({
    mutationFn: ({ responsavelId, senha }: { responsavelId: string; senha: string }) =>
      alunoService.ativarAcessoPortal(responsavelId, senha),
    onSuccess: () => invalidateAlunos(),
  })
}

export function useAlternarFinanceiro() {
  const invalidateAlunos = useInvalidateAlunos()
  return useMutation({
    mutationFn: ({ vinculoId, isFinanceiro, alunoId }: { vinculoId: string; isFinanceiro: boolean; alunoId?: string }) =>
      alunoService.alternarResponsavelFinanceiro(vinculoId, isFinanceiro, alunoId),
    onSuccess: (_, variables) => {
      invalidateAlunos(variables.alunoId)
      toast.success('Responsável financeiro atualizado!')
    },
  })
}

export function useAtualizarResponsavel() {
  const invalidateAlunos = useInvalidateAlunos()
  return useMutation({
    mutationFn: ({ id, responsavel }: { id: string; responsavel: Partial<ResponsavelInsert> }) =>
      alunoService.atualizarResponsavel(id, responsavel),
    onSuccess: () => {
      invalidateAlunos()
      toast.success('Dados do responsável atualizados!')
    },
  })
}

export function useVincularResponsavel() {
  const invalidateAlunos = useInvalidateAlunos()
  return useMutation({
    mutationFn: ({ alunoId, responsavelId, grauParentesco }: { alunoId: string, responsavelId: string, grauParentesco: string }) =>
      alunoService.vincularExistente(alunoId, responsavelId, grauParentesco),
    onSuccess: (_, variables) => {
      invalidateAlunos(variables.alunoId)
      toast.success('Novo responsável vinculado!')
    },
  })
}

export function useCriarResponsavelAndVincular() {
  const invalidateAlunos = useInvalidateAlunos()
  return useMutation({
    mutationFn: ({ alunoId, responsavel, grauParentesco }: { alunoId: string, responsavel: Partial<ResponsavelInsert>, grauParentesco: string }) =>
      alunoService.criarResponsavelAndVincular(alunoId, responsavel, grauParentesco),
    onSuccess: (_, variables) => {
      invalidateAlunos(variables.alunoId)
      toast.success('Novo responsável criado e vinculado!')
    },
  })
}

export function useDesvincularResponsavel() {
  const invalidateAlunos = useInvalidateAlunos()
  return useMutation({
    mutationFn: (vinculoId: string) => alunoService.desvincularResponsavel(vinculoId),
    onSuccess: () => {
      invalidateAlunos()
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
    queryKey: QueryKeys.OVERRIDES.ALUNO(alunoId, authUser?.tenantId),
    queryFn: () => overrideService.listarAtivosPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCriarOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (override: OverrideFinanceiroInsert) => overrideService.criar(override),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.OVERRIDES.ALUNO(variables.aluno_id) })
    },
  })
}

export function useRevogarOverrides() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alunoId: string) => overrideService.revogarTodosPorAluno(alunoId),
    onSuccess: (_, alunoId) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.OVERRIDES.ALUNO(alunoId) })
    },
  })
}

export function useImportacoesPendentes() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: QueryKeys.STAGING.PENDENTES(authUser?.tenantId),
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
      queryClient.invalidateQueries({ queryKey: QueryKeys.STAGING.PENDENTES(authUser?.tenantId) })
      toast.success('Lote de importação removido com sucesso.')
    },
  })
}
