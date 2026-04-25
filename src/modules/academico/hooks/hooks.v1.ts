import { cacheEvents } from "@/lib/cache-events"
import { QueryKeys } from "@/lib/query-keys"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { academicoService } from '../services/academico.service.v1'
import { transferenciasService } from '../transferencias.service'
import type { 
  Matricula,
  MatriculaInsert, 
  MatriculaUpdate, 
  SeloInsert 
} from '@/lib/database.types'
import type { PlanoAulaComTurmas, AtividadeComTurmas } from '../types'

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
    queryFn: () => academicoService.listarMatriculas(authUser!.tenantId).then(list => list.find((m) => m.id === id)), 
    enabled: !!authUser?.tenantId && !!id 
  })
}
export function useCriarMatricula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (d: Partial<MatriculaInsert> & Record<string, unknown>) => academicoService.criarMatricula(d),
    onSuccess: (data) => {
      const m = data as Matricula;
      if (m) cacheEvents.publish('MATRICULA_CRIADA', { matriculaId: m.id, tenantId: m.tenant_id, turmaId: m.turma_id, alunoId: m.aluno_id });
      // Invalida turmas (trigger DB atualiza alunos_ids[])
      qc.invalidateQueries({ queryKey: ['turmas'] })
      // Invalida alunos (novo aluno pode aparecer na lista)
      qc.invalidateQueries({ queryKey: ['alunos'] })
      // Invalida financeiro (trigger DB gera cobranças automáticas)
      qc.invalidateQueries({ queryKey: ['cobrancas'] })
      // Invalida dashboard (métricas de alunos e financeiro)
      qc.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
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
    mutationFn: ({ id, data }: { id: string; data: Partial<MatriculaUpdate> & Record<string, unknown> }) => academicoService.atualizarMatricula(id, authUser!.tenantId, data),
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
        qc.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
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
      qc.invalidateQueries({ queryKey: QueryKeys.DASHBOARD })
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
    mutationFn: (d: PlanoAulaComTurmas) => academicoService.criarPlanoAula(d, undefined, authUser?.isProfessor ? authUser.funcionarioId : undefined),
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
    mutationFn: ({ id, data }: { id: string; data: PlanoAulaComTurmas }) => academicoService.atualizarPlanoAula(id, authUser!.tenantId, data, undefined, authUser?.isProfessor ? authUser.funcionarioId : undefined),
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
    mutationFn: (d: AtividadeComTurmas) => academicoService.criarAtividade(d),
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
    mutationFn: ({ id, data }: { id: string; data: AtividadeComTurmas }) => academicoService.atualizarAtividade(id, authUser!.tenantId, data),
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
    mutationFn: (d: SeloInsert) => academicoService.atribuirSelo(d),
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

export function useSolicitarSaida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof transferenciasService.solicitarSaida>[0]) =>
      transferenciasService.solicitarSaida(payload),
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

export function useAceitarTransferenciaDestino() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transferenciasService.aceitarTransferenciaDestino(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias', 'escola'] })
    }
  })
}

export function useRecusarTransferenciaDestino() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) =>
      transferenciasService.recusarTransferenciaDestino(id, justificativa),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias', 'escola'] })
    }
  })
}

export function useConcluirTransferencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transferenciasService.concluirTransferencia(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias', 'escola'] })
      qc.invalidateQueries({ queryKey: ['matriculas'] })
      qc.invalidateQueries({ queryKey: ['alunos'] })
    }
  })
}


export function useTransferenciasPendentesAceite() {
  const { data: transferencias } = useTransferenciasEscola()
  const { authUser } = useAuth()
  
  if (!transferencias) return 0
  
  return transferencias.filter(t => 
    t.status === 'aguardando_aceite_destino' && 
    t.escola_destino_id === authUser?.tenantId
  ).length
}
