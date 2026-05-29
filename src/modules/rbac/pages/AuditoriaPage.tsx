import type { AuditLogV2 } from '@/lib/database.types'
import { useAuditLogs } from '@/modules/rbac/hooks'
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Search,
  User,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const PAGE_SIZE = 25

type Operation = 'create' | 'update' | 'delete'

const RESOURCE_LABELS: Record<string, string> = {
  aluno: 'Aluno',
  alunos: 'Aluno',
  cobranca: 'Cobrança',
  cobrancas: 'Cobrança',
  mensalidade: 'Mensalidade',
  matricula: 'Matrícula',
  responsavel: 'Responsável',
  contrato: 'Contrato',
  config: 'Configuração',
  usuario: 'Usuário',
  funcionario: 'Funcionário',
  perfil: 'Perfil de Acesso',
  permissao: 'Permissão',
  financeiro: 'Financeiro',
  turma: 'Turma',
  filial: 'Filial',
}

function detectOperation(acao: string): Operation {
  const a = acao.toLowerCase()
  if (a.includes('insert') || a.includes('create') || a.includes('novo') || a.includes('cadastro'))
    return 'create'
  if (a.includes('delete') || a.includes('remove') || a.includes('excluir') || a.includes('revogado') || a.includes('deslig'))
    return 'delete'
  return 'update'
}

function detectResource(valor: Record<string, unknown> | null): string {
  if (!valor) return 'Registro'
  const keys = Object.keys(valor)
  if (keys.includes('nome_completo')) return 'Aluno'
  if (keys.includes('cpf') || keys.includes('nome')) return 'Responsável'
  if (keys.includes('valor') && (keys.includes('data_vencimento') || keys.includes('status'))) return 'Cobrança'
  if (keys.includes('email_login') || keys.includes('role')) return 'Usuário'
  if (keys.includes('chave_pix') || keys.includes('multa_atraso_perc')) return 'Configuração Financeira'
  if (keys.includes('nome') && keys.includes('cnpj')) return 'Escola'
  if (keys.includes('nome') && keys.includes('turno')) return 'Turma'
  return 'Registro'
}

function getOpLabel(op: Operation, resource: string): string {
  const labels: Record<Operation, string> = {
    create: `Novo ${resource} criado`,
    update: `${resource} atualizado`,
    delete: `${resource} removido`,
  }
  return labels[op]
}

function getOpIcon(op: Operation): string {
  if (op === 'create') return '✨'
  if (op === 'delete') return '🗑️'
  return '📝'
}

function getChangedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { field: string; from?: string; to?: string }[] {
  if (!before && !after) return []

  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ])

  const EXCLUDE_FIELDS = new Set(['id', 'created_at', 'updated_at', 'tenant_id'])

  const changes: { field: string; from?: string; to?: string }[] = []

  for (const key of allKeys) {
    if (EXCLUDE_FIELDS.has(key)) continue

    const oldVal = before?.[key]
    const newVal = after?.[key]

    const oldStr = oldVal !== undefined && oldVal !== null ? String(oldVal) : undefined
    const newStr = newVal !== undefined && newVal !== null ? String(newVal) : undefined

    if (oldStr !== newStr) {
      changes.push({
        field: formatFieldName(key),
        from: oldStr,
        to: newStr,
      })
    }
  }

  return changes
}

