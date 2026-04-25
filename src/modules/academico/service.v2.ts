import { supabase } from '@/lib/supabase'
import type { TurmaProfessorComDisciplina } from './types'

export type TipoAvaliacao = 'prova' | 'trabalho' | 'simulado' | 'participacao' | 'recuperacao' | 'exame_final'
export type StatusBimestre = 'aberto' | 'fechado' | 'conselho'

export interface AvaliacaoConfig {
  id: string
  tenant_id: string
  turma_id: string
  disciplina_id: string
  bimestre: number
  tipo: TipoAvaliacao
  titulo: string
  peso: number
  data_aplicacao?: string
  deleted_at?: string | null
  created_at: string
}

export interface AvaliacaoNota {
  id: string
  avaliacao_id: string
  aluno_id: string
  nota: number | null
  ausente: boolean
}

export interface BoletimConsolidado {
  aluno_id: string
  disciplina_id: string
  nome_disciplina: string
  bimestre: number
  turma_id: string
  tenant_id: string
  media_parcial: number | null
  total_faltas: number
  total_aulas_bimestre: number
  nota_recuperacao: number | null
  media_final: number | null
  resultado: 'aprovado' | 'reprovado_nota' | 'reprovado_falta' | 'aprovado_recuperacao' | 'cursando'
}

