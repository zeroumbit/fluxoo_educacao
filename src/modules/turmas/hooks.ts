import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { turmaService } from './service'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { z } from 'zod'

export function useTurmas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['turmas', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => turmaService.listar(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useTurma(id: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['turmas', id, authUser?.tenantId],
    queryFn: () => turmaService.buscarPorId(id, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!id,
  })
}

export function useCriarTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (turma: TurmaInsert) => turmaService.criar(turma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useAtualizarTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, turma }: { id: string; turma: TurmaUpdate }) =>
      turmaService.atualizar(id, turma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useExcluirTurma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => turmaService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turmas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useTurmaDoAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['turmas_aluno', alunoId, authUser?.tenantId],
    queryFn: () => turmaService.buscarPorAluno(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

/**
 * Busca disciplinas REAIS do banco de dados (tabela disciplinas).
 */
export function useDisciplinas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['disciplinas', authUser?.tenantId],
    queryFn: () => turmaService.listarDisciplinas(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Busca professores REAIS — funcionários ativos com função "Professor".
 * Os professores devem ser cadastrados via /funcionarios primeiro.
 */
export function useProfessoresTurma() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['professores-turma', authUser?.tenantId],
    queryFn: () => turmaService.listarProfessores(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    staleTime: 1000 * 60 * 5,
  })
}

// --- ACADÊMICO: ATRIBUIÇÕES E GRADE ---

export function useAtribuicoes(turmaId?: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['atribuicoes', authUser?.tenantId, turmaId],
    queryFn: () => turmaService.listarAtribuicoes(authUser!.tenantId, turmaId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAtribuirProfessor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (atribuicao: any) => turmaService.atribuirProfessor(atribuicao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atribuicoes'] })
    },
  })
}

export function useRemoverAtribuicao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => turmaService.removerAtribuicao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atribuicoes'] })
    },
  })
}

export function useGradeTurma(turmaId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['grade_horaria', authUser?.tenantId, turmaId],
    queryFn: () => turmaService.listarGrade(authUser!.tenantId, turmaId),
    enabled: !!authUser?.tenantId && !!turmaId,
  })
}

export function useSalvarGradeItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: any) => turmaService.salvarGradeItem(item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grade_horaria'] })
    },
  })
}

export function useRemoverGradeItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => turmaService.removerGradeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_horaria'] })
    },
  })
}

const updateMensalidadeSchema = z.object({
  turmaId: z.string().uuid(),
  tenantId: z.string().uuid(),
  valor: z.number().positive("O valor deve ser maior que zero"),
})

export const useTurmaBilling = () => {
  const queryClient = useQueryClient()

  const updateMensalidadeTurma = useMutation({
    mutationFn: async ({ turmaId, tenantId, valor }: z.infer<typeof updateMensalidadeSchema>) => {
      // @ts-ignore - RPC custom
      const { error } = await supabase.rpc('rpc_atualizar_mensalidade_turma_em_lote', {
        p_tenant_id: tenantId,
        p_turma_id: turmaId,
        p_novo_valor_cheio: valor
      })
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['turmas', variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ['alunos', variables.turmaId] })
      toast.success('Mensalidade da turma atualizada com sucesso!')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar mensalidade: ' + error.message)
    }
  })

  return {
    updateMensalidadeTurma,
    isUpdating: updateMensalidadeTurma.isPending
  }
}
