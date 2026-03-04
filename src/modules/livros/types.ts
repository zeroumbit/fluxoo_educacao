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
