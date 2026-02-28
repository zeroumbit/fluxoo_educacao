import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole, Funcionario, Responsavel } from '@/lib/database.types'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = useCallback(async (user: User, session: Session) => {
    // Verifica se é o super admin pelo e-mail
    if (isSuperAdminEmail(user.email || '')) {
      setAuthUser({
        user,
        session,
        tenantId: 'super_admin',
        role: 'super_admin',
        nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Super Admin',
      })
      return
    }

    // Tenta encontrar como funcionário
    const { data: funcionario } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single()

    if (funcionario) {
      setAuthUser({
        user,
        session,
        tenantId: (funcionario as Funcionario).tenant_id,
        role: (funcionario as Funcionario).role as UserRole,
        nome: (funcionario as Funcionario).nome,
      })
      return
    }

    // Tenta encontrar como responsável
    const { data: responsavel } = await supabase
      .from('responsaveis')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (responsavel) {
      setAuthUser({
        user,
        session,
        tenantId: (responsavel as Responsavel).tenant_id,
        role: 'responsavel',
        nome: (responsavel as Responsavel).nome,
      })
      return
    }

    // Sem perfil encontrado - logout
    await supabase.auth.signOut()
    setAuthUser(null)
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        await loadUserProfile(session.user, session)
      }

      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user, session)
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUserProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
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
