import re

with open('src/modules/alunos/pages/AlunoCadastroPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update schema responsavel_senha
content = content.replace("responsavel_senha: z.string().min(6, 'Senha mínima de 6 caracteres'),", "responsavel_senha: z.string().optional(),")

# 2. Add supabase import
if "import { supabase }" not in content:
    content = content.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { supabase } from '@/lib/supabase'")

# 3. Update steps
old_steps = """const steps = [
  { title: 'Dados Pessoais', icon: User, description: 'Informações do aluno' },
  { title: 'Endereço', icon: Building2, description: 'Endereço do aluno' },
  { title: 'Saúde', icon: Heart, description: 'Informações de saúde' },
  { title: 'Responsável', icon: Users, description: 'Dados do responsável' },
]"""
new_steps = """const steps = [
  { title: 'Responsável', icon: Users, description: 'Dados do responsável' },
  { title: 'Dados do aluno', icon: User, description: 'Informações do aluno' },
  { title: 'Endereço', icon: Building2, description: 'Endereço do aluno' },
  { title: 'Saúde', icon: Heart, description: 'Informações de saúde' },
]"""
content = content.replace(old_steps, new_steps)

# 4. Update validateStep
old_validate = """    const fieldsPerStep: (keyof AlunoFormValues)[][] = [
      ['nome_completo', 'data_nascimento'],
      ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'],
      [],
      ['responsavel_nome', 'responsavel_cpf', 'responsavel_senha', 'responsavel_financeiro'],
    ]"""
new_validate = """    const fieldsPerStep: (keyof AlunoFormValues)[][] = [
      ['responsavel_nome', 'responsavel_cpf', 'responsavel_financeiro'],
      ['nome_completo', 'data_nascimento'],
      ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'],
      [],
    ]"""
content = content.replace(old_validate, new_validate)

# 5. Add state variables inside component
if "const [responsavelEncontrado" not in content:
    content = content.replace("const [showPassword, setShowPassword] = useState(false)", 
"""const [showPassword, setShowPassword] = useState(false)
  const [responsavelEncontrado, setResponsavelEncontrado] = useState(false)
  const [buscandoCpf, setBuscandoCpf] = useState(false)""")

# Add handleCpfBlur function
handle_cpf_blur = """
  const handleCpfResponsavelBlur = async () => {
    const cpf = watch('responsavel_cpf')
    if (!cpf || cpf.length < 14) return
    
    setBuscandoCpf(true)
    const cpfLimpo = cpf.replace(/\\D/g, '')
    try {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('nome, email, telefone')
        .eq('cpf', cpfLimpo)
        .maybeSingle()
        
      if (data) {
        setResponsavelEncontrado(true)
        setValue('responsavel_nome', data.nome || '', { shouldValidate: true })
        setValue('responsavel_email', data.email || '', { shouldValidate: true })
        setValue('responsavel_telefone', data.telefone || '', { shouldValidate: true })
        toast.info('Esse responsável já está na plataforma, ele não precisa criar senha, preencha os demais campos.')
      } else {
        if (responsavelEncontrado) {
          setResponsavelEncontrado(false)
          setValue('responsavel_nome', '')
          setValue('responsavel_email', '')
          setValue('responsavel_telefone', '')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBuscandoCpf(false)
    }
  }
"""
if "handleCpfResponsavelBlur" not in content:
    content = content.replace("const handleTelefoneChange", handle_cpf_blur + "\n  const handleTelefoneChange")

# 6. Change JSX blocks for steps
content = content.replace("{/* Step 1 - Dados Pessoais */}", "{/* Step 2 - Dados do aluno */}")
content = content.replace("currentStep === 0 && (", "currentStep === 1 && (")

content = content.replace("{/* Step 2 - Endereço */}", "{/* Step 3 - Endereço */}")
content = content.replace("currentStep === 1 && (", "currentStep === 2 && (")

content = content.replace("{/* Step 3 - Saúde */}", "{/* Step 4 - Saúde */}")
content = content.replace("currentStep === 2 && (", "currentStep === 3 && (")

# Update responsavel step
content = content.replace("{/* Step 4 - Responsável */}", "{/* Step 1 - Responsável */}")
content = content.replace("currentStep === 3 && (", "currentStep === 0 && (")

# Now change the order of fields in Responsavel to have CPF and Parentesco first
# And add handleCpfResponsavelBlur to the CPF input
old_responsavel_fields = """                <div className="space-y-2">
                  <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
                  <Input 
                    id="responsavel_nome" 
                    placeholder="Digite o nome completo do responsável" 
                    {...register('responsavel_nome')} 
                  />
                  {errors.responsavel_nome && <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="responsavel_cpf">CPF do responsável *</Label>
                    <Input
                      id="responsavel_cpf"
                      placeholder="000.000.000-00"
                      {...register('responsavel_cpf')}
                      onChange={(e) => handleCpfChange(e, 'responsavel_cpf')}
                      maxLength={14}
                      className="w-full"
                    />
                    {errors.responsavel_cpf && (
                      <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_parentesco">Parentesco *</Label>
                    <Select onValueChange={(v) => setValue('responsavel_parentesco', v)}>
                      <SelectTrigger id="responsavel_parentesco" className="w-full">
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
                </div>"""

new_responsavel_fields = """                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="responsavel_cpf">CPF do responsável *</Label>
                    <div className="relative">
                      <Input
                        id="responsavel_cpf"
                        placeholder="000.000.000-00"
                        {...register('responsavel_cpf')}
                        onChange={(e) => {
                          handleCpfChange(e, 'responsavel_cpf')
                          if (e.target.value.length === 14) {
                            setTimeout(() => {
                              const input = document.getElementById('responsavel_cpf')
                              input?.blur()
                            }, 100)
                          }
                        }}
                        onBlur={handleCpfResponsavelBlur}
                        maxLength={14}
                        className="w-full"
                      />
                      {buscandoCpf && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {errors.responsavel_cpf && (
                      <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_parentesco">Parentesco *</Label>
                    <Select onValueChange={(v) => setValue('responsavel_parentesco', v)}>
                      <SelectTrigger id="responsavel_parentesco" className="w-full">
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

                {responsavelEncontrado && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-4 shadow-sm mb-4">
                    <Users className="h-6 w-6 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Responsável já cadastrado</h4>
                      <p className="text-sm mt-1">
                        Esse responsável já está na plataforma. Ele não precisa criar senha, e os dados abaixo podem ser revisados ou mantidos caso precise preencher os demais campos.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
                  <Input 
                    id="responsavel_nome" 
                    placeholder="Digite o nome completo do responsável" 
                    {...register('responsavel_nome')} 
                  />
                  {errors.responsavel_nome && <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>}
                </div>"""

content = content.replace(old_responsavel_fields, new_responsavel_fields)

# Hide password field if responsavelEncontrado
old_password = """                <div className="space-y-2">
                  <Label htmlFor="responsavel_senha">Senha de acesso *</Label>
                  <div className="relative">
                    <Input
                      id="responsavel_senha"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      {...register('responsavel_senha')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.responsavel_senha && <p className="text-sm text-destructive">{errors.responsavel_senha.message}</p>}
                  <p className="text-xs text-muted-foreground">Senha para o responsável acessar o portal</p>
                </div>"""

new_password = """                {!responsavelEncontrado && (
                  <div className="space-y-2">
                    <Label htmlFor="responsavel_senha">Senha de acesso *</Label>
                    <div className="relative">
                      <Input
                        id="responsavel_senha"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        {...register('responsavel_senha')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.responsavel_senha && <p className="text-sm text-destructive">{errors.responsavel_senha.message}</p>}
                    <p className="text-xs text-muted-foreground">Senha para o responsável acessar o portal</p>
                  </div>
                )}"""

content = content.replace(old_password, new_password)

# Fix filial step rendering (it was checking currentStep === 3, now should check currentStep === 0)
content = content.replace("currentStep === 3 && filiais && filiais.length > 0 &&", "currentStep === 0 && filiais && filiais.length > 0 &&")

with open('src/modules/alunos/pages/AlunoCadastroPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
