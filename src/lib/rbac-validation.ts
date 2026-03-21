/**
 * Utilitário de Validação RBAC para Serviços
 * 
 * Este módulo fornece funções para validar permissões RBAC no lado do servidor/serviço,
 * garantindo que operações de escrita (INSERT/UPDATE/DELETE) sejam protegidas mesmo
 * se a UI for bypassada.
 * 
 * USO: Importar e chamar antes de operações críticas em cada serviço.
 * 
 * @example
 * await validarPermissao(userId, tenantId, 'financeiro.cobrancas.create')
 * await validarPermissao(userId, tenantId, 'alunos.update')
 */

import { supabase } from '@/lib/supabase'
import { rbacService } from '@/modules/rbac/service'
import type { ScopeType } from '@/modules/rbac/types'

/**
 * Exceção personalizada para erros de permissão RBAC
 */
export class RBACValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RBACValidationError'
  }
}

/**
 * Valida se um usuário tem permissão para executar uma ação específica.
 * 
 * REGRAS DE NEGÓCIO:
 * - Super Admin (role='super_admin') tem acesso total a tudo
 * - Gestor da escola (gestor_user_id) tem acesso total na própria escola
 * - Responsável (role='responsavel') tem acesso limitado ao portal
 * - Funcionários seguem matriz RBAC do tenant
 * 
 * @param userId - ID do usuário autenticado (auth.uid())
 * @param tenantId - ID do tenant (escola)
 * @param permissionKey - Chave da permissão (ex: 'financeiro.cobrancas.create')
 * @throws {RBACValidationError} Se usuário não tiver permissão
 */
export async function validarPermissao(
  userId: string,
  tenantId: string,
  permissionKey: string
): Promise<void> {
  // 1. Buscar perfil do usuário para verificar se é Super Admin ou Gestor
  const { data: userData, error: userError } = await supabase
    .from('usuarios_sistema' as any)
    .select('*, perfil:perfis_acesso(nome), funcionario:funcionarios(status)')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    console.error('[RBAC] Erro ao buscar dados do usuário:', userError)
    throw new RBACValidationError('Erro ao validar permissões')
  }

  // 2. Super Admin tem acesso total
  if (userData && 'perfil' in userData && Array.isArray(userData.perfil) && userData.perfil[0]?.nome === 'Super Admin') {
    return // Acesso concedido
  }

  // 3. Verificar se é gestor da escola (acesso total na própria escola)
  const { data: escolaData } = await supabase
    .from('escolas')
    .select('gestor_user_id')
    .eq('id', tenantId)
    .maybeSingle()

  if (escolaData?.gestor_user_id === userId) {
    return // Gestor tem acesso total na própria escola
  }

  // 4. Responsável não tem acesso aos serviços administrativos
  const { data: responsavelData } = await supabase
    .from('responsaveis')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (responsavelData?.user_id === userId) {
    throw new RBACValidationError(
      `Acesso negado: Responsáveis não têm permissão para '${permissionKey}'`
    )
  }

  // 5. Funcionários: Validar permissão via RBAC
  // Usar o serviço RBAC para resolver permissões do usuário
  const permissoes = await rbacService.resolverPermissoes(userId)
  
  // Verificar se tem a permissão específica
  const temPermissao = permissoes.some(p => p.permission_key === permissionKey)
  
  if (!temPermissao) {
    console.error(
      `[RBAC] Acesso negado: Usuário ${userId} não tem permissão '${permissionKey}' no tenant ${tenantId}`
    )
    throw new RBACValidationError(
      `Acesso negado: Permissão necessária '${permissionKey}'`
    )
  }
}

/**
 * Valida permissão com escopo (scope-based validation)
 * 
 * @param userId - ID do usuário autenticado
 * @param tenantId - ID do tenant (escola)
 * @param permissionKey - Chave da permissão
 * @param scope - Escopo necessário (ex: 'minhas_turmas', 'toda_escola')
 * @throws {RBACValidationError} Se usuário não tiver permissão no escopo
 */
export async function validarPermissaoComEscopo(
  userId: string,
  tenantId: string,
  permissionKey: string,
  scope: ScopeType
): Promise<void> {
  // Primeiro valida a permissão básica
  await validarPermissao(userId, tenantId, permissionKey)

  // 1. Buscar permissões resolvidas com escopo
  const permissoes = await rbacService.resolverPermissoes(userId)
  
  // 2. Encontrar a permissão específica e verificar escopo
  const permissaoEncontrada = permissoes.find(p => p.permission_key === permissionKey)
  
  if (!permissaoEncontrada) {
    throw new RBACValidationError(
      `Acesso negado: Permissão necessária '${permissionKey}'`
    )
  }

  // 3. Hierarquia de escopos (do mais restritivo ao mais amplo)
  const hierarquiaEscopos: ScopeType[] = [
    'self',
    'minhas_turmas',
    'minhas_disciplinas',
    'minha_unidade',
    'toda_escola',
    'rede',
  ]

  const indiceNecessario = hierarquiaEscopos.indexOf(scope)
  const indiceUsuario = hierarquiaEscopos.indexOf(permissaoEncontrada.scope)

  // Usuário precisa ter escopo igual ou superior ao necessário
  if (indiceUsuario < indiceNecessario) {
    throw new RBACValidationError(
      `Acesso negado: Escopo insuficiente. Necessário '${scope}', usuário tem '${permissaoEncontrada.scope}'`
    )
  }
}

/**
 * Validação simplificada para operações em lote
 * Retorna boolean ao invés de lançar exceção
 * 
 * @returns true se tem permissão, false caso contrário
 */
export async function temPermissao(
  userId: string,
  tenantId: string,
  permissionKey: string
): Promise<boolean> {
  try {
    await validarPermissao(userId, tenantId, permissionKey)
    return true
  } catch {
    return false
  }
}

/**
 * Wrapper para operações CRUD completas
 * Valida múltiplas permissões de uma vez
 * 
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @param moduloKey - Chave do módulo (ex: 'financeiro', 'alunos')
 * @param acao - Ação necessária (ex: 'create', 'update', 'delete')
 */
export async function validarCRUD(
  userId: string,
  tenantId: string,
  moduloKey: string,
  acao: 'create' | 'read' | 'update' | 'delete'
): Promise<void> {
  const permissionKey = `${moduloKey}.${acao}`
  await validarPermissao(userId, tenantId, permissionKey)
}
