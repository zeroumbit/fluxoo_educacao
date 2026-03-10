import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  ShieldCheck,
  GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'
import { useAluno, useAtualizarAluno, useAtivarAcessoPortal, useAlternarFinanceiro } from '../hooks'
import { cn } from '@/lib/utils'
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
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-6">
          <Skeleton className="h-32 w-full rounded-[2.5rem]" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!aluno) return null

  const vinculos = (aluno as any).aluno_responsavel as any[]
  const filial = (aluno as any).filiais as any

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
      {/* Rule 3: Sticky Top Header (Custom, no MobilePageLayout) */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[640px] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => navigate('/alunos')}
              className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
            </motion.button>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[180px]">
                {aluno.nome_completo}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Perfil do Aluno</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setIsEditSheetOpen(true)}
            className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50"
          >
            <Edit2 className="h-4 w-4 text-indigo-600" />
          </motion.button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[640px] px-4 pt-6 space-y-7">
        {/* Header Profile Section */}
        <section>
          <NativeCard className="bg-white dark:bg-slate-900 p-6 flex flex-col items-center gap-4 text-center">
            <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-inner overflow-hidden">
               {(aluno as any).foto_url ? (
                 <img src={(aluno as any).foto_url} alt="" className="w-full h-full object-cover" />
               ) : (
                 <UserCircle className="h-14 w-14 text-indigo-200" />
               )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{aluno.nome_completo}</h2>
              {aluno.nome_social && <p className="text-sm font-bold text-indigo-600">"{aluno.nome_social}"</p>}
              <div className="flex justify-center gap-2 mt-3">
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

        {/* Informações Section */}
        <section className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dados Cadastrais</Label>
          <NativeCard className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Fingerprint className="h-4 w-4 text-slate-300" /></div>
              <div><p className="text-[8px] uppercase font-black text-slate-400">CPF</p><p className="text-sm font-bold text-slate-800">{aluno.cpf || '---'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Calendar className="h-4 w-4 text-slate-300" /></div>
              <div><p className="text-[8px] uppercase font-black text-slate-400">Nascimento</p><p className="text-sm font-bold text-slate-800">{aluno.data_nascimento || '---'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-slate-300" /></div>
              <div><p className="text-[8px] uppercase font-black text-slate-400">Cidade</p><p className="text-sm font-bold text-slate-800">{aluno.cidade} - {aluno.estado}</p></div>
            </div>
          </NativeCard>
        </section>

        {/* Saúde Section */}
        <section className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Saúde e Alergias</Label>
          <NativeCard className="bg-rose-50/50 border-rose-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="h-4 w-4 text-rose-500" />
              <p className="text-xs font-black text-rose-900 uppercase tracking-widest">Protocolo de Saúde</p>
            </div>
            <p className="text-[13px] text-rose-700 font-medium leading-relaxed">
              {aluno.observacoes_saude || 'Nenhuma restrição ou patologia informada.'}
            </p>
          </NativeCard>
        </section>

        {/* Familiares Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsáveis</Label>
            <Badge className="bg-indigo-100 text-indigo-700 border-0 h-5 text-[9px] font-black rounded-lg">{vinculos?.length || 0} VÍNCULOS</Badge>
          </div>
          <div className="space-y-3">
            {vinculos?.map((v, i) => (
              <NativeCard key={i} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none">{v.responsaveis.nome}</h4>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1.5">{v.grau_parentesco || 'Responsável'}</p>
                  </div>
                  {v.is_financeiro && <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black h-5 border-0">PAGADOR</Badge>}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><Phone className="h-3.5 w-3.5 text-slate-300" /> {v.responsaveis.telefone || '---'}</div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 truncate"><Mail className="h-3.5 w-3.5 text-slate-300" /> {v.responsaveis.email || '---'}</div>
                </div>

                {!v.responsaveis.user_id && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 rounded-xl h-11 text-xs font-black border-dashed border-slate-200 text-slate-400"
                    onClick={() => {
                      setActivatingResp(v.responsaveis)
                      setIsActivationSheetOpen(true)
                    }}
                  >
                    <Lock className="h-3.5 w-3.5 mr-2" /> LIBERAR PORTAL
                  </Button>
                )}
                {v.responsaveis.user_id && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 py-2 rounded-xl">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ACESSO ATIVO
                  </div>
                )}
              </NativeCard>
            ))}
          </div>
        </section>
      </div>

      {/* Sheet para Edição Rápida (Rule 4) */}
      <BottomSheet isOpen={isEditSheetOpen} onClose={() => setIsEditSheetOpen(false)} title="Editar Cadastro" size="full">
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
            <Input value={formData?.nome_completo} onChange={(e) => setFormData({...formData, nome_completo: e.target.value})} className="h-14 rounded-2xl text-base font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Social</Label>
            <Input value={formData?.nome_social} onChange={(e) => setFormData({...formData, nome_social: e.target.value})} className="h-14 rounded-2xl font-medium" placeholder="Ex: Nome de preferência" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nascimento</Label>
              <Input type="date" value={formData?.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} className="h-14 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF</Label>
              <Input value={formData?.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} className="h-14 rounded-2xl font-bold" placeholder="000.000.000-00" />
            </div>
          </div>
          <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-bold shadow-xl shadow-indigo-100 mt-6" onClick={handleSave} disabled={atualizarAluno.isPending}>
            {atualizarAluno.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </BottomSheet>

      {/* Sheet para Ativação de Portal */}
      <BottomSheet isOpen={isActivationSheetOpen} onClose={() => setIsActivationSheetOpen(false)} title="Ativar Portal" size="half">
        <div className="space-y-6 pt-4 text-center">
          <div className="h-16 w-16 bg-zinc-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2">
            <Lock className="h-8 w-8 text-zinc-400" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-slate-900">Defina uma senha</h4>
            <p className="text-xs text-slate-500 font-medium px-6">O responsável <strong>{activatingResp?.nome}</strong> usará o CPF dele e esta senha para acessar o portal.</p>
          </div>
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha Temporária</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-14 rounded-2xl text-center text-lg tracking-[0.5em] font-black" placeholder="••••••" />
          </div>
          <Button className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold" onClick={handleActivatePortal} disabled={newPassword.length < 6}>
            Confirmar Liberação
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
