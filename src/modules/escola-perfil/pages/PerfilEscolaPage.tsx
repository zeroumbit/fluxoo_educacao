import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, MapPin, Building2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { mascaraCPF, mascaraCNPJ } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function PerfilEscolaPage() {
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
      toast.success('Logomarca enviada com sucesso!')
    } catch (error) {
      toast.error('Erro ao enviar logomarca')
      console.error(error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <div className="text-left">
        <h1 className="text-2xl font-bold tracking-tight">Perfil da Escola</h1>
        <p className="text-muted-foreground">Gerencie os dados cadastrais da sua instituição</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload da Logomarca */}
          <div className="border-b border-slate-100 pb-6">
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">Logomarca da Escola</Label>
            <div className="flex items-center gap-6">
              {/* Preview da Logo */}
              <div className="relative group flex-shrink-0">
                <div className={`h-32 w-32 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${
                  form.logo_url 
                    ? 'border-indigo-300 bg-white shadow-sm' 
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  {form.logo_url ? (
                    <img 
                      src={form.logo_url} 
                      alt="Logomarca da Escola" 
                      className="h-full w-full object-contain p-2" 
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-slate-300" />
                  )}
                </div>
                {/* Botão de remover (aparece no hover) */}
                {form.logo_url && (
                  <button
                    onClick={() => setForm({...form, logo_url: ''})}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110"
                    type="button"
                    title="Remover logomarca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Área de Upload */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                    onChange={handleUploadLogo}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {form.logo_url ? 'Alterar logomarca' : 'Enviar logomarca'}
                  </Button>
                  {form.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(form.logo_url, '_blank')}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Visualizar em tela cheia
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    PNG, JPG ou SVG
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    Máximo 2MB
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    Recomendado: 200x200px
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Demais campos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Razão Social</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: mascaraCNPJ(e.target.value) })} maxLength={18} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>E-mail da Escola</Label><Input type="email" value={form.email_gestor} onChange={(e) => setForm({ ...form, email_gestor: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-600" />Endereço</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="space-y-2 flex-1"><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} maxLength={9} /></div>
            <Button type="button" variant="outline" onClick={buscarCep} className="mt-7" disabled={buscandoCepHook}>
              {buscandoCepHook ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar CEP'}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2"><Label>Logradouro</Label><Input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} /></div>
            <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Estado/UF</Label>
              <Select value={form.estado} onValueChange={(val) => setForm({ ...form, estado: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((est) => (
                    <SelectItem key={est.value} value={est.value}>{est.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select value={form.cidade} onValueChange={(val) => setForm({ ...form, cidade: val })} disabled={!form.estado || loadingCities}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCities ? "..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Gestor Responsável</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome do Diretor/Gestor</Label><Input value={form.nome_gestor} onChange={(e) => setForm({ ...form, nome_gestor: e.target.value })} /></div>
            <div className="space-y-2"><Label>CPF do Gestor</Label><Input value={form.cpf_gestor} onChange={(e) => setForm({ ...form, cpf_gestor: mascaraCPF(e.target.value) })} maxLength={14} /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-md min-w-[200px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salvar Perfil
        </Button>
      </div>
    </div>
  )
}
