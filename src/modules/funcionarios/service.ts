import { supabase } from '@/lib/supabase'

export const funcionariosService = {
  async listar(tenantId: string) {
    // Usar query mais simples possível para evitar problemas de RLS
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome_completo', { ascending: true })
    
    if (error) {
      console.error('Erro ao listar funcionários:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        tenantId
      })
      throw error
    }
    return data || []
  },

  async criar(funcionario: any) {
    // Garantir que tenant_id está sendo enviado
    if (!funcionario.tenant_id) {
      throw new Error('tenant_id é obrigatório')
    }

    // Preparar dados com valores padrão
    const dadosFuncionario = {
      ...funcionario,
      status: funcionario.status || 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('funcionarios')
      .insert(dadosFuncionario)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar funcionário:', error)
      throw new Error(error.message || 'Erro ao criar funcionário')
    }
    return data
  },

  async atualizar(id: string, updates: any) {
    const { data, error } = await supabase
      .from('funcionarios')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Erro ao atualizar funcionário:', error)
      throw error
    }
    return data
  },

  async excluir(id: string) {
    // Exclusão lógica - apenas muda o status
    const { error } = await supabase
      .from('funcionarios')
      .update({ 
        status: 'inativo', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
    if (error) {
      console.error('Erro ao desativar funcionário:', error)
      throw error
    }
  },

  async criarUsuarioEscola(funcionarioId: string, email: string, senha: string, areasAcesso: string[]) {
    try {
      // 1. Criar autenticação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { 
          data: { 
            role: 'funcionario',
            funcionario_id: funcionarioId,
          },
          emailRedirectTo: window.location.origin,
        },
      })

      if (authError) {
        console.error('Erro ao criar usuário auth:', authError)
        throw new Error(authError.message || 'Erro ao criar usuário')
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado')
      }

      // 2. Vincular o user_id ao funcionário
      const { error: updateError } = await supabase
        .from('funcionarios')
        .update({
          user_id: authData.user.id,
          email,
          areas_acesso: areasAcesso,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funcionarioId)

      if (updateError) {
        console.error('Erro ao vincular usuário ao funcionário:', updateError)
        // Tentar remover o usuário auth criado
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error('Erro ao vincular usuário ao funcionário')
      }

      return authData
    } catch (error: any) {
      console.error('Erro ao criar usuário escola:', error)
      throw error
    }
  },

  // Nova função: buscar funcionário por user_id (para sincronização)
  async buscarPorUserId(userId: string) {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*, escolas(razao_social, nome_gestor)')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  // Nova função: verificar acesso do funcionário a uma área
  async verificarAcesso(userId: string, area: string) {
    const { data, error } = await supabase.rpc('funcionario_tem_acesso_area', {
      p_funcionario_id: userId,
      p_area: area,
    })
    
    if (error) throw error
    return data
  },
}
