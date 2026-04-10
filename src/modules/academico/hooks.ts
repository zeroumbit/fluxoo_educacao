import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { academicoService } from './service'
import { transferenciasService } from './transferencias.service'

export function useMatriculas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['matriculas', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => academicoService.listarMatriculas(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId
  })
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
  return useMutation({
    mutationFn: (d: any) => academicoService.criarMatricula(d),
    onSuccess: () => {
      // Invalida matrículas (atualiza a lista)
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      // Invalida turmas (trigger DB atualiza alunos_ids[])
      qc.invalidateQueries({ queryKey: ['turmas'] })
      // Invalida alunos (novo aluno pode aparecer na lista)
      qc.invalidateQueries({ queryKey: ['alunos'] })
      // Invalida financeiro (trigger DB gera cobranças automáticas)
      qc.invalidateQueries({ queryKey: ['cobrancas'] })
      // Invalida dashboard (métricas de alunos e financeiro)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      // Invalida portal (dados do responsável)
      qc.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
      qc.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    }
  })
}
export function useAtualizarMatricula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarMatricula(id, authUser!.tenantId, data),
    onSuccess: (_, { data }) => {
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      // Invalida turmas se houve mudança de turma
      if (data?.turma_id || data?.status) {
        qc.invalidateQueries({ queryKey: ['turmas'] })
      }
      // Invalida alunos se status mudou (ativa/inativa)
      if (data?.status) {
        qc.invalidateQueries({ queryKey: ['alunos'] })
      }
      // Invalida financeiro (mensalidade, cobranças)
      if (data?.valor_matricula || data?.turma_id || data?.status) {
        qc.invalidateQueries({ queryKey: ['cobrancas'] })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      }
      qc.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
      qc.invalidateQueries({ queryKey: ['portal', 'aluno-completo'] })
    }
  })
}
export function useExcluirMatricula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academicoService.excluirMatricula(id, authUser!.tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      // Invalida turmas (trigger DB remove aluno do array alunos_ids[])
      qc.invalidateQueries({ queryKey: ['turmas'] })
      // Invalida alunos (aluno pode sair da lista de ativos)
      qc.invalidateQueries({ queryKey: ['alunos'] })
      // Invalida financeiro (cobranças podem ser canceladas)
      qc.invalidateQueries({ queryKey: ['cobrancas'] })
      // Invalida dashboard
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      // Invalida portal
      qc.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
      qc.invalidateQueries({ queryKey: ['portal', 'cobrancas'] })
      qc.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    }
  })
}
export function useMatriculasAtivas() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['matriculas_ativas', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => academicoService.listarMatriculasAtivasPorAluno(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
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
  return useQuery({
    queryKey: ['planos_aula', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => academicoService.listarPlanosAula(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId
  })
}
export function useCriarPlanoAula() {
  const qc = useQueryClient()
  const { authUser } = useAuth()
  return useMutation({
    mutationFn: (d: any) => academicoService.criarPlanoAula(d, undefined, authUser?.isProfessor ? authUser.funcionarioId : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planos_aula'] })
      qc.invalidateQueries({ queryKey: ['portal', 'planos-aula'] })
    }
  })
}
export function useAtualizarPlanoAula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarPlanoAula(id, authUser!.tenantId, data, undefined, authUser?.isProfessor ? authUser.funcionarioId : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planos_aula'] })
      qc.invalidateQueries({ queryKey: ['portal', 'planos-aula'] })
    }
  })
}
export function useExcluirPlanoAula() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academicoService.excluirPlanoAula(id, authUser!.tenantId, undefined, authUser?.isProfessor ? authUser.funcionarioId : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planos_aula'] })
      qc.invalidateQueries({ queryKey: ['portal', 'planos-aula'] })
    }
  })
}

export function useAtividades() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['atividades', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => academicoService.listarAtividades(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId
  })
}
export function useCriarAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: any) => academicoService.criarAtividade(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atividades'] })
      qc.invalidateQueries({ queryKey: ['portal', 'atividades'] })
    }
  })
}
export function useAtualizarAtividade() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => academicoService.atualizarAtividade(id, authUser!.tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atividades'] })
      qc.invalidateQueries({ queryKey: ['portal', 'atividades'] })
    }
  })
}
export function useExcluirAtividade() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => academicoService.excluirAtividade(id, authUser!.tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atividades'] })
      qc.invalidateQueries({ queryKey: ['portal', 'atividades'] })
    }
  })
}

export function useSelos() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['selos', authUser?.tenantId, authUser?.isProfessor ? authUser.funcionarioId : 'all'],
    queryFn: () => academicoService.listarSelos(
      authUser!.tenantId,
      authUser?.isProfessor ? authUser.funcionarioId : undefined
    ),
    enabled: !!authUser?.tenantId
  })
}
export function useAtribuirSelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: any) => academicoService.atribuirSelo(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['selos'] })
      qc.invalidateQueries({ queryKey: ['portal', 'selos'] })
    }
  })
}
export function useMatriculaAtivaDoAluno(alunoId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['matricula_ativa_detalhe', alunoId, authUser?.tenantId],
    queryFn: () => academicoService.buscarMatriculaAtiva(alunoId, authUser!.tenantId),
    enabled: !!authUser?.tenantId && !!alunoId,
  })
}

export function useMatriculasAtivasPorTurma(turmaId: string) {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['matriculas_ativas_turma', turmaId, authUser?.tenantId],
    queryFn: () => academicoService.listarMatriculasAtivasPorTurma(
      authUser!.tenantId,
      turmaId
    ),
    enabled: !!authUser?.tenantId && !!turmaId,
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
      // Invalida alertas_status para recalcular gravidade do radar
      // (notas baixas podem ser indicador de evasão)
      qc.invalidateQueries({ queryKey: ['alertas_status'] })
      qc.invalidateQueries({ queryKey: ['radar_evasao'] })
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

// ─── Transferências entre Escolas ─────────────────────────────────────────
export function useTransferenciasEscola() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['transferencias', 'escola', authUser?.tenantId],
    queryFn: () => transferenciasService.listarPorEscola(authUser!.tenantId!),
    enabled: !!authUser?.tenantId,
    refetchInterval: 30000,
    staleTime: 15000,
  })
}

export function useSolicitarTransferencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ alunoId, origemId, destinoId, motivo }: {
      alunoId: string; origemId: string; destinoId: string; motivo: string
    }) => transferenciasService.solicitar(alunoId, origemId, destinoId, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias', 'escola'] })
    }
  })
}

export function useCheckPermissaoTransferencia() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['transferencias', 'permissao', authUser?.tenantId],
    queryFn: () => transferenciasService.checkPermissaoEscola(authUser!.tenantId!),
    enabled: !!authUser?.tenantId,
    staleTime: 5 * 60 * 1000,
  })
}
