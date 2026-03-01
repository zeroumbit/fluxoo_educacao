import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AlunoInsert = Database['public']['Tables']['alunos']['Insert']
type AlunoUpdate = Database['public']['Tables']['alunos']['Update']
type ResponsavelInsert = Database['public']['Tables']['responsaveis']['Insert']
type AlunoResponsavelInsert = Database['public']['Tables']['aluno_responsavel']['Insert']

export const alunoService = {
  async listar(tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, filiais(nome_unidade)')
      .eq('tenant_id', tenantId)
      .order('nome_completo')

    if (error) throw error
    return data
  },

  async buscarPorId(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*, filiais(nome_unidade), aluno_responsavel(*, responsaveis(*))')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  },

  async contarAtivos(tenantId: string) {
    const { count, error } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')

    if (error) throw error
    return count || 0
  },

  async criar(aluno: AlunoInsert) {
    const { data, error } = await supabase
      .from('alunos')
      .insert(aluno)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async criarComResponsavel(
    responsavel: ResponsavelInsert,
    alunoDados: AlunoInsert,
    grauParentesco: string | null,
    isFinanceiro: boolean = true
  ) {
    // 0. Preparar dados (limpar CPF)
    const cpfLimpo = responsavel.cpf.replace(/\D/g, '')
    const alunoCpfLimpo = alunoDados.cpf ? alunoDados.cpf.replace(/\D/g, '') : null

    // 1. Verificar se responsável já existe pelo CPF (sempre buscar pelo limpo)
    const { data: respExistente, error: respCheckError } = await supabase
      .from('responsaveis')
      .select('id, cpf, user_id, email')
      .or(`cpf.eq.${cpfLimpo},cpf.eq.${responsavel.cpf}`)
      .maybeSingle()

    let respData: { id: string; cpf: string; user_id?: string | null } | null = null

    if (respCheckError) throw respCheckError

    let authUserId = respExistente?.user_id || null

    // 2. Criar ou Vincular usuário no Auth (se tiver email e senha e não tiver user_id)
    if (!authUserId && responsavel.email && (responsavel as any).senha_hash) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const authClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          { auth: { persistSession: false } }
        )

        const { data: authData, error: authError } = await authClient.auth.signUp({
          email: responsavel.email,
          password: (responsavel as any).senha_hash,
          options: {
            data: {
              role: 'responsavel',
              nome: responsavel.nome,
            }
          }
        })

        if (authError) {
          // Se o erro for que o usuário já existe, não paramos o fluxo, mas logamos
          if (authError.message.includes('already registered')) {
            console.warn('Usuário já existe no Auth, seguindo para vínculo manual se possível.')
            // Idealmente buscaríamos o ID do usuário existente, mas o signUp por anon não permite.
            // O ideal para esses casos é o dashboard do Supabase ter o "Confirm Email" desativado.
          } else {
            console.error('Erro ao criar usuário auth para responsável:', authError)
          }
        } else {
          authUserId = authData.user?.id || null
        }
      } catch (authErr) {
        console.error('Falha crítica no SignUp do responsável:', authErr)
      }
    }

    if (respExistente) {
      // 3. Responsável já existe, atualiza o user_id se ele foi gerado agora e estava nulo
      if (authUserId && !respExistente.user_id) {
        await supabase.from('responsaveis')
          .update({ user_id: authUserId })
          .eq('id', respExistente.id)
      }
      respData = { id: respExistente.id, cpf: respExistente.cpf, user_id: authUserId }
    } else {
      // 4. Criar novo responsável
      const { data: novaResp, error: respError } = await supabase.from('responsaveis')
        .insert({
          ...responsavel,
          cpf: cpfLimpo, // Garante CPF limpo no banco
          user_id: authUserId
        })
        .select('id, cpf, user_id')
        .single()

      if (respError) throw respError
      respData = novaResp
    }

    // 3. Criar aluno
    const { data: alunoData, error: alunoError } = await supabase.from('alunos')
      .insert(alunoDados)
      .select()
      .single()

    if (alunoError) throw alunoError

    // 4. Vincular via aluno_responsavel (N:N)
    const vinculo: AlunoResponsavelInsert = {
      aluno_id: alunoData.id,
      responsavel_id: respData!.id,
      grau_parentesco: grauParentesco,
      is_financeiro: isFinanceiro,
      is_academico: true,
      status: 'ativo'
    }
    const { error: vincError } = await supabase
      .from('aluno_responsavel')
      .insert(vinculo)

    if (vincError) throw vincError

    return alunoData
  },

  async atualizar(id: string, aluno: AlunoUpdate) {
    const { data, error } = await supabase
      .from('alunos')
      .update(aluno)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluir(id: string) {
    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async listarPorFilial(filialId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('filial_id', filialId)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .order('nome_completo')

    if (error) throw error
    return data
  },

  async ativarAcessoPortal(responsavelId: string, senha: string) {
    // 1. Buscar dados do responsável
    const { data: resp, error: respError } = await supabase
      .from('responsaveis')
      .select('nome, email, cpf, user_id')
      .eq('id', responsavelId)
      .single()

    if (respError) throw respError
    if (!resp.email) throw new Error('O responsável precisa ter um e-mail cadastrado.')

    // 2. Criar usuário no Auth usando cliente temporário
    const { createClient } = await import('@supabase/supabase-js')
    const authClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: resp.email,
      password: senha,
      options: {
        data: {
          role: 'responsavel',
          nome: resp.nome,
        }
      }
    })

    if (authError) throw authError

    // 3. Atualizar o user_id no banco
    const { error: updateError } = await supabase
      .from('responsaveis')
      .update({ 
        user_id: authData.user?.id,
        cpf: resp.cpf.replace(/\D/g, ''), // Aproveita para limpar CPF no banco se estiver sujo
        primeiro_acesso: true,
        termos_aceitos: false,
        status: 'ativo'
      })
      .eq('id', responsavelId)

    if (updateError) throw updateError

    return authData.user
  },

  async alternarResponsavelFinanceiro(vinculoId: string, isFinanceiro: boolean) {
    const { error } = await supabase
      .from('aluno_responsavel')
      .update({ is_financeiro: isFinanceiro })
      .eq('id', vinculoId)

    if (error) throw error
  }
}

