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

      // 2. GESTOR — busca escola com tratamento de erro para Lock broken
      if (user.user_metadata?.role === 'gestor') {
        let escola = null
        let erro = null
        
        // Pequena espera para o Supabase Auth estabilizar os locks
        await new Promise(r => setTimeout(r, 600))

        try {
          console.log('🔍 Buscando escola para gestor:', user.id)
          const resp = await supabase
              .from('escolas')
              .select('id, razao_social')
              .eq('gestor_user_id', user.id)
              .maybeSingle()
          
          escola = resp?.data
          erro = resp?.error
        } catch (e: any) {
          console.warn('⚠️ Erro imediato na busca:', e.message)
          // Retenta uma vez se for Lock
          if (e?.name === 'AbortError' || e?.message?.includes('Lock')) {
            await new Promise(r => setTimeout(r, 1500))
            const resp = await supabase.from('escolas').select('id, razao_social').eq('gestor_user_id', user.id).maybeSingle()
            escola = resp.data
            erro = resp.error
          } else {
            throw e
          }
        }

        if (erro) {
          console.error('❌ Erro detalhado na busca da escola:', erro.message || erro)
        }

        console.log('📊 Resultado da busca da escola:', { escola, erro })
        
        if (escola) {
          console.log('✅ Tenant vinculado:', (escola as any).id)
          setAuthUser({
            user, session,
            tenantId: (escola as any).id,
            role: 'gestor',
            nome: user.user_metadata?.full_name || 'Gestor',
          })
          return
        }

        console.warn('⚠️ Gestor logado mas sem escola no banco!')
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
        supabase.from('funcionarios').select('tenant_id, nome_completo').eq('user_id', user.id).maybeSingle() as any,
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
        supabase.from('responsaveis').select('nome').eq('user_id', user.id).maybeSingle() as any,
        5000
      ) as any

      if (respRes?.data) {
        setAuthUser({
          user, session,
          tenantId: '', // Responsável não tem tenant_id fixo (vários filhos podem ser de escolas diferentes?)
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Evento de Autenticação:', event, '| Usuário:', session?.user?.id || 'nenhum')
        
        // INITIAL_SESSION ou SIGNED_IN são os momentos de carregar perfil
        if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          console.log('🆔 MEU ID DE USUÁRIO:', session.user.id)
          await loadUserProfile(session.user, session)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Usuário saiu.')
          setAuthUser(null)
          setLoading(false)
        } else {
          // Casos onde não há sessão no início
          setLoading(false)
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
