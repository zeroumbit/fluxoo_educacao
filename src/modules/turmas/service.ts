import { supabase } from '@/lib/supabase'
import type { TurmaInsert, TurmaUpdate } from '@/lib/database.types'
import type { Professor, Disciplina } from './types'

export const turmaService = {
  async listar(tenantId: string, professorId?: string) {
    let query = supabase
      .from('turmas')
      .select('*, filiais(nome_unidade)')
    
    // Filtro de tenant opcional para Super Admin
    if (tenantId && tenantId !== 'super_admin') {
      query = query.eq('tenant_id', tenantId)
    }

    if (professorId) {
      const { data: turmasVinc } = await (supabase.from('turma_professores' as any) as any)
        .select('turma_id')
        .eq('professor_id', professorId)
      
      const idsT = turmasVinc?.map((t: any) => t.turma_id) || []
      
      if (idsT.length === 0) return []
      query = query.in('id', idsT)
    }

    const { data, error } = await query.order('nome')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data as any
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
   * Auxiliar para formatar o objeto Disciplina a partir do retorno do banco.
   */
  formatarDisciplina(d: any, idsOcultos: string[] = []): Disciplina {
    const DISCIPLINE_COLORS: Record<string, string> = {
      'Matemática': '#4f46e5', 'Português': '#ec4899', 'Ciências': '#10b981',
      'História': '#f59e0b', 'Geografia': '#06b6d4', 'Física': '#8b5cf6',
      'Química': '#ef4444', 'Biologia': '#22c55e', 'Inglês': '#3b82f6',
      'Educação Física': '#f97316', 'Artes': '#a855f7', 'Filosofia': '#64748b',
      'Sociologia': '#0ea5e9', 'Espanhol': '#e11d48', 'Música': '#d946ef',
      'Língua Portuguesa': '#ec4899', 'Ensino Religioso': '#78716c',
      'Redação': '#f472b6', 'Robótica': '#14b8a6', 'Informática': '#6366f1',
    }

    const code = d.nome
      .replace(/[^A-ZÀ-Ú]/gi, ' ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)

    const colorKey = Object.keys(DISCIPLINE_COLORS).find(k =>
      d.nome.toLowerCase().includes(k.toLowerCase())
    )

    const isGlobal = d.tenant_id === null
    const ativa = (d.ativa !== false) && (isGlobal ? !idsOcultos.includes(d.id) : true)

    return {
      id: d.id,
      nome: d.nome,
      codigo: code || 'DIS',
      carga_horaria_total: 0,
      cor: colorKey ? DISCIPLINE_COLORS[colorKey] : '#6366f1',
      ativa,
      etapa: d.etapa || 'TODAS',
      categoria: d.categoria || 'Outros',
      ordem: d.ordem || 999,
      tenant_id: d.tenant_id,
      is_default: d.is_default || false,
      is_global: isGlobal,
    }
  },

  /**
   * Lista disciplinas visíveis para o tenant atual (filtradas por ativos).
   */
  async listarDisciplinas(tenantId: string, etapa?: string): Promise<Disciplina[]> {
    const { data: ocultas, error: errOcultas } = await supabase
      .from('tenant_disciplinas_ocultas' as any)
      .select('disciplina_id')
      .eq('tenant_id', tenantId)

    if (errOcultas) {
      console.error('[listarDisciplinas] Erro ao buscar ocultas:', errOcultas)
    }

    const idsOcultos = (ocultas || []).map((o: any) => o.disciplina_id)
    console.log('[listarDisciplinas] IDs ocultos:', idsOcultos.length, idsOcultos)

    const query = supabase
      .from('disciplinas')
      .select('*')
      .eq('ativa', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)

    const { data, error } = await query
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })

    if (error) throw error

    const total = (data || []).length
    const filtered = (data || [])
      .filter((d: any) => {
        if (d.tenant_id === null && idsOcultos.includes(d.id)) return false;
        if (etapa && etapa !== 'TODAS') {
           return d.etapa === etapa || d.etapa === 'TODAS';
        }
        return true;
      })
    
    console.log(`[listarDisciplinas] Total do banco: ${total}, Após filtro: ${filtered.length}, Removidas: ${total - filtered.length}`)
    
    return filtered.map((d: any) => this.formatarDisciplina(d, idsOcultos))
  },

  /**
   * Lista o catálogo completo (globais + locais) para gestão, sem filtrar por 'ativa'.
   */
  async listarCatalogoDisciplinas(tenantId: string): Promise<Disciplina[]> {
    const { data: ocultas } = await supabase
      .from('tenant_disciplinas_ocultas' as any)
      .select('disciplina_id')
      .eq('tenant_id', tenantId)

    const idsOcultos = (ocultas || []).map((o: any) => o.disciplina_id)

    const { data, error } = await supabase
      .from('disciplinas' as any)
      .select('*')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .order('is_default', { ascending: false }) // Prioriza BNCC
      .order('nome', { ascending: true })

    if (error) throw error

    return (data || []).map((d: any) => this.formatarDisciplina(d, idsOcultos))
  },

  async criarDisciplinaCustomizada(nome: string, tenantId: string, etapa: string = 'TODAS', categoria: string = 'Outros') {
     const { data, error } = await supabase
       .from('disciplinas' as any)
        .insert({
          nome,
          tenant_id: tenantId,
          etapa,
          categoria,
          is_default: false,
          ativa: true
        })
       .select()
       .single()
     
     if (error) throw error
     return data
  },

  /**
   * Ativa/oculta uma disciplina para o tenant.
   */
   async toggleDisciplinaAtiva(disciplinaId: string, tenantId: string, isGlobal: boolean, ocultar: boolean) {
     if (!tenantId || tenantId === 'PENDING_TENANT') return;
     
     if (isGlobal) {
       // Disciplina BNCC global: usa tabela pivot de ocultação
       if (ocultar) {
         const { error } = await (supabase.from('tenant_disciplinas_ocultas') as any)
           .upsert(
             { tenant_id: tenantId, disciplina_id: disciplinaId }, 
             { onConflict: 'tenant_id,disciplina_id' }
           )
         if (error) {
           console.error('[toggleDisciplinaAtiva] Erro ao ocultar:', error)
           throw error
         }
       } else {
         const { error } = await supabase
           .from('tenant_disciplinas_ocultas' as any)
           .delete()
           .eq('tenant_id', tenantId)
           .eq('disciplina_id', disciplinaId)
         if (error) {
           console.error('[toggleDisciplinaAtiva] Erro ao reativar:', error)
           throw error
         }
       }
     } else {
       // Disciplina local da escola: atualiza diretamente
       const { error } = await supabase
         .from('disciplinas' as any)
         .update({ ativa: !ocultar })
         .eq('id', disciplinaId)
         .eq('tenant_id', tenantId)
       if (error) {
         console.error('[toggleDisciplinaAtiva] Erro ao alterar local:', error)
         throw error
       }
     }
   },

  /**
   * Lista professores reais.
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
      .map((f: any) => ({
        id: f.id,
        nome: f.nome_completo,
        especialidades: (Array.isArray(f.funcoes) ? f.funcoes : [f.funcao]).filter((fn: any) =>
          String(fn || '').toLowerCase().includes('professor')
        ),
        carga_horaria_maxima: 40,
        ativo: f.status === 'ativo'
      }))
  },

  // --- ACADÊMICO: ATRIBUIÇÕES E GRADE ---

  async listarAtribuicoes(tenantId: string, turmaId?: string) {
    let query = supabase
      .from('turma_professores' as any)
      .select('id, tenant_id, turma_id, professor_id, disciplina_id, carga_horaria_semanal, data_inicio, data_fim, status')
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
      .select('id, tenant_id, turma_id, disciplina_id, professor_id, dia_semana, hora_inicio, hora_fim, sala, status')
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
  },

  async contarAlunos(turmaId: string) {
    const { count, error } = await (supabase.from('matriculas' as any) as any)
      .select('*', { count: 'exact', head: true })
      .eq('turma_id', turmaId)
      .eq('status', 'ativa')

    if (error) throw error
    return count || 0
  }
}

