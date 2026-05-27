import { supabase } from '@/lib/supabase'
import type { ConfigRecados, ConfigRecadosInsert, ConfigRecadosUpdate, Evento, EventoInsert, EventoUpdate } from '@/lib/database.types'

type EventoPayload = EventoInsert & { id?: string }

export const agendaService = {
  async listarEventos(tenantId: string) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*').eq('tenant_id', tenantId).order('data_inicio', { ascending: false })
    if (error) throw error
    return (data as Evento[] | null) || []
  },
  async salvarEvento(evento: EventoPayload) {
    const { id, ...dados } = evento
    if (id) {
      const { data, error } = await supabase
        .from('eventos')
        .update(dados satisfies EventoUpdate)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    }
    const { data, error } = await supabase.from('eventos').insert(dados).select().single()
    if (error) throw error
    return data
  },
  async excluirEvento(id: string) {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
  async getConfigRecados(tenantId: string) {
    const { data, error } = await supabase
      .from('config_recados')
      .select('*').eq('tenant_id', tenantId).maybeSingle()
    if (error) throw error
    return data as ConfigRecados | null
  },
  async upsertConfigRecados(config: ConfigRecadosInsert | ConfigRecadosUpdate) {
    const payload = { ...config, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('config_recados')
      .upsert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
