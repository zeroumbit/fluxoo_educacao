import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Wallet, ShieldAlert, Scale, CalendarDays, History,
  Save, Info, Banknote, ChevronRight, Check, ShieldCheck,
  Loader2, AlertTriangle, BadgeAlert, ArrowLeft, RefreshCw,
  LayoutGrid, Settings2, Bell, Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { NativeCard } from '@/components/mobile/NativeCard'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  useTenantSettings,
  useTenantSettingsHistory,
  type ConfigAcademica,
  type ConfigFinanceira,
  type ConfigOperacional,
  type ConfigConduta,
  type ConfigCalendario,
} from '@/modules/escolas/hooks/useTenantSettings'
import { supabase } from '@/lib/supabase'

export function ConfiguracoesPageMobile() {
  const { authUser } = useAuth()
  const { config, isLoading, updateConfig, isSaving } = useTenantSettings()
  const { data: vigencias } = useTenantSettingsHistory()

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Estados Locais
  const [academica, setAcademica] = useState<ConfigAcademica>(config.config_academica)
  const [financeira, setFinanceira] = useState<ConfigFinanceira>(config.config_financeira)
  const [operacional, setOperacional] = useState<ConfigOperacional>(config.config_operacional)
  const [conduta, setConduta] = useState<ConfigConduta>(config.config_conduta)
  const [calendario, setCalendario] = useState<ConfigCalendario>(config.config_calendario)

  useEffect(() => {
    if (!isLoading) {
      setAcademica(config.config_academica)
      setFinanceira(config.config_financeira)
      setOperacional(config.config_operacional)
      setConduta(config.config_conduta)
      setCalendario(config.config_calendario)
    }
  }, [isLoading, config])

  // Monitorar mudanças para mostrar botão salvar
  useEffect(() => {
    const isDifferent = 
      JSON.stringify(academica) !== JSON.stringify(config.config_academica) ||
      JSON.stringify(financeira) !== JSON.stringify(config.config_financeira) ||
      JSON.stringify(operacional) !== JSON.stringify(config.config_operacional) ||
      JSON.stringify(conduta) !== JSON.stringify(config.config_conduta) ||
      JSON.stringify(calendario) !== JSON.stringify(config.config_calendario)
    
    setHasChanges(isDifferent)
  }, [academica, financeira, operacional, conduta, calendario, config])

  const handleSave = async () => {
    try {
      await updateConfig({
        config_academica: academica,
        config_financeira: financeira,
        config_operacional: operacional,
        config_conduta: conduta,
        config_calendario: calendario,
      })
      toast.success('Configurações salvas!')
      setHasChanges(false)
      setActiveCategory(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">Carregando Preferências...</p>
      </div>
    )
  }

  const sections = [
    { id: 'academico', title: 'Acadêmico', sub: 'Média, Frequência, LDB', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { id: 'financeiro', title: 'Financeiro', sub: 'Multas, Juros, Matrícula', icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'operacional', title: 'Operacional', sub: 'Portaria, Atrasos, Segurança', icon: ShieldAlert, color: 'bg-amber-50 text-amber-600' },
    { id: 'conduta', title: 'Conduta', sub: 'Ocorrências, Regimento', icon: Scale, color: 'bg-purple-50 text-purple-600' },
    { id: 'calendario', title: 'Calendário', sub: 'Datas, Carga Horária', icon: CalendarDays, color: 'bg-rose-50 text-rose-600' },
    { id: 'auditoria', title: 'Auditoria', sub: 'Histórico de Logs', icon: History, color: 'bg-slate-50 text-slate-600' },
  ]

  return (
    <MobilePageLayout title="Configurações">
      <div className="space-y-6 pb-32 pt-2">
        {/* Profile Card Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
             <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Building size={32} />
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Painel Institucional</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Regras de Negócio e LDB</p>
             </div>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {sections.map((s, idx) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveCategory(s.id)}
              className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group active:scale-95 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", s.color)}>
                  <s.icon size={22} />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-slate-800 dark:text-white text-base">{s.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{s.sub}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </motion.button>
          ))}
        </div>

        {/* Legend / Info */}
        <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 flex gap-4">
           <div className="shrink-0 h-10 w-10 text-indigo-500 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={20} />
           </div>
           <div>
              <p className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest leading-normal">Conformidade Legal</p>
              <p className="text-[10px] font-bold text-indigo-600/60 leading-relaxed mt-1">Todas as regras aqui editadas são validadas automaticamente seguindo a LDB e o CDC.</p>
           </div>
        </div>
      </div>

      {/* FAB Salvar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-0 right-0 px-6 z-50 pointer-events-none"
          >
             <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-16 rounded-[24px] bg-slate-900 border-4 border-white dark:border-slate-950 text-white font-black uppercase text-sm tracking-widest shadow-2xl pointer-events-auto"
             >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="mr-2 text-indigo-400" />}
                Salvar Alterações
             </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category BottomSheets */}
      
      {/* 1. Acadêmico */}
      <BottomSheet isOpen={activeCategory === 'academico'} onClose={() => setActiveCategory(null)} title="Regras Acadêmicas">
         <div className="px-1 pb-20 space-y-6">
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Frequência Mínima (%)</Label>
                <div className="flex items-center gap-4">
                    <Input 
                      type="number" 
                      value={academica.frequencia_minima_perc}
                      onChange={(e) => setAcademica({ ...academica, frequencia_minima_perc: Number(e.target.value) })}
                      className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-black"
                    />
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shrink-0">
                        <p className="text-[9px] font-black text-blue-600 uppercase">LDB Art. 24</p>
                        <p className="text-[11px] font-bold text-blue-400">Mínimo 75%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Média Aprovação</Label>
                    <Input 
                      type="number" step="0.5" 
                      value={academica.media_aprovacao}
                      onChange={(e) => setAcademica({ ...academica, media_aprovacao: Number(e.target.value) })}
                      className="h-14 rounded-2xl bg-slate-50 border-none text-base font-black px-5"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Média Recup.</Label>
                    <Input 
                      type="number" step="0.5"
                      value={academica.media_recuperacao_minima}
                      onChange={(e) => setAcademica({ ...academica, media_recuperacao_minima: Number(e.target.value) })}
                      className="h-14 rounded-2xl bg-slate-50 border-none text-base font-black px-5"
                    />
                </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] space-y-4 border border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Reprovação Automática</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Considerar Faltas?</p>
                  </div>
                  <Switch 
                     checked={academica.reprovacao_automatica_por_falta} 
                     onCheckedChange={(v) => setAcademica({ ...academica, reprovacao_automatica_por_falta: v })} 
                  />
               </div>
            </div>
         </div>
      </BottomSheet>

      {/* 2. Financeiro */}
      <BottomSheet isOpen={activeCategory === 'financeiro'} onClose={() => setActiveCategory(null)} title="Parâmetros Financeiros">
         <div className="px-1 pb-20 space-y-8">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Multa Atraso (%)</Label>
                    <Input 
                      type="number" step="0.1"
                      value={financeira.multa_atraso_perc}
                      onChange={(e) => setFinanceira({ ...financeira, multa_atraso_perc: Number(e.target.value) })}
                      className="h-14 rounded-2xl bg-slate-50 border-none text-base font-black px-5"
                    />
                    <p className="text-[8px] font-bold text-emerald-600 uppercase ml-1">Máx: 2% (CDC)</p>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Juros Mora (%)</Label>
                    <Input 
                      type="number" step="0.1"
                      value={financeira.juros_mora_mensal_perc}
                      onChange={(e) => setFinanceira({ ...financeira, juros_mora_mensal_perc: Number(e.target.value) })}
                      className="h-14 rounded-2xl bg-slate-50 border-none text-base font-black px-5"
                    />
                    <p className="text-[8px] font-bold text-emerald-600 uppercase ml-1">Padrão: 1%/mês</p>
                </div>
            </div>

            {/* Novos Controles de Regras de Negócio */}
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-rose-900">Multa & Juros</h4>
                  <p className="text-[10px] font-bold text-rose-600/60 uppercase">Cálculo Automático</p>
                </div>
                <Switch 
                  checked={financeira.multa_juros_habilitado} 
                  onCheckedChange={(v) => setFinanceira({ ...financeira, multa_juros_habilitado: v })} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-rose-900">Notificações</h4>
                  <p className="text-[10px] font-bold text-rose-600/60 uppercase">Alertas de Vencimento</p>
                </div>
                <Switch 
                  checked={financeira.notificacoes_habilitado} 
                  onCheckedChange={(v) => setFinanceira({ ...financeira, notificacoes_habilitado: v })} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-rose-900">Recibo PDF</h4>
                  <p className="text-[10px] font-bold text-rose-600/60 uppercase">Geração Automática</p>
                </div>
                <Switch 
                  checked={financeira.recibo_pdf_auto_habilitado} 
                  onCheckedChange={(v) => setFinanceira({ ...financeira, recibo_pdf_auto_habilitado: v })} 
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] space-y-4 border border-slate-100">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Cobrar Matrícula?</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Gerar fatura extra</p>
                  </div>
                  <Switch 
                     checked={financeira.cobrar_matricula} 
                     onCheckedChange={(v) => setFinanceira({ ...financeira, cobrar_matricula: v })} 
                  />
               </div>
               {financeira.cobrar_matricula && (
                  <div className="pt-4 border-t border-slate-200">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Matrícula (R$)</Label>
                     <Input 
                        type="number" 
                        value={financeira.valor_matricula_padrao}
                        onChange={(e) => setFinanceira({ ...financeira, valor_matricula_padrao: Number(e.target.value) })}
                        placeholder="R$ 0,00"
                        className="h-14 rounded-2xl bg-white border-none text-base font-black mt-2"
                     />
                  </div>
               )}
            </div>

            <div className="p-6 bg-indigo-600 rounded-[32px] text-white space-y-4 shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <Settings2 size={24} />
                   </div>
                   <h4 className="text-sm font-black uppercase tracking-widest">Controle de PIX</h4>
                </div>
                <Switch 
                  checked={financeira.pix_auto} 
                  onCheckedChange={(v) => setFinanceira({ ...financeira, pix_auto: v })} 
                  className="data-[state=checked]:bg-white data-[state=unchecked]:bg-slate-600/30"
                />
                <p className="text-[10px] font-bold text-indigo-100 leading-relaxed">O PIX Automático gera QR Codes únicos por parcela e faz a baixa bancária instantânea.</p>
            </div>
         </div>
      </BottomSheet>

      {/* 3. Operacional */}
      <BottomSheet isOpen={activeCategory === 'operacional'} onClose={() => setActiveCategory(null)} title="Segurança e Portaria">
         <div className="px-1 pb-20 space-y-8">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tolerância Atraso (Minutos)</Label>
                <Input 
                  type="number"
                  value={operacional.tolerancia_atraso_minutos}
                  onChange={(e) => setOperacional({ ...operacional, tolerancia_atraso_minutos: Number(e.target.value) })}
                  className="h-14 rounded-2xl bg-slate-50 border-none text-base font-black px-5"
                />
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 rounded-[32px] space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-slate-900">Push de Saída</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Alertar pais via APP</p>
                    </div>
                    <Switch checked={operacional.push_saida} onCheckedChange={(v) => setOperacional({ ...operacional, push_saida: v })} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-slate-900">Exigir Foto Terceiros</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Controle de entrada</p>
                    </div>
                    <Switch checked={operacional.exige_foto_terceiros} onCheckedChange={(v) => setOperacional({ ...operacional, exige_foto_terceiros: v })} />
                </div>
            </div>
         </div>
      </BottomSheet>

      {/* 4. Calendário */}
       <BottomSheet isOpen={activeCategory === 'calendario'} onClose={() => setActiveCategory(null)} title="Calendário Letivo">
          <div className="px-1 pb-20 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dias Letivos</Label>
                   <Input type="number" value={calendario.dias_letivos} onChange={(e) => setCalendario({ ...calendario, dias_letivos: Number(e.target.value) })} className="h-14 rounded-2xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Carga Horária (h)</Label>
                   <Input type="number" value={calendario.carga_horaria} onChange={(e) => setCalendario({ ...calendario, carga_horaria: Number(e.target.value) })} className="h-14 rounded-2xl bg-slate-50" />
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">LDB exige 200 dias / 800 horas anuais.</p>
          </div>
       </BottomSheet>

       {/* 5. Conduta */}
       <BottomSheet isOpen={activeCategory === 'conduta'} onClose={() => setActiveCategory(null)} title="Regimento Escolar">
          <div className="px-1 pb-20 space-y-8">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Limite Atrasos (Ocorrência)</Label>
                <Input 
                  type="number"
                  value={conduta.limite_atrasos_penalidade}
                  onChange={(e) => setConduta({ ...conduta, limite_atrasos_penalidade: Number(e.target.value) })}
                  className="h-14 rounded-2xl bg-slate-50"
                />
             </div>
             <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <div>
                   <h4 className="text-sm font-black text-slate-900">Notificar Pais</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Alertar Ocorrências</p>
                </div>
                <Switch checked={conduta.notifica_pais_falta} onCheckedChange={(v) => setConduta({ ...conduta, notifica_pais_falta: v })} />
             </div>
          </div>
       </BottomSheet>

       {/* 6. Auditoria */}
       <BottomSheet isOpen={activeCategory === 'auditoria'} onClose={() => setActiveCategory(null)} title="Histórico de Logs">
          <div className="px-1 pb-20 space-y-4">
             {vigencias && vigencias.length > 0 ? (
                vigencias.map((v: any) => (
                   <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Alteração Salva</span>
                         <span className="text-[10px] font-bold text-slate-400">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">Configuração Institucional atualizada</p>
                   </div>
                ))
             ) : (
                <div className="text-center py-12 text-slate-300">
                   <History size={48} className="mx-auto mb-4 opacity-20" />
                   <p className="text-xs font-bold uppercase tracking-widest">Nenhum log encontrado</p>
                </div>
             )}
          </div>
       </BottomSheet>

    </MobilePageLayout>
  )
}
