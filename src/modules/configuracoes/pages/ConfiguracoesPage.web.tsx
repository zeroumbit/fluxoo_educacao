import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Wallet, ShieldAlert, Scale, CalendarDays, History,
  UploadCloud, Save, Info, Banknote, ChevronDown, Check, ShieldCheck,
  Loader2, AlertTriangle, BadgeAlert, BadgeCheck, ChevronRight, Clock,
  RefreshCw, Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface HistoricoItem {
  id: string
  categoria: string
  campo: string
  valor_anterior?: string
  valor_novo: string
  alterado_por?: string
  alterado_em: string
}

// ─── Constantes de Risco ──────────────────────────────────────────────────────

const RISK = {
  JURIDICO: { label: 'Risco Jurídico', color: 'text-red-600 bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' },
  OPERACIONAL: { label: 'Risco Operacional', color: 'text-amber-600 bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  UX: { label: 'Risco UX', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
}

// ─── Sub-componentes Reutilizáveis ────────────────────────────────────────────

function RiskBadge({ level }: { level: keyof typeof RISK }) {
  const r = RISK[level]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', r.badge)}>
      <AlertTriangle size={9} />
      {r.label}
    </span>
  )
}

function FieldInfo({ text }: { text: string }) {
  return (
    <span className="group relative cursor-help">
      <Info size={13} className="text-slate-400 hover:text-indigo-500 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-60 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 leading-relaxed">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </span>
  )
}

function SelectField({ label, value, onChange, options, info, risk }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  info?: string
  risk?: keyof typeof RISK
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</Label>
        {info && <FieldInfo text={info} />}
        {risk && <RiskBadge level={risk} />}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange, step = 1, error, info, risk }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  error?: string | null
  info?: string
  risk?: keyof typeof RISK
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</Label>
          {info && <FieldInfo text={info} />}
          {risk && <RiskBadge level={risk} />}
        </div>
        {error && <span className="text-[10px] text-red-500 font-bold">{error}</span>}
      </div>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-10 rounded-xl transition-all',
          error ? 'border-red-400 focus-visible:ring-red-100' : 'focus-visible:ring-indigo-100 focus-visible:border-indigo-400'
        )}
      />
    </div>
  )
}

function ToggleRow({ label, description, checked, onCheckedChange, risk }: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  risk?: keyof typeof RISK
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
      <div className="flex-1 mr-4">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          {risk && <RiskBadge level={risk} />}
        </div>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-indigo-600 shrink-0" />
    </div>
  )
}

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 pb-4 pt-6 bg-slate-50/50">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-800">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  )
}

// ─── Abas de Navegação ────────────────────────────────────────────────────────

const TABS = [
  { id: 'academico', icon: BookOpen, label: 'Acadêmico', sublabel: 'LDB', risk: 'JURIDICO' },
  { id: 'financeiro', icon: Wallet, label: 'Financeiro', sublabel: 'CDC', risk: null },
  { id: 'operacional', icon: ShieldAlert, label: 'Operacional', sublabel: 'Portaria', risk: 'OPERACIONAL' },
  { id: 'conduta', icon: Scale, label: 'Conduta', sublabel: 'Regimento', risk: 'OPERACIONAL' },
  { id: 'calendario', icon: CalendarDays, label: 'Calendário', sublabel: 'Letivo', risk: 'UX' },
  { id: 'auditoria', icon: History, label: 'Auditoria', sublabel: 'Logs', risk: null },
] as const

