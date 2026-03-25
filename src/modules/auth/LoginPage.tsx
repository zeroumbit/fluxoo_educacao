import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, Lock, Check, AlertTriangle } from 'lucide-react'
import { validarEmail } from '@/lib/validacoes'
import { useAuth } from '@/modules/auth/AuthContext'
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit'
import { loginPasswordSchema } from '@/lib/password-validation'
import CorujaIcon from '@/assets/coruja_ANDROID.svg'

const loginSchema = z.object({
  email: z.string().refine((val) => validarEmail(val), 'E-mail inválido'),
  password: loginPasswordSchema,
})

type LoginForm = z.infer<typeof loginSchema>

/**
 * Formata tempo em segundos para MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function LoginPage() {
  const navigate = useNavigate()
  const { authUser, loading, signIn } = useAuth()
  const { checkAttempt, recordFailedAttempt, resetAttempts, getWaitTime, getRemainingAttempts } = useLoginRateLimit()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [waitTime, setWaitTime] = useState(0)

  // Redireciona se já estiver logado
  useEffect(() => {
    if (!loading && authUser) {
      if (authUser.role === 'super_admin') navigate('/admin/dashboard', { replace: true })
      else if (authUser.role === 'responsavel') navigate('/portal', { replace: true })
      else navigate('/dashboard', { replace: true })
    }
  }, [authUser, loading, navigate])

  // Verifica se está bloqueado e atualiza contador
  useEffect(() => {
    const checkLock = () => {
      const remaining = getRemainingAttempts()
      const time = getWaitTime()
      
      if (time > 0) {
        setIsLocked(true)
        setWaitTime(time)
        setError(`Muitas tentativas falhas. Tente novamente em ${formatTime(time)}`)
      } else {
        setIsLocked(false)
        setWaitTime(0)
        if (remaining <= 2 && remaining > 0) {
          setError(`Atenção: você tem apenas ${remaining} tentativa(s) restante(s)`)
        } else {
          setError(null)
        }
      }
    }

    checkLock()
    
    // Atualiza contador a cada segundo
    const interval = setInterval(checkLock, 1000)
    return () => clearInterval(interval)
  }, [getRemainingAttempts, getWaitTime])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)

    // Verifica rate limiting
    if (!checkAttempt()) {
      const time = getWaitTime()
      setError(`Muitas tentativas falhas. Tente novamente em ${formatTime(time)}`)
      return
    }

    const result = await signIn(data.email, data.password)

    if (result.error) {
      // Registra tentativa falha
      recordFailedAttempt()
      
      // Mostra erro
      const remaining = getRemainingAttempts()
      if (remaining > 0) {
        setError(`${result.error} (${remaining} tentativa(s) restante(s))`)
      }
      return
    }

    // Login sucesso: reseta tentativas
    resetAttempts()

    // A navegação agora pode ser feita baseada no papel ou deixada para o RootRedirect
    // Mas para uma experiência mais rápida, podemos tentar inferir aqui
    if (data.email.includes('fluxoo.edu')) {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col md:flex-row">

        {/* Sidebar */}
        <div className="hidden md:flex md:w-1/3 bg-gradient-to-b from-indigo-600 to-blue-700 p-8 flex-col justify-between text-white">
          <div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
              <img src={CorujaIcon} alt="Fluxoo" className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bem-vindo de volta!</h2>
            <p className="text-indigo-100 text-sm leading-relaxed">Acesse sua conta para continuar.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 opacity-100">
              <div className="h-8 w-8 rounded-full bg-white text-indigo-600 border border-white flex items-center justify-center text-xs font-bold">
                <Lock className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Login</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 p-8 md:p-10">
          <div className="md:hidden flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <img src={CorujaIcon} alt="Fluxoo" className="h-5 w-5" />
              </div>
              <h1 className="font-bold text-lg">Fluxoo Educação</h1>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-zinc-900 mb-1">Acesso ao Sistema</h3>
            <p className="text-sm text-muted-foreground">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha de acesso"
                    {...register('password')}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  ℹ️ Senhas antigas (6+ caracteres) continuam válidas
                </p>
              </div>

              {error && (
                <div className={`text-sm rounded-lg p-3 flex items-start gap-2 ${
                  isLocked 
                    ? 'bg-amber-50 border border-amber-200 text-amber-800' 
                    : 'bg-destructive/10 border border-destructive/20 text-destructive'
                }`}>
                  {isLocked && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || isLocked}
                className={`w-full h-11 shadow-lg shadow-zinc-200 transition-all duration-300 rounded-xl ${
                  isLocked
                    ? 'bg-zinc-300 cursor-not-allowed text-zinc-500'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </div>

            <div className="pt-6 border-t border-zinc-100 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                É pai ou aluno?{' '}
                <a
                  href="/portal/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors underline underline-offset-4"
                >
                  Acessar Portal do Aluno
                </a>
              </p>

              <p className="text-sm text-muted-foreground text-center border-t pt-4">
                Sua escola ainda não é cadastrada?{' '}
                <Link
                  to="/cadastro"
                  className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                >
                  Clique aqui e crie uma conta
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">Powered by Fluxoo Educação &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
