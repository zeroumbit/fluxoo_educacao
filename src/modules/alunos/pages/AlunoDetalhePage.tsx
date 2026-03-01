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
import { ArrowLeft, Loader2, UserCircle, MapPin, Heart, Users, Edit2, Save, X, Phone, Mail, Fingerprint, Calendar, Building2, Lock, CheckCircle2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useAluno, useAtualizarAluno, useAtivarAcessoPortal, useAlternarFinanceiro } from '../hooks'
import { cn } from '@/lib/utils'

export function AlunoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditingInitial = searchParams.get('edit') === 'true'
  
  const { data: aluno, isLoading } = useAluno(id || '')
  const atualizarAluno = useAtualizarAluno()
  const ativarAcesso = useAtivarAcessoPortal()
  const alternarFinanceiro = useAlternarFinanceiro()
  
  const [isEditing, setIsEditing] = useState(isEditingInitial)
  const [formData, setFormData] = useState<any>(null)
  
  // Estados para Ativação de Portal
  const [activatingResp, setActivatingResp] = useState<{ id: string, nome: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Inicializa o form com os dados do aluno quando carregar
  useEffect(() => {
    if (aluno && !formData) {
      setFormData({
        nome_completo: aluno.nome_completo,
        nome_social: aluno.nome_social || '',
        data_nascimento: aluno.data_nascimento,
        cpf: aluno.cpf || '',
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
      })
    }
  }, [aluno, formData])

  const handleSave = async () => {
    if (!id) return
    try {
      const payload = {
        ...formData,
        patologias: formData.patologias ? formData.patologias.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
        medicamentos: formData.medicamentos ? formData.medicamentos.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
      }
      await atualizarAluno.mutateAsync({ id, aluno: payload })
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
      await ativarAcesso.mutateAsync({ 
        responsavelId: activatingResp.id, 
        senha: newPassword 
      })
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

  if (!aluno) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-medium">Aluno não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/alunos')} className="text-indigo-600">Voltar para a lista</Button>
      </div>
    )
  }

  const vinculos = (aluno as any).aluno_responsavel as Array<{
    id: string
    is_financeiro: boolean
    grau_parentesco: string | null
    responsaveis: any
  }> | null

  const filial = (aluno as any).filiais as { nome_unidade: string } | null

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate('/alunos')} className="w-fit transition-colors hover:bg-zinc-100 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Alunos
        </Button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl border-zinc-200">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={atualizarAluno.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                {atualizarAluno.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl border-zinc-200">
                <Edit2 className="mr-2 h-4 w-4" /> Editar Aluno
              </Button>
              <Button
                variant={aluno.status === 'ativo' ? 'destructive' : 'default'}
                size="sm"
                onClick={toggleStatus}
                disabled={atualizarAluno.isPending}
                className={cn("rounded-xl shadow-sm", aluno.status !== 'ativo' && "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 border-0")}
              >
                {aluno.status === 'ativo' ? 'Desativar Aluno' : 'Ativar Aluno'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-white to-zinc-50/50">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shadow-inner border border-white/50">
              <UserCircle className="h-16 w-16 text-indigo-600/80" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                {isEditing && formData ? (
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-widest font-black text-muted-foreground">Nome Completo</Label>
                      <Input value={formData.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} className="h-11 rounded-xl font-bold text-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-widest font-black text-muted-foreground">Nome Social</Label>
                      <Input value={formData.nome_social} onChange={(e) => setFormData({...formData, nome_social: e.target.value})} className="h-10 rounded-xl" placeholder="Ex: Nome como o aluno prefere ser chamado" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{aluno.nome_completo}</h1>
                    {aluno.nome_social && (
                      <p className="text-indigo-600 font-semibold text-lg">"{aluno.nome_social}"</p>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className={cn("px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest", aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-zinc-100 text-zinc-600 border border-zinc-200')}>
                  {aluno.status}
                </Badge>
                {filial && (
                  <Badge variant="outline" className="px-3 py-1 rounded-full border-zinc-200 text-zinc-600 font-bold text-[10px] uppercase tracking-widest bg-white">
                    <Building2 className="mr-1 h-3 w-3" /> {filial.nome_unidade}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados Pessoais & Endereço */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg rounded-3xl">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Fingerprint className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg font-bold">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing && formData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-bold text-xs uppercase">Data de Nascimento</Label>
                    <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500 font-bold text-xs uppercase">CPF</Label>
                    <Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="000.000.000-00" className="rounded-xl" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Data de Nascimento</p>
                    <p className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-400" /> {aluno.data_nascimento || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">CPF</p>
                    <p className="font-bold text-zinc-700">{aluno.cpf || '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-3xl">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg font-bold">Endereço Residencial</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && formData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-zinc-400">CEP</Label><Input value={formData.cep} onChange={(e) => setFormData({...formData, cep: e.target.value})} className="rounded-xl h-9" /></div>
                    <div className="col-span-2 space-y-1"><Label className="text-[10px] uppercase font-bold text-zinc-400">Logradouro</Label><Input value={formData.logradouro} onChange={(e) => setFormData({...formData, logradouro: e.target.value})} className="rounded-xl h-9" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-zinc-400">Número</Label><Input value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} className="rounded-xl h-9" /></div>
                    <div className="col-span-2 space-y-1"><Label className="text-[10px] uppercase font-bold text-zinc-400">Complemento</Label><Input value={formData.complemento} onChange={(e) => setFormData({...formData, complemento: e.target.value})} className="rounded-xl h-9" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-zinc-400">Bairro</Label><Input value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} className="rounded-xl h-9" /></div>
                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-zinc-400">Cidade/UF</Label><div className="flex gap-1"><Input value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})} className="rounded-xl h-9 flex-1" /><Input value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="rounded-xl h-9 w-12" /></div></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rua e Número</p>
                    <p className="font-bold text-zinc-800">{aluno.logradouro || '—'}{aluno.numero ? `, ${aluno.numero}` : ''}</p>
                    {aluno.complemento && <p className="text-sm text-zinc-500 font-medium">{aluno.complemento}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bairro</p>
                      <p className="font-bold text-zinc-700">{aluno.bairro || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cidade / UF</p>
                      <p className="font-bold text-zinc-700">{aluno.cidade || '—'}{aluno.estado ? ` / ${aluno.estado}` : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-zinc-100">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CEP</p>
                    <p className="font-bold text-zinc-600">{aluno.cep || '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Saúde & Responsáveis */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg rounded-3xl">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-lg font-bold">Saúde e Atenção</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && formData ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-zinc-400">Patologias (separadas por vírgula)</Label>
                      <Textarea value={formData.patologias} onChange={(e) => setFormData({...formData, patologias: e.target.value})} className="rounded-xl min-h-[60px]" placeholder="Ex: Rinite, Asma..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-zinc-400">Medicamentos</Label>
                      <Textarea value={formData.medicamentos} onChange={(e) => setFormData({...formData, medicamentos: e.target.value})} className="rounded-xl min-h-[60px]" placeholder="Ex: Antialérgico..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-zinc-400">Observações Gerais</Label>
                      <Textarea value={formData.observacoes_saude} onChange={(e) => setFormData({...formData, observacoes_saude: e.target.value})} className="rounded-xl min-h-[80px]" />
                    </div>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100/50 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Patologias</p>
                      <p className="font-bold text-zinc-800">
                        {aluno.patologias && aluno.patologias.length > 0
                          ? aluno.patologias.join(', ')
                          : 'Nenhuma informada'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Medicamentos</p>
                      <p className="font-bold text-zinc-800">
                        {aluno.medicamentos && aluno.medicamentos.length > 0
                          ? aluno.medicamentos.join(', ')
                          : 'Nenhum informado'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Observações Adicionais</p>
                    <p className="text-sm text-zinc-600 font-medium leading-relaxed">{aluno.observacoes_saude || 'Nenhuma observação registrada.'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-3xl">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg font-bold">Núcleo Familiar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vinculos?.map((v, i) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-black text-zinc-900 leading-tight">{v.responsaveis.nome}</p>
                      <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-0.5">{v.grau_parentesco || 'Responsável'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {v.is_financeiro && (
                        <Badge className="rounded-full bg-emerald-100 text-emerald-800 border-emerald-200 font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                          <CreditCard className="h-2.5 w-2.5 mr-1" /> PAGADOR
                        </Badge>
                      )}
                      <Badge variant="secondary" className="rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0 font-bold text-[10px]">REPRESENTANTE</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-bold text-zinc-700">{v.responsaveis.telefone || 'Sem telefone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-bold text-zinc-700 lowercase truncate max-w-[200px]">{v.responsaveis.email || 'Sem e-mail'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Fingerprint className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-bold text-zinc-500">{v.responsaveis.cpf}</span>
                    </div>
                  </div>

                  {/* Status do Portal e Ações */}
                  <div className="mt-4 pt-4 border-t border-zinc-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       {v.responsaveis.user_id ? (
                         <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 rounded-lg flex gap-1 items-center py-1">
                           <CheckCircle2 className="h-3 w-3" /> Acesso Ativo
                         </Badge>
                       ) : (
                         <Badge variant="outline" className="text-zinc-400 border-zinc-200 rounded-lg flex gap-1 items-center py-1">
                           <Lock className="h-3 w-3" /> Sem Acesso
                         </Badge>
                       )}
                    </div>
                    
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-2 text-[10px] font-bold uppercase tracking-tight rounded-xl border border-dashed hover:bg-zinc-100",
                            v.is_financeiro ? "text-amber-600 border-amber-200" : "text-zinc-400 border-zinc-200"
                          )}
                          onClick={() => alternarFinanceiro.mutate({ 
                             vinculoId: v.id, 
                             isFinanceiro: !v.is_financeiro 
                          })}
                          disabled={alternarFinanceiro.isPending}
                          title={v.is_financeiro ? "Remover responsabilidade financeira" : "Tornar responsável financeiro"}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {v.is_financeiro ? 'Remover Pagador' : 'Tornar Pagador'}
                        </Button>

                        {!v.responsaveis.user_id && v.responsaveis.email && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] font-bold uppercase tracking-tight rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                            onClick={() => {
                              setActivatingResp({ id: v.responsaveis.id, nome: v.responsaveis.nome })
                              setNewPassword('')
                            }}
                            disabled={ativarAcesso.isPending}
                          >
                            {ativarAcesso.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                            Ativar Portal
                          </Button>
                        )}
                      </div>
                  </div>

                  {/* Endereço do Responsável - Quase sempre igual ao do aluno, mas bom listar se houver */}
                  {(v.responsaveis.logradouro || v.responsaveis.cep) && (
                    <div className="mt-3 pt-3 border-t border-zinc-200/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> Endereço Próprio</p>
                      <p className="text-xs font-bold text-zinc-600">{v.responsaveis.logradouro}, {v.responsaveis.numero}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{v.responsaveis.bairro}, {v.responsaveis.cidade}</p>
                    </div>
                  )}
                </div>
              ))}
              {!vinculos?.length && <p className="text-sm text-center text-muted-foreground py-4">Nenhum responsável vinculado.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Ativação de Portal */}
      <Dialog open={!!activatingResp} onOpenChange={(open) => !open && setActivatingResp(null)}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-zinc-900">Ativar Portal da Família</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium pt-1">
              Defina uma senha de acesso para <strong>{activatingResp?.nome}</strong>. O login será feito através do CPF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-widest text-zinc-400">Senha de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                <Input 
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 pl-10 rounded-2xl border-zinc-100 bg-zinc-50/50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed italic">
              * Recomendamos uma senha temporária simples que o responsável possa alterar em seu primeiro acesso.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setActivatingResp(null)} className="rounded-xl font-bold">Cancelar</Button>
            <Button 
              onClick={handleConfirmActivation} 
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-8 shadow-lg shadow-zinc-200"
              disabled={ativarAcesso.isPending || newPassword.length < 6}
            >
              {ativarAcesso.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              ATIVAR ACESSO AGORA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
