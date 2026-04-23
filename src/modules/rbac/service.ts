/**
 * RBAC Service V2.2
 * Comunicação com Supabase para gestão de perfis, permissões, cargos e auditoria.
 */
import { supabase } from '@/lib/supabase'
import type {
  PerfilAcesso,
  PerfilAcessoInsert,
  PerfilAcessoUpdate,
  Permission,
  PerfilPermissionInsert,
  SystemModule,
  CargoV2,
  CargoV2Insert,
  UsuarioSistema,
  UsuarioSistemaInsert,
  UsuarioSistemaUpdate,
  UserPermissionOverrideInsert,
  UserPermissionOverride,
  ApprovalWorkflow,
  ApprovalWorkflowInsert,
  AuditLogV2,
  AuditLogV2Insert,
  ResolvedPermission,
  ScopeType,
} from './types'

export const rbacService = {
  // ==========================================
  // MÓDULOS DO SISTEMA (Global)
  // ==========================================
  async listarModulos(): Promise<SystemModule[]> {
    const { data, error } = await supabase
      .from('system_modules')
      .select('*')
      .order('ordem', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // CATÁLOGO DE PERMISSÕES (Global)
  // ==========================================

  async listarPermissoes(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('modulo_key', { ascending: true })
      .order('recurso', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  async listarPermissoesPorModulo(moduloKey: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('modulo_key', moduloKey)
      .order('recurso', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  // ==========================================
  // PERFIS DE ACESSO
  // ==========================================

  async listarPerfis(tenantId?: string): Promise<PerfilAcesso[]> {
    let query = supabase
      .from('perfis_acesso')
      .select('*')
      .order('nome', { ascending: true })

    // Incluir templates globais (tenant_id IS NULL) + perfis do tenant
    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data as any[]) || []
  },

  async buscarPerfil(id: string) {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async criarPerfil(perfil: PerfilAcessoInsert): Promise<PerfilAcesso> {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .insert(perfil)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizarPerfil(id: string, updates: PerfilAcessoUpdate): Promise<PerfilAcesso> {
    const { data, error } = await supabase
      .from('perfis_acesso')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async excluirPerfil(id: string): Promise<void> {
    const { error } = await supabase
      .from('perfis_acesso')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==========================================
  // MATRIZ PERFIL ↔ PERMISSÕES
  // ==========================================

  async listarPermissoesDoPerfil(perfilId: string) {
    const { data, error } = await supabase
      .from('perfil_permissions')
      .select('*, permission:permissions(*)')
      .eq('perfil_id', perfilId)

    if (error) throw error
    return (data as any[]) || []
  },

  async definirPermissoesDoPerfil(perfilId: string, permissoes: { permissionId: string; scope: ScopeType }[]) {
    // 1. Remover todas as permissões atuais do perfil
    const { error: delError } = await supabase
      .from('perfil_permissions')
      .delete()
      .eq('perfil_id', perfilId)

    if (delError) throw delError

    // 2. Inserir novas
    if (permissoes.length === 0) return

    const inserts: PerfilPermissionInsert[] = permissoes.map(p => ({
      perfil_id: perfilId,
      permission_id: p.permissionId,
      scope_type: p.scope,
    }))

    const { error } = await supabase
      .from('perfil_permissions')
      .insert(inserts)

    if (error) throw error
  },

  async adicionarPermissaoAoPerfil(perfilId: string, permissionId: string, scope: ScopeType) {
    const { error } = await supabase
      .from('perfil_permissions')
      .insert({ perfil_id: perfilId, permission_id: permissionId, scope_type: scope })

    if (error) throw error
  },

  async removerPermissaoDoPerfil(perfilId: string, permissionId: string) {
    const { error } = await supabase
      .from('perfil_permissions')
      .delete()
      .eq('perfil_id', perfilId)
      .eq('permission_id', permissionId)

    if (error) throw error
  },

  // ==========================================
  // CARGOS V2
  // ==========================================

  async listarCargos(tenantId: string): Promise<CargoV2[]> {
    const { data, error } = await supabase
      .from('cargos_v2')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nome', { ascending: true })

    if (error) throw error
    return (data as any[]) || []
  },

  async criarCargo(cargo: CargoV2Insert): Promise<CargoV2> {
    const { data, error } = await supabase
      .from('cargos_v2')
      .insert(cargo)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ==========================================
  // USUÁRIOS DO SISTEMA (RBAC)
  // ==========================================

  async listarUsuarios(tenantId: string): Promise<UsuarioSistema[]> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*, perfil:perfis_acesso(id, nome), funcionario:funcionarios(id, nome_completo, status)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  async buscarUsuarioPorAuthId(authUserId: string): Promise<UsuarioSistema | null> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*, perfil:perfis_acesso(id, nome)')
      .eq('id', authUserId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async criarUsuarioSistema(usuario: UsuarioSistemaInsert): Promise<UsuarioSistema> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .insert(usuario)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async atualizarUsuarioSistema(id: string, updates: UsuarioSistemaUpdate): Promise<UsuarioSistema> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ==========================================
  // OVERRIDES (Exceções Pontuais)
  // ==========================================

  async listarOverrides(tenantId: string): Promise<UserPermissionOverride[]> {
    const { data, error } = await supabase
      .from('user_permission_overrides')
      .select('*, permission:permissions(key, descricao), user:usuarios_sistema(email_login, funcionario:funcionarios(nome_completo))')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  },

  async criarOverride(override: UserPermissionOverrideInsert) {
    const { data, error } = await supabase
      .from('user_permission_overrides')
      .insert(override)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removerOverride(id: string) {
    const { error } = await supabase
      .from('user_permission_overrides')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==========================================
  // RESOLUÇÃO DE PERMISSÕES (RPC)
  // ==========================================

  async resolverPermissoes(userId: string): Promise<ResolvedPermission[]> {
    const { data, error } = await supabase
      .rpc('fn_resolve_user_permissions', { p_user_id: userId })

    if (error) {
      console.error('Erro ao resolver permissões via RPC:', error)
      // Fallback: resolver no frontend
      return this.resolverPermissoesClientSide(userId)
    }

    const results = Array.isArray(data) ? data : []
    return (results as any[]).map((d: any) => ({
      permission_key: d.permission_key,
      scope: d.scope,
      source: d.source,
    }))
  },

  /** Fallback: resolve permissões no client quando RPC não está disponível */
  async resolverPermissoesClientSide(userId: string): Promise<ResolvedPermission[]> {
    // 1. Buscar usuário e perfil
    const usuario = await this.buscarUsuarioPorAuthId(userId)
    if (!usuario || !usuario.perfil_id) return []

    // 2. Resolver herança de perfis (até 3 níveis)
    const permissoes: ResolvedPermission[] = []
    let currentPerfilId: string | null = usuario.perfil_id
    let depth = 0

    while (currentPerfilId && depth < 3) {
      const perfilPerms = await this.listarPermissoesDoPerfil(currentPerfilId)
      for (const pp of perfilPerms) {
        permissoes.push({
          permission_key: (pp as any).permission?.key,
          scope: pp.scope_type,
          source: 'perfil',
        })
      }

      // Subir na herança
      const perfil = await this.buscarPerfil(currentPerfilId)
      currentPerfilId = (perfil as any)?.parent_perfil_id || null
      depth++
    }

    // 3. Buscar overrides
    const { data: overrides } = await supabase
      .from('user_permission_overrides')
      .select('*, permission:permissions(key)')
      .eq('user_id', userId)

    if (overrides) {
      for (const ov of overrides as any[]) {
        permissoes.push({
          permission_key: ov.permission?.key,
          scope: 'toda_escola',
          source: ov.status === 'allow' ? 'override_allow' : 'override_deny',
        })
      }
    }

    return permissoes
  },

  // ==========================================
  // APPROVAL WORKFLOWS
  // ==========================================

  async listarWorkflows(tenantId: string): Promise<ApprovalWorkflow[]> {
    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw error
    return (data as any[]) || []
  },

  async criarWorkflow(workflow: ApprovalWorkflowInsert): Promise<ApprovalWorkflow> {
    const { data, error } = await supabase
      .from('approval_workflows')
      .insert(workflow)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ==========================================
  // AUDITORIA V2
  // ==========================================

  async listarAuditLogs(tenantId: string, options?: { limit?: number; offset?: number; acao?: string }) {
    let query = supabase
      .from('audit_logs_v2')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (options?.acao) {
      query = query.ilike('acao', `%${options.acao}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error
    return { data: (data as any[]) || [], count: count || 0 }
  },

  async criarAuditLog(log: AuditLogV2Insert) {
    const { error } = await supabase
      .from('audit_logs_v2')
      .insert(log)

    if (error) console.error('Erro ao criar audit log:', error)
  },
}
