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
  role: UserRole
  nome: string
  endereco?: Endereco
  areasAcesso?: string[]
  funcionarioId?: string
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
        })
        return
      }

      // 2. GESTOR
      if (user.user_metadata?.role === 'gestor') {
        const { data: escola, error: erro } = await supabase
          .from('escolas')
          .select('id, razao_social, logradouro, numero, bairro, cidade, estado, cep')
          .eq('gestor_user_id', user.id)
          .limit(1)
          .maybeSingle() as any

        if (erro) {
          console.error('❌ Erro na busca da escola:', erro.message)
          // Em caso de erro real de rede/banco, não definimos authUser para permitir refetch ou manter loading
          throw erro
        }
        
        if (escola) {
          setAuthUser({
            user, session,
            tenantId: (escola as any).id,
            role: 'gestor',
            nome: user.user_metadata?.full_name || 'Gestor',
            endereco: {
              logradouro: escola.logradouro,
              numero: escola.numero,
              bairro: escola.bairro,
              cidade: escola.cidade,
              estado: escola.estado,
              cep: escola.cep
            }
          })
          return
        }

        // Se não encontrou a escola (ex: cadastro incompleto), tratamos como gestor sem tenant
        // mas marcamos como tal para que a UI saiba que não é um erro de carregamento
        setAuthUser({
          user, session,
          tenantId: 'PENDING_TENANT', // Valor distintivo em vez de string vazia
          role: 'gestor',
          nome: user.user_metadata?.full_name || 'Gestor',
        })
        return
      }

      // 3 & 4. Paralelizando busca de Funcionário e Responsável
      const [funcRes, respRes] = await Promise.all([
        withTimeout(
          supabase.from('funcionarios')
            .select('tenant_id, nome_completo, areas_acesso, id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle() as any,
          5000
        ) as any,
        withTimeout(
          supabase.from('responsaveis')
            .select('nome, logradouro, numero, complemento, bairro, cidade, estado, cep')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle() as any,
          5000
        ) as any
      ])

      if (funcRes?.data) {
        setAuthUser({
          user, session,
          tenantId: funcRes.data.tenant_id || '',
          role: 'funcionario',
          nome: funcRes.data.nome_completo,
          areasAcesso: funcRes.data.areas_acesso || [],
          funcionarioId: funcRes.data.id,
        })
        return
      }

      if (respRes?.data) {
        setAuthUser({
          user, session,
          tenantId: '',
          role: 'responsavel',
          nome: respRes.data.nome,
          endereco: {
            logradouro: respRes.data.logradouro,
            numero: respRes.data.numero,
            complemento: respRes.data.complemento,
            bairro: respRes.data.bairro,
            cidade: respRes.data.cidade,
            estado: respRes.data.estado,
            cep: respRes.data.cep
          }
        })
        return
      }

      // Sem perfil
      setAuthUser(null)
    } catch (err) {
      console.error('Erro no carregamento de perfil:', err)
      if (user.user_metadata?.role === 'gestor') {
        setAuthUser({
          user, session,
          tenantId: '',
          role: 'gestor',
          nome: user.user_metadata?.full_name || 'Gestor',
        })
      } else {
        setAuthUser(null)
      }
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
