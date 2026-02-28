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
export function useDocumentosEmitidos() {
  const { authUser } = useAuth()
  return useQuery({ queryKey: ['docs_emitidos', authUser?.tenantId], queryFn: () => documentosService.listarEmitidos(authUser!.tenantId), enabled: !!authUser?.tenantId })
}
export function useEmitirDocumento() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (d: any) => documentosService.emitirDocumento(d), onSuccess: () => qc.invalidateQueries({ queryKey: ['docs_emitidos'] }) })
}
