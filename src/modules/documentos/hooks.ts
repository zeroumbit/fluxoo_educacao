import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { documentosService } from './service'

export function useTemplates() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['doc_templates', authUser?.tenantId], queryFn: () => documentosService.listarTemplates(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useCriarTemplate() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => documentosService.criarTemplate(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['doc_templates'] }) })
}
export function useAtualizarTemplate() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, updates }: { id: string; updates: any }) => documentosService.atualizarTemplate(id, updates), onSuccess: () => qc.invalidateQueries({ queryKey: ['doc_templates'] }) })
}
export function useExcluirTemplate() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => documentosService.excluirTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['doc_templates'] }) })
}
export function useDocumentosEmitidos() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['docs_emitidos', authUser?.tenantId], queryFn: () => documentosService.listarEmitidos(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useEmitirDocumento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => documentosService.emitirDocumento(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['docs_emitidos'] }) })
}

// ==========================================
// SOLICITAÇÕES DE DOCUMENTOS (ESCOLA)
// ==========================================
export function useSolicitacoesDocumento() {
  const { authUser } = useAuth()
  return useQuery({
    queryKey: ['doc_solicitacoes', authUser?.tenantId],
    queryFn: () => documentosService.listarSolicitacoes(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
  })
}

export function useAtualizarSolicitacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      documentosService.atualizarSolicitacao(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc_solicitacoes'] }),
  })
}

export function useVincularDocumentoSolicitacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ solicitacaoId, documentoEmitidoId }: { solicitacaoId: string; documentoEmitidoId: string }) =>
      documentosService.vincularDocumentoSolicitacao(solicitacaoId, documentoEmitidoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc_solicitacoes', 'docs_emitidos'] }),
  })
}
