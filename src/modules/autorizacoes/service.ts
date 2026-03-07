import { supabase } from '@/lib/supabase'

export type CategoriaAutorizacao = 
  | 'matricula' | 'saude' | 'imagem' | 'conduta' | 'tecnologia' 
  | 'transporte' | 'alimentacao' | 'inclusao' | 'religiosidade' 
  | 'projetos' | 'eventos'

export const CATEGORIA_LABELS: Record<string, string> = {
  matricula: 'Matrícula e Documentação',
  saude: 'Saúde e Emergências',
  imagem: 'Imagem e Comunicação',
  conduta: 'Conduta e Convivência',
  tecnologia: 'Tecnologia e Internet',
  transporte: 'Transporte e Saída',
  alimentacao: 'Alimentação',
  inclusao: 'Inclusão e AEE',
  religiosidade: 'Religiosidade e Valores',
  projetos: 'Projetos e Parcerias',
  eventos: 'Eventos e Passeios',
}

export const CATEGORIA_CORES: Record<string, { bg: string; text: string; border: string }> = {
  matricula: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  saude: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  imagem: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  conduta: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  tecnologia: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  transporte: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  alimentacao: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  inclusao: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  religiosidade: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  projetos: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  eventos: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
}

export const autorizacoesService = {
  // ==========================================
  // MODELOS (Admin)
  // ==========================================
  async buscarModelos(tenantId: string) {
    // Busca modelos globais (tenant_id IS NULL) + modelos da escola
    const { data, error } = await (supabase.from('autorizacoes_modelos' as any) as any)
      .select('*')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .eq('ativa', true)
      .order('categoria')
      .order('ordem')

    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // RESPOSTAS (Admin — visualização)
  // ==========================================
  async buscarRespostasPorAluno(alunoId: string) {
    const { data, error } = await (supabase.from('autorizacoes_respostas' as any) as any)
      .select(`
        *,
        modelo:autorizacoes_modelos(id, titulo, categoria, descricao_curta, obrigatoria),
        responsavel:responsaveis(nome, cpf)
      `)
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  async buscarResumoAutorizacoesPorAluno(alunoId: string, tenantId: string) {
    const [modelosRes, respostasRes] = await Promise.all([
      (supabase.from('autorizacoes_modelos' as any) as any)
        .select('id, titulo, categoria, descricao_curta, obrigatoria, ordem')
        .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        .eq('ativa', true)
        .order('categoria').order('ordem'),
      (supabase.from('autorizacoes_respostas' as any) as any)
        .select('modelo_id, aceita, data_resposta, responsavel:responsaveis(nome)')
        .eq('aluno_id', alunoId)
    ])

    if (modelosRes.error) throw modelosRes.error

    const modelos = (modelosRes.data as any[]) || []
    const respostas = (respostasRes.data as any[]) || []

    // Agrupa models com suas respostas
    return modelos.map((modelo: any) => {
      const resposta = respostas.find((r: any) => r.modelo_id === modelo.id)
      return {
        ...modelo,
        aceita: resposta?.aceita ?? null, // null = ainda não respondido
        data_resposta: resposta?.data_resposta ?? null,
        responsavel_nome: resposta?.responsavel?.nome ?? null,
      }
    })
  },

  // ==========================================
  // RESPOSTAS (Portal do Responsável)
  // ==========================================
  async buscarRespostasResponsavel(responsavelId: string, alunoId: string, tenantId: string) {
    const [modelosRes, respostasRes] = await Promise.all([
      (supabase.from('autorizacoes_modelos' as any) as any)
        .select('*')
        .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        .eq('ativa', true)
        .order('categoria').order('ordem'),
      (supabase.from('autorizacoes_respostas' as any) as any)
        .select('*')
        .eq('responsavel_id', responsavelId)
        .eq('aluno_id', alunoId)
    ])

    if (modelosRes.error) throw modelosRes.error

    const modelos = (modelosRes.data as any[]) || []
    const respostas = (respostasRes.data as any[]) || []

    return modelos.map((modelo: any) => {
      const resposta = respostas.find((r: any) => r.modelo_id === modelo.id)
      return {
        ...modelo,
        resposta_id: resposta?.id ?? null,
        aceita: resposta?.aceita ?? null,
        texto_lido: resposta?.texto_lido ?? false,
        data_resposta: resposta?.data_resposta ?? null,
      }
    })
  },

  async responderAutorizacao(dados: {
    tenant_id: string
    modelo_id: string
    aluno_id: string
    responsavel_id: string
    aceita: boolean
    texto_lido: boolean
  }) {
    // Verifica se já existe
    const { data: existente } = await (supabase.from('autorizacoes_respostas' as any) as any)
      .select('id')
      .eq('modelo_id', dados.modelo_id)
      .eq('aluno_id', dados.aluno_id)
      .eq('responsavel_id', dados.responsavel_id)
      .maybeSingle()

    let error: any

    if (existente) {
      // Atualiza
      const res = await (supabase.from('autorizacoes_respostas' as any) as any)
        .update({
          aceita: dados.aceita,
          texto_lido: dados.texto_lido,
          data_resposta: new Date().toISOString(),
          data_revogacao: !dados.aceita ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', existente.id)
      error = res.error
    } else {
      // Insere
      const res = await (supabase.from('autorizacoes_respostas' as any) as any)
        .insert({
          ...dados,
          data_resposta: new Date().toISOString(),
        } as any)
      error = res.error
    }

    if (error) throw error

    // Log de auditoria
    await autorizacoesService.registrarAuditoria({
      tenant_id: dados.tenant_id,
      modelo_id: dados.modelo_id,
      aluno_id: dados.aluno_id,
      responsavel_id: dados.responsavel_id,
      acao: dados.aceita ? 'autorizou' : 'revogou',
    })

    return true
  },

  async registrarAuditoria(dados: {
    tenant_id: string
    modelo_id: string
    aluno_id: string
    responsavel_id: string
    acao: 'autorizou' | 'revogou' | 'releu'
  }) {
    try {
      await (supabase.from('autorizacoes_auditoria' as any) as any).insert(dados as any)
    } catch {
      console.warn('Falha ao registrar auditoria de autorização')
    }
  },

  // ==========================================
  // GESTÃO ADMIN — Modelos da Escola
  // ==========================================
  async buscarModelosAdmin(tenantId: string) {
    // Retorna globais + da escola, incluindo inativos
    const { data, error } = await (supabase.from('autorizacoes_modelos' as any) as any)
      .select('*')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .order('categoria')
      .order('ordem')

    if (error) throw error
    return (data as any[]) || []
  },

  async criarModeloEscola(dados: {
    tenant_id: string
    categoria: string
    titulo: string
    descricao_curta: string
    texto_completo: string
    obrigatoria?: boolean
    ordem?: number
  }) {
    const { data, error } = await (supabase.from('autorizacoes_modelos' as any) as any)
      .insert({ ...dados, ativa: true } as any)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizarModelo(id: string, updates: {
    titulo?: string
    descricao_curta?: string
    texto_completo?: string
    categoria?: string
    ativa?: boolean
    obrigatoria?: boolean
    ordem?: number
  }) {
    const { data, error } = await (supabase.from('autorizacoes_modelos' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async toggleAtivo(id: string, ativa: boolean) {
    const { error } = await (supabase.from('autorizacoes_modelos' as any) as any)
      .update({ ativa, updated_at: new Date().toISOString() } as any)
      .eq('id', id)

    if (error) throw error
  },
}
