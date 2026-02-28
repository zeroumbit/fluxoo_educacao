// Tipos do banco de dados Supabase (baseados no schema existente)
// NÃO MODIFIQUE O SCHEMA — estas são apenas as interfaces TypeScript

export type Database = {
  public: {
    Tables: {
      escolas: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          telefone: string | null
          endereco: string | null
          email: string | null
          logo_url: string | null
          plano_id: string | null
          limite_alunos: number
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          telefone?: string | null
          endereco?: string | null
          email?: string | null
          logo_url?: string | null
          plano_id?: string | null
          limite_alunos?: number
          ativo?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          telefone?: string | null
          endereco?: string | null
          email?: string | null
          logo_url?: string | null
          plano_id?: string | null
          limite_alunos?: number
          ativo?: boolean
          atualizado_em?: string
        }
      }
      alunos: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          data_nascimento: string | null
          cpf: string | null
          sexo: string | null
          endereco: string | null
          telefone: string | null
          email: string | null
          foto_url: string | null
          alergias: string | null
          medicamentos: string | null
          tipo_sanguineo: string | null
          observacoes_saude: string | null
          turma_id: string | null
          responsavel_id: string | null
          status: string
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          data_nascimento?: string | null
          cpf?: string | null
          sexo?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          foto_url?: string | null
          alergias?: string | null
          medicamentos?: string | null
          tipo_sanguineo?: string | null
          observacoes_saude?: string | null
          turma_id?: string | null
          responsavel_id?: string | null
          status?: string
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          data_nascimento?: string | null
          cpf?: string | null
          sexo?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          foto_url?: string | null
          alergias?: string | null
          medicamentos?: string | null
          tipo_sanguineo?: string | null
          observacoes_saude?: string | null
          turma_id?: string | null
          responsavel_id?: string | null
          status?: string
          atualizado_em?: string
        }
      }
      turmas: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          turno: string
          capacidade: number
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          turno: string
          capacidade?: number
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          nome?: string
          turno?: string
          capacidade?: number
          atualizado_em?: string
        }
      }
      funcionarios: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          nome: string
          cargo: string
          email: string | null
          telefone: string | null
          role: string
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          nome: string
          cargo: string
          email?: string | null
          telefone?: string | null
          role?: string
          ativo?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          nome?: string
          cargo?: string
          email?: string | null
          telefone?: string | null
          role?: string
          ativo?: boolean
          atualizado_em?: string
        }
      }
      responsaveis: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          nome: string
          cpf: string | null
          telefone: string | null
          email: string | null
          parentesco: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          nome: string
          cpf?: string | null
          telefone?: string | null
          email?: string | null
          parentesco?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          nome?: string
          cpf?: string | null
          telefone?: string | null
          email?: string | null
          parentesco?: string | null
          atualizado_em?: string
        }
      }
      frequencias: {
        Row: {
          id: string
          tenant_id: string
          aluno_id: string
          turma_id: string
          data: string
          status: string
          observacao: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          aluno_id: string
          turma_id: string
          data: string
          status: string
          observacao?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          aluno_id?: string
          turma_id?: string
          data?: string
          status?: string
          observacao?: string | null
        }
      }
      mural_avisos: {
        Row: {
          id: string
          tenant_id: string
          titulo: string
          conteudo: string
          turma_id: string | null
          autor_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          titulo: string
          conteudo: string
          turma_id?: string | null
          autor_id?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          titulo?: string
          conteudo?: string
          turma_id?: string | null
          autor_id?: string | null
          atualizado_em?: string
        }
      }
      cobrancas: {
        Row: {
          id: string
          tenant_id: string
          aluno_id: string
          descricao: string
          valor: number
          vencimento: string
          status: string
          data_pagamento: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          aluno_id: string
          descricao: string
          valor: number
          vencimento: string
          status?: string
          data_pagamento?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          aluno_id?: string
          descricao?: string
          valor?: number
          vencimento?: string
          status?: string
          data_pagamento?: string | null
          atualizado_em?: string
        }
      }
      planos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          preco: number
          limite_alunos: number
          ativo: boolean
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          preco: number
          limite_alunos: number
          ativo?: boolean
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          preco?: number
          limite_alunos?: number
          ativo?: boolean
        }
      }
      historico_assinatura: {
        Row: {
          id: string
          tenant_id: string
          plano_id: string
          data_inicio: string
          data_fim: string | null
          status: string
          criado_em: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plano_id: string
          data_inicio: string
          data_fim?: string | null
          status?: string
          criado_em?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plano_id?: string
          data_inicio?: string
          data_fim?: string | null
          status?: string
        }
      }
    }
  }
}

// Tipos auxiliares derivados do banco
export type Escola = Database['public']['Tables']['escolas']['Row']
export type Aluno = Database['public']['Tables']['alunos']['Row']
export type AlunoInsert = Database['public']['Tables']['alunos']['Insert']
export type AlunoUpdate = Database['public']['Tables']['alunos']['Update']
export type Turma = Database['public']['Tables']['turmas']['Row']
export type TurmaInsert = Database['public']['Tables']['turmas']['Insert']
export type TurmaUpdate = Database['public']['Tables']['turmas']['Update']
export type Funcionario = Database['public']['Tables']['funcionarios']['Row']
export type Responsavel = Database['public']['Tables']['responsaveis']['Row']
export type ResponsavelInsert = Database['public']['Tables']['responsaveis']['Insert']
export type Frequencia = Database['public']['Tables']['frequencias']['Row']
export type FrequenciaInsert = Database['public']['Tables']['frequencias']['Insert']
export type MuralAviso = Database['public']['Tables']['mural_avisos']['Row']
export type MuralAvisoInsert = Database['public']['Tables']['mural_avisos']['Insert']
export type Cobranca = Database['public']['Tables']['cobrancas']['Row']
export type CobrancaInsert = Database['public']['Tables']['cobrancas']['Insert']
export type CobrancaUpdate = Database['public']['Tables']['cobrancas']['Update']
export type Plano = Database['public']['Tables']['planos']['Row']
export type HistoricoAssinatura = Database['public']['Tables']['historico_assinatura']['Row']

// Tipos de roles
export type UserRole = 'super_admin' | 'admin' | 'funcionario' | 'responsavel'

// Status de frequência
export type FrequenciaStatus = 'presente' | 'falta' | 'justificada'

// Status de cobrança
export type CobrancaStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

// Status do aluno
export type AlunoStatus = 'ativo' | 'inativo'
