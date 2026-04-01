import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { turmaService } from './service'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'

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
 * Retorna globais ativas (não ocultas) + criadas pela escola.
 * @param etapa - Filtro opcional por etapa (EI, EF1, EF2, EM)
 */
export function useDisciplinas(tenantId: string, etapa?: string) {
  return useQuery({
    queryKey: ['disciplinas', tenantId, etapa],
    queryFn: () => turmaService.listarDisciplinas(tenantId, etapa),
    enabled: !!tenantId
  })
}

export function useCatalogoDisciplinas(tenantId: string) {
  return useQuery({
    queryKey: ['disciplinas-catalogo', tenantId],
    queryFn: () => turmaService.listarCatalogoDisciplinas(tenantId),
    enabled: !!tenantId
  })
}

export function useCriarDisciplina() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nome, tenantId, etapa, categoria }: { nome: string, tenantId: string, etapa?: string, categoria?: string }) => 
      turmaService.criarDisciplinaCustomizada(nome, tenantId, etapa, categoria),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas', variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ['disciplinas-catalogo', variables.tenantId] })
      toast.success('Disciplina criada com sucesso!')
    },
    onError: (error: any) => {
      toast.error('Erro ao criar disciplina: ' + error.message)
    }
  })
}

/**
 * Mutation para ativar/ocultar disciplina (transparente: global vs local).
 */
export function useToggleDisciplinaAtiva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ disciplinaId, tenantId, isGlobal, ocultar }: { disciplinaId: string, tenantId: string, isGlobal: boolean, ocultar: boolean }) => 
      turmaService.toggleDisciplinaAtiva(disciplinaId, tenantId, isGlobal, ocultar),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas', variables.tenantId] })
      queryClient.invalidateQueries({ queryKey: ['disciplinas-catalogo', variables.tenantId] })
    }
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

export function useContarAlunosTurma(turmaId: string) {
  return useQuery({
    queryKey: ['turma_alunos_count', turmaId],
    queryFn: () => turmaService.contarAlunos(turmaId),
    enabled: !!turmaId,
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

/**
 * Hook para buscar a contagem de alunos matriculados em uma turma específica.
 * Usa a tabela matriculas para contar alunos com status ativo.
 */
export function useAlunosCountByTurma(turmaId: string) {
  const { authUser } = useAuth()
  
  return useQuery({
    queryKey: ['turmas', 'alunos-count', turmaId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('matriculas')
        .select('id', { count: 'exact', head: true })
        .eq('turma_id', turmaId)
        .eq('status', 'ativa')
        .eq('tenant_id', authUser!.tenantId)

      if (error) throw error
      return count || 0
    },
    enabled: !!authUser?.tenantId && !!turmaId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

/**
 * Hook para buscar a contagem de alunos de múltiplas turmas de uma vez.
 * Retorna um mapa de turma_id -> count.
 */
export function useAlunosCountByTurmas(turmaIds: string[]) {
  const { authUser } = useAuth()
  
  return useQuery({
    queryKey: ['turmas', 'alunos-count', turmaIds.sort()],
    queryFn: async () => {
      if (turmaIds.length === 0) return {}

      const { data, error } = await supabase
        .from('matriculas')
        .select('turma_id, id')
        .in('turma_id', turmaIds)
        .eq('status', 'ativa')
        .eq('tenant_id', authUser!.tenantId)

      if (error) throw error

      // Agrupa por turma_id e conta
      const counts: Record<string, number> = {}
      turmaIds.forEach(id => { counts[id] = 0 })
      
      data?.forEach((matricula: any) => {
        if (matricula.turma_id) {
          counts[matricula.turma_id] = (counts[matricula.turma_id] || 0) + 1
        }
      })

      return counts
    },
    enabled: !!authUser?.tenantId && turmaIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}
