import { supabase } from '@/lib/supabase'

export const agendaService = {
  async listarEventos(tenantId: string) {
    const { data, error } = await (supabase.from('eventos' as any) as any)
      .select('*').eq('tenant_id', tenantId).order('data_inicio', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarEvento(evento: any) {
    const { data, error } = await (supabase.from('eventos' as any) as any).insert(evento).select().single()
    if (error) throw error
    return data
  },
  async getConfigRecados(tenantId: string) {
    const { data, error } = await (supabase.from('config_recados' as any) as any)
      .select('*').eq('tenant_id', tenantId).maybeSingle()
    if (error) throw error
    return data
  },
  async upsertConfigRecados(config: any) {
    const { data, error } = await (supabase.from('config_recados' as any) as any)
      .upsert({ ...config, updated_at: new Date().toISOString() }).select().single()
    if (error) throw error
    return data
  },
}
