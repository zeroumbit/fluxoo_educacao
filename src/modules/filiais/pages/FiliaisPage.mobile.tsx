import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import { useFiliais, useCriarFilial, useAtualizarFilial, useExcluirFilial } from '../hooks'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { PullToRefresh } from '@/components/mobile/PullToRefresh'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { mascaraCNPJ, mascaraCEP } from '@/lib/validacoes'
import { useViaCEP } from '@/hooks/use-viacep'

export function FiliaisPageMobile() {
  const { authUser } = useAuth()
  const { data: filiais, isLoading, refetch } = useFiliais()
  const criarFilial = useCriarFilial()
  const atualizarFilial = useAtualizarFilial()
  const excluirFilial = useExcluirFilial()

  // UI States
  const [search, setSearch] = useState('')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedFilial, setSelectedFilial] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [form, setForm] = useState({
    nome_unidade: '',
    cnpj_proprio: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    estado: '',
    cidade: '',
    is_matriz: false
  })

  const { fetchAddressByCEP, fetchCitiesByUF, cities, loadingCities, loading: buscandoCepHook, estados } = useViaCEP()

  useEffect(() => {
    if (form.estado) {
      fetchCitiesByUF(form.estado)
    }
  }, [form.estado])

  const handleOpenEdit = (filial: any = null) => {
    if (filial) {
      setSelectedFilial(filial)
      setForm({
        nome_unidade: filial.nome_unidade || '',
        cnpj_proprio: filial.cnpj_proprio || '',
        cep: filial.cep || '',
        logradouro: filial.logradouro || '',
        numero: filial.numero || '',
        bairro: filial.bairro || '',
        estado: filial.estado || '',
        cidade: filial.cidade || '',
        is_matriz: filial.is_matriz || false
      })
    } else {
      setSelectedFilial(null)
      setForm({
        nome_unidade: '', cnpj_proprio: '', cep: '', logradouro: '',
        numero: '', bairro: '', estado: '', cidade: '', is_matriz: false
      })
    }
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    if (!authUser || !form.nome_unidade) return
    const matrizExistente = filiais?.find(f => f.is_matriz)
    if (form.is_matriz && matrizExistente && (!selectedFilial || selectedFilial.id !== matrizExistente.id)) {
      toast.error('Já existe uma matriz cadastrada.')
      return
    }
    try {
      if (selectedFilial) {
        await atualizarFilial.mutateAsync({ id: selectedFilial.id, filial: form })
        toast.success('Unidade atualizada!')
      } else {
        await criarFilial.mutateAsync({ ...form, tenant_id: authUser.tenantId })
        toast.success('Unidade criada!')
      }
      setIsEditOpen(false)
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message)
    }
  }

  const handleExcluir = async () => {
    if (!selectedFilial) return
    setIsDeleting(true)
    try {
      await excluirFilial.mutateAsync(selectedFilial.id)
      toast.success('Unidade excluída!')
      setIsEditOpen(false)
    } catch { toast.error('Erro ao excluir') }
    finally { setIsDeleting(false) }
  }

  const handleCepChange = async (val: string) => {
    const cep = mascaraCEP(val)
    setForm(prev => ({ ...prev, cep }))
    if (cep.replace(/\D/g, '').length === 8) {
      const data = await fetchAddressByCEP(cep)
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
      }
    }
  }

  const filteredFiliais = (filiais || []).filter((f: any) => 
    f.nome_unidade.toLowerCase().includes(search.toLowerCase()) ||
    (f.cidade || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PullToRefresh onRefresh={async () => { await refetch() }}>
       <MobilePageLayout title="Unidades Escolares">
         <div className="space-y-6 pt-2">
            {/* Busca Padronizada */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="Buscar unidade..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm text-sm"
              />
            </div>

            {/* List */}
            <div className="space-y-3 pb-32">
              <AnimatePresence mode="popLayout">
                {filteredFiliais.map((f: any, idx) => (
                  <motion.div key={f.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
                    <NativeCard 
                      onClick={() => handleOpenEdit(f)}
                      className={cn(
                        "p-5 flex items-center justify-between",
                        f.is_matriz && "ring-2 ring-indigo-500/10 bg-indigo-50/5"
                      )}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center border",
                          f.is_matriz ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                        )}>
                          <Building2 size={28} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-800 dark:text-white truncate uppercase tracking-tight text-sm font-black">{f.nome_unidade}</h3>
                            {f.is_matriz && <Badge className="bg-indigo-600 text-[8px] h-4 font-black">MATRIZ</Badge>}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <MapPin size={12} className="text-slate-400" />
                             <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                {f.cidade ? `${f.cidade}/${f.estado}` : 'Pendente'}
                             </p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 ml-2 shrink-0" />
                    </NativeCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
         </div>

         {/* FAB PADRONIZADO (Estilo Financeiro) */}
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => handleOpenEdit()}
            className="fixed bottom-28 right-6 h-18 w-18 rounded-[24px] bg-indigo-600 shadow-2xl shadow-indigo-200 text-white z-40 flex items-center justify-center"
          >
            <Plus className="h-8 w-8" strokeWidth={3} />
          </motion.button>
       </MobilePageLayout>

       {/* Form Sheet logic preserved */}
       <BottomSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={selectedFilial ? "Configurar Unidade" : "Nova Unidade"} size="full">
         <div className="px-1 pb-24 space-y-6">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 scrollbar-hide">
               <div className="space-y-2">
                 <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Nome</Label>
                 <Input value={form.nome_unidade} onChange={e => setForm({ ...form, nome_unidade: e.target.value })} className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
               </div>

               <div className="space-y-2">
                 <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">CNPJ</Label>
                 <Input value={form.cnpj_proprio} onChange={e => setForm({ ...form, cnpj_proprio: mascaraCNPJ(e.target.value) })} className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-mono font-bold" />
               </div>

               <div className="bg-slate-900 dark:bg-slate-900 p-6 rounded-[32px] space-y-6 text-white shadow-xl">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Endereço</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input value={form.cep} onChange={e => handleCepChange(e.target.value)} className="h-14 rounded-xl bg-white/10 border-none text-white font-bold px-4" placeholder="CEP" />
                    {buscandoCepHook && <Loader2 className="animate-spin text-indigo-400 h-6 w-6 self-center" />}
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                     <Input value={form.logradouro} onChange={e => setForm({ ...form, logradouro: e.target.value })} className="col-span-3 h-14 rounded-xl bg-white/10 border-none text-white font-bold px-4" placeholder="Rua" />
                     <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className="h-14 rounded-xl bg-white/10 border-none text-white font-bold text-center" placeholder="Nº" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                        <SelectTrigger className="h-14 rounded-xl bg-white/10 border-none text-white font-bold px-4"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent className="rounded-2xl">{estados.map(est => <SelectItem key={est.value} value={est.value}>{est.value}</SelectItem>)}</SelectContent>
                     </Select>
                     <Select value={form.cidade} onValueChange={v => setForm({ ...form, cidade: v })} disabled={!form.estado || loadingCities}>
                        <SelectTrigger className="h-14 rounded-xl bg-white/10 border-none text-white font-bold px-4"><SelectValue placeholder="Cidade" /></SelectTrigger>
                        <SelectContent className="rounded-2xl max-h-[300px]">{cities.map(city => <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>)}</SelectContent>
                     </Select>
                  </div>
               </div>

               <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-tighter">Essa é a Unidade Matriz?</span>
                  <Switch checked={form.is_matriz} onCheckedChange={v => setForm({ ...form, is_matriz: v })} disabled={!!(filiais?.some(f => f.is_matriz) && !selectedFilial?.is_matriz)} />
               </div>
            </div>

            <div className="space-y-3">
               <Button onClick={handleSave} className="w-full h-20 rounded-[32px] bg-indigo-600 text-white font-black text-lg uppercase tracking-widest shadow-2xl">SALVAR ALTERAÇÕES</Button>
               {selectedFilial && !selectedFilial.is_matriz && (
                 <Button variant="ghost" onClick={handleExcluir} disabled={isDeleting} className="w-full text-rose-500 font-bold uppercase text-[10px] tracking-widest">EXCLUIR UNIDADE</Button>
               )}
            </div>
         </div>
       </BottomSheet>
    </PullToRefresh>
  )
}