export const academicoV2Service = {
  // ==================================================================================
  // AVALIAÇÕES (CONFIG + NOTAS)
  // ==================================================================================

  async listarDisciplinasPorTurma(turmaId: string) {
    const { data, error } = await supabase
      .from('turma_professores' as never)
      .select('disciplina:disciplinas(id, nome)')
      .eq('turma_id', turmaId)
      .eq('status', 'ativo')

    if (error) throw error
    
    // Achata o resultado para retornar uma lista de disciplinas únicas
    const uniqueDisciplinas = new Map<string, { id: string; nome: string }>()
    ;(data as TurmaProfessorComDisciplina[] || []).forEach((item) => {
      if (item.disciplina && item.disciplina.id) {
        uniqueDisciplinas.set(item.disciplina.id, item.disciplina)
      }
    })
    
    return Array.from(uniqueDisciplinas.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  },


  async listarAvaliacoesByTurmaDisciplina(turmaId: string, disciplinaId: string, bimestre: number) {
    const { data, error } = await supabase
      .from('avaliacoes_config' as never)
      .select('*')
      .eq('turma_id', turmaId)
      .eq('disciplina_id', disciplinaId)
      .eq('bimestre', bimestre)
      .is('deleted_at', null)
      .order('data_aplicacao', { ascending: true })
    if (error) throw error
    return (data as unknown as AvaliacaoConfig[]) || []
  },

  async criarAvaliacao(payload: Omit<AvaliacaoConfig, 'id' | 'created_at' | 'deleted_at'>) {
    const { data, error } = await supabase
      .from('avaliacoes_config' as never)
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as unknown as AvaliacaoConfig
  },

  async excluirAvaliacao(id: string, userId: string) {
    const { error } = await supabase
      .from('avaliacoes_config' as never)
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq('id', id)
    if (error) throw error
  },

  async listarNotasPorAvaliacao(avaliacaoId: string): Promise<AvaliacaoNota[]> {
    const { data, error } = await supabase
      .from('avaliacoes_notas' as never)
      .select('*')
      .eq('avaliacao_id', avaliacaoId)
      .is('deleted_at', null)
    if (error) throw error
    return (data as unknown as AvaliacaoNota[]) || []
  },

  // Upsert em lote de notas (uma avaliação, múltiplos alunos)
  async salvarNotasEmLote(
    tenantId: string,
    avaliacaoId: string,
    userId: string,
    notas: { aluno_id: string; nota: number | null; ausente: boolean }[]
  ) {
    const payload = notas.map((n) => ({
      tenant_id: tenantId,
      avaliacao_id: avaliacaoId,
      aluno_id: n.aluno_id,
      nota: n.ausente ? null : n.nota,
      ausente: n.ausente,
      updated_by: userId,
    }))

    const { error } = await supabase
      .from('avaliacoes_notas' as never)
      .upsert(payload, { onConflict: 'avaliacao_id,aluno_id' })
    if (error) throw error
    return true
  },

  // ==================================================================================
  // BOLETIM CONSOLIDADO (Views V2)
  // ==================================================================================

  async buscarBoletimConsolidadoPorTurma(turmaId: string, bimestre: number): Promise<BoletimConsolidado[]> {
    const { data, error } = await supabase
      .from('vw_boletim_completo' as never)
      .select('*')
      .eq('turma_id', turmaId)
      .eq('bimestre', bimestre)
    if (error) throw error
    return (data as unknown as BoletimConsolidado[]) || []
  },

  async buscarBoletimConsolidadoPorAluno(alunoId: string): Promise<BoletimConsolidado[]> {
    const { data, error } = await supabase
      .from('vw_boletim_completo' as never)
      .select('*')
      .eq('aluno_id', alunoId)
      .order('bimestre', { ascending: true })
    if (error) throw error
    return (data as unknown as BoletimConsolidado[]) || []
  },

  // ==================================================================================
  // RECUPERAÇÕES (LDB Art. 24, V, "e")
  // ==================================================================================

  async salvarRecuperacao(payload: {
    tenant_id: string
    aluno_id: string
    disciplina_id: string
    bimestre: number
    nota_recuperacao: number
    registrado_por: string
  }) {
    const { error } = await supabase
      .from('recuperacoes' as never)
      .upsert(payload, { onConflict: 'aluno_id,disciplina_id,bimestre' })
    if (error) throw error
    return true
  },

  // ==================================================================================
  // FECHAMENTO DE BIMESTRE
  // ==================================================================================

  async buscarStatusFechamento(tenantId: string, turmaId: string, bimestre: number) {
    const { data, error } = await supabase
      .from('fechamento_bimestre' as never)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('turma_id', turmaId)
      .eq('bimestre', bimestre)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async fecharBimestre(payload: {
    tenant_id: string
    turma_id: string
    bimestre: number
    fechado_por: string
    observacoes?: string
  }) {
    const { error } = await supabase
      .from('fechamento_bimestre' as never)
      .upsert({
        ...payload,
        status: 'fechado' as StatusBimestre,
        fechado_em: new Date().toISOString(),
      }, { onConflict: 'tenant_id,turma_id,bimestre' })
    if (error) throw error
    return true
  },

  async reabrirBimestre(tenantId: string, turmaId: string, bimestre: number) {
    const { error } = await supabase
      .from('fechamento_bimestre' as never)
      .update({ status: 'aberto' as StatusBimestre, fechado_em: null })
      .eq('tenant_id', tenantId)
      .eq('turma_id', turmaId)
      .eq('bimestre', bimestre)
    if (error) throw error
    return true
  },

  // ==================================================================================
  // CALENDÁRIO LETIVO
  // ==================================================================================

  async listarCalendario(tenantId: string) {
    const { data, error } = await supabase
      .from('calendario_letivo' as never)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data', { ascending: true })
    if (error) throw error
    return data || []
  },

  // ==================================================================================
  // OBSERVAÇÕES PEDAGÓGICAS
  // ==================================================================================

  async salvarObservacaoPedagogica(payload: {
    tenant_id: string
    aluno_id: string
    turma_id: string
    bimestre: number
    comportamento?: string
    participacao?: string
    parecer_descritivo?: string
    registrado_por: string
  }) {
    const { error } = await supabase
      .from('observacoes_pedagogicas' as never)
      .upsert(payload, { onConflict: 'aluno_id,bimestre,turma_id' })
    if (error) throw error
    return true
  },

  async buscarObservacaoPedagogica(alunoId: string, bimestre: number, turmaId: string) {
    const { data, error } = await supabase
      .from('observacoes_pedagogicas' as never)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('bimestre', bimestre)
      .eq('turma_id', turmaId)
      .is('deleted_at', null)
      .maybeSingle()
    if (error) throw error
    return data
  },
}
