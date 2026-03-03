import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, Eye, EyeOff, Lock, Check } from 'lucide-react'
import { validarEmail } from '@/lib/validacoes'

const loginSchema = z.object({
  email: z.string().refine((val) => validarEmail(val), 'E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const { data: { session }, error } = await supabase.auth.signInWithPassword({ 
      email: data.email, 
      password: data.password 
    })

    if (error) {
      setError(error.message)
      return
    }

    const role = session?.user?.user_metadata?.role
    if (role === 'super_admin' || data.email.includes('fluxoo.edu')) {
      navigate('/admin/dashboard')
    } else if (role === 'responsavel') {
      navigate('/portal')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col md:flex-row">

        {/* Sidebar */}
        <div className="hidden md:flex md:w-1/3 bg-gradient-to-b from-indigo-600 to-blue-700 p-8 flex-col justify-between text-white">
          <div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
              <GraduationCap className="h-7 w-7 text-white" />
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
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-white" /></div>
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
                    placeholder="••••••"
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
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200 transition-all duration-300 rounded-xl"
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
