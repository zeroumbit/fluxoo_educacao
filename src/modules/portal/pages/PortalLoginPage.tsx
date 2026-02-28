import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { portalService } from '../service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Loader2, Eye, EyeOff, User } from 'lucide-react'
import { toast } from 'sonner'

const portalLoginSchema = z.object({
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type PortalLoginForm = z.infer<typeof portalLoginSchema>

export function PortalLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PortalLoginForm>({
    resolver: zodResolver(portalLoginSchema),
  })

  const onSubmit = async (data: PortalLoginForm) => {
    setError(null)
    try {
      await portalService.loginPorCpf(data.cpf, data.password)
      toast.success('Login realizado com sucesso!')
      navigate('/portal')
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.')
    }
  }

  // Função para formatar CPF enquanto digita
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)
    
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2')
    }
    
    e.target.value = value
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-indigo-50/50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
            Portal do Responsável
          </h1>
          <p className="text-muted-foreground mt-1 text-center">Acompanhamento acadêmico e financeiro</p>
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 border-0 shadow-2xl shadow-indigo-200/40">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Área da Família</CardTitle>
            <CardDescription>Acesse com seu CPF e senha</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cpf">Seu CPF</Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    {...register('cpf')}
                    onChange={(e) => {
                      handleCpfChange(e)
                      register('cpf').onChange(e)
                    }}
                    className="h-12 pl-10"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                {errors.cpf && (
                  <p className="text-xs text-destructive font-medium">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Sua Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    {...register('password')}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-4 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'ACESSAR PORTAL'
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Primeiro acesso? A senha inicial é fornecida pela secretaria da escola no ato da matrícula.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
