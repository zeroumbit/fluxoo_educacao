import { supabase } from '@/lib/supabase'
import type { FuncaoEscolaInsert } from '@/lib/database.types'
import { validarPermissao } from '@/lib/rbac-validation'

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

  async criar(funcionario: any, userId?: string) {
    // Validação RBAC: funcionarios.create
    if (userId && funcionario.tenant_id) {
      await validarPermissao(userId, funcionario.tenant_id, 'funcionarios.create')
    }

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

  async atualizar(id: string, updates: any, userId?: string, tenantId?: string) {
    // Validação RBAC: funcionarios.update
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'funcionarios.update')
    }

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

  async excluir(id: string, userId?: string, tenantId?: string) {
    // Validação RBAC: funcionarios.delete
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'funcionarios.delete')
    }

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

  async criarUsuarioEscola(funcionarioId: string, email: string, senha: string, perfilId: string, userId?: string, tenantId?: string) {
    // Validação RBAC: funcionarios.manage_users
    if (userId && tenantId) {
      await validarPermissao(userId, tenantId, 'funcionarios.manage_users')
    }

    try {
      // 0. Buscar o tenant_id real do funcionário (Segurança extra e correção de bug de nulo)
      const { data: func, error: funcErr } = await (supabase.from('funcionarios') as any).select('tenant_id, nome_completo').eq('id', funcionarioId).single() as any
      
      if (funcErr || !func) throw new Error('Funcionário não encontrado')
      const targetTenantId = func.tenant_id
      const funcionarioNome = func.nome_completo

      // 1. Criar autenticação no Supabase Auth
      let authUserId: string | undefined;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            full_name: funcionarioNome,
            tenant_id: targetTenantId,
            role: 'funcionario',
          }
        }
      })

      if (authError) {
        // Se o usuário já existir no Auth, tentamos recuperar o ID dele para completar o vínculo
        if (authError.message.includes('User already registered') || (authError as any).status === 422) {
          console.log('ℹ️ Usuário já registrado no Auth, tentando recuperar ID por e-mail...')
          
          // No Fluxoo, se o email já existe, vamos tentar forçar o vínculo na tabela funcionarios
          // para capturar o ID que está no Auth.
          throw new Error('E-mail já está sendo usado por outro usuário no sistema. Verifique o cadastro ou use outro e-mail.')
        }
        throw new Error(authError.message)
      }

      authUserId = authData.user?.id;

      if (!authUserId) {
        throw new Error('Falha ao obter ID do usuário criado.')
      }

      // 2. Vincular o user_id ao funcionário (Legado para compatibilidade)
      const { error: updateError } = await supabase
        .from('funcionarios')
        .update({
          user_id: authUserId,
          email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funcionarioId)

      if (updateError) {
        console.error('Erro ao vincular user_id:', updateError)
        throw new Error('Usuário criado no Auth, mas falhou ao vincular ao funcionário.')
      }

      // 3. Criar registro no usuarios_sistema (Novo RBAC)
      const { error: rbacError } = await (supabase.from('usuarios_sistema' as any) as any)
        .insert({
          id: authUserId,
          tenant_id: targetTenantId,
          funcionario_id: funcionarioId,
          email_login: email,
          perfil_id: perfilId,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (rbacError) {
        console.error('Erro ao criar registro RBAC:', rbacError)
        // Não jogamos erro aqui para não invalidar a criação do usuário, mas logamos
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
  // Verificar acesso de funcionário a uma área
  async verificarAcesso(userId: string, area: string) {
    const { data, error } = await supabase.rpc('funcionario_tem_acesso_area', {
      p_funcionario_id: userId,
      p_area: area,
    })
    if (error) throw error
    return data
  },

  // ===================================================
  // FUNÇÕES / CARGOS ESCOLARES
  // ===================================================

  /** Lista funções globais (is_padrao=true) + personalizadas do tenant */
  async listarFuncoes(tenantId: string) {
    const { data, error } = await supabase
      .from('funcoes_escola' as any)
      .select('id, nome, categoria, is_padrao, ativo')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .eq('ativo', true)
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  /** Cria uma nova função personalizada para o tenant */
  async criarFuncaoCustom(payload: FuncaoEscolaInsert, userId?: string) {
    // Validação RBAC: funcionarios.funcoes.create
    if (userId && payload.tenant_id) {
      await validarPermissao(userId, payload.tenant_id, 'funcionarios.funcoes.create')
    }

    const { data, error } = await supabase
      .from('funcoes_escola' as any)
      .insert(payload as any)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ===================================================
  // FOLHA DE PAGAMENTO (INTEGRAÇÃO FINANCEIRA)
  // ===================================================

  /**
   * Gera contas a pagar para todos os funcionários ativos com salário definido.
   * Evita duplicidade para o mesmo mês/ano/funcionário.
   */
  async gerarFolhaPagamento(tenantId: string, mes: number, ano: number, userId?: string) {
    // Validação RBAC: funcionarios.folha.generate
    if (userId) {
      await validarPermissao(userId, tenantId, 'funcionarios.folha.generate')
    }

    // 1. Buscar funcionários ativos com salário e dia de pagamento
    const { data: ativos, error: errFunc } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, salario_bruto, dia_pagamento')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .gt('salario_bruto', 0)

    if (errFunc) throw errFunc
    if (!ativos || ativos.length === 0) return { gerados: 0, pulados: 0 }

    let gerados = 0
    let pulados = 0

    // 2. Iterar e criar as contas a pagar
    for (const func of ativos) {
      const nomeConta = `Salário - ${func.nome_completo}`
      // Formata a data de vencimento (YYYY-MM-DD)
      // Ajusta o dia se o mês for menor que o dia (ex: fevereiro dia 30 -> 28)
      const dia = Math.min(func.dia_pagamento || 5, new Date(ano, mes, 0).getDate())
      const dataVencimento = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

      // 3. Verificar se já existe uma conta idêntica para este mês/ano/funcionário
      // Usamos um padrão no nome ou campo de referência se existisse.
      // Aqui usaremos o nome da conta e favorecido como critério.
      const { data: existente } = await (supabase.from('contas_pagar' as any) as any)
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('nome', nomeConta)
        .eq('data_vencimento', dataVencimento)
        .maybeSingle()

      if (existente) {
        pulados++
        continue
      }

      // 4. Inserir a conta a pagar
      const { error: errInsert } = await (supabase.from('contas_pagar' as any) as any)
        .insert({
          tenant_id: tenantId,
          nome: nomeConta,
          favorecido: func.nome_completo,
          valor: func.salario_bruto,
          data_vencimento: dataVencimento,
          status: 'ativo',
          recorrente: true,
          categoria: 'Folha de Pagamento',
          created_at: new Date().toISOString()
        })

      if (errInsert) {
        console.error(`Erro ao gerar salário para ${func.nome_completo}:`, errInsert)
      } else {
        gerados++
      }
    }

    return { gerados, pulados }
  },
}
