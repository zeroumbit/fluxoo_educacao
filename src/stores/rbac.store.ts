/**
 * Zustand Store para RBAC V2.2
 * Cache de permissões com expiração e invalidação via Supabase Realtime.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { rbacService } from '@/modules/rbac/service'
import type { ResolvedPermission, ScopeType } from '@/modules/rbac/types'

const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutos

interface RBACState {
  // Estado
  permissions: ResolvedPermission[]
  deniedKeys: Set<string>
  lastFetchedAt: number | null
  userId: string | null
  tenantId: string | null
  isLoading: boolean
  isInitialized: boolean

  // Ações
  loadPermissions: (userId: string, tenantId: string) => Promise<void>
  clearPermissions: () => void
  invalidateCache: () => void

  // Checagens
  hasPermission: (key: string) => boolean
  hasAnyPermission: (keys: string[]) => boolean
  hasAllPermissions: (keys: string[]) => boolean
  hasScope: (key: string, requiredScope: ScopeType) => boolean
  getPermissionScope: (key: string) => ScopeType | null
  canAccessModule: (moduleKey: string) => boolean
}

/** Hierarquia de escopos: índice maior = acesso mais amplo */
const SCOPE_RANK: Record<ScopeType, number> = {
  self: 0,
  minhas_turmas: 1,
  minhas_disciplinas: 2,
  minha_unidade: 3,
  toda_escola: 4,
  rede: 5,
}

export const useRBACStore = create<RBACState>()(
  persist(
    (set, get) => ({
      permissions: [],
      deniedKeys: new Set<string>(),
      lastFetchedAt: null,
      userId: null,
      tenantId: null,
      isLoading: false,
      isInitialized: false,

      loadPermissions: async (userId: string, tenantId: string) => {
        const state = get()

        // Skip se cache ainda é válido para o mesmo usuário
        if (
          state.isInitialized &&
          state.userId === userId &&
          state.lastFetchedAt &&
          Date.now() - state.lastFetchedAt < CACHE_DURATION_MS
        ) {
          return
        }

        set({ isLoading: true })

        try {
          const resolved = await rbacService.resolverPermissoes(userId)

          // Separar allows e denys
          const denied = new Set<string>()
          const allowed: ResolvedPermission[] = []

          for (const perm of resolved) {
            if (perm.source === 'override_deny') {
              denied.add(perm.permission_key)
            } else {
              allowed.push(perm)
            }
          }

          set({
            permissions: allowed,
            deniedKeys: denied,
            lastFetchedAt: Date.now(),
            userId,
            tenantId,
            isLoading: false,
            isInitialized: true,
          })
        } catch (error) {
          console.error('❌ Erro ao carregar permissões RBAC:', error)
          set({ isLoading: false, isInitialized: true })
        }
      },

      clearPermissions: () => {
        set({
          permissions: [],
          deniedKeys: new Set(),
          lastFetchedAt: null,
          userId: null,
          tenantId: null,
          isLoading: false,
          isInitialized: false,
        })
      },

      invalidateCache: () => {
        const state = get()
        set({ lastFetchedAt: null, isInitialized: false })

        // Re-carregar automaticamente se tiver userId
        if (state.userId && state.tenantId) {
          state.loadPermissions(state.userId, state.tenantId)
        }
      },

      hasPermission: (key: string) => {
        const state = get()

        // Deny override tem prioridade absoluta
        if (state.deniedKeys.has(key)) return false

        return state.permissions.some(p => p.permission_key === key)
      },

      hasAnyPermission: (keys: string[]) => {
        const state = get()
        return keys.some(key => {
          if (state.deniedKeys.has(key)) return false
          return state.permissions.some(p => p.permission_key === key)
        })
      },

      hasAllPermissions: (keys: string[]) => {
        const state = get()
        return keys.every(key => {
          if (state.deniedKeys.has(key)) return false
          return state.permissions.some(p => p.permission_key === key)
        })
      },

      hasScope: (key: string, requiredScope: ScopeType) => {
        const state = get()
        if (state.deniedKeys.has(key)) return false

        const perm = state.permissions.find(p => p.permission_key === key)
        if (!perm) return false

        // Escopo do usuário deve ser >= ao escopo requerido
        return SCOPE_RANK[perm.scope] >= SCOPE_RANK[requiredScope]
      },

      getPermissionScope: (key: string) => {
        const state = get()
        if (state.deniedKeys.has(key)) return null

        const perm = state.permissions.find(p => p.permission_key === key)
        return perm?.scope || null
      },

      canAccessModule: (moduleKey: string) => {
        const state = get()
        // Usuário pode acessar módulo se tem QUALQUER permissão desse módulo
        return state.permissions.some(p => {
          if (state.deniedKeys.has(p.permission_key)) return false
          return p.permission_key.startsWith(moduleKey + '.')
        })
      },
    }),
    {
      name: 'fluxoo-rbac-store',
      partialize: (state) => ({
        permissions: state.permissions,
        // Converter Set para array para serialização
        deniedKeys: Array.from(state.deniedKeys),
        lastFetchedAt: state.lastFetchedAt,
        userId: state.userId,
        tenantId: state.tenantId,
        isInitialized: state.isInitialized,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted || {}),
        // Reconstruir Set a partir do array
        deniedKeys: new Set(persisted?.deniedKeys || []),
      }),
    }
  )
)

// ==========================================
// SUPABASE REALTIME: Invalidação de Cache
// ==========================================

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

export function subscribeToRBACChanges(tenantId: string) {
  // Cleanup anterior
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }

  realtimeChannel = supabase
    .channel(`rbac-changes-${tenantId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'perfil_permissions' },
      () => {
        console.log('🔄 RBAC: perfil_permissions alterado, invalidando cache...')
        useRBACStore.getState().invalidateCache()
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_permission_overrides' },
      () => {
        console.log('🔄 RBAC: overrides alterados, invalidando cache...')
        useRBACStore.getState().invalidateCache()
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'perfis_acesso' },
      () => {
        console.log('🔄 RBAC: perfis alterados, invalidando cache...')
        useRBACStore.getState().invalidateCache()
      }
    )
    .subscribe()

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }
}

export function unsubscribeFromRBACChanges() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}
