import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portalService } from './service'
import { usePortalContext } from './context'
import { useAuth } from '@/modules/auth/AuthContext'
import { transferenciasService } from '@/modules/academico/transferencias.service'

// ==========================================
// RESPONSÁVEL
// ==========================================
export function useResponsavel() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['portal', 'responsavel', authUser?.user.id],
    queryFn: () => portalService.buscarResponsavelPorUserId(authUser!.user.id),
    enabled: !!authUser?.user.id,
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
  const turmaId = alunoSelecionado?.turma?.id || alunoSelecionado?.turma_id || null
  return useQuery({
    queryKey: ['portal', 'dashboard', alunoSelecionado?.id, tenantId, turmaId],
    queryFn: () => portalService.buscarDashboardAluno(alunoSelecionado!.id, tenantId!, turmaId),
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
  const turmaId = alunoSelecionado?.turma?.id || alunoSelecionado?.turma_id || null
  return useQuery({
    queryKey: ['portal', 'avisos', tenantId, turmaId],
    queryFn: () => portalService.buscarAvisosPorTurma(tenantId!, turmaId),
    enabled: !!tenantId,
    refetchInterval: 10 * 60 * 1000 // Atualizar a cada 10 min se a página ficar aberta
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

export function useConfigRecados(tenantIdOverride?: string | null) {
  const { tenantId: contextTenantId } = usePortalContext()
  const tenantId = tenantIdOverride || contextTenantId
  
  return useQuery({
    queryKey: ['portal', 'config-recados', tenantId],
    queryFn: () => portalService.buscarConfigRecados(tenantId!),
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

export function useUpdatePerfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ responsavelId, dados }: { responsavelId: string; dados: any }) =>
      portalService.atualizarPerfil(responsavelId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'responsavel'] })
    },
  })
}

export function useUpdateParentesco() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vinculoId, grauParentesco }: { vinculoId: string; grauParentesco: string }) =>
      portalService.atualizarParentesco(vinculoId, grauParentesco),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    },
  })
}

// ==========================================
// SOLICITAÇÃO DE DOCUMENTOS
// ==========================================
export function useCriarSolicitacaoDocumento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: {
      tenant_id: string
      aluno_id: string
      responsavel_id: string
      documento_tipo: string
      observacoes?: string
    }) => portalService.criarSolicitacaoDocumento(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'solicitacoes'] })
    },
  })
}

export function useSolicitacoesDocumento() {
  const { data: responsavel } = useResponsavel()
  const { tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'solicitacoes', responsavel?.id, tenantId],
    queryFn: () => portalService.buscarSolicitacoesDocumento(responsavel!.id, tenantId!),
    enabled: !!responsavel?.id && !!tenantId,
  })
}

export function useTemplatesDocumento() {
  const { tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'templates-documento', tenantId],
    queryFn: () => portalService.buscarTemplatesDocumento(tenantId!),
    enabled: !!tenantId,
  })
}

// ==========================================
// MOTOR DE TRANSFERÊNCIAS
// ==========================================
export function useTransferenciasPortal() {
  const { data: vinculosRaw } = useVinculosAtivos()
  const alunoIds = vinculosRaw?.map((v: any) => v.aluno_id) || []
  
  return useQuery({
    queryKey: ['portal', 'transferencias', alunoIds],
    queryFn: () => transferenciasService.listarPorResponsavel(alunoIds),
    enabled: alunoIds.length > 0,
    staleTime: 30 * 1000,
  })
}

export function useResponderTransferencia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aprovado, motivoRecusa }: { id: string; aprovado: boolean; motivoRecusa?: string }) => 
      transferenciasService.responderResponsavel(id, aprovado, motivoRecusa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'transferencias'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
    },
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
