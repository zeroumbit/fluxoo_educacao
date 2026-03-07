import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/modules/auth/AuthContext'
import { usePortalContext } from '@/modules/portal/context'
import { useUpdatePerfil, useUpdateParentesco } from '@/modules/portal/hooks'
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  Settings, 
  MapPin, 
  Loader2, 
  Save, 
  Check, 
  Users,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { mascaraCPF, mascaraTelefone, validarCPF, mascaraCEP } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const perfilSchema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().min(14, 'CPF incompleto'),
  telefone: z.string().min(14, 'Telefone incompleto'),
  cep: z.string().min(9, 'CEP incompleto').optional().or(z.literal('')),
  logradouro: z.string().optional().or(z.literal('')),
  numero: z.string().optional().or(z.literal('')),
  bairro: z.string().optional().or(z.literal('')),
  cidade: z.string().optional().or(z.literal('')),
  estado: z.string().optional().or(z.literal('')),
}).refine((data) => !data.cpf || validarCPF(data.cpf), {
  message: 'CPF inválido',
  path: ['cpf'],
})

type PerfilFormValues = z.infer<typeof perfilSchema>

export function PortalPerfilPage() {
  const { authUser, signOut } = useAuth()
  const { responsavel, vinculos, alunoSelecionado } = usePortalContext()
  const updatePerfil = useUpdatePerfil()
  const updateParentesco = useUpdateParentesco()
  const [isEditing, setIsEditing] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
  })

  // Preencher form quando os dados carregarem
  useEffect(() => {
    if (responsavel) {
      reset({
        nome: responsavel.nome || '',
        cpf: responsavel.cpf || '',
        telefone: responsavel.telefone || '',
        cep: responsavel.cep || '',
        logradouro: responsavel.logradouro || '',
        numero: responsavel.numero || '',
        bairro: responsavel.bairro || '',
        cidade: responsavel.cidade || '',
        estado: responsavel.estado || '',
      })
    }
  }, [responsavel, reset])

  const { fetchAddressByCEP, loading: buscandoCep } = useViaCEP()

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = mascaraCEP(e.target.value)
    setValue('cep', val)
    if (val.length === 9) {
      const dados = await fetchAddressByCEP(val)
      if (dados && !('error' in dados)) {
        setValue('logradouro', (dados as any).logradouro || '')
        setValue('bairro', (dados as any).bairro || '')
        setValue('cidade', (dados as any).cidade || '')
        setValue('estado', (dados as any).estado || '')
      }
    }
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cpf', mascaraCPF(e.target.value))
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('telefone', mascaraTelefone(e.target.value))
  }

  const onSubmit = async (data: PerfilFormValues) => {
    try {
      await updatePerfil.mutateAsync({
        responsavelId: responsavel.id,
        dados: {
          ...data,
          cpf: data.cpf.replace(/\D/g, ''),
          updated_at: new Date().toISOString()
        }
      })
      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (err) {
      toast.error('Erro ao atualizar perfil')
      console.error(err)
    }
  }

  const handleUpdateParentesco = async (vinculoId: string, novoParentesco: string) => {
    try {
      await updateParentesco.mutateAsync({
        vinculoId,
        grauParentesco: novoParentesco
      })
      toast.success('Parentesco atualizado!')
    } catch (err) {
      toast.error('Erro ao atualizar parentesco')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e de contato</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700">
             <Settings className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pt-[30px] pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Suas informações básicas de identificação</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="perfil-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input 
                      id="nome" 
                      {...register('nome')} 
                      disabled={!isEditing}
                      className={!isEditing ? "bg-slate-50" : ""}
                    />
                    {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input 
                      id="cpf" 
                      {...register('cpf')} 
                      onChange={handleCpfChange}
                      maxLength={14}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-slate-50" : ""}
                    />
                    {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <div className="relative">
                      <Input 
                        id="email" 
                        value={responsavel?.email || ''} 
                        readOnly 
                        className="bg-slate-100 pl-9"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado pelo portal.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                    <Input 
                      id="telefone" 
                      {...register('telefone')} 
                      onChange={handleTelefoneChange}
                      maxLength={15}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-slate-50" : ""}
                    />
                    {errors.telefone && <p className="text-xs text-destructive">{errors.telefone.message}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Endereço
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input 
                          id="cep" 
                          {...register('cep')} 
                          onChange={handleCepChange}
                          maxLength={9}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-slate-50" : ""}
                        />
                        {buscandoCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-teal-600" />}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input 
                        id="logradouro" 
                        {...register('logradouro')} 
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input 
                        id="numero" 
                        {...register('numero')} 
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input 
                        id="bairro" 
                        {...register('bairro')} 
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input 
                        id="cidade" 
                        {...register('cidade')} 
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado (UF)</Label>
                      <Input 
                        id="estado" 
                        {...register('estado')} 
                        maxLength={2}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-slate-50 uppercase" : "uppercase"}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar Alterações
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pt-[30px] pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                  Informações Financeiras
                </CardTitle>
                <CardDescription>Valores acordados para o aluno selecionado ({alunoSelecionado?.nome_social || alunoSelecionado?.nome_completo})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Valor da Mensalidade</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alunoSelecionado?.turma?.valor_mensalidade || 0)}
                    </p>
                    <p className="text-[10px] text-slate-500 italic mt-1 font-medium">Turma: {alunoSelecionado?.turma?.nome || '—'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Valor da Matrícula/Contrato</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(alunoSelecionado?.valor_matricula || 0)}
                    </p>
                    <p className="text-[10px] text-slate-500 italic mt-1 font-medium">Status: {alunoSelecionado?.status || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
 
           <Card className="border-0 shadow-md overflow-hidden">
             <CardHeader className="pt-[30px] pb-4">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Users className="h-5 w-5 text-teal-600" />
                 Vínculos com Alunos
               </CardTitle>
               <CardDescription>Confirme seu parentesco com cada aluno vinculado</CardDescription>
             </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-100 border-t border-slate-100">
                 {vinculos.map((v: any) => (
                   <div key={v.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                            {v.aluno.nome_completo.charAt(0)}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{v.aluno.nome_completo}</p>
                            <p className="text-xs text-muted-foreground">ID Aluno: {v.aluno_id}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Parentesco:</Label>
                        <Select 
                          defaultValue={v.grau_parentesco || ''} 
                          onValueChange={(val) => handleUpdateParentesco(v.id, val)}
                        >
                          <SelectTrigger className="w-[140px] h-9">
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
                 ))}
                 {vinculos.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground italic">
                       Nenhum aluno vinculado encontrado.
                    </div>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-teal-600 to-teal-700 text-white">
            <CardContent className="pt-8 pb-8 text-center flex flex-col items-center">
               <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md mb-4 border border-white/30">
                  <User size={40} className="text-white" />
               </div>
               <h2 className="text-xl font-bold">{authUser?.nome}</h2>
               <p className="text-teal-100 text-sm opacity-80 uppercase tracking-widest font-medium mt-1">Responsável</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pt-[30px]">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Gerenciamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 border-slate-200" disabled>
                <Shield size={16} className="text-slate-400" /> Alterar Senha
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-3 shadow-sm"
                onClick={handleSignOut}
              >
                <LogOut size={16} /> Sair do Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
