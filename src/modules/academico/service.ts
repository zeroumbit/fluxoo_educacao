import { supabase } from '@/lib/supabase'

export const academicoService = {
  // MATRÍCULAS
  async listarMatriculas(tenantId: string) {
    const { data, error } = await (supabase.from('matriculas' as any) as any)
      .select('*, aluno:alunos(nome_completo, cpf)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarMatricula(matricula: any) {
    const { data, error } = await (supabase.from('matriculas' as any) as any).insert(matricula).select().single()
    if (error) throw error
    return data
  },

  // PLANOS DE AULA
  async listarPlanosAula(tenantId: string) {
    const { data, error } = await (supabase.from('planos_aula' as any) as any)
      .select('*, turma:turmas(nome)')
      .eq('tenant_id', tenantId).order('data_aula', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarPlanoAula(plano: any) {
    const { data, error } = await (supabase.from('planos_aula' as any) as any).insert(plano).select().single()
    if (error) throw error
    return data
  },

  // ATIVIDADES
  async listarAtividades(tenantId: string) {
    const { data, error } = await (supabase.from('atividades' as any) as any)
      .select('*, turma:turmas(nome)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async criarAtividade(atividade: any) {
    const { data, error } = await (supabase.from('atividades' as any) as any).insert(atividade).select().single()
    if (error) throw error
    return data
  },

  // SELOS
  async listarSelos(tenantId: string) {
    const { data, error } = await (supabase.from('selos' as any) as any)
      .select('*, aluno:alunos(nome_completo)')
      .eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return (data as any[]) || []
  },
  async atribuirSelo(selo: any) {
    const { data, error } = await (supabase.from('selos' as any) as any).insert(selo).select().single()
    if (error) throw error
    return data
  },
}
