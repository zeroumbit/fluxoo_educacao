import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { academicoV2Service } from '../service.v2'
import { QueryKeys } from '@/lib/query-keys'
import { cacheEvents } from '@/lib/cache-events'
import { toast } from 'sonner'

// ==================================================================================
// AVALIAÇÕES
// ==================================================================================

export function useAvaliacoesByTurmaDisciplina(turmaId: string, disciplinaId: string, bimestre: number) {
  return useQuery({
    queryKey: QueryKeys.TURMAS.AVALIACOES(turmaId, disciplinaId, bimestre),
    queryFn: () => academicoV2Service.listarAvaliacoesByTurmaDisciplina(turmaId, disciplinaId, bimestre),
    enabled: !!turmaId && !!disciplinaId && !!bimestre,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDisciplinasPorTurma(turmaId: string) {
  return useQuery({
    queryKey: ['disciplinas_turma', turmaId], // Could add to QueryKeys if needed
    queryFn: () => academicoV2Service.listarDisciplinasPorTurma(turmaId),
    enabled: !!turmaId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useCriarAvaliacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Parameters<typeof academicoV2Service.criarAvaliacao>[0]) => {
      const result = await academicoV2Service.criarAvaliacao(payload)
      return { result, payload }
    },
    onSuccess: ({ payload }) => {
      qc.invalidateQueries({ queryKey: QueryKeys.TURMAS.AVALIACOES(payload.turma_id, payload.disciplina_id, payload.bimestre) })
      cacheEvents.publish('AVALIACAO_CRIADA', { turmaId: payload.turma_id, disciplinaId: payload.disciplina_id })
      toast.success('Avaliação criada com sucesso!')
    },
  })
}

export function useExcluirAvaliacao() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academicoV2Service.excluirAvaliacao(id, authUser!.user.id),
    onSuccess: () => {
      // Nota: Idealmente passaríamos os IDs na mutação para invalidar exato, mas invalidate all de avaliacoes é seguro
      qc.invalidateQueries({ queryKey: ['avaliacoes_config'] })
      toast.success('Avaliação excluída.')
    }
  })
}

export function useNotasPorAvaliacao(avaliacaoId: string) {
  return useQuery({
    queryKey: QueryKeys.TURMAS.NOTAS(avaliacaoId),
    queryFn: () => academicoV2Service.listarNotasPorAvaliacao(avaliacaoId),
    enabled: !!avaliacaoId,
    staleTime: 1 * 60 * 1000, // Dados que mudam, mas evitam spam imediato
  })
}

export function useSalvarNotasEmLote() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      avaliacaoId,
      notas,
    }: {
      tenantId: string
      avaliacaoId: string
      notas: { aluno_id: string; nota: number | null; ausente: boolean }[]
    }) => academicoV2Service.salvarNotasEmLote(tenantId, avaliacaoId, authUser!.user.id, notas),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QueryKeys.TURMAS.NOTAS(variables.avaliacaoId) })
      qc.invalidateQueries({ queryKey: ['boletim_v2'] }) // Invalida genérico para garantir atualização
      qc.invalidateQueries({ queryKey: QueryKeys.PORTAL.ROOT })
      cacheEvents.publish('NOTAS_LANCADAS', { avaliacaoId: variables.avaliacaoId })
      toast.success('Notas salvas com sucesso!')
    },
  })
}

// ==================================================================================
// BOLETIM CONSOLIDADO (Views V2)
// ==================================================================================

export function useBoletimV2PorTurma(turmaId: string, bimestre: number) {
  return useQuery({
    queryKey: QueryKeys.TURMAS.BOLETIM_TURMA(turmaId, bimestre),
    queryFn: () => academicoV2Service.buscarBoletimConsolidadoPorTurma(turmaId, bimestre),
    enabled: !!turmaId && !!bimestre,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBoletimV2PorAluno(alunoId: string) {
  return useQuery({
    queryKey: QueryKeys.TURMAS.BOLETIM(alunoId),
    queryFn: () => academicoV2Service.buscarBoletimConsolidadoPorAluno(alunoId),
    enabled: !!alunoId,
    staleTime: 5 * 60 * 1000,
  })
}

// ==================================================================================
// RECUPERAÇÕES
// ==================================================================================

export function useSalvarRecuperacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof academicoV2Service.salvarRecuperacao>[0]) =>
      academicoV2Service.salvarRecuperacao(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boletim_v2'] })
      qc.invalidateQueries({ queryKey: QueryKeys.PORTAL.ROOT })
      toast.success('Recuperação salva com sucesso!')
    },
  })
}

// ==================================================================================
// FECHAMENTO DE BIMESTRE
// ==================================================================================

export function useStatusFechamento(turmaId: string, bimestre: number) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: QueryKeys.TURMAS.FECHAMENTO(authUser?.tenantId || '', turmaId, bimestre),
    queryFn: () => academicoV2Service.buscarStatusFechamento(authUser!.tenantId, turmaId, bimestre),
    enabled: !!authUser?.tenantId && !!turmaId && !!bimestre,
    staleTime: 10 * 60 * 1000,
  })
}

export function useFecharBimestre() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ turmaId, bimestre, observacoes }: { turmaId: string; bimestre: number; observacoes?: string }) =>
      academicoV2Service.fecharBimestre({
        tenant_id: authUser!.tenantId,
        turma_id: turmaId,
        bimestre,
        fechado_por: authUser!.user.id,
        observacoes,
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QueryKeys.TURMAS.FECHAMENTO(authUser!.tenantId, variables.turmaId, variables.bimestre) })
      qc.invalidateQueries({ queryKey: ['boletim_v2'] })
      cacheEvents.publish('BIMESTRE_FECHADO', { turmaId: variables.turmaId, bimestre: variables.bimestre })
      toast.success(`Bimestre ${variables.bimestre} fechado com sucesso!`)
    },
  })
}

export function useReabrirBimestre() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ turmaId, bimestre }: { turmaId: string; bimestre: number }) =>
      academicoV2Service.reabrirBimestre(authUser!.tenantId, turmaId, bimestre),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: QueryKeys.TURMAS.FECHAMENTO(authUser!.tenantId, variables.turmaId, variables.bimestre) })
      cacheEvents.publish('BIMESTRE_REABERTO', { turmaId: variables.turmaId, bimestre: variables.bimestre })
      toast.success(`Bimestre ${variables.bimestre} reaberto!`)
    },
  })
}