function formatFieldName(key: string): string {
  const map: Record<string, string> = {
    nome_completo: 'Nome',
    nome: 'Nome',
    cpf: 'CPF',
    rg: 'RG',
    cep: 'CEP',
    email: 'E-mail',
    email_login: 'E-mail de acesso',
    telefone: 'Telefone',
    celular: 'Celular',
    endereco: 'Endereço',
    logradouro: 'Logradouro',
    numero: 'Número',
    bairro: 'Bairro',
    cidade: 'Cidade',
    estado: 'Estado',
    cnpj: 'CNPJ',
    valor: 'Valor',
    status: 'Status',
    data_vencimento: 'Data de Vencimento',
    data_pagamento: 'Data de Pagamento',
    forma_pagamento: 'Forma de Pagamento',
    descricao: 'Descrição',
    observacao: 'Observação',
    desconto_valor: 'Valor do Desconto',
    desconto_tipo: 'Tipo de Desconto',
    desconto_inicio: 'Início do Desconto',
    desconto_fim: 'Fim do Desconto',
    chave_pix: 'Chave PIX',
    pix_chave: 'Chave PIX',
    multa_atraso_perc: 'Multa por Atraso (%)',
    juros_mora_mensal_perc: 'Juros de Mora (% mês)',
    dia_vencimento_padrao: 'Dia de Vencimento',
    grau_parentesco: 'Grau de Parentesco',
    responsavel_id: 'Responsável',
    aluno_id: 'Aluno',
    turma_id: 'Turma',
    filial_id: 'Filial',
    role: 'Perfil de Acesso',
    user_id: 'Usuário',
    ativo: 'Ativo',
    status_cobranca: 'Status da Cobrança',
    is_financeiro: 'Responsável Financeiro',
    is_academico: 'Acesso Acadêmico',
    turno: 'Turno',
    ano_letivo: 'Ano Letivo',
    foto_url: 'Foto',
  }
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatValue(valor: string | undefined, field: string): string | undefined {
  if (!valor) return undefined

  if (valor === 'true') return 'Sim'
  if (valor === 'false') return 'Não'
  if (valor === 'null' || valor === 'undefined' || valor === '') return '(vazio)'

  if (field === 'Valor' || field === 'Valor do Desconto') {
    const num = Number(valor)
    if (!isNaN(num)) return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (field === 'Multa por Atraso (%)' || field === 'Juros de Mora (% mês)') {
    const num = Number(valor)
    if (!isNaN(num)) return `${num}%`
  }

  if (field === 'Data de Vencimento' || field === 'Data de Pagamento' || field === 'Início do Desconto' || field === 'Fim do Desconto') {
    if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
      return new Date(valor + 'T12:00:00').toLocaleDateString('pt-BR')
    }
  }

  if (valor.length > 50) return valor.substring(0, 50) + '…'

  return valor
}

const FILTER_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: 'Inclusões', value: 'insert' },
  { label: 'Alterações', value: 'update' },
  { label: 'Exclusões', value: 'delete' },
]

export function AuditoriaPage() {
  const [page, setPage] = useState(0)
  const [filtroAcao, setFiltroAcao] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { data, isLoading } = useAuditLogs({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    acao: filtroAcao || undefined,
  })

  const logs = (data?.data || []) as AuditLogV2[]
  const total = data?.count || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleSearch = () => {
    setFiltroAcao(searchInput)
    setPage(0)
  }

  const enrichedLogs = useMemo(() => {
    return logs.map((log) => {
      const op = detectOperation(log.acao)
      const resource = detectResource(log.valor_novo || log.valor_anterior)
      const changes = getChangedFields(log.valor_anterior, log.valor_novo)
      return { ...log, _op: op, _resource: resource, _changes: changes }
    })
  }, [logs])

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Auditoria do Sistema
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Histórico de alterações feitas na sua escola. Use para acompanhar quem fez o quê e quando.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFiltroAcao(opt.value); setSearchInput(''); setPage(0) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filtroAcao === opt.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {filtroAcao && (
          <button
            onClick={() => { setFiltroAcao(''); setPage(0) }}
            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <span className="text-xs text-zinc-400 ml-auto">
          {total} {total === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {enrichedLogs.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-zinc-500">Nenhum registro encontrado</p>
          <p className="text-sm mt-1">As alterações feitas no sistema aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enrichedLogs.map((log) => {
            const op = (log as any)._op as Operation
            const resource = (log as any)._resource as string
            const changes = (log as any)._changes as { field: string; from?: string; to?: string }[]

            return (
              <div key={log.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0 mt-0.5">{getOpIcon(op)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-800">
                          {getOpLabel(op, resource)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {log.user_id && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              ID: {log.user_id.substring(0, 8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        op === 'delete'
                          ? 'bg-red-100 text-red-700'
                          : op === 'create'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {op === 'create' ? 'Inclusão' : op === 'delete' ? 'Exclusão' : 'Alteração'}
                      </div>
                      {changes.length > 0 && (
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedIds.has(log.id) ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedIds.has(log.id) && changes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
                      {changes.map((c) => (
                        <div key={c.field} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm bg-zinc-50 rounded-xl px-3 py-2">
                          <span className="font-medium text-zinc-700 text-xs min-w-[100px]">{c.field}:</span>
                          {c.from !== undefined && (
                            <span className="text-rose-600 line-through text-xs">
                              {formatValue(c.from, c.field) || '(vazio)'}
                            </span>
                          )}
                          {c.from !== undefined && c.to !== undefined && (
                            <span className="text-zinc-400 text-xs">→</span>
                          )}
                          {c.to !== undefined && (
                            <span className="text-emerald-700 font-medium text-xs">
                              {formatValue(c.to, c.field) || '(vazio)'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-zinc-500">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
