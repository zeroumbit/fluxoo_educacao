import { useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { portalService } from './service'
import { usePortalContext } from './context'
import { useAuth } from '@/modules/auth/AuthContext'
import { transferenciasService } from '@/modules/academico/transferencias.service'
// import alertaSom from '@/assets/alerta.mp3'
const alertaSom = '/alerta_v3.mp3'

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
    staleTime: 60 * 1000,
  })
}

// ==========================================
// DASHBOARD DA FAMÍLIA (Consolidado)
// ==========================================
export function useDashboardFamilia() {
  const { vinculos, tenantId } = usePortalContext()
  
  const queries = useQueries({
    queries: (vinculos || []).map((v: any) => {
      const aId = v.aluno_id || v.aluno?.id
      const tId = v.tenant_id || v.aluno?.tenant_id || tenantId
      const turmaId = v.aluno?.turma?.id || v.aluno?.turma_id || null
      
      return {
        queryKey: ['portal', 'dashboard', aId, tId, turmaId],
        queryFn: () => portalService.buscarDashboardAluno(aId, tId, turmaId),
        enabled: !!aId && !!tId,
        staleTime: 60 * 1000,
      }
    })
  })

  const isLoading = queries.some(q => q.isLoading)
  const isError = queries.some(q => q.isError)

  const dataConsolidada = useMemo(() => {
    if (isLoading || !queries.length) return null

    return queries.reduce((acc: any, q: any) => {
      const d = q.data
      if (!d) return acc

      return {
        frequencia: {
          percentual: acc.frequencia.percentual + (d.frequencia?.percentual || 0),
          count: acc.frequencia.count + 1
        },
        financeiro: {
          totalPendente: acc.financeiro.totalPendente + (d.financeiro?.totalPendente || 0),
          totalAtrasadas: acc.financeiro.totalAtrasadas + (d.financeiro?.totalAtrasadas || 0),
          proximoVencimento: [
            acc.financeiro.proximoVencimento, 
            d.financeiro?.proximoVencimento
          ]
          .filter(Boolean)
          .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0] || null,
        },
        avisosRecentes: [...acc.avisosRecentes, ...(d.avisosRecentes || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      }
    }, {
      frequencia: { percentual: 0, count: 0 },
      financeiro: { totalPendente: 0, totalAtrasadas: 0, proximoVencimento: null },
      avisosRecentes: []
    })
  }, [queries, isLoading])

  // Ajusta média de frequência
  if (dataConsolidada && dataConsolidada.frequencia.count > 0) {
    dataConsolidada.frequencia.media = Math.round(dataConsolidada.frequencia.percentual / dataConsolidada.frequencia.count)
  }

  return { data: dataConsolidada, isLoading, isError }
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
    staleTime: 60 * 1000,
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
    staleTime: 60 * 1000,
  })
}
export function useConfigPix() {
  const { tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'config-pix', tenantId],
    queryFn: () => portalService.buscarConfigPixEscola(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 60 * 1000,
  })
}

export function useAlunoCompleto() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'aluno-completo', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarAlunoCompleto(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
    staleTime: 60 * 1000,
  })
}

export function useUpdateAlunoPortal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alunoId, responsavelId, dados }: { alunoId: string; responsavelId: string; dados: any }) =>
      portalService.atualizarAluno(alunoId, responsavelId, dados),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'aluno-completo', variables.alunoId] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'vinculos'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'dashboard'] })
    },
  })
}

// ==========================================
// SELOS / CONQUISTAS
// ==========================================
export function useSelosPortal() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'selos', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarSelos(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
    staleTime: 60 * 1000,
  })
}

// ==========================================
// PLANOS DE AULA
// ==========================================
export function usePlanosAulaPortal() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'planos-aula', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarPlanosAula(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
  })
}

// ==========================================
// ATIVIDADES
// ==========================================
export function useAtividadesPortal() {
  const { alunoSelecionado, tenantId } = usePortalContext()
  return useQuery({
    queryKey: ['portal', 'atividades', alunoSelecionado?.id, tenantId],
    queryFn: () => portalService.buscarAtividades(alunoSelecionado!.id, tenantId!),
    enabled: !!alunoSelecionado?.id && !!tenantId,
    staleTime: 60 * 1000,
  })
}

// ==========================================
// NOTIFICAÇÃO SONORA - AVISOS
// ==========================================
export function useNotificacaoSonoraAvisos() {
  const { data: avisos } = useAvisosPortal()
  const prevCountRef = useRef<number>(0)
  const { alunoSelecionado } = usePortalContext()

  useEffect(() => {
    if (!alunoSelecionado) return // Só toca se houver aluno selecionado

    const currentCount = avisos?.length || 0

    // Se é a primeira vez ou se aumentou o número de avisos
    if (prevCountRef.current > 0 && currentCount > prevCountRef.current) {
      // Cria o áudio sob demanda (evita ERR_CACHE_READ_FAILURE do Service Worker)
      try {
        const audio = new Audio(`${alertaSom}?t=${Date.now()}`)
        audio.volume = 0.5
        audio.play().catch(() => {
          // Autoplay bloqueado pelo navegador — ignora silenciosamente
        })
      } catch {
        // Falha ao criar Audio — ignora
      }
    }

    prevCountRef.current = currentCount
  }, [avisos, alunoSelecionado])
}
