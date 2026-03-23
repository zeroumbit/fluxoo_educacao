export interface Disciplina {
  id: string
  tenant_id: string
  nome: string
  created_at: string
}

export interface Livro {
  id: string
  tenant_id: string
  titulo: string
  autor: string
  editora: string
  disciplina_id: string
  ano_letivo: number
  capa_url?: string | null
  descricao?: string | null
  isbn?: string | null
  estado?: 'Novo' | 'Usado' | 'Indiferente' | null
  link_referencia?: string | null
  created_at?: string
  updated_at?: string

  // Relacionamentos para exibição
  disciplina?: { nome: string }
  turmas?: { id: string; nome: string }[]
}

export interface MaterialEscolar {
  id: string
  tenant_id: string
  nome: string
  descricao?: string | null
  codigo_sku?: string | null
  categoria: string
  subcategoria?: string | null
  quantidade_sugerida: number
  unidade_medida: string
  especificacoes?: string | null
  tamanho?: string | null
  cor?: string | null
  tipo?: string | null
  marca_sugerida?: string | null
  disciplina_id?: string | null
  periodo_uso: 'Início do ano' | 'Durante o ano' | 'Específico'
  status: 'Ativo' | 'Indiferente' | 'Inativo' | 'Descontinuado' | 'Em breve'
  obrigatoriedade: 'Obrigatório' | 'Recomendado' | 'Opcional'
  data_inclusao?: string
  data_remocao?: string | null
  onde_encontrar?: string | null
  observacoes?: string | null
  link_referencia?: string | null
  preco_sugerido?: number | null
  estoque_atual?: number | null
  estoque_minimo?: number | null
  fornecedor?: string | null
  preco_unitario?: number | null
  codigo_barras?: string | null
  codigo_interno?: string | null
  data_ultima_compra?: string | null
  quantidade_por_aluno?: number | null
  incluir_na_lista_oficial: boolean
  posicao_lista?: number | null
  observacao_especifica_lista?: string | null
  imagem_url?: string | null
  is_uso_coletivo: boolean
  created_at?: string
  updated_at?: string
  
  // Relacionamentos
  disciplina?: { nome: string }
  turmas?: { id: string; nome: string }[]
}

export interface VwLivroDisponivelAluno {
  livro_id: string
  tenant_id: string
  titulo: string
  autor: string
  editora: string
  ano_letivo: number
  disciplina: string
  capa_url: string | null
  descricao: string | null
  isbn: string | null
  estado: string | null
  link_referencia: string | null
  aluno_id: string
  turma_id: string
}

export interface VwItemEscolar {
  tipo: 'livro' | 'material'
  id: string
  tenant_id: string
  titulo: string
  autor: string | null
  editora: string | null
  disciplina: string | null
  capa_url: string | null
  descricao: string | null
  isbn: string | null
  status_estado: string | null
  link_referencia: string | null
  ano_letivo: number
  aluno_id: string
  turma_id: string
  created_at: string
}