type TabId = typeof TABS[number]['id']

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfiguracoesPage() {
  const { authUser } = useAuth()
  const { config, isLoading, updateConfig, isSaving } = useTenantSettings()
  const { data: vigencias, isLoading: isLoadingHistory } = useTenantSettingsHistory()

  const [activeTab, setActiveTab] = useState<TabId>('academico')
  const [historicoDetalhado, setHistoricoDetalhado] = useState<HistoricoItem[]>([])
  const [isLoadingHist, setIsLoadingHist] = useState(false)

  // Form local por aba
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
  }, [isLoading]) // eslint-disable-line

  // Carrega histórico campo-a-campo quando acessa a aba Auditoria
  const loadHistoricoDetalhado = useCallback(async () => {
    if (!authUser?.tenantId) return
    setIsLoadingHist(true)
    try {
      const { data, error } = await (supabase.from('configuracoes_historico' as any) as any)
        .select('*')
        .eq('tenant_id', authUser.tenantId)
        .order('alterado_em', { ascending: false })
        .limit(50)
      if (!error) setHistoricoDetalhado((data as HistoricoItem[]) || [])
    } finally {
      setIsLoadingHist(false)
    }
  }, [authUser?.tenantId])

  useEffect(() => {
    if (activeTab === 'auditoria') loadHistoricoDetalhado()
  }, [activeTab, loadHistoricoDetalhado])

  // Validações legais em tempo real
  const erros = {
    frequencia: academica.frequencia_minima_perc < 75 ? 'Mín: 75% (LDB Art. 24)' : null,
    diasLetivos: calendario.dias_letivos < 200 ? 'Mín: 200 dias (LDB)' : null,
    cargaHoraria: calendario.carga_horaria < 800 ? 'Mín: 800h (LDB)' : null,
    multa: financeira.multa_atraso_perc > 2.0 ? 'Máx: 2% (CDC Art. 52)' : null,
    juros: financeira.juros_mora_mensal_perc > 1.0 ? 'Máx: 1%/mês (CDC)' : null,
  }

  const hasErrors = Object.values(erros).some(Boolean)

  // Salva e grava histórico campo-a-campo
  const handleSave = async () => {
    if (hasErrors) {
      toast.error('Corrija os erros de conformidade antes de salvar.')
      return
    }

    // Antes de salvar, registra diff no histórico campo-a-campo
    const categorias: Array<{
      key: keyof typeof erros | string
      categoria: string
      local: Record<string, unknown>
      original: Record<string, unknown>
    }> = [
      { key: 'academica', categoria: 'academica', local: academica as any, original: config.config_academica as any },
      { key: 'financeira', categoria: 'financeira', local: financeira as any, original: config.config_financeira as any },
      { key: 'operacional', categoria: 'operacional', local: operacional as any, original: config.config_operacional as any },
      { key: 'conduta', categoria: 'conduta', local: conduta as any, original: config.config_conduta as any },
      { key: 'calendario', categoria: 'calendario', local: calendario as any, original: config.config_calendario as any },
    ]

    const registros: Omit<HistoricoItem, 'id' | 'alterado_em'>[] = []
    for (const cat of categorias) {
      for (const campo of Object.keys(cat.local)) {
        const vAnterior = String(cat.original[campo] ?? '')
        const vNovo = String(cat.local[campo] ?? '')
        if (vAnterior !== vNovo) {
          registros.push({
            tenant_id: authUser?.tenantId,
            categoria: cat.categoria,
            campo,
            valor_anterior: vAnterior,
            valor_novo: vNovo,
            alterado_por: authUser?.user?.id,
          } as any)
        }
      }
    }

    if (registros.length > 0) {
      await (supabase.from('configuracoes_historico' as any) as any).insert(registros)
    }

    updateConfig({
      config_academica: academica,
      config_financeira: financeira,
      config_operacional: operacional,
      config_conduta: conduta,
      config_calendario: calendario,
    })
  }

  // ─── Loading Skeleton ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
        <div className="flex gap-6">
          <div className="w-52 space-y-2">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Configurações Institucionais</h1>
          <p className="text-sm text-slate-500 mt-1">
            Regras acadêmicas, financeiras e operacionais com conformidade legal automática.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-10 px-6 rounded-xl font-bold shadow-sm shadow-indigo-200 shrink-0"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Salvar
        </Button>
      </div>

      {/* Alerta de conformidade legal */}
      {hasErrors && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <BadgeAlert size={16} className="shrink-0" />
          <span className="font-semibold">Existem campos fora dos limites legais. Corrija-os antes de salvar.</span>
        </div>
      )}

      {/* Layout: sidebar + conteúdo */}
      <div className="flex gap-6 items-start">

        {/* Sidebar de Navegação */}
        <nav className="w-52 shrink-0 flex flex-col gap-1 sticky top-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-semibold group',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <tab.icon size={16} className={cn('shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{tab.label}</div>
                  <div className={cn('text-[10px] font-bold uppercase tracking-wider', isActive ? 'text-indigo-200' : 'text-slate-400')}>
                    {tab.sublabel}
                  </div>
                </div>
                {isActive && <ChevronRight size={14} className="text-indigo-300 shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* Painel de Conteúdo */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ── ABA ACADÊMICO ─────────────────────────────────── */}
          {activeTab === 'academico' && (
            <>
              <SectionCard icon={BookOpen} title="Avaliação e Aprovação" description="Define os critérios de aprovação e reprovação conforme a LDB.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <SelectField
                    label="Divisão do Ano Letivo"
                    value={academica.divisao_etapas}
                    onChange={(v) => setAcademica({ ...academica, divisao_etapas: v as any })}
                    options={[
                      { value: '4_bimestres', label: '4 Bimestres' },
                      { value: '3_trimestres', label: '3 Trimestres' },
                      { value: '2_semestres', label: '2 Semestres' },
                    ]}
                    risk="UX"
                  />
                  <SelectField
                    label="Casas Decimais nas Notas"
                    value={String(academica.casas_decimais)}
                    onChange={(v) => setAcademica({ ...academica, casas_decimais: Number(v) })}
                    options={[
                      { value: '1', label: 'Uma casa (Ex: 8.5)' },
                      { value: '2', label: 'Duas casas (Ex: 8.50)' },
                    ]}
                    risk="UX"
                  />
                  <NumberField
                    label="Média de Aprovação"
                    value={academica.media_aprovacao}
                    step={0.1}
                    onChange={(v) => setAcademica({ ...academica, media_aprovacao: v })}
                    risk="JURIDICO"
                    info="Alunos com média igual ou superior a este valor são aprovados diretamente."
                  />
                  <NumberField
                    label="Média Mínima — Recuperação"
                    value={academica.media_recuperacao_minima}
                    step={0.1}
                    onChange={(v) => setAcademica({ ...academica, media_recuperacao_minima: v })}
                    risk="JURIDICO"
                    info="Alunos abaixo desta média são reprovados sem direito à recuperação."
                  />
                  <NumberField
                    label="Frequência Mínima (%)"
                    value={academica.frequencia_minima_perc}
                    error={erros.frequencia}
                    onChange={(v) => setAcademica({ ...academica, frequencia_minima_perc: v })}
                    risk="JURIDICO"
                    info="Art. 24 da LDB: mínimo obrigatório de 75% de presença no total de horas letivas."
                  />
                  <div className="flex flex-col justify-end">
                    <ToggleRow
                      label="Reprovação Automática por Falta"
                      description="Sistema processa automaticamente ao fechar o bimestre."
                      checked={academica.reprovacao_automatica_por_falta}
                      onCheckedChange={(v) => setAcademica({ ...academica, reprovacao_automatica_por_falta: v })}
                      risk="JURIDICO"
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── ABA FINANCEIRO ────────────────────────────────── */}
          {activeTab === 'financeiro' && (
            <>
              <SectionCard icon={Wallet} title="Faturamento e Inadimplência" description="Regras de cobrança conforme o Código de Defesa do Consumidor.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  <SelectField
                    label="Dia Vencimento Padrão"
                    value={String(financeira.dia_vencimento_padrao)}
                    onChange={(v) => setFinanceira({ ...financeira, dia_vencimento_padrao: Number(v) })}
                    options={[
                      { value: '5', label: 'Dia 05' },
                      { value: '10', label: 'Dia 10' },
                      { value: '15', label: 'Dia 15' },
                      { value: '20', label: 'Dia 20' },
                      { value: '28', label: 'Dia 28' },
                    ]}
                    info="Dia fixo de vencimento de todas as mensalidades."
                  />
                  <NumberField
                    label="Qtd. Mensalidades Automáticas"
                    value={financeira.qtd_mensalidades_automaticas || 12}
                    onChange={(v) => setFinanceira({ ...financeira, qtd_mensalidades_automaticas: v })}
                    info="Quantas mensalidades gerar na matrícula (padrão: 12)."
                  />
                  <NumberField
                    label="Dias de Carência"
                    value={financeira.dias_carencia}
                    onChange={(v) => setFinanceira({ ...financeira, dias_carencia: v })}
                    info="Dias após o vencimento antes de cobrar multa."
                  />
                  <NumberField
                    label="Desconto Irmãos (%)"
                    value={financeira.desconto_irmaos_perc}
                    step={0.5}
                    onChange={(v) => setFinanceira({ ...financeira, desconto_irmaos_perc: v })}
                    info="Aplicado automaticamente na matrícula de irmãos."
                  />
                  <NumberField
                    label="Multa Atraso (%)"
                    value={financeira.multa_atraso_perc}
                    step={0.1}
                    error={erros.multa}
                    onChange={(v) => setFinanceira({ ...financeira, multa_atraso_perc: v })}
                    info="CDC Art. 52: limite legal de 2% de multa moratória."
                  />
                  <NumberField
                    label="Juros Mora (%/mês)"
                    value={financeira.juros_mora_mensal_perc}
                    step={0.1}
                    error={erros.juros}
                    onChange={(v) => setFinanceira({ ...financeira, juros_mora_mensal_perc: v })}
                    info="CDC: juros máximos de 1% ao mês."
                  />
                  <NumberField
                    label="Multa Fixa (R$)"
                    value={financeira.multa_fixa}
                    onChange={(v) => setFinanceira({ ...financeira, multa_fixa: v })}
                  />
                </div>
              </SectionCard>

              <SectionCard icon={Banknote} title="Taxa de Matrícula">
                <div className="space-y-4">
                  <ToggleRow
                    label="Cobrar Taxa de Matrícula"
                    description="Se desativado, não gerará cobrança de matrícula nos novos registros."
                    checked={financeira.cobrar_matricula}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, cobrar_matricula: v })}
                  />
                  {financeira.cobrar_matricula && (
                    <div className="pl-4 border-l-2 border-indigo-200 py-2 animate-in slide-in-from-top-2 duration-200">
                      <NumberField
                        label="Valor Padrão Sugerido (R$)"
                        value={financeira.valor_matricula_padrao || 0}
                        onChange={(v) => setFinanceira({ ...financeira, valor_matricula_padrao: v })}
                        info="Valor base para preenchimento automático na tela de matrícula. Pode ser sobrescrito manualmente."
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard icon={Banknote} title="Métodos de Recebimento">
                <div className="space-y-3">
                  <ToggleRow
                    label="PIX Manual"
                    description="Exibe a chave PIX e obriga upload de comprovante pelo responsável."
                    checked={financeira.pix_manual}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, pix_manual: v })}
                  />
                  {financeira.pix_manual && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-200 py-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chave PIX</Label>
                        <Input value={financeira.chave_pix} onChange={(e) => setFinanceira({ ...financeira, chave_pix: e.target.value })} placeholder="CNPJ, e-mail ou chave aleatória" className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nome do Favorecido</Label>
                        <Input value={financeira.nome_favorecido} onChange={(e) => setFinanceira({ ...financeira, nome_favorecido: e.target.value })} placeholder="Nome da escola ou conta" className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instruções ao Responsável</Label>
                        <Input value={financeira.instrucoes_pix} onChange={(e) => setFinanceira({ ...financeira, instrucoes_pix: e.target.value })} placeholder="Ex: Envie o comprovante para o WhatsApp da secretaria" className="h-10 rounded-xl" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        PIX Automático (API)
                        <Badge className="bg-indigo-600 text-white border-0 text-[9px] h-4">Recomendado</Badge>
                      </p>
                      <p className="text-xs text-slate-500">QR Code dinâmico com baixa automática de faturas.</p>
                    </div>
                    <Switch checked={financeira.pix_auto} onCheckedChange={(v) => setFinanceira({ ...financeira, pix_auto: v })} className="data-[state=checked]:bg-indigo-600" />
                  </div>

                  <ToggleRow
                    label="Dinheiro / Cartão Presencial"
                    description="Pagamento no caixa físico da escola."
                    checked={financeira.presencial}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, presencial: v })}
                  />
                </div>
              </SectionCard>

              <SectionCard icon={Settings2} title="Ajustes de Automação">
                <div className="space-y-3">
                  <ToggleRow
                    label="Cálculo de Multa/Juros"
                    description="Se desativado, o portal não exibirá encargos. A escola calcula na mão."
                    checked={financeira.multa_juros_habilitado}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, multa_juros_habilitado: v })}
                  />
                  <ToggleRow
                    label="Notificações de Vencimento"
                    description="Alerta o responsável sobre faturas vencendo."
                    checked={financeira.notificacoes_habilitado}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, notificacoes_habilitado: v })}
                  />
                  <ToggleRow
                    label="Geração de Recibo PDF"
                    description="Gera recibo automático após a baixa da fatura."
                    checked={financeira.recibo_pdf_auto_habilitado}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, recibo_pdf_auto_habilitado: v })}
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* ── ABA OPERACIONAL ────────────────────────────────── */}
          {activeTab === 'operacional' && (
            <SectionCard icon={ShieldAlert} title="Portaria, Catraca e Segurança" description="Regras de controle de acesso e retirada de alunos.">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <NumberField
                    label="Tolerância de Atraso (min)"
                    value={operacional.tolerancia_atraso_minutos}
                    onChange={(v) => setOperacional({ ...operacional, tolerancia_atraso_minutos: v })}
                    risk="OPERACIONAL"
                    info="Tempo após o horário de entrada/saída antes de registrar atraso."
                  />
                  <NumberField
                    label="Validade Autorização Temporária (dias)"
                    value={operacional.validade_temp_dias}
                    onChange={(v) => setOperacional({ ...operacional, validade_temp_dias: v })}
                    info="Dias de validade de uma autorização de entrada temporária."
                  />
                  <NumberField
                    label="Idade Mínima — Saída Desacompanhada"
                    value={operacional.idade_minima_saida_desacompanhada}
                    onChange={(v) => setOperacional({ ...operacional, idade_minima_saida_desacompanhada: v })}
                    risk="OPERACIONAL"
                    info="ECA: Recomenda-se 12 anos completos para saída sem responsável."
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <ToggleRow
                    label="Exigir Foto para Terceiros Autorizados"
                    description="Terceiros sem foto no cadastro ficam bloqueados na portaria."
                    checked={operacional.exige_foto_terceiros}
                    onCheckedChange={(v) => setOperacional({ ...operacional, exige_foto_terceiros: v })}
                    risk="OPERACIONAL"
                  />
                  <ToggleRow
                    label="Exigir Documento na Portaria"
                    description="Funcionário confirma documento antes de liberar a saída."
                    checked={operacional.exige_documento_portaria}
                    onCheckedChange={(v) => setOperacional({ ...operacional, exige_documento_portaria: v })}
                    risk="OPERACIONAL"
                  />
                  <ToggleRow
                    label="Notificação Push de Saída"
                    description="Responsável recebe push notification ao filho sair da escola."
                    checked={operacional.push_saida}
                    onCheckedChange={(v) => setOperacional({ ...operacional, push_saida: v })}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── ABA CONDUTA ────────────────────────────────────── */}
          {activeTab === 'conduta' && (
            <SectionCard icon={Scale} title="Regimento e Comportamento" description="Regras de conduta e geração automática de ocorrências.">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <NumberField
                    label="Atrasos para gerar Ocorrência"
                    value={conduta.limite_atrasos_penalidade}
                    onChange={(v) => setConduta({ ...conduta, limite_atrasos_penalidade: v })}
                    risk="OPERACIONAL"
                    info="Atrasos acumulados antes de gerar advertência automática."
                  />
                  <div className="flex flex-col justify-end">
                    <ToggleRow
                      label="Notificar Responsáveis por Ocorrências"
                      description="Pais recebem alerta automático em cada ocorrência registrada."
                      checked={conduta.notifica_pais_falta}
                      onCheckedChange={(v) => setConduta({ ...conduta, notifica_pais_falta: v })}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 block">Upload do Regimento Escolar (PDF)</Label>
                  <div className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <UploadCloud size={22} />
                      <span className="text-sm font-medium">Arraste o arquivo ou clique para upload</span>
                      <span className="text-xs">PDF com até 50MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── ABA CALENDÁRIO ─────────────────────────────────── */}
          {activeTab === 'calendario' && (
            <SectionCard icon={CalendarDays} title="Definições do Ano Letivo" description="Datas e carga horária para conformidade com a LDB.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Início das Aulas</Label>
                  <Input type="date" value={calendario.inicio_aulas} onChange={(e) => setCalendario({ ...calendario, inicio_aulas: e.target.value })} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Término das Aulas</Label>
                  <Input type="date" value={calendario.termino_aulas} onChange={(e) => setCalendario({ ...calendario, termino_aulas: e.target.value })} className="h-10 rounded-xl" />
                </div>
                <NumberField
                  label="Dias Letivos"
                  value={calendario.dias_letivos}
                  error={erros.diasLetivos}
                  onChange={(v) => setCalendario({ ...calendario, dias_letivos: v })}
                  risk="UX"
                  info="LDB: Mínimo de 200 dias de efetivo trabalho escolar."
                />
                <NumberField
                  label="Carga Horária (h)"
                  value={calendario.carga_horaria}
                  error={erros.cargaHoraria}
                  onChange={(v) => setCalendario({ ...calendario, carga_horaria: v })}
                  risk="UX"
                  info="LDB: Mínimo de 800 horas anuais."
                />
              </div>
            </SectionCard>
          )}

          {/* ── ABA AUDITORIA ──────────────────────────────────── */}
          {activeTab === 'auditoria' && (
            <SectionCard icon={History} title="Histórico de Alterações" description="Rastreamento completo de cada campo modificado.">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-slate-500 font-medium">
                  Últimas 50 alterações individuais realizadas nesta configuração.
                </p>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs rounded-xl" onClick={loadHistoricoDetalhado}>
                  <RefreshCw size={12} />
                  Atualizar
                </Button>
              </div>

              {/* Histórico campo-a-campo */}
              {isLoadingHist ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : historicoDetalhado.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma alteração registrada ainda.</p>
                  <p className="text-xs mt-1">O histórico campo-a-campo é registrado a partir de agora.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historicoDetalhado.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={14} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider font-montserrat">{h.categoria}</span>
                          <span className="text-[10px] text-slate-400">→</span>
                          <span className="text-xs font-bold text-slate-700">{h.campo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="line-through text-slate-400">{h.valor_anterior || '—'}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-bold text-slate-700">{h.valor_novo}</span>
                        </div>
                      </div>
                      <time className="text-[10px] text-slate-400 font-medium shrink-0">
                        {new Date(h.alterado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  ))}
                </div>
              )}

              {/* Histórico de vigências (tabela legada) */}
              {vigencias && vigencias.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Clock size={12} />
                      Vigências Arquivadas
                    </div>
                    {isLoadingHistory ? (
                      <div className="space-y-2">
                        {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                      </div>
                    ) : (
                      vigencias.map((h: any) => (
                        <div key={h.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Configuração Arquivada</span>
                            <time className="text-[10px] text-slate-400 font-medium">
                              {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </time>
                          </div>
                          <p className="text-sm font-semibold text-slate-700 mt-1">Vigência encerrada</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            De {new Date(h.vigencia_inicio).toLocaleDateString('pt-BR')} até {h.vigencia_fim ? new Date(h.vigencia_fim).toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </SectionCard>
          )}

        </div>
      </div>

      {/* Footer Mobile — botão de salvar fixo no mobile */}
      <div className="flex justify-end pt-4 border-t border-slate-100 md:hidden">
        <Button
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 h-12 rounded-xl font-bold shadow-sm"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
