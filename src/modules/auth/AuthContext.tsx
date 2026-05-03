import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { usePortalStore } from '@/modules/portal/store'
import { useRBACStore } from '@/stores/rbac.store'
import { rbacService } from '@/modules/rbac/service'
import { clearSensitiveClientState } from '@/lib/session-cleanup'
import { precheckLogin, recordLoginAttempt } from '@/lib/auth-rate-limit'
import type { ResolvedPermission } from '@/modules/rbac/types'

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
  resolvedPermissions?: ResolvedPermission[]
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

function hasSuperAdminAppClaim(user: User): boolean {
  return user.app_metadata?.is_super_admin === true ||
    user.app_metadata?.role === 'super_admin'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Utilitário: Executa uma promise com timeout */
function _withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const authUserRef = useRef<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Sincroniza o ref sempre que o state mudar
  useEffect(() => {
    authUserRef.current = authUser
  }, [authUser])

  const loadUserProfile = useCallback(async (user: User, session: Session) => {
    try {
      // 1. SUPER ADMIN: only app_metadata is trusted for authorization.
      const isSuper = hasSuperAdminAppClaim(user)

      if (isSuper) {
        setAuthUser({
          user, session,
          tenantId: 'super_admin',
          role: 'super_admin',
          nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Super Admin',
          email: user.email || '',
          isProfessor: false,
          isGestor: false,       // R2: Super Admin nunca é gestor operacional de escola
          isSuperAdmin: true
        })
        return
      }

      // 2. GESTOR / ESCOLA (Busca por UUID ou Email)
      let escolaData = null
      
      // Tentativa 1: Por gestor_user_id (Mais rápido e seguro)
      const { data: escolaById } = await supabase
        .from('escolas')
        .select('id, razao_social, email_gestor, gestor_user_id, logradouro, numero, complemento, bairro, cidade, estado, cep')
        .eq('gestor_user_id', user.id)
        .maybeSingle()
      
      escolaData = escolaById

      // Tentativa 2: Por e-mail (Fallback para cadastros legados ou em transição)
      if (!escolaData && user.email) {
        const { data: escolaByEmail } = await supabase
          .from('escolas')
          .select('id, razao_social, email_gestor, gestor_user_id, logradouro, numero, complemento, bairro, cidade, estado, cep')
          .ilike('email_gestor', user.email)
          .maybeSingle()
        
        escolaData = escolaByEmail
      }

      if (escolaData) {
        const escola = escolaData as any
        console.log('🏫 Escola encontrada para o usuário:', escola.id)
        
        const endereco = escola?.logradouro ? {
          logradouro: escola.logradouro,
          numero: escola.numero,
          complemento: escola.complemento,
          bairro: escola.bairro,
          cidade: escola.cidade,
          estado: escola.estado,
          cep: escola.cep
        } : undefined

        // Sincronização de Segurança: Garante que o gestor_user_id esteja preenchido para RLS legados
        if (!escola.gestor_user_id) {
          console.log('🔄 Sincronizando gestor_user_id na tabela escolas...')
          const { error: syncError } = await supabase
            .from('escolas')
            .update({ gestor_user_id: user.id })
            .eq('id', escola.id)
          
          if (syncError) console.error('⚠️ Falha ao sincronizar gestor_user_id:', syncError.message)
        }

        // Sincronização de Metadados: Essencial para a função public.uid_tenant() no RLS
        const currentTenantId = user.user_metadata?.tenant_id
        const currentRole = user.user_metadata?.role || user.app_metadata?.role || 'gestor'
        
        if (currentTenantId !== escola.id) {
          console.log(`🔄 Atualizando tenant_id nos metadados: ${currentTenantId} -> ${escola.id}`)
          const { error: updateMetaError } = await supabase.auth.updateUser({
            data: { 
              tenant_id: escola.id, 
              role: currentRole // Preserva o papel (super_admin ou outro)
            }
          })
          
          if (updateMetaError) {
            console.error('⚠️ Falha ao atualizar metadados do usuário:', updateMetaError.message)
          } else {
            console.log('✅ Metadados atualizados. Atualizando sessão para refletir no JWT...')
            // O RLS depende do JWT, então precisamos de um novo token com o tenant_id correto
            await supabase.auth.refreshSession()
          }
        }

        const resolvedPermissions = await rbacService.resolverPermissoes(user.id)

        setAuthUser({
          user, session,
          tenantId: escola.id,
          role: 'gestor',
          nome: user.user_metadata?.full_name || escola.razao_social || 'Gestor',
          email: user.email || '',
          isProfessor: false,
          isGestor: true,
          isSuperAdmin: false,
          endereco,
          resolvedPermissions
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
          const isSuperAdmin = hasSuperAdminAppClaim(user)
          const isProfessor = perfilNome.includes('professor') || perfilNome.includes('professora')

          const resolvedPermissions = await rbacService.resolverPermissoes(user.id)

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
            isSuperAdmin,
            resolvedPermissions
          })

          if (user.user_metadata?.tenant_id !== finalTenantId) {
            await supabase.auth.updateUser({
              data: { tenant_id: finalTenantId }
            })
            await supabase.auth.refreshSession()
          }
          return
        }

        // Step 1.2: Se não é funcionário direto, tenta usuários_sistema (RBAC V2)
        // Isso captura Contadores, Administradores e outros perfis que podem não estar na tabela de funcionários
        if (!funcionarioData) {
          const { data: systemUserData } = await (supabase.from('usuarios_sistema' as any) as any)
            .select('id, tenant_id, perfil_id')
            .eq('id', user.id)
            .maybeSingle()

          if (systemUserData) {
            const finalTenantId = systemUserData.tenant_id
            let perfilNome = ''
            try {
              if (systemUserData.perfil_id) {
                const { data: pData } = await (supabase as any).from('perfis_acesso').select('nome').eq('id', systemUserData.perfil_id).maybeSingle()
                perfilNome = pData?.nome?.toLowerCase() || ''
              }
            } catch { /* não crítico */ }

            const resolvedPermissions = await rbacService.resolverPermissoes(user.id)

            setAuthUser({
              user, session,
              tenantId: finalTenantId,
              role: 'funcionario',
              perfilId: systemUserData.perfil_id,
              perfilNome,
              nome: user.user_metadata?.full_name || 'Usuário do Sistema',
              email: user.email || '',
              isProfessor: perfilNome.includes('professor'),
              isGestor: perfilNome.includes('gestor') || perfilNome.includes('diretor') || perfilNome.includes('adm') || perfilNome.includes('contador'),
              isSuperAdmin: hasSuperAdminAppClaim(user),
              resolvedPermissions
            })

            if (user.user_metadata?.tenant_id !== finalTenantId) {
              await supabase.auth.updateUser({ data: { tenant_id: finalTenantId } })
              await supabase.auth.refreshSession()
            }
            return
          }
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

          if (user.user_metadata?.tenant_id !== funcByEmail.tenant_id) {
            await supabase.auth.updateUser({
              data: { tenant_id: funcByEmail.tenant_id }
            })
            await supabase.auth.refreshSession()
          }
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
        role: (user.user_metadata?.role as any) || 'funcionario',
        nome: user.user_metadata?.full_name || 'Usuário',
        email: user.email || '',
        isProfessor: false,
        isGestor: false,
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
        // Se for apenas TOKEN_REFRESHED ou USER_UPDATED (ex: on window focus)
        // e o usuário já estiver carregado no state (via authUserRef), 
        // atualizamos apenas a sessão e evitamos disparar todo o recarregamento do DB.
        if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && authUserRef.current && authUserRef.current.user.id === session.user.id) {
          setAuthUser(prev => prev ? { ...prev, user: session.user, session } : null)
          if (mounted) setLoading(false)
          return
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (loadingLock) return
          loadingLock = true
          
          if (!authUserRef.current) {
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
    const identifier = email.trim().toLowerCase()
    const precheck = await precheckLogin(identifier)

    if (!precheck.allowed) {
      setLoading(false)
      return { error: precheck.reason || 'Muitas tentativas falhas. Tente novamente mais tarde.' }
    }

    if (precheck.delayMs > 0) {
      await sleep(precheck.delayMs)
    }

    const { error } = await supabase.auth.signInWithPassword({ email: identifier, password })
    await recordLoginAttempt({
      identifier,
      success: !error,
      reason: error?.message,
    })

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
    clearSensitiveClientState()
    window.dispatchEvent(new Event('fluxoo:auth:signed-out'))
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
