import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/database.types'
import { isSuperAdminEmail } from '@/lib/config'
import { usePortalStore } from '@/modules/portal/store'
import { useRBACStore } from '@/stores/rbac.store'

export interface Endereco {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
}

export interface AuthUser {
  user: User
  session: Session
  tenantId: string
  role: 'gestor' | 'responsavel' | 'super_admin' | 'funcionario'
  funcionarioId?: string
  responsavelId?: string
  perfilId?: string
  perfilNome?: string
  nome: string
  email: string
  isProfessor: boolean
  isGestor: boolean
  isSuperAdmin: boolean
}

interface AuthContextType {
  authUser: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInPortal: (cpf: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Utilitário: Executa uma promise com timeout */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = useCallback(async (user: User, session: Session) => {
    try {
      // 1. SUPER ADMIN (Rollback: Identificação forçada por e-mail)
      if (isSuperAdminEmail(user.email || '')) {
        setAuthUser({
          user, session,
          tenantId: 'super_admin',
          role: 'super_admin',
          nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Super Admin',
          email: user.email || '',
          isProfessor: false,
          isGestor: true,
          isSuperAdmin: true
        })
        return
      }

      // 2. GESTOR
      if (user.user_metadata?.role === 'gestor') {
        const { data: escola, error: erro } = await supabase
          .from('escolas')
          .select('id, razao_social')
          .eq('gestor_user_id', user.id)
          .limit(1)
          .maybeSingle() as any

        if (erro) {
           console.error('❌ Erro na busca da escola:', erro.message)
        }

        setAuthUser({
          user, session,
          tenantId: (escola as any)?.id || 'PENDING_TENANT',
          role: 'gestor',
          nome: user.user_metadata?.full_name || 'Gestor',
          email: user.email || '',
          isProfessor: false,
          isGestor: true,
          isSuperAdmin: false
        })
        return
      }

      // 3. FUNCIONÁRIO / RESPONSÁVEL
      try {
        const { data: funcionarioData } = await (supabase.from('funcionarios') as any)
          .select('*, usuarios_sistema(perfil_id, perfil:perfis(nome))')
          .eq('user_id', user.id)
          .maybeSingle()

        if (funcionarioData) {
          const finalTenantId = funcionarioData.tenant_id
          const rbac = funcionarioData.usuarios_sistema?.[0]
          const perfilNome = rbac?.perfil?.nome?.toLowerCase() || ''
          
          const isGestor = user.user_metadata?.role === 'gestor' || perfilNome.includes('gestor') || perfilNome.includes('admin')
          const isSuperAdmin = user.app_metadata?.role === 'super_admin'
          const isProfessor = !isGestor && !isSuperAdmin && (user.user_metadata?.role === 'funcionario' || !!funcionarioData.id)

          setAuthUser({
            user, session,
            tenantId: finalTenantId,
            role: 'funcionario',
            funcionarioId: funcionarioData.id,
            perfilId: rbac?.perfil_id,
            perfilNome: rbac?.perfil?.nome,
            nome: funcionarioData.nome_completo || user.user_metadata?.full_name || 'Funcionário',
            email: user.email || '',
            isProfessor,
            isGestor,
            isSuperAdmin
          })
          return
        }

        const { data: responsavelData } = await supabase.from('responsaveis').select('*').eq('user_id', user.id).maybeSingle()
        if (responsavelData) {
          setAuthUser({
            user, session,
            tenantId: (responsavelData as any).tenant_id || 'PENDING_TENANT',
            role: 'responsavel',
            responsavelId: responsavelData.id,
            nome: (responsavelData as any).nome || user.user_metadata?.full_name || 'Responsável',
            email: user.email || '',
            isProfessor: false,
            isGestor: false,
            isSuperAdmin: false
          })
          return
        }

        if (user.email) {
            const { data: funcByEmail } = await (supabase.from('funcionarios') as any)
              .select('*, usuarios_sistema(perfil_id, perfil:perfis(nome))')
              .ilike('email', user.email)
              .maybeSingle()
              
            if (funcByEmail) {
                const rbac = funcByEmail.usuarios_sistema?.[0]
                const perfilNome = rbac?.perfil?.nome?.toLowerCase() || ''
                const isGestor = perfilNome.includes('gestor') || perfilNome.includes('admin')
                const isProfessor = !isGestor

                setAuthUser({
                  user, session,
                  tenantId: funcByEmail.tenant_id,
                  role: 'funcionario',
                  funcionarioId: funcByEmail.id,
                  perfilId: rbac?.perfil_id,
                  perfilNome: rbac?.perfil?.nome,
                  nome: funcByEmail.nome_completo || user.user_metadata?.full_name || 'Funcionário',
                  email: user.email || '',
                  isProfessor,
                  isGestor,
                  isSuperAdmin: false
                })
                return
            }
        }
      } catch (err) {
        console.error('Erro no fallback do AuthContext:', err)
      }

      // 4. Caso padrão
      setAuthUser({
        user, session,
        tenantId: user.user_metadata?.tenant_id || 'PENDING_TENANT',
        role: (user.user_metadata?.role as any) || 'gestor',
        nome: user.user_metadata?.full_name || 'Usuário',
        email: user.email || '',
        isProfessor: false,
        isGestor: true,
        isSuperAdmin: false
      })
    } catch (err) {
      console.error('Erro no carregamento de perfil:', err)
      setAuthUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let loadingLock = false

    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!mounted) return
      
      if (session?.user) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (loadingLock) return
          loadingLock = true
          setLoading(true)
          try {
            await loadUserProfile(session.user, session)
          } finally {
            loadingLock = false
            if (mounted) setLoading(false)
          }
        } else {
          if (mounted) setLoading(false)
        }
      } else {
        setAuthUser(null)
        if (mounted) setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleAuthChange(event, session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return { error: error.message }
    }
    return { error: null }
  }

  const signInPortal = async (cpf: string, password: string) => {
    setLoading(true)
    try {
      const { portalService } = await import('@/modules/portal/service')
      await portalService.loginPorCpf(cpf, password)
      return { error: null }
    } catch (error: any) {
      setLoading(false)
      return { error: error.message }
    }
  }

  const signOut = async () => {
    const isResponsavel = authUser?.role === 'responsavel'
    await supabase.auth.signOut()
    setAuthUser(null)
    // Limpar estado persistido do portal para evitar vazamento de dados entre usuários no mesmo navegador
    usePortalStore.getState().clearStore()
    // Limpar permissões RBAC cacheadas
    useRBACStore.getState().clearPermissions()
    window.location.href = isResponsavel ? '/portal/login' : '/login'
  }

  return (
    <AuthContext.Provider value={{ authUser, loading, signIn, signInPortal, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
