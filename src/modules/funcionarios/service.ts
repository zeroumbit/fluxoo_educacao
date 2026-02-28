import { supabase } from '@/lib/supabase'

export const funcionariosService = {
  async listar(tenantId: string) {
    const { data, error } = await (supabase.from('funcionarios' as any) as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome_completo')
    if (error) throw error
    return (data as any[]) || []
  },

  async criar(funcionario: any) {
    const { data, error } = await (supabase.from('funcionarios' as any) as any)
      .insert(funcionario).select().single()
    if (error) throw error
    return data
  },

  async atualizar(id: string, updates: any) {
    const { data, error } = await (supabase.from('funcionarios' as any) as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await (supabase.from('funcionarios' as any) as any)
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async criarUsuarioEscola(funcionarioId: string, email: string, senha: string, areasAcesso: string[]) {
    // Cria autenticação no Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { role: 'funcionario' } },
    })
    if (authError) throw authError

    // Vincula o user_id ao funcionário
    await (supabase.from('funcionarios' as any) as any)
      .update({
        user_id: authData.user?.id,
        email,
        areas_acesso: areasAcesso,
        updated_at: new Date().toISOString(),
      })
      .eq('id', funcionarioId)

    return authData
  },
}
