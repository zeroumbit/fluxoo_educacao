import { supabase } from '@/lib/supabase'

export const documentosService = {
  async listarTemplates(tenantId: string) {
    const { data, error } = await (supabase.from('documento_templates' as any) as any)
      .select('id, tenant_id, titulo, tipo, corpo_html, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarTemplate(template: any) {
    const { data, error } = await (supabase.from('documento_templates' as any) as any).insert(template).select().single()
    if (error) throw error
    return data
  },
  async atualizarTemplate(id: string, updates: any) {
    const { data, error } = await (supabase.from('documento_templates' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async excluirTemplate(id: string) {
    const { error } = await (supabase.from('documento_templates' as any) as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  },
  async listarEmitidos(tenantId: string) {
    const { data, error } = await (supabase.from('documentos_emitidos' as any) as any)
      .select('id, tenant_id, aluno_id, template_id, created_at, template:documento_templates(titulo, tipo), aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async verificarPendenciasAutorizacao(tenantId: string, alunoId: string) {
    // 1. Busca modelos obrigatórios ativos para este tenant ou globais
    const { data: modelos, error: errModelos } = await supabase
      .from('autorizacoes_modelos')
      .select('id, titulo')
      .eq('obrigatoria', true)
      .eq('ativa', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)

    if (errModelos) throw errModelos
    if (!modelos || modelos.length === 0) return { temPendencia: false }

    // 2. Busca respostas de aceite para estes modelos e este aluno
    const modeloIds = modelos.map(m => m.id)
    const { data: respostas, error: errRespostas } = await supabase
      .from('autorizacoes_respostas')
      .select('modelo_id')
      .eq('aluno_id', alunoId)
      .eq('aceita', true)
      .in('modelo_id', modeloIds)

    if (errRespostas) throw errRespostas

    // 3. Compara: Algum modelo obrigatório não tem resposta de aceite?
    const modelosAceitos = new Set(respostas?.map(r => r.modelo_id) || [])
    const pendentes = modelos.filter(m => !modelosAceitos.has(m.id))

    return {
      temPendencia: pendentes.length > 0,
      modelosPendentes: pendentes.map(m => m.titulo)
    }
  },

  async emitirDocumento(doc: any) {
    // Validação de pendências de autorização antes de emitir
    if (doc.aluno_id) {
      const { temPendencia, modelosPendentes } = await this.verificarPendenciasAutorizacao(doc.tenant_id, doc.aluno_id)
      if (temPendencia) {
        throw new Error(`Não é possível emitir o documento. O aluno possui autorizações obrigatórias pendentes: ${(modelosPendentes || []).join(', ')}`)
      }
    }

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
        id, tenant_id, aluno_id, responsavel_id, documento_tipo, status, observacoes, created_at,
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
