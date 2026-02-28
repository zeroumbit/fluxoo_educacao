import { supabase } from '@/lib/supabase'

export const documentosService = {
  async listarTemplates(tenantId: string) {
    const { data, error } = await (supabase.from('documento_templates' as any) as any)
      .select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarTemplate(template: any) {
    const { data, error } = await (supabase.from('documento_templates' as any) as any).insert(template).select().single()
    if (error) throw error
    return data
  },
  async listarEmitidos(tenantId: string) {
    const { data, error } = await (supabase.from('documentos_emitidos' as any) as any)
      .select('*, template:documento_templates(titulo, tipo), aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async emitirDocumento(doc: any) {
    const { data, error } = await (supabase.from('documentos_emitidos' as any) as any).insert(doc).select().single()
    if (error) throw error
    return data
  },
}
