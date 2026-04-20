import { supabase } from '@/lib/supabase'
import { MODELOS_SISTEMA_PADRAO } from './constants'

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
    // Busca modelos da escola no banco
    const { data, error } = await (supabase.from('autorizacoes_modelos' as any) as any)
      .select('*')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .eq('ativa', true)
      .order('categoria')
      .order('ordem')

    if (error) throw error
    const dbModelos = (data as any[]) || []
    
    // Mescla com padrões do sistema (Code-First)
    return this.mesclarComPadroesSistema(dbModelos)
  },

  /**
   * Helper para mesclar modelos do banco com padrões definidos no código (constants.ts)
   */
  mesclarComPadroesSistema(dbModelos: any[], incluirInativos = false) {
    // Filtra modelos do sistema que já existem no banco (pelo título e categoria)
    const virtuais = MODELOS_SISTEMA_PADRAO.filter(padrao => {
      return !dbModelos.some(db => db.categoria === padrao.categoria && db.titulo === padrao.titulo)
    }).map(padrao => ({
      ...padrao,
      id: `virtual-${padrao.categoria}-${padrao.ordem}`,
      tenant_id: null,
      ativa: true, // No portal/serviço as sugestões são visíveis por padrão se não sobrescritas
      isDefault: true
    }))

    // Se estivermos no admin, talvez queiramos manter a lógica de 'ativa: false' para virtuais
    // Mas no portal, se elas são "Padrão do Sistema", elas devem aparecer.
    
    const todos = [...dbModelos, ...virtuais]
    
    // Filtra os inativos se solicitado (no Admin queremos todos, no Portal só ativos)
    if (!incluirInativos) {
      return todos.filter(m => m.ativa)
    }

    return todos.sort((a, b) => {
      if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria)
      return (a.ordem || 0) - (b.ordem || 0)
    })
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
        .select('id, titulo, categoria, descricao_curta, obrigatoria, ordem, ativa, tenant_id')
        .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
        .order('categoria').order('ordem'),
      (supabase.from('autorizacoes_respostas' as any) as any)
        .select('modelo_id, aceita, data_resposta, responsavel:responsaveis(nome)')
        .eq('aluno_id', alunoId)
    ])

    if (modelosRes.error) throw modelosRes.error

    const dbModelos = (modelosRes.data as any[]) || []
    const modelos = this.mesclarComPadroesSistema(dbModelos, true) // Inclui inativos para o admin ver o que falta
    
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
    const [modelosEscolaRes, modelosGlobaisRes, respostasRes] = await Promise.all([
      (supabase.from('autorizacoes_modelos' as any) as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('ativa', true)
        .order('ordem'),
      (supabase.from('autorizacoes_modelos' as any) as any)
        .select('*')
        .is('tenant_id', null)
        .eq('ativa', true)
        .order('ordem'),
      (supabase.from('autorizacoes_respostas' as any) as any)
        .select('*')
        .eq('responsavel_id', responsavelId)
        .eq('aluno_id', alunoId)
    ])

    // Se houver erro na busca dos modelos da escola, falha
    if (modelosEscolaRes.error) throw modelosEscolaRes.error

    // Modelos globais podem falhar ou vir vazios se RLS for restrito, tratamos como opcional
    const dbModelosEscola = (modelosEscolaRes.data as any[]) || []
    const dbModelosGlobais = (modelosGlobaisRes.data as any[]) || []
    
    const dbModelos = [...dbModelosEscola, ...dbModelosGlobais]
    const modelos = this.mesclarComPadroesSistema(dbModelos)
    
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
    let modeloIdReal = dados.modelo_id

    // Se for um modelo VIRTUAL, precisamos criar no banco antes de responder
    if (dados.modelo_id.startsWith('virtual-')) {
      const padrao = MODELOS_SISTEMA_PADRAO.find(p => 
        `virtual-${p.categoria}-${p.ordem}` === dados.modelo_id
      )
      
      if (padrao) {
        const novoModelo = await this.criarModeloEscola({
          tenant_id: dados.tenant_id,
          categoria: padrao.categoria,
          titulo: padrao.titulo,
          descricao_curta: padrao.descricao_curta,
          texto_completo: padrao.texto_completo,
          obrigatoria: padrao.obrigatoria,
          ordem: padrao.ordem
        })
        modeloIdReal = novoModelo.id
      }
    }

    // Verifica se já existe
    const { data: existente } = await (supabase.from('autorizacoes_respostas' as any) as any)
      .select('id')
      .eq('modelo_id', modeloIdReal)
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
      modelo_id: modeloIdReal,
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
    const dbModelos = (data as any[]) || []
    
    // Mescla com padrões do sistema para o admin poder ativar
    return this.mesclarComPadroesSistema(dbModelos, true)
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
