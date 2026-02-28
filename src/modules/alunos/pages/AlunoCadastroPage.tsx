import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCriarAlunoComResponsavel, useAlunosAtivos } from '../hooks'
import { useLimiteAlunos } from '@/modules/assinatura/hooks'
import { useFiliais } from '@/modules/filiais/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  User,
  Heart,
  Users,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const alunoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome é obrigatório'),
  nome_social: z.string().optional(),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  cpf: z.string().optional(),
  patologias: z.string().optional(),
  medicamentos: z.string().optional(),
  observacoes_saude: z.string().optional(),
  filial_id: z.string().optional(),
  responsavel_nome: z.string().min(3, 'Nome do responsável é obrigatório'),
  responsavel_cpf: z.string().min(11, 'CPF do responsável é obrigatório'),
  responsavel_telefone: z.string().optional(),
  responsavel_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  responsavel_parentesco: z.string().optional(),
  responsavel_senha: z.string().min(6, 'Senha mínima de 6 caracteres'),
})

type AlunoFormValues = z.infer<typeof alunoSchema>

const steps = [
  { title: 'Dados Pessoais', icon: User, description: 'Informações do aluno' },
  { title: 'Saúde', icon: Heart, description: 'Informações de saúde' },
  { title: 'Responsável', icon: Users, description: 'Dados do responsável' },
  { title: 'Unidade', icon: Building2, description: 'Vinculação à filial' },
]

export function AlunoCadastroPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const criarAlunoComResponsavel = useCriarAlunoComResponsavel()
  const { data: totalAtivos } = useAlunosAtivos()
  const { data: limite } = useLimiteAlunos()
  const { data: filiais } = useFiliais()

  const limiteAtingido = limite !== undefined && totalAtivos !== undefined && totalAtivos >= limite

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema),
    defaultValues: { nome_completo: '', data_nascimento: '' },
  })

  const validateStep = async () => {
    const fieldsPerStep: (keyof AlunoFormValues)[][] = [
      ['nome_completo', 'data_nascimento'],
      [],
      ['responsavel_nome', 'responsavel_cpf', 'responsavel_senha'],
      [],
    ]
    return await trigger(fieldsPerStep[currentStep])
  }

  const nextStep = async () => {
    const isValid = await validateStep()
    if (isValid && currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: AlunoFormValues) => {
    if (!authUser) return
    if (limiteAtingido) {
      toast.error('Limite de alunos atingido!')
      return
    }

    try {
      // Converter patologias e medicamentos em arrays
      const patologias = data.patologias
        ? data.patologias.split(',').map((p) => p.trim()).filter(Boolean)
        : null
      const medicamentos = data.medicamentos
        ? data.medicamentos.split(',').map((m) => m.trim()).filter(Boolean)
        : null

      await criarAlunoComResponsavel.mutateAsync({
        responsavel: {
          cpf: data.responsavel_cpf,
          nome: data.responsavel_nome,
          telefone: data.responsavel_telefone || null,
          email: data.responsavel_email || null,
          senha_hash: data.responsavel_senha, // Em produção, hash no servidor
        },
        aluno: {
          tenant_id: authUser.tenantId,
          filial_id: data.filial_id || null,
          nome_completo: data.nome_completo,
          nome_social: data.nome_social || null,
          data_nascimento: data.data_nascimento,
          cpf: data.cpf || null,
          patologias,
          medicamentos,
          observacoes_saude: data.observacoes_saude || null,
          status: 'ativo',
        },
        grauParentesco: data.responsavel_parentesco || null,
      })

      toast.success('Aluno cadastrado com sucesso!')
      navigate('/alunos')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar aluno'
      toast.error(message)
    }
  }

  if (limiteAtingido) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/alunos')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Limite de Alunos Atingido</h2>
            <p className="text-amber-700 max-w-md mx-auto">
              Limite de {limite} alunos ativos atingido. Atualize seu plano ou desative existentes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/alunos')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300',
                  index < currentStep
                    ? 'bg-emerald-500 text-white'
                    : index === currentStep
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-zinc-100 text-muted-foreground'
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className={cn('text-xs mt-1.5 hidden sm:block', index === currentStep ? 'text-indigo-700 font-medium' : 'text-muted-foreground')}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('h-0.5 w-8 sm:w-16 mx-2', index < currentStep ? 'bg-emerald-500' : 'bg-zinc-200')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 - Dados Pessoais */}
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome completo *</Label>
                  <Input id="nome_completo" {...register('nome_completo')} />
                  {errors.nome_completo && <p className="text-sm text-destructive">{errors.nome_completo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_social">Nome social</Label>
                  <Input id="nome_social" placeholder="Opcional" {...register('nome_social')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                    <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
                    {errors.data_nascimento && <p className="text-sm text-destructive">{errors.data_nascimento.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 - Saúde */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="patologias">Patologias</Label>
                  <Textarea id="patologias" placeholder="Separe por vírgula: asma, rinite..." {...register('patologias')} />
                  <p className="text-xs text-muted-foreground">Separe cada item por vírgula</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicamentos">Medicamentos em uso</Label>
                  <Textarea id="medicamentos" placeholder="Separe por vírgula..." {...register('medicamentos')} />
                  <p className="text-xs text-muted-foreground">Separe cada item por vírgula</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes_saude">Observações de saúde</Label>
                  <Textarea id="observacoes_saude" {...register('observacoes_saude')} />
                </div>
              </>
            )}

            {/* Step 3 - Responsável */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
                  <Input id="responsavel_nome" {...register('responsavel_nome')} />
                  {errors.responsavel_nome && <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_cpf">CPF do responsável *</Label>
                    <Input id="responsavel_cpf" {...register('responsavel_cpf')} />
                    {errors.responsavel_cpf && <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_parentesco">Parentesco</Label>
                    <Select onValueChange={(v) => setValue('responsavel_parentesco', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pai">Pai</SelectItem>
                        <SelectItem value="mae">Mãe</SelectItem>
                        <SelectItem value="avo">Avô/Avó</SelectItem>
                        <SelectItem value="tio">Tio/Tia</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_telefone">Telefone</Label>
                    <Input id="responsavel_telefone" {...register('responsavel_telefone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_email">E-mail</Label>
                    <Input id="responsavel_email" type="email" {...register('responsavel_email')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel_senha">Senha de acesso *</Label>
                  <Input id="responsavel_senha" type="password" {...register('responsavel_senha')} />
                  {errors.responsavel_senha && <p className="text-sm text-destructive">{errors.responsavel_senha.message}</p>}
                  <p className="text-xs text-muted-foreground">Senha para o responsável acessar o portal</p>
                </div>
              </>
            )}

            {/* Step 4 - Unidade */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Unidade / Filial</Label>
                  <Select onValueChange={(v) => setValue('filial_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a unidade (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {filiais?.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome_unidade} {f.is_matriz ? '(Matriz)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(!filiais || filiais.length === 0) && (
                  <p className="text-sm text-amber-600">Nenhuma unidade cadastrada. É opcional.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>) : (<><Check className="mr-2 h-4 w-4" /> Cadastrar Aluno</>)}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
