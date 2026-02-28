import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/database.types'
import { isSuperAdminEmail } from '@/lib/config'

interface AuthUser {
  user: User
  session: Session
  tenantId: string
  role: UserRole
  nome: string
}

interface AuthContextType {
  authUser: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
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
      // 1. SUPER ADMIN (sem consulta ao banco, mais rápido)
      if (isSuperAdminEmail(user.email || '')) {
        setAuthUser({
          user, session,
          tenantId: 'super_admin',
          role: 'super_admin',
          nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Super Admin',
        })
        return
      }

      // 2. GESTOR — busca escola com timeout de 5s para não travar
      if (user.user_metadata?.role === 'gestor') {
        const resultado = await withTimeout(
          supabase
            .from('escolas')
            .select('id, razao_social')
            .eq('gestor_user_id', user.id)
            .maybeSingle(),
          5000
        ) as any

        const escola = resultado?.data
        
        if (escola) {
          setAuthUser({
            user, session,
            tenantId: escola.id,
            role: 'gestor',
            nome: user.user_metadata?.full_name || 'Gestor',
          })
          return
        }

        // Mesmo sem escola, libera como gestor (senão trava na tela branca)
        setAuthUser({
          user, session,
          tenantId: '',
          role: 'gestor',
          nome: user.user_metadata?.full_name || 'Gestor',
        })
        return
      }

      // 3. Funcionário
      const funcRes = await withTimeout(
        supabase.from('funcionarios').select('tenant_id, nome_completo').eq('id', user.id).maybeSingle(),
        5000
      ) as any

      if (funcRes?.data) {
        setAuthUser({
          user, session,
          tenantId: funcRes.data.tenant_id || '',
          role: 'funcionario',
          nome: funcRes.data.nome_completo,
        })
        return
      }

      // 4. Responsável
      const respRes = await withTimeout(
        supabase.from('responsaveis').select('nome').eq('id', user.id).maybeSingle(),
        5000
      ) as any

      if (respRes?.data) {
        setAuthUser({
          user, session,
          tenantId: '',
          role: 'responsavel',
          nome: respRes.data.nome,
        })
        return
      }

      // Sem perfil — desconecta
      await supabase.auth.signOut()
      setAuthUser(null)
    } catch (err) {
      console.error('Erro no carregamento de perfil:', err)
      // Fallback de emergência: mantém logado para não travar
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

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          await loadUserProfile(session.user, session)
        }
      } catch (e) {
        console.error('Erro na inicialização:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user, session)
          if (mounted) setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
          if (mounted) setLoading(false)
        }
      }
    )

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

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
  }

  return (
    <AuthContext.Provider value={{ authUser, loading, signIn, signOut }}>
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
