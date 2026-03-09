/**
 * Página de Auditoria V2.2
 * /configuracoes/auditoria
 * 
 * Log inalterável para defesa jurídica e Procon.
 */
import { useState } from 'react'
import { useAuditLogs } from '@/modules/rbac/hooks'
import { FileText, Search, ChevronLeft, ChevronRight, Clock, User, Activity, Filter } from 'lucide-react'

const PAGE_SIZE = 25

export function AuditoriaPage() {
  const [page, setPage] = useState(0)
  const [filtroAcao, setFiltroAcao] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useAuditLogs({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    acao: filtroAcao || undefined,
  })

  const logs = data?.data || []
  const total = data?.count || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleSearch = () => {
    setFiltroAcao(searchInput)
    setPage(0)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-0 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Auditoria do Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro imutável de todas as ações críticas realizadas no sistema
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Filtrar por ação (ex: financeiro, seguranca)..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtrar
        </button>
        {filtroAcao && (
          <button
            onClick={() => { setFiltroAcao(''); setSearchInput(''); setPage(0) }}
            className="px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Limpar filtro
          </button>
        )}
        <span className="text-xs text-zinc-400 ml-auto">
          {total} registros encontrados
        </span>
      </div>

      {/* Logs */}
      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum registro de auditoria</p>
          <p className="text-xs mt-1">As ações do sistema serão registradas aqui automaticamente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    log.acao?.includes('delete') || log.acao?.includes('revogado') || log.acao?.includes('deslig')
                      ? 'bg-red-100 text-red-600'
                      : log.acao?.includes('create') || log.acao?.includes('insert')
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-indigo-600">{log.acao}</span>
                    </p>
                    {log.motivo_declarado && (
                      <p className="text-xs text-zinc-600 mt-1">
                        <span className="font-medium">Motivo:</span> {log.motivo_declarado}
                      </p>
                    )}
                    {(log.valor_anterior || log.valor_novo) && (
                      <div className="mt-2 flex gap-3 text-[11px]">
                        {log.valor_anterior && (
                          <div className="bg-red-50 px-2 py-1 rounded text-red-700">
                            <span className="font-medium">Antes:</span>{' '}
                            {typeof log.valor_anterior === 'object'
                              ? JSON.stringify(log.valor_anterior).substring(0, 80)
                              : String(log.valor_anterior).substring(0, 80)
                            }
                          </div>
                        )}
                        {log.valor_novo && (
                          <div className="bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                            <span className="font-medium">Depois:</span>{' '}
                            {typeof log.valor_novo === 'object'
                              ? JSON.stringify(log.valor_novo).substring(0, 80)
                              : String(log.valor_novo).substring(0, 80)
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 justify-end">
                    <User className="h-3 w-3" />
                    <span className="font-mono">{log.user_id?.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-zinc-600">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
