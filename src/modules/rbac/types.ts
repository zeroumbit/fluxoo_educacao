/**
 * Tipos TypeScript para o sistema RBAC V2.2
 * Catálogo de permissões, perfis, escopos e governança.
 */

// ========== ENUMS ==========
export type StatusFuncionarioV2 = 'ativo' | 'licenca' | 'desligado'
export type StatusUsuario = 'ativo' | 'bloqueado'
export type ScopeType = 'self' | 'minhas_turmas' | 'minhas_disciplinas' | 'minha_unidade' | 'toda_escola' | 'rede'
export type OverrideStatus = 'allow' | 'deny'

// ========== SYSTEM MODULES (Global) ==========
export type SystemModule = {
  id: string
  key: string
  nome: string
  icone: string | null
  ordem: number
  created_at: string
}

// ========== PERMISSIONS (Global Catalog) ==========
export type Permission = {
  id: string
  key: string
  modulo_key: string
  recurso: string
  acao: string
  descricao: string
  requires_approval: boolean
  created_at: string
}

// ========== PERFIS DE ACESSO ==========
export type PerfilAcesso = {
  id: string
  tenant_id: string | null
  nome: string
  descricao: string | null
  parent_perfil_id: string | null
  created_at: string
}
export type PerfilAcessoInsert = Omit<PerfilAcesso, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}
export type PerfilAcessoUpdate = Partial<PerfilAcessoInsert>

// ========== PERFIL ↔ PERMISSIONS (Matriz RBAC) ==========
export type PerfilPermission = {
  id: string
  perfil_id: string
  permission_id: string
  scope_type: ScopeType
  created_at: string
}
export type PerfilPermissionInsert = Omit<PerfilPermission, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== CARGOS V2 ==========
export type CargoV2 = {
  id: string
  tenant_id: string
  nome: string
  is_template_sistema: boolean
  created_at: string
}
export type CargoV2Insert = Omit<CargoV2, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== USUÁRIOS DO SISTEMA ==========
export type UsuarioSistema = {
  id: string
  tenant_id: string
  funcionario_id: string | null
  email_login: string
  status: StatusUsuario
  perfil_id: string | null
  created_at: string
  updated_at: string
}
export type UsuarioSistemaInsert = Omit<UsuarioSistema, 'created_at' | 'updated_at'> & {
  created_at?: string; updated_at?: string
}
export type UsuarioSistemaUpdate = Partial<UsuarioSistemaInsert>

// ========== OVERRIDES ==========
export type UserPermissionOverride = {
  id: string
  tenant_id: string
  user_id: string
  permission_id: string
  status: OverrideStatus
  concedido_por: string | null
  motivo: string | null
  created_at: string
}
export type UserPermissionOverrideInsert = Omit<UserPermissionOverride, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== APPROVAL WORKFLOWS ==========
export type ApprovalWorkflow = {
  id: string
  tenant_id: string
  permission_key: string
  threshold: number
  required_role: string
  created_at: string
}
export type ApprovalWorkflowInsert = Omit<ApprovalWorkflow, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== AUDIT LOGS V2 ==========
export type AuditLogV2 = {
  id: string
  tenant_id: string
  user_id: string
  acao: string
  recurso_id: string
  valor_anterior: Record<string, unknown> | null
  valor_novo: Record<string, unknown> | null
  motivo_declarado: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
export type AuditLogV2Insert = Omit<AuditLogV2, 'id' | 'created_at'> & {
  id?: string; created_at?: string
}

// ========== TYPES COMPOSTOS (para resolução de permissões) ==========
export type ResolvedPermission = {
  permission_key: string
  scope: ScopeType
  source: 'perfil' | 'override_allow' | 'override_deny'
}

export type PermissionCheck = {
  key: string
  scope?: ScopeType
}

// ========== VIEWS / JOINs ==========
export type PerfilAcessoComPermissoes = PerfilAcesso & {
  permissions: (PerfilPermission & { permission: Permission })[]
  parent?: PerfilAcesso | null
}

export type UsuarioSistemaCompleto = UsuarioSistema & {
  perfil?: PerfilAcesso | null
  funcionario?: {
    id: string
    nome_completo: string
    status: string
  } | null
}

// ========== CONSTANTES ==========
export const SCOPE_LABELS: Record<ScopeType, string> = {
  self: 'Apenas próprio',
  minhas_turmas: 'Minhas turmas',
  minhas_disciplinas: 'Minhas disciplinas',
  minha_unidade: 'Minha unidade',
  toda_escola: 'Toda a escola',
  rede: 'Toda a rede',
}

export const SCOPE_HIERARCHY: ScopeType[] = [
  'self',
  'minhas_turmas',
  'minhas_disciplinas',
  'minha_unidade',
  'toda_escola',
  'rede',
]

/** Mapeia ícones de módulos para componentes Lucide */
export const MODULE_ICONS: Record<string, string> = {
  dashboard: 'LayoutDashboard',
  academico: 'GraduationCap',
  comunicacao: 'Megaphone',
  financeiro: 'CreditCard',
  gestao: 'Briefcase',
  configuracoes: 'Settings',
}
