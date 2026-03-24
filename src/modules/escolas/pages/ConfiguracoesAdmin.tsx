import { useState, useEffect } from 'react'
import {
  BookOpen, Wallet, ShieldAlert, Scale, CalendarDays, History,
  UploadCloud, Save, Info, Banknote, ChevronDown, Check, ShieldCheck, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useTenantSettings,
  useTenantSettingsHistory,
  type ConfigAcademica,
  type ConfigFinanceira,
  type ConfigOperacional,
  type ConfigConduta,
  type ConfigCalendario,
} from '@/modules/escolas/hooks/useTenantSettings'

// ─── Sub-componentes Locais ───────────────────────────────────────────────────

function FieldInfo({ text }: { text: string }) {
  return (
    <span className="group relative cursor-help">
      <Info size={13} className="text-slate-400 hover:text-slate-600 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 normal-case tracking-normal font-normal leading-relaxed">
        {text}
      </div>
    </span>
  )
}

function SelectField({ label, value, onChange, options, info }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  info?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</Label>
        {info && <FieldInfo text={info} />}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
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

function NumberField({ label, value, onChange, step = 1, error, info }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  error?: string | null
  info?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</Label>
          {info && <FieldInfo text={info} />}
        </div>
        {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
      </div>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-10 transition-all',
          error ? 'border-red-400 focus-visible:ring-red-100' : ''
        )}
      />
    </div>
  )
}

function ToggleRow({ label, description, checked, onCheckedChange }: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-indigo-600" />
    </div>
  )
}

