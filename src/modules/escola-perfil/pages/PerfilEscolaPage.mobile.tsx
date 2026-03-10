import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, MapPin, Building2, Upload, X, ShieldCheck, Phone, Mail, Globe, Navigation, ChevronRight, Camera } from 'lucide-react'
import { mascaraCPF, mascaraCNPJ } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'

export function PerfilEscolaPageMobile() {
  const { authUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    razao_social: '', cnpj: '', email_gestor: '', nome_gestor: '', cpf_gestor: '',
    telefone: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
    logo_url: '',
  })

  useEffect(() => {
    if (!authUser?.tenantId) return
    const load = async () => {
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
    load()
  }, [authUser?.tenantId])

  const { fetchAddressByCEP, fetchCitiesByUF, cities, loadingCities, loading: buscandoCepHook, estados } = useViaCEP()

  useEffect(() => {
    if (form.estado) {
      fetchCitiesByUF(form.estado)
    }
  }, [form.estado])

  const buscarCep = async () => {
    if (form.cep.length < 8) return
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
      toast.success('Endereço encontrado!')
    } else if (data && 'error' in data) {
      toast.error(data.error)
    }
  }

  const handleSave = async () => {
    if (!authUser?.tenantId) return
    setSaving(true)
    try {
      const { error } = await (supabase.from('escolas' as any) as any)
        .update({ ...form, updated_at: new Date().toISOString() }).eq('id', authUser.tenantId)
      if (error) throw error
      toast.success('Perfil atualizado com sucesso!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !authUser) return

    try {
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
      toast.success('Logomarca enviada!')
    } catch (error) {
      toast.error('Erro ao enviar')
      console.error(error)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-sm font-bold text-slate-400 animate-pulse">Carregando Perfil...</p>
    </div>
  )

  return (
    <PullToRefresh onRefresh={async () => {
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
    }}>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-32">
        {/* Header Visual */}
        <div className="bg-indigo-600 px-6 pt-12 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Building2 size={160} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="h-28 w-28 rounded-[38px] bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4 border-indigo-500/30">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={40} className="text-indigo-200" />
                )}
              </div>
              <label 
                htmlFor="logo-mobile-upload" 
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center text-indigo-600 border border-slate-100 active:scale-90 transition-transform"
              >
                <Camera size={20} />
                <input type="file" id="logo-mobile-upload" className="hidden" accept="image/*" onChange={handleUploadLogo} />
              </label>
            </div>
            <h1 className="mt-4 text-xl font-black text-white tracking-tight">{form.razao_social || 'Escola sem Nome'}</h1>
            <p className="text-indigo-100/70 text-xs font-bold uppercase tracking-widest">{form.cnpj || 'CNPJ não informado'}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mx-auto w-full max-w-[640px] px-4 -mt-12 space-y-6">
          
          {/* Sessão: Informações Básicas */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 ml-2">Dados da Instituição</h2>
            <NativeCard className="space-y-6 pt-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Razão Social</Label>
                <Input 
                  value={form.razao_social} 
                  onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CNPJ</Label>
                  <Input 
                    value={form.cnpj} 
                    onChange={(e) => setForm({ ...form, cnpj: mascaraCNPJ(e.target.value) })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Telefone</Label>
                  <Input 
                    value={form.telefone} 
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail de Contato</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email"
                    value={form.email_gestor} 
                    onChange={(e) => setForm({ ...form, email_gestor: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold pl-11"
                  />
                </div>
              </div>
            </NativeCard>
          </section>

          {/* Sessão: Localização */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 ml-2">Endereço</h2>
            <NativeCard className="space-y-6 pt-6">
              <div className="flex gap-2">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CEP</Label>
                  <Input 
                    value={form.cep} 
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={buscarCep} 
                  disabled={buscandoCepHook}
                  className="mt-6 h-12 rounded-xl border-indigo-100 text-indigo-600 font-bold"
                >
                  {buscandoCepHook ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LOCALIZAR'}
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5 col-span-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logradouro</Label>
                  <Input 
                    value={form.logradouro} 
                    onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nº</Label>
                  <Input 
                    value={form.numero} 
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bairro</Label>
                <Input 
                  value={form.bairro} 
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado (UF)</Label>
                  <Select value={form.estado} onValueChange={(val) => setForm({ ...form, estado: val })}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {estados.map((est) => (
                        <SelectItem key={est.value} value={est.value}>{est.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cidade</Label>
                  <Select value={form.cidade} onValueChange={(val) => setForm({ ...form, cidade: val })} disabled={!form.estado || loadingCities}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold">
                      <SelectValue placeholder={loadingCities ? "..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </NativeCard>
          </section>

          {/* Sessão: Gestor */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 ml-2">Gestão</h2>
            <NativeCard className="space-y-6 pt-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Diretor / Gestor</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    value={form.nome_gestor} 
                    onChange={(e) => setForm({ ...form, nome_gestor: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CPF do Gestor</Label>
                <Input 
                  value={form.cpf_gestor} 
                  onChange={(e) => setForm({ ...form, cpf_gestor: mascaraCPF(e.target.value) })}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold"
                />
              </div>
            </NativeCard>
          </section>

        </div>

        {/* FAB: Salvar */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          disabled={saving}
          className="fixed bottom-24 right-5 left-5 h-16 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-200/60 dark:shadow-none flex items-center justify-center text-white z-40 ring-4 ring-white dark:ring-slate-950 font-black tracking-widest uppercase text-sm"
        >
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : (
            <div className="flex items-center gap-3">
              <Save size={20} />
              <span>Salvar Alterações</span>
            </div>
          )}
        </motion.button>
      </div>
    </PullToRefresh>
  )
}
