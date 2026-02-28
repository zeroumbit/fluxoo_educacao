import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { useCriarAluno, useAlunosAtivos } from '../hooks'
import { useLimiteAlunos } from '@/modules/assinatura/hooks'
import { useTurmas } from '@/modules/turmas/hooks'
import { supabase } from '@/lib/supabase'
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
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const alunoSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  data_nascimento: z.string().optional(),
  cpf: z.string().optional(),
  sexo: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  alergias: z.string().optional(),
  medicamentos: z.string().optional(),
  tipo_sanguineo: z.string().optional(),
  observacoes_saude: z.string().optional(),
  responsavel_nome: z.string().min(3, 'Nome do responsável é obrigatório'),
  responsavel_cpf: z.string().optional(),
  responsavel_telefone: z.string().optional(),
  responsavel_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  responsavel_parentesco: z.string().optional(),
  turma_id: z.string().min(1, 'Selecione uma turma'),
})

type AlunoFormValues = z.infer<typeof alunoSchema>

const steps = [
  { title: 'Dados Pessoais', icon: User, description: 'Informações pessoais do aluno' },
  { title: 'Saúde', icon: Heart, description: 'Informações de saúde' },
  { title: 'Responsável', icon: Users, description: 'Dados do responsável' },
  { title: 'Turma', icon: BookOpen, description: 'Vinculação à turma' },
]

export function AlunoCadastroPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const criarAluno = useCriarAluno()
  const { data: totalAtivos } = useAlunosAtivos()
  const { data: limite } = useLimiteAlunos()
  const { data: turmas } = useTurmas()

  const limiteAtingido = limite !== undefined && totalAtivos !== undefined && totalAtivos >= limite

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AlunoFormValues>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      nome: '',
      turma_id: '',
    },
  })

  const turmaId = watch('turma_id')

  const validateStep = async () => {
    const fieldsPerStep: (keyof AlunoFormValues)[][] = [
      ['nome'],
      [],
      ['responsavel_nome'],
      ['turma_id'],
    ]
    const result = await trigger(fieldsPerStep[currentStep])
    return result
  }

  const nextStep = async () => {
    const isValid = await validateStep()
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: AlunoFormValues) => {
    if (!authUser) return
    if (limiteAtingido) {
      toast.error('Limite de alunos atingido! Atualize seu plano.')
      return
    }

    try {
      // 1. Criar responsável
      const { data: responsavel, error: respError } = await supabase
        .from('responsaveis')
        .insert({
          tenant_id: authUser.tenantId,
          nome: data.responsavel_nome,
          cpf: data.responsavel_cpf || null,
          telefone: data.responsavel_telefone || null,
          email: data.responsavel_email || null,
          parentesco: data.responsavel_parentesco || null,
        })
        .select()
        .single()

      if (respError) throw respError

      // 2. Criar aluno vinculado ao responsável
      await criarAluno.mutateAsync({
        tenant_id: authUser.tenantId,
        nome: data.nome,
        data_nascimento: data.data_nascimento || null,
        cpf: data.cpf || null,
        sexo: data.sexo || null,
        endereco: data.endereco || null,
        telefone: data.telefone || null,
        email: data.email || null,
        alergias: data.alergias || null,
        medicamentos: data.medicamentos || null,
        tipo_sanguineo: data.tipo_sanguineo || null,
        observacoes_saude: data.observacoes_saude || null,
        turma_id: data.turma_id,
        responsavel_id: responsavel.id,
        status: 'ativo',
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
              Sua escola atingiu o limite de {limite} alunos ativos. 
              Para cadastrar novos alunos, atualize seu plano ou desative alunos existentes.
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
              <span
                className={cn(
                  'text-xs mt-1.5 hidden sm:block',
                  index === currentStep ? 'text-indigo-700 font-medium' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-16 mx-2',
                  index < currentStep ? 'bg-emerald-500' : 'bg-zinc-200'
                )}
              />
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
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input id="nome" {...register('nome')} />
                  {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select onValueChange={(v) => setValue('sexo', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" {...register('endereco')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" {...register('telefone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" {...register('email')} />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 - Saúde */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Textarea id="alergias" placeholder="Descreva as alergias..." {...register('alergias')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicamentos">Medicamentos em uso</Label>
                  <Textarea id="medicamentos" placeholder="Liste os medicamentos..." {...register('medicamentos')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_sanguineo">Tipo Sanguíneo</Label>
                  <Select onValueChange={(v) => setValue('tipo_sanguineo', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes_saude">Observações de saúde</Label>
                  <Textarea id="observacoes_saude" placeholder="Outras observações..." {...register('observacoes_saude')} />
                </div>
              </>
            )}

            {/* Step 3 - Responsável */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
                  <Input id="responsavel_nome" {...register('responsavel_nome')} />
                  {errors.responsavel_nome && (
                    <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_cpf">CPF</Label>
                    <Input id="responsavel_cpf" {...register('responsavel_cpf')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_parentesco">Parentesco</Label>
                    <Select onValueChange={(v) => setValue('responsavel_parentesco', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
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
              </>
            )}

            {/* Step 4 - Turma */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Turma *</Label>
                  <Select value={turmaId} onValueChange={(v) => setValue('turma_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas?.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome} - {turma.turno}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.turma_id && (
                    <p className="text-sm text-destructive">{errors.turma_id.message}</p>
                  )}
                </div>
                {turmas?.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Nenhuma turma cadastrada. Cadastre uma turma primeiro.
                  </p>
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> Cadastrar Aluno
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
