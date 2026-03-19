import { supabase } from '@/lib/supabase'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'
import type { Professor, Disciplina } from './types'

export const turmaService = {
  async listar(tenantId: string) {
    let query = supabase
      .from('turmas')
      .select('*, filiais(nome_unidade)')
    
    // Filtro de tenant opcional para Super Admin
    if (tenantId && tenantId !== 'super_admin') {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query.order('nome')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string, tenantId: string) {
    let query = supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
    
    if (tenantId && tenantId !== 'super_admin') {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
  },

  async criar(turma: TurmaInsert) {
    const { data, error } = await supabase
      .from('turmas')
      .insert(turma)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizar(id: string, turma: TurmaUpdate) {
    const { data, error } = await supabase
      .from('turmas')
      .update(turma)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await supabase
      .from('turmas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async buscarPorAluno(alunoId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('tenant_id', tenantId)
      .contains('alunos_ids', [alunoId])
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Lista disciplinas reais cadastradas no banco para o tenant.
   */
  async listarDisciplinas(tenantId: string): Promise<Disciplina[]> {
    const { data, error } = await supabase
      .from('disciplinas' as any)
      .select('id, nome, tenant_id, created_at')
      .eq('tenant_id', tenantId)
      .order('nome')

    if (error) throw error

    // Map to our Disciplina interface
    const DISCIPLINE_COLORS: Record<string, string> = {
      'Matemática': '#4f46e5', 'Português': '#ec4899', 'Ciências': '#10b981',
      'História': '#f59e0b', 'Geografia': '#06b6d4', 'Física': '#8b5cf6',
      'Química': '#ef4444', 'Biologia': '#22c55e', 'Inglês': '#3b82f6',
      'Educação Física': '#f97316', 'Artes': '#a855f7', 'Filosofia': '#64748b',
      'Sociologia': '#0ea5e9', 'Espanhol': '#e11d48', 'Música': '#d946ef',
    }

    return (data || []).map((d: any) => {
      const code = d.nome
        .replace(/[^A-ZÀ-Ú]/gi, ' ')
        .split(' ')
        .filter(Boolean)
        .slice(0, 3)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3)

      // Find a matching color key
      const colorKey = Object.keys(DISCIPLINE_COLORS).find(k =>
        d.nome.toLowerCase().includes(k.toLowerCase())
      )

      return {
        id: d.id,
        nome: d.nome,
        codigo: code || 'DIS',
        carga_horaria_total: 0,
        cor: colorKey ? DISCIPLINE_COLORS[colorKey] : '#6366f1',
        ativa: true,
      }
    })
  },

  /**
   * Lista professores reais — funcionários ativos cujas funções contêm "Professor".
   */
  async listarProfessores(tenantId: string): Promise<Professor[]> {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, funcoes, funcao, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('nome_completo')

    if (error) throw error

    return (data || [])
      .filter((f: any) => {
        const funcs: string[] = Array.isArray(f.funcoes) && f.funcoes.length > 0
          ? f.funcoes
          : f.funcao ? [f.funcao] : []
        return funcs.some((fn: string) =>
          fn.toLowerCase().includes('professor')
        )
      })
      .map((f: any) => {
        const funcs: string[] = Array.isArray(f.funcoes) && f.funcoes.length > 0
          ? f.funcoes
          : f.funcao ? [f.funcao] : []

        return {
          id: f.id,
          nome: f.nome_completo,
          especialidades: funcs.filter((fn: string) =>
            fn.toLowerCase().includes('professor')
          ),
          carga_horaria_maxima: 40,
          ativo: f.status === 'ativo'
        }
      })
  },

  // --- ACADÊMICO: ATRIBUIÇÕES E GRADE ---

  async listarAtribuicoes(tenantId: string, turmaId?: string) {
    let query = supabase
      .from('turma_professores' as any)
      .select('*')
      .eq('tenant_id', tenantId)

    if (turmaId) query = query.eq('turma_id', turmaId)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async atribuirProfessor(atribuicao: any) {
    const { data, error } = await supabase
      .from('turma_professores' as any)
      .upsert(atribuicao)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removerAtribuicao(id: string) {
    const { error } = await supabase
      .from('turma_professores' as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async listarGrade(tenantId: string, turmaId?: string) {
    let query = supabase
      .from('turma_grade_horaria' as any)
      .select('*')
      .eq('tenant_id', tenantId)

    if (turmaId) query = query.eq('turma_id', turmaId)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async salvarGradeItem(item: any) {
    // Upsert baseado no constraint único (turma_id, dia_semana, hora_inicio)
    const { data, error } = await supabase
      .from('turma_grade_horaria' as any)
      .upsert(item)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removerGradeItem(id: string) {
    const { error } = await supabase
      .from('turma_grade_horaria' as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

