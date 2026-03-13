import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { portalService } from '../service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, Eye, EyeOff, User, Check } from 'lucide-react'
import { toast } from 'sonner'
import { mascaraCPF } from '@/lib/validacoes'

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
    const value = mascaraCPF(e.target.value)
    e.target.value = value
    register('cpf').onChange(e)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-50 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50 animate-pulse" />

      <div className="w-full max-w-[850px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#E2E8F0] flex flex-col md:flex-row relative z-10">
        {/* Sidebar - Teal Deep */}
        <div className="hidden md:flex md:w-[35%] bg-gradient-to-b from-[#134E4A] to-[#0F3937] p-10 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <GraduationCap className="h-40 w-40 text-white" />
          </div>
          <div className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-xl">
              <GraduationCap className="h-8 w-8 text-teal-400" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">Portal do Responsável</h2>
            <p className="text-teal-100/70 text-sm leading-relaxed font-medium">Sua conexão direta com a jornada acadêmica e financeira de quem você ama.</p>
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center shadow-lg shadow-teal-900/50">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#14B8A6]">Segurança Ativa</p>
                <p className="text-[10px] text-teal-100/50">Criptografia de ponta a ponta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
          <div className="md:hidden flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#14B8A6] flex items-center justify-center shadow-lg shadow-teal-100">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-black text-xl text-[#134E4A]">Fluxoo</h1>
            </div>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h3 className="text-3xl font-black text-[#1E293B] mb-2 tracking-tight">Área da Família</h3>
            <p className="text-sm text-[#64748B] font-medium italic">Acesse com suas credenciais oficiais</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-1">Seu CPF</Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    {...register('cpf')}
                    onChange={(e) => {
                      handleCpfChange(e)
                      register('cpf').onChange(e)
                    }}
                    className="h-14 pl-12 bg-slate-50 border-[#E2E8F0] rounded-2xl focus-visible:ring-[#14B8A6] focus-visible:bg-white transition-all font-medium"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
                {errors.cpf && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-1">Sua Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="h-14 pr-12 bg-slate-50 border-[#E2E8F0] rounded-2xl focus-visible:ring-[#14B8A6] focus-visible:bg-white transition-all font-bold tracking-widest pl-5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#14B8A6] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-xl p-4 flex items-center gap-3 animate-shake">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#14B8A6] hover:bg-[#134E4A] text-white shadow-xl shadow-teal-500/20 transition-all duration-300 rounded-2xl font-black text-sm tracking-widest uppercase mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    ACESSAR PORTAL
                  </>
                )}
              </Button>
            </div>

            <div className="pt-8 border-t border-[#F1F5F9]">
              <p className="text-[10px] text-slate-400 text-center leading-relaxed font-semibold italic">
                Primeiro acesso? Utilize a senha PIN fornecida pela instituição no ato da matrícula.
              </p>
            </div>
          </form>

          <div className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase">Powered by Fluxoo &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
