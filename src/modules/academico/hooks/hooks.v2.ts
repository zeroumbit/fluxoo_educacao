import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { academicoV2Service } from '../service.v2'

// ==================================================================================
// AVALIAÇÕES
// ==================================================================================

export function useAvaliacoesByTurmaDisciplina(turmaId: string, disciplinaId: string, bimestre: number) {
  return useQuery({
    queryKey: ['avaliacoes_config', turmaId, disciplinaId, bimestre],
    queryFn: () => academicoV2Service.listarAvaliacoesByTurmaDisciplina(turmaId, disciplinaId, bimestre),
    enabled: !!turmaId && !!disciplinaId && !!bimestre,
  })
}

export function useDisciplinasPorTurma(turmaId: string) {
  return useQuery({
    queryKey: ['disciplinas_turma', turmaId],
    queryFn: () => academicoV2Service.listarDisciplinasPorTurma(turmaId),
    enabled: !!turmaId,
  })
}

export function useCriarAvaliacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof academicoV2Service.criarAvaliacao>[0]) =>
      academicoV2Service.criarAvaliacao(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avaliacoes_config'] })
    },
  })
}

export function useExcluirAvaliacao() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academicoV2Service.excluirAvaliacao(id, authUser!.user.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avaliacoes_config'] })
    },
  })
}

export function useNotasPorAvaliacao(avaliacaoId: string) {
  return useQuery({
    queryKey: ['avaliacoes_notas', avaliacaoId],
    queryFn: () => academicoV2Service.listarNotasPorAvaliacao(avaliacaoId),
    enabled: !!avaliacaoId,
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
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['avaliacoes_notas', variables.avaliacaoId] })
      qc.invalidateQueries({ queryKey: ['boletim_v2'] })
      qc.invalidateQueries({ queryKey: ['portal', 'boletins'] })
    },
  })
}

// ==================================================================================
// BOLETIM CONSOLIDADO (Views V2)
// ==================================================================================

export function useBoletimV2PorTurma(turmaId: string, bimestre: number) {
  return useQuery({
    queryKey: ['boletim_v2', 'turma', turmaId, bimestre],
    queryFn: () => academicoV2Service.buscarBoletimConsolidadoPorTurma(turmaId, bimestre),
    enabled: !!turmaId && !!bimestre,
  })
}

export function useBoletimV2PorAluno(alunoId: string) {
  return useQuery({
    queryKey: ['boletim_v2', 'aluno', alunoId],
    queryFn: () => academicoV2Service.buscarBoletimConsolidadoPorAluno(alunoId),
    enabled: !!alunoId,
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
      qc.invalidateQueries({ queryKey: ['portal', 'boletins'] })
    },
  })
}

// ==================================================================================
// FECHAMENTO DE BIMESTRE
// ==================================================================================

export function useStatusFechamento(turmaId: string, bimestre: number) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['fechamento_bimestre', authUser?.tenantId, turmaId, bimestre],
    queryFn: () => academicoV2Service.buscarStatusFechamento(authUser!.tenantId, turmaId, bimestre),
    enabled: !!authUser?.tenantId && !!turmaId && !!bimestre,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fechamento_bimestre'] })
      qc.invalidateQueries({ queryKey: ['boletim_v2'] })
    },
  })
}

export function useReabrirBimestre() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ turmaId, bimestre }: { turmaId: string; bimestre: number }) =>
      academicoV2Service.reabrirBimestre(authUser!.tenantId, turmaId, bimestre),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fechamento_bimestre'] })
    },
  })
}
