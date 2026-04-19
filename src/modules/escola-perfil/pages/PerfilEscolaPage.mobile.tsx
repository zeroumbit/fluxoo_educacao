import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Loader2, 
  Save, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Camera, 
  Info,
  CheckCircle2
} from 'lucide-react'
import { mascaraCPF, mascaraCNPJ } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { NativeCard } from '@/components/mobile/NativeCard'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function PerfilEscolaPageMobile() {
  const { authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    razao_social: '', cnpj: '', email_gestor: '', nome_gestor: '', cpf_gestor: '',
    telefone: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
    logo_url: '',
  })

  const loadData = async () => {
    if (!authUser?.tenantId) return
    const { data } = await (supabase.from('escolas' as any) as any)
      .select('*').eq('id', authUser.tenantId).maybeSingle()
    if (data) {
      setForm({
        razao_social: data.razao_social || '', cnpj: data.cnpj || '',
        email_gestor: data.email_gestor || '', nome_gestor: data.nome_gestor || '',
        cpf_gestor: data.cpf_gestor || '', telefone: data.telefone || '',
        cep: data.cep || '', logradouro: data.logradouro || '', numero: data.numero || '',
        bairro: data.bairro || '', cidade: data.cidade || '', estado: data.estado || '',
        logo_url: data.logo_url || '',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [authUser?.tenantId])

  const { fetchAddressByCEP, fetchCitiesByUF, cities, _loadingCities, loading: buscandoCepHook, estados } = useViaCEP()

  useEffect(() => {
    if (form.estado) {
      fetchCitiesByUF(form.estado)
    }
  }, [form.estado])

  const buscarCep = async () => {
    if (form.cep.replace(/\D/g, '').length < 8) return
    const data = await fetchAddressByCEP(form.cep)
    if (data && !('error' in data)) {
      setForm(prev => ({ 
        ...prev, 
        logradouro: data.logradouro || '', 
        bairro: data.bairro || '', 
        estado: data.estado || '' 
      }))
      setTimeout(() => {
        setForm(prev => ({ ...prev, cidade: data.cidade || '' }))
      }, 500)
      toast.success('Localização atualizada!')
    }
  }

  const handleSave = async () => {
    if (!authUser?.tenantId) return
    if (!form.telefone) {
      toast.error('Informe o WhatsApp para contato!')
      return
    }
    setSaving(true)
    try {
      const { error } = await (supabase.from('escolas' as any) as any)
        .update({ ...form, updated_at: new Date().toISOString() }).eq('id', authUser.tenantId)
      if (error) throw error
      toast.success('Informações salvas com sucesso!')
    } catch { toast.error('Erro ao salvar perfil') }
    finally { setSaving(false) }
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !authUser) return

    try {
      toast.loading('Processando imagem...')
      const fileExt = file.name.split('.').pop()
      const fileName = `${authUser.tenantId}-logo-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath)

      setForm({ ...form, logo_url: publicUrl })
      toast.dismiss()
      toast.success('Logomarca atualizada!')
    } catch (error) {
      toast.dismiss()
      toast.error('Erro no upload')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Dados...</p>
    </div>
  )

  return (
    <PullToRefresh onRefresh={loadData}>
      <MobilePageLayout title="Identidade Institucional">
        <div className="space-y-8 pt-4 pb-32">
          
          {/* Header de Identidade - Redesenhado para ser mais profissional */}
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
             {/* Background decorativo sutil */}
             <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none" />
             
             <div className="relative z-10">
                <div className="relative group">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="h-32 w-32 rounded-[32px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 shadow-inner overflow-hidden"
                    >
                        {form.logo_url ? (
                            <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                        ) : (
                            <Building2 size={48} className="text-slate-200" />
                        )}
                    </motion.div>
                    <label 
                        htmlFor="profile-logo-upload-v2" 
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center text-white border-4 border-white dark:border-slate-900 active:scale-95 transition-all cursor-pointer"
                    >
                        <Camera size={18} strokeWidth={2.5} />
                        <input type="file" id="profile-logo-upload-v2" className="hidden" accept="image/*" onChange={handleUploadLogo} />
                    </label>
                </div>
             </div>

             <div className="mt-6 text-center z-10">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                    {form.razao_social || 'Escola Digital'}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Escola Verificada Fluxoo
                    </span>
                </div>
             </div>
          </div>

          {/* Seções de Formulário */}
          <div className="space-y-6">
             
             <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <Info size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dados da Instituição</span>
                </div>
                <NativeCard className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Razão Social</Label>
                        <Input 
                            value={form.razao_social}
                            onChange={e => setForm({ ...form, razao_social: e.target.value })}
                            className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CNPJ</Label>
                            <Input 
                                value={form.cnpj}
                                onChange={e => setForm({ ...form, cnpj: mascaraCNPJ(e.target.value) })}
                                className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-mono font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</Label>
                            <Input 
                                value={form.telefone}
                                onChange={e => setForm({ ...form, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold text-indigo-600"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail Institucional</Label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <Input 
                                value={form.email_gestor}
                                onChange={e => setForm({ ...form, email_gestor: e.target.value })}
                                className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none pl-11 pr-5 font-bold"
                            />
                        </div>
                    </div>
                </NativeCard>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <MapPin size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Localização</span>
                </div>
                <NativeCard className="p-6 space-y-6">
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CEP</Label>
                             <Input 
                                value={form.cep}
                                onChange={e => setForm({ ...form, cep: e.target.value })}
                                onBlur={buscarCep}
                                className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold"
                             />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={buscarCep}
                            disabled={buscandoCepHook}
                            className="mt-6 h-14 rounded-xl border-dashed border-indigo-200 text-indigo-600 font-bold text-xs"
                        >
                            {buscandoCepHook ? <Loader2 size={16} className="animate-spin" /> : 'LOCALIZAR'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logradouro / Rua</Label>
                            <Input value={form.logradouro} onChange={e => setForm({ ...form, logradouro: e.target.value })} className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nº</Label>
                            <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-center font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado (UF)</Label>
                            <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                                <SelectTrigger className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {estados.map(est => <SelectItem key={est.value} value={est.value}>{est.value}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cidade</Label>
                            <Select value={form.cidade} onValueChange={v => setForm({ ...form, cidade: v })} disabled={!form.estado}>
                                <SelectTrigger className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl max-h-[300px]">
                                    {cities.map(city => <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </NativeCard>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Diretoria / Responsável</span>
                </div>
                <NativeCard className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome do Gestor</Label>
                        <Input value={form.nome_gestor} onChange={e => setForm({ ...form, nome_gestor: e.target.value })} className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CPF do Responsável</Label>
                        <Input value={form.cpf_gestor} onChange={e => setForm({ ...form, cpf_gestor: mascaraCPF(e.target.value) })} className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4" />
                    </div>
                </NativeCard>
             </div>

             {/* Botão Salvar Centralizado no Fluxo */}
             <div className="pt-6">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full h-18 rounded-[24px] bg-slate-900 dark:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                    {saving ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                            <Save size={20} />
                            <span>Gravar Alterações</span>
                        </>
                    )}
                </Button>
                <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-4">
                    Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
             </div>

          </div>

        </div>
      </MobilePageLayout>
    </PullToRefresh>
  )
}
