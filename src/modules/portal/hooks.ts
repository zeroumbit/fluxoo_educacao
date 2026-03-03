import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portalService } from './service'
import { usePortalContext } from './context'
import { useAuth } from '@/modules/auth/AuthContext'

// ==========================================
// RESPONSÁVEL
// ==========================================
export function useResponsavel() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['portal', 'responsavel', authUser?.user.id],
    queryFn: () => portalService.buscarResponsavelPorUserId(authUser!.user.id),
    enabled: !!authUser?.user?.id,
    staleTime: 10 * 60 * 1000,
  })
}

// ==========================================
// VÍNCULOS (Multi-aluno)
// ==========================================
export function useVinculosAtivos() {
  const { data: responsavel } = useResponsavel()
  return useQuery({
    queryKey: ['portal', 'vinculos', responsavel?.id],
    queryFn: () => portalService.buscarVinculosAtivos(responsavel!.id),
    enabled: !!responsavel?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// ==========================================
// DASHBOARD DO ALUNO
// ==========================================
export function useDashboardAluno() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'dashboard', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarDashboardAluno(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
    staleTime: 30 * 1000,
  })
}

// ==========================================
// FREQUÊNCIA
// ==========================================
export function useFrequenciaAluno(mes?: string) {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'frequencia', alunoSelecionado?.id, tenantId, mes],
    queryFn: () => portalService.buscarFrequenciaPorAluno(alunoSelecionado!.id, tenantId!, mes),
    enabled: !!alunoSelecionado?.id && !!tenantId,
  })
}

// ==========================================
// AVISOS
// ==========================================
export function useAvisosPortal() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  const turmaId = alunoSelecionado?.turma_id || null
  return useQuery({
    queryKey: ['portal', 'avisos', tenantId, turmaId],
    queryFn: () => portalService.buscarAvisosPorTurma(tenantId!, turmaId),
    enabled: !!tenantId,
  })
}

// ==========================================
// COBRANÇAS
// ==========================================
export function useCobrancasAluno() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'cobrancas', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarCobrancasPorAluno(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
  })
}

export function useConfigPix() {
  const { tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'config-pix', tenantId],
    queryFn: () => portalService.buscarConfigPixEscola(tenantId!),
    enabled: !!tenantId,
  })
}

// ==========================================
// FILA VIRTUAL
// ==========================================
export function useFilaVirtual() {
  const { data: responsavel } = useResponsavel()
  const { tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'fila', responsavel?.id, tenantId],
    queryFn: () => portalService.buscarStatusFila(responsavel!.id, tenantId!),
    enabled: !!responsavel?.id && !!tenantId,
    refetchInterval: 15000, // Atualiza a cada 15s para ver mudanças de status
  })
}

export function useEntrarNaFila() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: { tenant_id: string; aluno_id: string; responsavel_id: string }) =>
      portalService.entrarNaFila(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'fila'] })
    },
  })
}

export function useCancelarFila() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filaId: string) => portalService.cancelarFila(filaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'fila'] })
    },
  })
}

// ==========================================
// LGPD
// ==========================================
export function useAceitarTermos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (responsavelId: string) => portalService.aceitarTermos(responsavelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'responsavel'] })
    },
  })
}

export function useTrocarSenha() {
  return useMutation({
    mutationFn: (novaSenha: string) => portalService.trocarSenha(novaSenha),
  })
}

// ==========================================
// BOLETIM
// ==========================================
export function useBoletins() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'boletins', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarBoletins(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
    staleTime: 5 * 60 * 1000,
  })
}
