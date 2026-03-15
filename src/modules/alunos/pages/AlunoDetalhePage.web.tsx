import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Loader2, UserCircle, MapPin, Heart, Users, Edit2, Save, X, Phone, Mail, Fingerprint, Calendar, Building2, Lock, CheckCircle2, CreditCard, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useAluno, useAtualizarAluno, useAtivarAcessoPortal, useAlternarFinanceiro } from '../hooks'
import { cn } from '@/lib/utils'

export function AlunoDetalhePageWeb() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditingInitial = searchParams.get('edit') === 'true'

  const { data: aluno, isLoading, error } = useAluno(id || '')
  const atualizarAluno = useAtualizarAluno()
  const ativarAcesso = useAtivarAcessoPortal()
  const alternarFinanceiro = useAlternarFinanceiro()

  const [isEditing, setIsEditing] = useState(isEditingInitial)
  const [formData, setFormData] = useState<any>(null)

  const [activatingResp, setActivatingResp] = useState<{ id: string, nome: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (aluno && !formData) {
      setFormData({
        nome_completo: aluno.nome_completo,
        nome_social: aluno.nome_social || '',
        data_nascimento: aluno.data_nascimento,
        cpf: aluno.cpf || '',
        rg: aluno.rg || '',
        genero: aluno.genero || '',
        cep: aluno.cep || '',
        logradouro: aluno.logradouro || '',
        numero: aluno.numero || '',
        complemento: aluno.complemento || '',
        bairro: aluno.bairro || '',
        cidade: aluno.cidade || '',
        estado: aluno.estado || '',
        patologias: aluno.patologias?.join(', ') || '',
        medicamentos: aluno.medicamentos?.join(', ') || '',
        observacoes_saude: aluno.observacoes_saude || '',
        valor_mensalidade_atual: (aluno as any).valor_mensalidade_atual || 0,
        data_ingresso: (aluno as any).data_ingresso || '',
      })
    }
  }, [aluno, formData])

  const handleSave = async () => {
    if (!id) return
    try {
      // Remover campos que não são da tabela 'alunos' (vem de matriculas/turmas)
      const { valor_mensalidade_atual, data_ingresso, ...payloadClean } = formData;
      
      const payload = {
        ...payloadClean,
        patologias: formData.patologias ? formData.patologias.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
        medicamentos: formData.medicamentos ? formData.medicamentos.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
      }
      await atualizarAluno.mutateAsync({ id, aluno: payload as any })
      toast.success('Dados atualizados com sucesso!')
      setIsEditing(false)
    } catch (err) {
      toast.error('Erro ao salvar alterações')
    }
  }

  const toggleStatus = async () => {
    if (!aluno || !id) return
    const novoStatus = aluno.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await atualizarAluno.mutateAsync({ id, aluno: { status: novoStatus } })
      toast.success(`Aluno ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`)
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleConfirmActivation = async () => {
    if (!activatingResp || !activatingResp.id) return
    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    try {
      await ativarAcesso.mutateAsync({ responsavelId: activatingResp.id, senha: newPassword })
      toast.success('Senha definida e acesso liberado!')
      setActivatingResp(null)
      setNewPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ativar acesso')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-bold">Erro ao carregar dados do aluno</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!aluno) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Aluno não encontrado</p>
      </div>
    )
  }

  const vinculos = (aluno as any).aluno_responsavel as any[]
  const filial = (aluno as any).filiais as { nome_unidade: string } | null

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/alunos')} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-100 font-bold text-[10px] uppercase tracking-[0.1em] transition-all"
        >
          <ArrowLeft size={16} /> Voltar para Alunos
        </Button>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)} 
                className="rounded-2xl font-bold px-6 h-11 border-slate-200 text-slate-600"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold px-8 h-11 shadow-lg shadow-indigo-100"
                disabled={atualizarAluno.isPending}
              >
                {atualizarAluno.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)} 
                className="rounded-2xl font-bold px-6 h-11 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Edit2 className="h-4 w-4 mr-2" /> Editar Cadastro
              </Button>
              <Button 
                variant={aluno.status === 'ativo' ? 'destructive' : 'default'} 
                onClick={toggleStatus} 
                className={cn(
                  "rounded-2xl font-bold px-6 h-11 shadow-md transition-all",
                  aluno.status === 'ativo' ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                )}
              >
                {aluno.status === 'ativo' ? 'Desativar Aluno' : 'Ativar Aluno'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-0 shadow-2xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-10 flex flex-col md:flex-row items-center md:items-start gap-8 bg-gradient-to-br from-white to-slate-50/50">
          <div className="relative group">
            <div className="h-32 w-32 rounded-[2rem] bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <UserCircle className="h-16 w-16 text-indigo-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
               <Fingerprint className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          
          <div className="space-y-4 flex-1 text-center md:text-left">
             <div className="space-y-1">
               {isEditing ? (
                 <Input 
                   value={formData?.nome_completo} 
                   onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} 
                   className="h-14 text-2xl font-black rounded-2xl border-indigo-100 focus:ring-indigo-500"
                 />
               ) : (
                 <>
                   <h1 className="text-4xl font-black tracking-tighter text-slate-900">{aluno.nome_completo}</h1>
                   {aluno.nome_social && (
                     <p className="text-indigo-600 font-bold text-xl drop-shadow-sm flex items-center justify-center md:justify-start gap-2 italic">
                       <CheckCircle2 size={18} /> {aluno.nome_social}
                     </p>
                   )}
                 </>
               )}
             </div>
             
             <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <Badge className={cn(
                  "px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-0",
                  aluno.status === 'ativo' ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-50' : 'bg-slate-100 text-slate-500'
                )}>
                  {aluno.status}
                </Badge>
                {(aluno as any).serie_ano && (
                  <Badge className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-indigo-100 text-indigo-700 border-0 shadow-sm shadow-indigo-50">
                    <Users size={12} className="mr-1.5" />
                    {(aluno as any).serie_ano} {(aluno as any).turma_nome ? `• ${(aluno as any).turma_nome}` : ''}
                  </Badge>
                )}
                {filial && (
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest border-slate-200 text-slate-500">
                    <Building2 size={12} className="mr-1.5" /> {filial.nome_unidade}
                  </Badge>
                )}
                {aluno.data_ingresso && (
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest border-slate-200 text-slate-500">
                    <Calendar size={12} className="mr-1.5" /> Desde {new Date(aluno.data_ingresso).toLocaleDateString('pt-BR')}
                  </Badge>
                )}
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Dados Cadastrais e Endereço */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Dados Pessoais */}
          <Card className="rounded-[2rem] border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
            <CardHeader className="pt-8 pb-4 px-8 flex flex-row items-center justify-between bg-slate-50/50">
               <div>
                  <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-indigo-500" /> Dados Pessoais
                  </CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identificação principal do aluno</p>
               </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">CPF</Label>
                 {isEditing ? (
                   <Input value={formData?.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} className="h-11 rounded-xl" />
                 ) : (
                   <p className="font-bold text-slate-700 text-lg">{aluno.cpf || 'Não informado'}</p>
                 )}
               </div>
               <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">RG</Label>
                 {isEditing ? (
                   <Input value={formData?.rg} onChange={(e) => setFormData({...formData, rg: e.target.value})} className="h-11 rounded-xl" />
                 ) : (
                   <p className="font-bold text-slate-700 text-lg">{aluno.rg || 'Não informado'}</p>
                 )}
               </div>
               <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Data de Nascimento</Label>
                 {isEditing ? (
                   <Input type="date" value={formData?.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} className="h-11 rounded-xl" />
                 ) : (
                   <p className="font-bold text-slate-700 text-lg">
                     {aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
                   </p>
                 )}
               </div>
               <div className="space-y-1">
                 <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Gênero</Label>
                 {isEditing ? (
                   <Input value={formData?.genero} onChange={(e) => setFormData({...formData, genero: e.target.value})} className="h-11 rounded-xl" />
                 ) : (
                   <p className="font-bold text-slate-700 text-lg uppercase">{aluno.genero || '---'}</p>
                 )}
               </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="rounded-[2rem] border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
            <CardHeader className="pt-8 pb-4 px-8 flex flex-row items-center justify-between bg-slate-50/50">
               <div>
                  <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-500" /> Localização
                  </CardTitle>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Endereço de residência fixo</p>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Logradouro</Label>
                    {isEditing ? (
                      <Input value={formData?.logradouro} onChange={(e) => setFormData({...formData, logradouro: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg">{aluno.logradouro || '---'}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Número</Label>
                    {isEditing ? (
                      <Input value={formData?.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg">{aluno.numero || 'S/N'}</p>
                    )}
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Bairro</Label>
                    {isEditing ? (
                      <Input value={formData?.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg">{aluno.bairro || '---'}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Complemento</Label>
                    {isEditing ? (
                      <Input value={formData?.complemento} onChange={(e) => setFormData({...formData, complemento: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg">{aluno.complemento || '---'}</p>
                    )}
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">CEP</Label>
                    {isEditing ? (
                      <Input value={formData?.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg">{aluno.cep || '---'}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Cidade</Label>
                    {isEditing ? (
                      <Input value={formData?.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg">{aluno.cidade || '---'}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Estado</Label>
                    {isEditing ? (
                      <Input value={formData?.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="h-11 rounded-xl" />
                    ) : (
                      <p className="font-bold text-slate-700 text-lg uppercase">{aluno.estado || '---'}</p>
                    )}
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Saúde e Responsáveis */}
        <div className="space-y-8">
          
          {/* Financeiro / Escolar */}
          <Card className="rounded-[2rem] border-0 shadow-xl shadow-slate-200/40 bg-indigo-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <CreditCard size={100} />
            </div>
            <CardHeader className="pt-8 pb-2 px-8">
               <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                 <CreditCard className="h-5 w-5" /> Escolar & Planos
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6 relative z-10">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Mensalidade Atual</p>
                 {isEditing ? (
                   <Input
                     type="number"
                     value={formData?.valor_mensalidade_atual}
                     onChange={(e) => setFormData({...formData, valor_mensalidade_atual: Number(e.target.value)})}
                     className="h-11 bg-white/10 border-white/20 text-white rounded-xl"
                   />
                 ) : (
                   <h4 className="text-3xl font-black">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((aluno as any).valor_mensalidade_atual || 0)}
                   </h4>
                 )}
               </div>
               
               {/* Turma / Ano do Aluno */}
               {(aluno as any).turma_atual && (aluno as any).turma_atual.nome && (
                 <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Turma / Ano</p>
                   <h4 className="text-xl font-black">
                     {(aluno as any).turma_atual.nome} {((aluno as any).ano_letivo) && `- ${((aluno as any).ano_letivo)}`}
                   </h4>
                 </div>
               )}
               
               <div className="h-px bg-white/10 w-full" />
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} className="text-indigo-200" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none mb-1">Status Acadêmico</p>
                    <p className="text-sm font-bold uppercase">{aluno.status === 'ativo' ? 'Matrícula Ativa' : 'Inativo / Trancado'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Saúde */}
          <Card className="rounded-[2rem] border-0 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
            <CardHeader className="pt-8 pb-4 px-8 flex flex-row items-center justify-between bg-rose-50/50">
               <div>
                  <CardTitle className="text-xl font-black text-rose-800 tracking-tight flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" /> Saúde & Atenção
                  </CardTitle>
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">Cuidados e restrições médicas</p>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Patologias</Label>
                 {isEditing ? (
                   <Textarea value={formData?.patologias} onChange={(e) => setFormData({...formData, patologias: e.target.value})} className="rounded-xl" />
                 ) : (
                   <div className="flex flex-wrap gap-2">
                     {aluno.patologias && aluno.patologias.length > 0 ? (
                       aluno.patologias.map((p, i) => (
                         <Badge key={i} className="bg-rose-50 text-rose-600 border-rose-100 font-bold px-3 py-1 rounded-lg">
                           {p}
                         </Badge>
                       ))
                     ) : <p className="text-sm font-medium text-slate-400 italic">Nenhuma registrada</p>}
                   </div>
                 )}
               </div>

               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Medicamentos</Label>
                 {isEditing ? (
                   <Textarea value={formData?.medicamentos} onChange={(e) => setFormData({...formData, medicamentos: e.target.value})} className="rounded-xl" />
                 ) : (
                   <div className="grid grid-cols-1 gap-2">
                     {aluno.medicamentos && aluno.medicamentos.length > 0 ? (
                        aluno.medicamentos.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                             <div className="h-2 w-2 rounded-full bg-rose-400" /> {m}
                          </div>
                        ))
                     ) : <p className="text-sm font-medium text-slate-400 italic">Nenhum uso registrado</p>}
                   </div>
                 )}
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-50">
                 <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Observações Gerais</Label>
                 {isEditing ? (
                    <Textarea value={formData?.observacoes_saude} onChange={(e) => setFormData({...formData, observacoes_saude: e.target.value})} className="rounded-xl h-24" />
                 ) : (
                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                      {aluno.observacoes_saude || 'Nenhuma observação adicional de saúde foi informada no cadastro inicial do aluno.'}
                    </p>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Responsáveis Section */}
      <Card className="rounded-[2.5rem] border-0 shadow-2xl shadow-slate-200/40 bg-white overflow-hidden mt-4">
        <CardHeader className="pt-10 pb-6 px-10 border-b border-slate-50">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <CardTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                   <Users className="h-6 w-6 text-indigo-500" /> Núcleo Familiar
                 </CardTitle>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Responsáveis vinculados e acesso ao portal</p>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-10">
           <div className="space-y-4">
              {vinculos?.map((v, i) => (
                <div key={i} className="group p-6 rounded-3xl bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-500 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
                   <div className="flex items-start lg:items-center gap-4 w-full">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-indigo-600 shrink-0">
                         {v.responsaveis.nome.charAt(0)}
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                         <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-slate-800 text-lg leading-tight break-words">{v.responsaveis.nome}</p>
                            {v.is_financeiro && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-black uppercase px-2 py-0 shrink-0">PAGADOR</Badge>
                            )}
                         </div>
                         <div className="flex flex-wrap gap-x-4 gap-y-2">
                           <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest">{v.grau_parentesco}</p>
                           {v.responsaveis.email && <p className="text-[10px] text-slate-400 font-bold"><Mail size={10} className="inline mr-1 shrink-0" /> {v.responsaveis.email}</p>}
                           {v.responsaveis.telefone && <p className="text-[10px] text-slate-400 font-bold"><Phone size={10} className="inline mr-1 shrink-0" /> {v.responsaveis.telefone}</p>}
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-2 w-full lg:w-auto lg:shrink-0">
                      {v.responsaveis.user_id ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 flex items-center gap-1.5">
                           <Lock size={12} /> ACESSO ATIVO
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivatingResp({id: v.responsaveis.id, nome: v.responsaveis.nome})}
                          className="flex-1 lg:flex-none rounded-xl font-black text-[10px] uppercase tracking-wider h-10 px-6 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Ativar Acesso
                        </Button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>

      <Dialog open={!!activatingResp} onOpenChange={() => setActivatingResp(null)}>
        <DialogContent className="rounded-[2.5rem] border-0 p-0 overflow-hidden bg-white shadow-2xl max-w-sm">
          <div className="bg-indigo-600 p-8 text-white text-center">
             <div className="h-16 w-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
             </div>
             <DialogTitle className="text-xl font-black">Liberar Acesso Portal</DialogTitle>
             <DialogDescription className="text-indigo-100 text-xs mt-2 italic font-medium">
               Responsável: {activatingResp?.nome}
             </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Definir Senha de Acesso</Label>
                <Input 
                   type="password" 
                   placeholder="Mínimo 6 caracteres"
                   value={newPassword} 
                   onChange={(e) => setNewPassword(e.target.value)} 
                   className="h-14 rounded-2xl border-slate-100 focus:ring-indigo-500 text-center font-black tracking-widest"
                />
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">O responsável usará o CPF dele e esta senha para entrar no <strong>Portal da Família</strong>.</p>
             </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-3">
             <Button 
                variant="ghost" 
                onClick={() => setActivatingResp(null)}
                className="rounded-xl font-bold text-slate-400"
             >
               Cancelar
             </Button>
             <Button 
                onClick={handleConfirmActivation} 
                disabled={ativarAcesso.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest h-11"
             >
                {ativarAcesso.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar e Ativar'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
