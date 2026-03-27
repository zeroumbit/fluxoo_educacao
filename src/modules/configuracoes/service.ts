/**
 * Serviço Centralizado de Configurações Multi-Tenant
 * 
 * Cache em memória com TTL de 5 min.
 * Invalida automaticamente ao detectar mudanças via Supabase Realtime.
 */

import { supabase } from '@/lib/supabase'
import type {
  ConfigAcademica,
  ConfigFinanceira,
  ConfigOperacional,
  ConfigConduta,
  ConfigCalendario,
  TenantSettings,
} from '@/modules/escolas/hooks/useTenantSettings'
import { DEFAULT_CONFIG } from '@/modules/escolas/hooks/useTenantSettings'

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: TenantSettings
  timestamp: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos
const cache = new Map<string, CacheEntry>()

function invalidateCache(tenantId: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(tenantId)) cache.delete(key)
  }
}

// ─── Realtime subscription ────────────────────────────────────────────────────

let realtimeInitialized = false

export function initConfiguracoesRealtime() {
  if (realtimeInitialized) return
  realtimeInitialized = true

  supabase
    .channel('configuracoes_changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracoes_escola' }, (payload: any) => {
      if (payload.new?.tenant_id) invalidateCache(payload.new.tenant_id)
    })
    .subscribe()
}

// ─── Fetch central ────────────────────────────────────────────────────────────

async function fetchConfig(tenantId: string): Promise<TenantSettings> {
  const cacheKey = `${tenantId}:all`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('contexto', 'escola')
    .is('vigencia_fim', null)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error

  const result: TenantSettings = {
    ...(DEFAULT_CONFIG as any),
    ...(data || {}),
  }

  cache.set(cacheKey, { data: result, timestamp: Date.now() })
  return result
}

// ─── Wrappers por módulo ──────────────────────────────────────────────────────

export async function getConfiguracoesAcademicas(tenantId: string): Promise<ConfigAcademica> {
  const settings = await fetchConfig(tenantId)
  return settings.config_academica
}

export async function getConfiguracoesFinanceiras(tenantId: string): Promise<ConfigFinanceira> {
  const settings = await fetchConfig(tenantId)
  return settings.config_financeira
}

export async function getConfiguracoesOperacionais(tenantId: string): Promise<ConfigOperacional> {
  const settings = await fetchConfig(tenantId)
  return settings.config_operacional
}

export async function getConfiguracoesConduta(tenantId: string): Promise<ConfigConduta> {
  const settings = await fetchConfig(tenantId)
  return settings.config_conduta
}

export async function getConfiguracoesCalendario(tenantId: string): Promise<ConfigCalendario> {
  const settings = await fetchConfig(tenantId)
  return settings.config_calendario
}

// ─── Validadores de negócio ────────────────────────────────────────────────────

export async function validarAprovacao(
  tenantId: string,
  media: number,
  faltas: number,
  totalAulas: number
): Promise<{ status: 'aprovado' | 'recuperacao' | 'reprovado' | 'reprovado_por_falta'; motivo: string }> {
  const config = await getConfiguracoesAcademicas(tenantId)
  const percentualFaltas = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0

  if (config.reprovacao_automatica_por_falta && percentualFaltas > (100 - config.frequencia_minima_perc)) {
    return { status: 'reprovado_por_falta', motivo: `Faltas acima de ${config.frequencia_minima_perc}% de frequência mínima` }
  }
  if (media >= config.media_aprovacao) {
    return { status: 'aprovado', motivo: 'Média atingida' }
  }
  if (media >= config.media_recuperacao_minima) {
    return { status: 'recuperacao', motivo: `Média entre ${config.media_recuperacao_minima} e ${config.media_aprovacao}` }
  }
  return { status: 'reprovado', motivo: `Média abaixo de ${config.media_recuperacao_minima}` }
}

export async function validarDiaLetivo(
  tenantId: string,
  data: Date
): Promise<{ valido: boolean; motivo?: string }> {
  const config = await getConfiguracoesCalendario(tenantId)

  if (config.inicio_aulas) {
    const inicio = new Date(config.inicio_aulas)
    if (data < inicio) return { valido: false, motivo: 'Data anterior ao início do ano letivo' }
  }
  if (config.termino_aulas) {
    const fim = new Date(config.termino_aulas)
    if (data > fim) return { valido: false, motivo: 'Data após o término do ano letivo' }
  }
  return { valido: true }
}

// ─── Export de invalidação para uso externo (após updateConfig) ───────────────

export { invalidateCache as invalidateConfigCache }
