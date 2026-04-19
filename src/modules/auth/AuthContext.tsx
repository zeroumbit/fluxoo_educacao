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
  role: 'gestor' | 'responsavel' | 'super_admin' | 'funcionario' | 'lojista' | 'profissional'
  funcionarioId?: string
  responsavelId?: string
  perfilId?: string
  perfilNome?: string
  nome: string
  email: string
  isProfessor: boolean
  isGestor: boolean
  isSuperAdmin: boolean
  areasAcesso?: string[]
  endereco?: Endereco
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
function _withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
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
      // 1. SUPER ADMIN (Identificação por app_metadata ou e-mail de contingência)
      const isSuper = user.app_metadata?.role === 'super_admin' || 
                      user.user_metadata?.role === 'super_admin' ||
                      isSuperAdminEmail(user.email || '')

      if (isSuper) {
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

      // 2. GESTOR / ESCOLA (Busca por UUID ou Email)
      const { data: escola, error: erro } = await supabase
        .from('escolas')
        .select('id, razao_social, email_gestor, gestor_user_id, logradouro, numero, complemento, bairro, cidade, estado, cep')
        .or(`gestor_user_id.eq."${user.id}",email_gestor.ilike."${user.email}"`)
        .maybeSingle() as any

      if (escola && !erro) {
        const endereco = escola?.logradouro ? {
          logradouro: escola.logradouro,
          numero: escola.numero,
          complemento: escola.complemento,
          bairro: escola.bairro,
          cidade: escola.cidade,
          estado: escola.estado,
          cep: escola.cep
        } : undefined

        setAuthUser({
          user, session,
          tenantId: escola.id,
          role: 'gestor',
          nome: user.user_metadata?.full_name || escola.razao_social || 'Gestor',
          email: user.email || '',
          isProfessor: false,
          isGestor: true,
          isSuperAdmin: false,
          endereco
        })
        return
      }

      // 3. FUNCIONÁRIO / RESPONSÁVEL
      try {
        // Step 1: Busca o funcionário sem joins aninhados para evitar erro 400 por RLS
        const { data: funcionarioData } = await (supabase.from('funcionarios') as any)
          .select('id, nome_completo, tenant_id, email, user_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (funcionarioData) {
          const finalTenantId = funcionarioData.tenant_id

          // Step 2: Busca dados RBAC separado (query independente, não afeta funcionario)
          let perfilNome = ''
          let perfilId: string | undefined
          let areasAcesso: string[] | undefined
          try {
            const { data: rbacData } = await (supabase.from('usuarios_sistema' as any) as any)
              .select('perfil_id')
              .eq('id', user.id)
              .maybeSingle()
            perfilId = rbacData?.perfil_id
            if (perfilId) {
              const { data: pData } = await (supabase as any).from('perfis_acesso').select('nome').eq('id', perfilId).maybeSingle()
              perfilNome = pData?.nome?.toLowerCase() || ''
            }
            // Áreas de acesso removidas (tabela não existe no banco)
            areasAcesso = []
          } catch {
            // RBAC não crítico — não bloqueia o login
          }

          const isGestor = user.user_metadata?.role === 'gestor' // Apenas o fundador/dono recebe bypass global
          const isSuperAdmin = user.app_metadata?.role === 'super_admin' || user.user_metadata?.role === 'super_admin'
          const isProfessor = perfilNome.includes('professor') || perfilNome.includes('professora')

          setAuthUser({
            user, session,
            tenantId: finalTenantId,
            role: 'funcionario',
            funcionarioId: funcionarioData.id,
            perfilId,
            perfilNome,
            areasAcesso,
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
            // Fallback por email — também sem join aninhado
            const { data: funcByEmail } = await (supabase.from('funcionarios') as any)
              .select('id, nome_completo, tenant_id, email')
              .ilike('email', user.email)
              .maybeSingle()
              
            if (funcByEmail) {
                let perfilNome = ''
                let perfilId: string | undefined
                let areasAcesso: string[] | undefined
                try {
                  const { data: rbacData } = await (supabase.from('usuarios_sistema' as any) as any)
                    .select('perfil_id')
                    .eq('id', user.id)
                    .maybeSingle()
                  perfilId = rbacData?.perfil_id
                  if (perfilId) {
                    const { data: pData } = await (supabase as any).from('perfis_acesso').select('nome').eq('id', perfilId).maybeSingle()
                    perfilNome = pData?.nome?.toLowerCase() || ''
                  }
                  areasAcesso = []
                } catch { /* não bloqueia */ }

                const isGestorMetadata = user.user_metadata?.role === 'gestor'
                const isGestorPerfil = perfilNome.includes('gestor') || perfilNome.includes('coordenador') || perfilNome.includes('diretor')
                const isGestor = isGestorMetadata || isGestorPerfil
                const isProfessor = perfilNome.includes('professor') || perfilNome.includes('professora')

                setAuthUser({
                  user, session,
                  tenantId: funcByEmail.tenant_id,
                  role: 'funcionario',
                  funcionarioId: funcByEmail.id,
                  perfilId,
                  perfilNome,
                  areasAcesso,
                  nome: funcByEmail.nome_completo || user.user_metadata?.full_name || 'Funcionário',
                  email: user.email || '',
                  isProfessor: isProfessor && !isGestor, // Prioridade para Gestor se tiver ambos
                  isGestor,
                  isSuperAdmin: false
                })
                return
            }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Erro no fallback do AuthContext:', err)
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
      if (import.meta.env.DEV) console.error('Erro no carregamento de perfil:', err)
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
          
          // Só ativa o estado de loading se ainda não tivermos um usuário carregado.
          // Isso evita que atualizações de background (USER_UPDATED) desmontem o app.
          if (!authUser) {
            setLoading(true)
          }

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
