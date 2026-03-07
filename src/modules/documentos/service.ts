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

  // ==========================================
  // SOLICITAÇÕES DE DOCUMENTOS
  // ==========================================
  async listarSolicitacoes(tenantId: string) {
    const { data, error } = await (supabase.from('document_solicitations' as any) as any)
      .select(`
        *,
        aluno:alunos(nome_completo, nome_social),
        responsavel:responsaveis(nome, cpf, telefone),
        documento_emitido:documentos_emitidos(id, titulo, created_at)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },

  async atualizarSolicitacao(id: string, updates: any) {
    const { data, error } = await (supabase.from('document_solicitations' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async vincularDocumentoSolicitacao(solicitacaoId: string, documentoEmitidoId: string) {
    const { data, error } = await (supabase.from('document_solicitations' as any) as any)
      .update({
        documento_emitido_id: documentoEmitidoId,
        status: 'pronto',
        analysed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', solicitacaoId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