// ─── Abas ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'academico', icon: BookOpen, label: 'Acadêmico', sublabel: 'LDB' },
  { id: 'financeiro', icon: Wallet, label: 'Financeiro', sublabel: 'CDC' },
  { id: 'operacional', icon: ShieldAlert, label: 'Operacional', sublabel: 'Portaria' },
  { id: 'conduta', icon: Scale, label: 'Conduta', sublabel: 'Regimento' },
  { id: 'calendario', icon: CalendarDays, label: 'Calendário', sublabel: 'Letivo' },
  { id: 'auditoria', icon: History, label: 'Auditoria', sublabel: 'Logs' },
]

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ConfiguracoesAdmin() {
  const { config, isLoading, updateConfig, isSaving } = useTenantSettings()
  const { data: historico, isLoading: isLoadingHistory } = useTenantSettingsHistory()

  const [activeTab, setActiveTab] = useState('financeiro')

  // Form local para edição imediata sem re-render global
  const [academica, setAcademica] = useState<ConfigAcademica>(config.config_academica)
  const [financeira, setFinanceira] = useState<ConfigFinanceira>(config.config_financeira)
  const [operacional, setOperacional] = useState<ConfigOperacional>(config.config_operacional)
  const [conduta, setConduta] = useState<ConfigConduta>(config.config_conduta)
  const [calendario, setCalendario] = useState<ConfigCalendario>(config.config_calendario)

  // Sincroniza form com dados carregados do banco
  useEffect(() => {
    if (!isLoading) {
      setAcademica(config.config_academica)
      setFinanceira(config.config_financeira)
      setOperacional(config.config_operacional)
      setConduta(config.config_conduta)
      setCalendario(config.config_calendario)
    }
  }, [isLoading]) // eslint-disable-line

  // Validações legais em tempo real (espelham as constraints do banco)
  const erros = {
    frequencia: academica.frequencia_minima_perc < 75 ? 'Mín: 75% (LDB Art. 24)' : null,
    diasLetivos: calendario.dias_letivos < 200 ? 'Mín: 200 dias (LDB)' : null,
    cargaHoraria: calendario.carga_horaria < 800 ? 'Mín: 800h (LDB)' : null,
    multa: financeira.multa_atraso_perc > 2.0 ? 'Máx: 2% (CDC Art. 52)' : null,
    juros: financeira.juros_mora_mensal_perc > 1.0 ? 'Máx: 1%/mês (CDC)' : null,
  }

  const hasErrors = Object.values(erros).some(Boolean)

  const handleSave = () => {
    if (hasErrors) return
    updateConfig({
      config_academica: academica,
      config_financeira: financeira,
      config_operacional: operacional,
      config_conduta: conduta,
      config_calendario: calendario,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-64" />
          <div className="col-span-3 space-y-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Configurações Institucionais</h1>
          <p className="text-sm text-slate-500 mt-0.5">Regras acadêmicas, financeiras e operacionais com conformidade legal automática</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-10"
        >
          {isSaving
            ? <Loader2 size={16} className="animate-spin" />
            : <Save size={16} />
          }
          Salvar Configurações
        </Button>
      </div>

      {hasErrors && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <ShieldCheck size={16} className="flex-shrink-0" />
          <span>Corrija os campos com erro de conformidade legal antes de salvar.</span>
        </div>
      )}

      {/* Layout Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <aside className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1">Domínios</p>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all font-medium',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <tab.icon size={15} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                <Badge variant="outline" className={cn(
                  'ml-auto text-[9px] px-1.5 h-4',
                  isActive ? 'border-indigo-200 text-indigo-600 bg-indigo-50' : 'text-slate-400'
                )}>
                  {tab.sublabel}
                </Badge>
              </button>
            )
          })}
        </aside>

        {/* Área de Detalhes */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── ABA ACADÊMICO ─────────────────────────── */}
          {activeTab === 'academico' && (
            <Card className="border-slate-200 shadow-sm animate-in fade-in duration-300">
              <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <BookOpen size={16} className="text-slate-400" />
                  Regras Acadêmicas e Avaliativas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SelectField
                  label="Divisão do Ano Letivo"
                  value={academica.divisao_etapas}
                  onChange={(v) => setAcademica({ ...academica, divisao_etapas: v as any })}
                  options={[
                    { value: '4_bimestres', label: '4 Bimestres' },
                    { value: '3_trimestres', label: '3 Trimestres' },
                    { value: '2_semestres', label: '2 Semestres' },
                  ]}
                />
                <SelectField
                  label="Casas Decimais nas Notas"
                  value={String(academica.casas_decimais)}
                  onChange={(v) => setAcademica({ ...academica, casas_decimais: Number(v) })}
                  options={[
                    { value: '1', label: 'Uma casa (Ex: 8.5)' },
                    { value: '2', label: 'Duas casas (Ex: 8.50)' },
                  ]}
                />
                <NumberField label="Média de Aprovação" value={academica.media_aprovacao} step={0.1} onChange={(v) => setAcademica({ ...academica, media_aprovacao: v })} />
                <NumberField
                  label="Média Mínima — Recuperação"
                  value={academica.media_recuperacao_minima}
                  step={0.1}
                  onChange={(v) => setAcademica({ ...academica, media_recuperacao_minima: v })}
                  info="Alunos abaixo desta nota são reprovados diretamente, sem direito à recuperação."
                />
                <NumberField
                  label="Frequência Mínima (%)"
                  value={academica.frequencia_minima_perc}
                  error={erros.frequencia}
                  onChange={(v) => setAcademica({ ...academica, frequencia_minima_perc: v })}
                  info="Art. 24 da LDB: mínimo obrigatório de 75% de presença no total de horas."
                />
                <div className="space-y-2 flex flex-col justify-end">
                  <ToggleRow
                    label="Reprovação Automática por Falta"
                    description="Sistema processa automaticamente ao fechar bimestre"
                    checked={academica.reprovacao_automatica_por_falta}
                    onCheckedChange={(v) => setAcademica({ ...academica, reprovacao_automatica_por_falta: v })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ABA FINANCEIRO ────────────────────────── */}
          {activeTab === 'financeiro' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <Wallet size={16} className="text-slate-400" />
                    Regras de Faturamento e Inadimplência
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
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
                    info="Dia fixo para vencimento de todas as mensalidades."
                  />
                  <NumberField
                    label="Qtd. Mensalidades Automáticas"
                    value={financeira.qtd_mensalidades_automaticas || 12}
                    onChange={(v) => setFinanceira({ ...financeira, qtd_mensalidades_automaticas: v })}
                    info="Quantas mensalidades gerar automaticamente na matrícula (padrão: 12)."
                  />
                  <NumberField label="Dias de Carência" value={financeira.dias_carencia} onChange={(v) => setFinanceira({ ...financeira, dias_carencia: v })} />
                  <NumberField
                    label="Desconto Irmãos (%)"
                    value={financeira.desconto_irmaos_perc}
                    step={0.5}
                    onChange={(v) => setFinanceira({ ...financeira, desconto_irmaos_perc: v })}
                    info="Aplicado automaticamente pelo motor de famílias na matrícula."
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
                  <NumberField label="Multa Fixa (R$)" value={financeira.multa_fixa} onChange={(v) => setFinanceira({ ...financeira, multa_fixa: v })} />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <Banknote size={16} className="text-slate-400" />
                    Taxa de Matrícula
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <ToggleRow 
                    label="Cobrar Taxa de Matrícula" 
                    description="Se desativado, o sistema não gerará cobrança de matrícula nos novos registros." 
                    checked={financeira.cobrar_matricula} 
                    onCheckedChange={(v) => setFinanceira({ ...financeira, cobrar_matricula: v })} 
                  />
                  {financeira.cobrar_matricula && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-4 border-l-2 border-indigo-200 py-2 animate-in slide-in-from-top-2 duration-200">
                      <NumberField 
                        label="Valor Padrão sugerido (R$)" 
                        value={financeira.valor_matricula_padrao || 0} 
                        onChange={(v) => setFinanceira({ ...financeira, valor_matricula_padrao: v })} 
                        info="Valor base para preenchimento automático na tela de matrícula."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <Banknote size={16} className="text-slate-400" />
                    Métodos de Recebimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <ToggleRow
                    label="PIX Manual"
                    description="Exibe a chave PIX e obriga upload de comprovante pelo responsável."
                    checked={financeira.pix_manual}
                    onCheckedChange={(v) => setFinanceira({ ...financeira, pix_manual: v })}
                  />
                  {financeira.pix_manual && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-200 py-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chave PIX</Label>
                        <Input value={financeira.chave_pix} onChange={(e) => setFinanceira({ ...financeira, chave_pix: e.target.value })} placeholder="CNPJ, e-mail ou chave aleatória" className="h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nome do Favorecido</Label>
                        <Input value={financeira.nome_favorecido} onChange={(e) => setFinanceira({ ...financeira, nome_favorecido: e.target.value })} placeholder="Nome da escola ou conta" className="h-10" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instruções ao Responsável</Label>
                        <Input value={financeira.instrucoes_pix} onChange={(e) => setFinanceira({ ...financeira, instrucoes_pix: e.target.value })} placeholder="Ex: Envie o comprovante para o WhatsApp da secretaria" className="h-10" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-100 bg-indigo-50/30">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
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
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── ABA OPERACIONAL ───────────────────────── */}
          {activeTab === 'operacional' && (
            <Card className="border-slate-200 shadow-sm animate-in fade-in duration-300">
              <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <ShieldAlert size={16} className="text-slate-400" />
                  Portaria, Catraca e Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <NumberField label="Tolerância de Atraso (min)" value={operacional.tolerancia_atraso_minutos} onChange={(v) => setOperacional({ ...operacional, tolerancia_atraso_minutos: v })} />
                  <NumberField label="Validade Aut. Temporária (dias)" value={operacional.validade_temp_dias} onChange={(v) => setOperacional({ ...operacional, validade_temp_dias: v })} />
                  <NumberField
                    label="Idade Saída Desacompanhado"
                    value={operacional.idade_minima_saida_desacompanhada}
                    onChange={(v) => setOperacional({ ...operacional, idade_minima_saida_desacompanhada: v })}
                    info="ECA: Recomenda-se 12 anos completos para saída sem responsável."
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <ToggleRow
                    label="Exigir foto para Terceiros Autorizados"
                    description="Terceiros sem foto no cadastro ficam bloqueados na portaria."
                    checked={operacional.exige_foto_terceiros}
                    onCheckedChange={(v) => setOperacional({ ...operacional, exige_foto_terceiros: v })}
                  />
                  <ToggleRow
                    label="Exigir documento na Portaria"
                    description="Funcionário confirma documento antes de liberar a saída."
                    checked={operacional.exige_documento_portaria}
                    onCheckedChange={(v) => setOperacional({ ...operacional, exige_documento_portaria: v })}
                  />
                  <ToggleRow
                    label="Notificação Push de Saída"
                    description="Responsável recebe push notification ao filho sair da escola."
                    checked={operacional.push_saida}
                    onCheckedChange={(v) => setOperacional({ ...operacional, push_saida: v })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ABA CONDUTA ───────────────────────────── */}
          {activeTab === 'conduta' && (
            <Card className="border-slate-200 shadow-sm animate-in fade-in duration-300">
              <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <Scale size={16} className="text-slate-400" />
                  Regimento e Comportamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NumberField
                    label="Atrasos para gerar Ocorrência"
                    value={conduta.limite_atrasos_penalidade}
                    onChange={(v) => setConduta({ ...conduta, limite_atrasos_penalidade: v })}
                    info="Quantidade de atrasos acumulados antes de gerar advertência automática."
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
                      <span className="text-xs font-semibold">Clique ou arraste o PDF oficial</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ABA CALENDÁRIO ────────────────────────── */}
          {activeTab === 'calendario' && (
            <Card className="border-slate-200 shadow-sm animate-in fade-in duration-300">
              <CardHeader className="border-b border-slate-100 pb-4 pt-[30px]">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <CalendarDays size={16} className="text-slate-400" />
                  Definições do Ano Letivo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Início das Aulas</Label>
                  <Input type="date" value={calendario.inicio_aulas} onChange={(e) => setCalendario({ ...calendario, inicio_aulas: e.target.value })} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Término das Aulas</Label>
                  <Input type="date" value={calendario.termino_aulas} onChange={(e) => setCalendario({ ...calendario, termino_aulas: e.target.value })} className="h-10" />
                </div>
                <NumberField
                  label="Dias Letivos"
                  value={calendario.dias_letivos}
                  error={erros.diasLetivos}
                  onChange={(v) => setCalendario({ ...calendario, dias_letivos: v })}
                  info="LDB: Mínimo de 200 dias de efetivo trabalho escolar."
                />
                <NumberField
                  label="Carga Horária (h)"
                  value={calendario.carga_horaria}
                  error={erros.cargaHoraria}
                  onChange={(v) => setCalendario({ ...calendario, carga_horaria: v })}
                  info="LDB: Mínimo de 800 horas anuais."
                />
              </CardContent>
            </Card>
          )}

          {/* ── ABA AUDITORIA ─────────────────────────── */}
          {activeTab === 'auditoria' && (
            <Card className="border-slate-200 shadow-sm animate-in fade-in duration-300">
              <CardHeader className="border-b border-slate-100 pb-4 pt-[30px] flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                  <ShieldCheck size={16} className="text-slate-400" />
                  Histórico de Alterações
                </CardTitle>
                <Button variant="outline" size="sm" className="text-[10px] uppercase tracking-wider h-7">
                  Exportar PDF
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : !historico || historico.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <History size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Nenhuma alteração registrada ainda.</p>
                    <p className="text-xs mt-1">O histórico é arquivado automaticamente a cada atualização.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-gradient-to-b before:from-slate-300 before:to-transparent">
                    {historico.map((h: any) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Configuração Arquivada</span>
                            <time className="text-[10px] text-slate-400 font-medium">
                              {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </time>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">Vigência encerrada</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            De {new Date(h.vigencia_inicio).toLocaleDateString('pt-BR')} até {h.vigencia_fim ? new Date(h.vigencia_fim).toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
