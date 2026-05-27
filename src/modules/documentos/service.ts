import { supabase } from '@/lib/supabase'
import type {
  DocumentSolicitation,
  DocumentSolicitationUpdate,
  DocumentoEmitido,
  DocumentoEmitidoInsert,
  DocumentoTemplate,
  DocumentoTemplateInsert,
  DocumentoTemplateUpdate,
} from '@/lib/database.types'

type DocumentoEmitidoComRelacionamentos = DocumentoEmitido & {
  template: { titulo: string; tipo: string } | null
  aluno: { nome_completo: string } | null
}

type DocumentSolicitationComRelacionamentos = DocumentSolicitation & {
  aluno: { nome_completo: string; nome_social: string | null } | null
  responsavel: { nome: string; cpf: string; telefone: string | null } | null
  documento_emitido: { id: string; titulo: string; created_at: string } | null
}

export const documentosService = {
  async listarTemplates(tenantId: string) {
    const { data, error } = await supabase
      .from('documento_templates')
      .select('id, tenant_id, titulo, tipo, corpo_html, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as DocumentoTemplate[] | null) || []
  },
  async criarTemplate(template: DocumentoTemplateInsert) {
    const { data, error } = await supabase.from('documento_templates').insert(template).select().single()
    if (error) throw error
    return data
  },
  async atualizarTemplate(id: string, tenantId: string, updates: DocumentoTemplateUpdate) {
    const updatePayload: DocumentoTemplateUpdate = { ...updates, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('documento_templates')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async excluirTemplate(id: string, tenantId: string) {
    const { error } = await supabase
      .from('documento_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
  },
  async listarEmitidos(tenantId: string) {
    const { data, error } = await supabase
      .from('documentos_emitidos')
      .select('id, tenant_id, aluno_id, template_id, created_at, template:documento_templates(titulo, tipo), aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as DocumentoEmitidoComRelacionamentos[] | null) || []
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

  async emitirDocumento(doc: DocumentoEmitidoInsert) {
    // Validação de pendências de autorização antes de emitir
    if (doc.aluno_id) {
      const { temPendencia, modelosPendentes } = await this.verificarPendenciasAutorizacao(doc.tenant_id, doc.aluno_id)
      if (temPendencia) {
        throw new Error(`Não é possível emitir o documento. O aluno possui autorizações obrigatórias pendentes: ${(modelosPendentes || []).join(', ')}`)
      }
    }

    const { data, error } = await supabase.from('documentos_emitidos').insert(doc).select().single()
    if (error) throw error
    return data
  },

  // ==========================================
  // SOLICITAÇÕES DE DOCUMENTOS
  // ==========================================
  async listarSolicitacoes(tenantId: string) {
    const { data, error } = await supabase
      .from('document_solicitations')
      .select(`
        id, tenant_id, aluno_id, responsavel_id, documento_tipo, status, observacoes, created_at,
        aluno:alunos(nome_completo, nome_social),
        responsavel:responsaveis(nome, cpf, telefone),
        documento_emitido:documentos_emitidos(id, titulo, created_at)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as DocumentSolicitationComRelacionamentos[] | null) || []
  },

  async atualizarSolicitacao(id: string, tenantId: string, updates: DocumentSolicitationUpdate) {
    const updatePayload: DocumentSolicitationUpdate = { ...updates, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('document_solicitations')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async vincularDocumentoSolicitacao(solicitacaoId: string, tenantId: string, documentoEmitidoId: string) {
    const updatePayload: DocumentSolicitationUpdate = {
      documento_emitido_id: documentoEmitidoId,
      status: 'pronto',
      analysed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('document_solicitations')
      .update(updatePayload)
      .eq('id', solicitacaoId)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
