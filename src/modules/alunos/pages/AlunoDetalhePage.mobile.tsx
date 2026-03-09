import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  UserCircle, 
  MapPin, 
  Heart, 
  Users, 
  Edit2, 
  Phone, 
  Mail, 
  Fingerprint, 
  Calendar, 
  Building2, 
  Lock, 
  CheckCircle2, 
  CreditCard,
  ChevronRight,
  MoreVertical,
  Save,
  ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useAluno, useAtualizarAluno, useAtivarAcessoPortal, useAlternarFinanceiro } from '../hooks'
import { cn } from '@/lib/utils'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export function AlunoDetalhePageMobile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: aluno, isLoading } = useAluno(id || '')
  const atualizarAluno = useAtualizarAluno()
  const ativarAcesso = useAtivarAcessoPortal()
  const alternarFinanceiro = useAlternarFinanceiro()

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isActivationSheetOpen, setIsActivationSheetOpen] = useState(false)
  const [activatingResp, setActivatingResp] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    if (aluno && !formData) {
       setFormData({
         nome_completo: aluno.nome_completo,
         nome_social: aluno.nome_social || '',
         data_nascimento: aluno.data_nascimento,
         cpf: aluno.cpf || '',
       })
    }
  }, [aluno, formData])

  const handleSave = async () => {
    try {
      await atualizarAluno.mutateAsync({ id: id!, aluno: formData })
      toast.success('Dados atualizados!')
      setIsEditSheetOpen(false)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  const handleActivatePortal = async () => {
    if (newPassword.length < 6) return
    try {
      await ativarAcesso.mutateAsync({ responsavelId: activatingResp.id, senha: newPassword })
      toast.success('Portal ativado!')
      setIsActivationSheetOpen(false)
      setNewPassword('')
    } catch {
      toast.error('Erro ao ativar')
    }
  }

  if (isLoading) {
    return (
      <MobilePageLayout title="Detalhes do Aluno">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-[2.5rem]" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </MobilePageLayout>
    )
  }

  if (!aluno) return null

  const vinculos = (aluno as any).aluno_responsavel as any[]
  const filial = (aluno as any).filiais as any

  return (
    <MobilePageLayout 
      title={aluno.nome_completo}
      leftAction={
        <Button variant="ghost" size="icon" onClick={() => navigate('/alunos')} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      }
      rightActions={
        <Button variant="ghost" size="icon" onClick={() => setIsEditSheetOpen(true)} className="rounded-full h-10 w-10 bg-slate-100">
          <Edit2 className="h-4 w-4 text-slate-500" />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <section className="relative">
           <NativeCard className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center gap-4 text-center">
              <div className="h-20 w-20 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                 <UserCircle className="h-12 w-12 text-indigo-500" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{aluno.nome_completo}</h2>
                 {aluno.nome_social && <p className="text-sm font-bold text-indigo-600">"{aluno.nome_social}"</p>}
                 <div className="flex justify-center gap-2 mt-2">
                    <Badge className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0", aluno.status === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                       {aluno.status}
                    </Badge>
                    <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-slate-200 text-slate-400">
                       {filial?.nome_unidade || 'Sem Unidade'}
                    </Badge>
                 </div>
              </div>
           </NativeCard>
        </section>

        {/* Info Sections */}
        <section className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Informações Principais</h3>
           <NativeCard className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                 <Fingerprint className="h-4 w-4 text-slate-300" />
                 <div><p className="text-[8px] uppercase font-black text-slate-400">CPF</p><p className="text-sm font-bold text-slate-800">{aluno.cpf || 'Não cadastrado'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                 <Calendar className="h-4 w-4 text-slate-300" />
                 <div><p className="text-[8px] uppercase font-black text-slate-400">Nascimento</p><p className="text-sm font-bold text-slate-800">{aluno.data_nascimento || '---'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                 <MapPin className="h-4 w-4 text-slate-300" />
                 <div><p className="text-[8px] uppercase font-black text-slate-400">Endereço</p><p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{aluno.logradouro || 'Não informado'}</p></div>
              </div>
           </NativeCard>

           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 pt-2">Saúde</h3>
           <NativeCard className="bg-rose-50/30 border border-rose-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                 <Heart className="h-4 w-4 text-rose-500" />
                 <p className="text-xs font-black text-rose-900 uppercase tracking-widest">Atenção e Alergias</p>
              </div>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                 {aluno.observacoes_saude || 'Nenhum registro de saúde cadastrado para este aluno.'}
              </p>
           </NativeCard>
        </section>

        {/* Responsáveis Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsáveis e Família</h3>
              <Badge className="bg-indigo-100 text-indigo-700 border-0 h-5 text-[8px] font-black rounded-lg">{vinculos?.length || 0} VÍNCULOS</Badge>
           </div>
           
           <div className="space-y-3">
              {vinculos?.map((v, i) => (
                <NativeCard key={i} className="group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2 items-center">
                       <p className="font-bold text-sm text-slate-900">{v.responsaveis.nome}</p>
                       {v.is_financeiro && <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black h-5 border-0">FINANCEIRO</Badge>}
                    </div>
                    <MoreVertical className="h-4 w-4 text-slate-300" />
                  </div>
                  
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">{v.grau_parentesco || 'Responsável'}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><Phone className="h-3 w-3" /> {v.responsaveis.telefone || '---'}</div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 truncate"><Mail className="h-3 w-3" /> {v.responsaveis.email || '---'}</div>
                  </div>

                  <div className="mt-4 flex gap-2">
                     {v.responsaveis.user_id ? (
                       <Badge variant="outline" className="flex-1 justify-center rounded-xl py-2 border-emerald-100 bg-emerald-50 text-emerald-700 text-[9px] font-black">
                         <CheckCircle2 className="h-3 w-3 mr-1" /> PORTAL ATIVO
                       </Badge>
                     ) : (
                       <Button 
                        variant="outline" 
                        className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase border-dashed border-slate-200"
                        onClick={() => {
                          setActivatingResp(v.responsaveis)
                          setIsActivationSheetOpen(true)
                        }}
                       >
                         <Lock className="h-3 w-3 mr-1" /> Liberar Portal
                       </Button>
                     )}
                  </div>
                </NativeCard>
              ))}
           </div>
        </section>
      </div>

      {/* Edit Form Bottom Sheet */}
      <BottomSheet isOpen={isEditSheetOpen} onClose={() => setIsEditSheetOpen(false)} title="Editar Cadastro" size="full">
         <div className="space-y-6 pt-4">
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Completo</Label>
               <Input value={formData?.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} className="h-14 rounded-2xl text-base font-bold" />
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Social</Label>
               <Input value={formData?.nome_social} onChange={(e) => setFormData({...formData, nome_social: e.target.value})} className="h-12 rounded-2xl font-medium" placeholder="Ex: Nome de preferência" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nascimento</Label>
                  <Input type="date" value={formData?.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} className="h-12 rounded-2xl" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CPF</Label>
                  <Input value={formData?.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} className="h-12 rounded-2xl" placeholder="000.000.000-00" />
               </div>
            </div>
            
            <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-bold shadow-xl shadow-indigo-100 mt-6" onClick={handleSave} disabled={atualizarAluno.isPending}>
               {atualizarAluno.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
         </div>
      </BottomSheet>

      {/* Portal Activation Sheet */}
      <BottomSheet isOpen={isActivationSheetOpen} onClose={() => setIsActivationSheetOpen(false)} title="Ativar Portal" size="half">
         <div className="space-y-6 pt-4">
            <p className="text-xs text-slate-500 font-medium">Defina uma senha para <strong>{activatingResp?.nome}</strong>. O login será pelo CPF.</p>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha Temporária</Label>
               <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 rounded-2xl" placeholder="Mínimo 6 caracteres" />
            </div>
            <Button className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold" onClick={handleActivatePortal} disabled={newPassword.length < 6 || ativarAcesso.isPending}>
               Confirmar Liberação
            </Button>
         </div>
      </BottomSheet>
    </MobilePageLayout>
  )
}
