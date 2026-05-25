import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { precificacaoService } from './service'

export function usePrecoGlobal() {
  return useQuery({
    queryKey: ['precificacao', 'global'],
    queryFn: () => precificacaoService.getPrecoGlobal(),
  })
}

export function useUpsertPrecoGlobal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (valores: { valor_matriz: number; valor_filial: number }) =>
      precificacaoService.upsertPrecoGlobal(valores),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'global'] })
      qc.invalidateQueries({ queryKey: ['precificacao', 'vigente'] })
    },
  })
}

export function usePrecoCliente(tenantId: string | null) {
  return useQuery({
    queryKey: ['precificacao', 'cliente', tenantId],
    queryFn: () => precificacaoService.getPrecoCliente(tenantId!),
    enabled: !!tenantId,
  })
}

export function useUpsertPrecoCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, valores }: { tenantId: string; valores: { valor_matriz: number; valor_filial: number } }) =>
      precificacaoService.upsertPrecoCliente(tenantId, valores),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'cliente', variables.tenantId] })
      qc.invalidateQueries({ queryKey: ['precificacao', 'vigente', variables.tenantId] })
    },
  })
}

export function useRemoverPrecoCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => precificacaoService.removerPrecoCliente(tenantId),
    onSuccess: (_data, tenantId) => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'cliente', tenantId] })
      qc.invalidateQueries({ queryKey: ['precificacao', 'vigente', tenantId] })
    },
  })
}

export function usePrecosModulos(tenantId?: string) {
  return useQuery({
    queryKey: ['precificacao', 'modulos', tenantId || 'global'],
    queryFn: () => precificacaoService.getPrecosModulos(tenantId),
  })
}

export function useUpsertPrecoModuloGlobal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduloId, valores }: { moduloId: string; valores: { valor: number; trial_dias: number } }) =>
      precificacaoService.upsertPrecoModuloGlobal(moduloId, valores),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'modulos'] })
    },
  })
}

export function useUpsertPrecoModuloCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, moduloId, valores }: { tenantId: string; moduloId: string; valores: { valor: number; trial_dias: number } }) =>
      precificacaoService.upsertPrecoModuloCliente(tenantId, moduloId, valores),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'modulos', variables.tenantId] })
    },
  })
}

export function useAssinaturaModulos(tenantId: string | null) {
  return useQuery({
    queryKey: ['precificacao', 'assinatura-modulos', tenantId],
    queryFn: () => precificacaoService.getAssinaturaModulos(tenantId!),
    enabled: !!tenantId,
  })
}

export function useAtivarModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, moduloCodigo }: { tenantId: string; moduloCodigo: string }) =>
      precificacaoService.ativarModulo(tenantId, moduloCodigo),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'assinatura-modulos', variables.tenantId] })
    },
  })
}

export function useDesativarModulo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assinaturaModuloId: string) =>
      precificacaoService.desativarModulo(assinaturaModuloId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['precificacao', 'assinatura-modulos'] })
    },
  })
}

export function useCalcularFatura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, diaVencimento }: { tenantId: string; diaVencimento?: number }) =>
      precificacaoService.calcularFatura(tenantId, diaVencimento),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faturas'] })
      qc.invalidateQueries({ queryKey: ['admin', 'assinaturas'] })
    },
  })
}

export function usePrecoVigente(tenantId: string | null) {
  return useQuery({
    queryKey: ['precificacao', 'vigente', tenantId],
    queryFn: () => precificacaoService.getPrecoVigente(tenantId!),
    enabled: !!tenantId,
  })
}

export function useFaturaItens(faturaId: string | null) {
  return useQuery({
    queryKey: ['precificacao', 'fatura-itens', faturaId],
    queryFn: () => precificacaoService.getFaturaItens(faturaId!),
    enabled: !!faturaId,
  })
}

export function useRecalcularFatura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (faturaId: string) => precificacaoService.recalcularFatura(faturaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faturas'] })
      qc.invalidateQueries({ queryKey: ['precificacao', 'fatura-itens'] })
    },
  })
}

export function useAlunosPorFilial(tenantId: string | null) {
  return useQuery({
    queryKey: ['precificacao', 'alunos-por-filial', tenantId],
    queryFn: () => precificacaoService.getAlunosPorFilial(tenantId!),
    enabled: !!tenantId,
  })
}

export function useModulosDisponiveis() {
  return useQuery({
    queryKey: ['precificacao', 'modulos-disponiveis'],
    queryFn: () => precificacaoService.getModulosDisponiveis(),
  })
}
