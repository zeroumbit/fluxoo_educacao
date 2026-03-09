/**
 * PermissionMatrix V2.2
 * Visualização da matriz Perfil ↔ Permissões para o Dashboard de Governança.
 */
import { useState, useMemo } from 'react'
import { usePerfis, usePermissions, usePerfilPermissions } from '@/modules/rbac/hooks'
import { SCOPE_LABELS } from '@/modules/rbac/types'
import type { ScopeType } from '@/modules/rbac/types'
import { Check, X, ChevronDown, ChevronRight, Shield, Eye } from 'lucide-react'

export function PermissionMatrix() {
  const { data: perfis, isLoading: loadingPerfis } = usePerfis()
  const { data: allPermissions, isLoading: loadingPerms } = usePermissions()
  const [selectedPerfilId, setSelectedPerfilId] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Agrupar permissões por módulo
  const groupedPermissions = useMemo(() => {
    if (!allPermissions) return {}
    const groups: Record<string, typeof allPermissions> = {}
    for (const perm of allPermissions) {
      if (!groups[perm.modulo_key]) {
        groups[perm.modulo_key] = []
      }
      groups[perm.modulo_key].push(perm)
    }
    return groups
  }, [allPermissions])

  const toggleModule = (key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (loadingPerfis || loadingPerms) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        <span className="ml-3 text-sm text-muted-foreground">Carregando matriz de permissões...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com seleção de perfil */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Matriz de Permissões</h3>
        </div>

        <div className="flex gap-2 flex-wrap">
          {perfis?.map(perfil => (
            <button
              key={perfil.id}
              onClick={() => setSelectedPerfilId(selectedPerfilId === perfil.id ? null : perfil.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedPerfilId === perfil.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {perfil.nome}
              {!perfil.tenant_id && (
                <span className="ml-1 text-[10px] opacity-60">(Padrão)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Matriz */}
      {selectedPerfilId ? (
        <PerfilPermissionDetail perfilId={selectedPerfilId} groupedPermissions={groupedPermissions} expandedModules={expandedModules} toggleModule={toggleModule} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Selecione um perfil acima para visualizar suas permissões</p>
        </div>
      )}
    </div>
  )
}

function PerfilPermissionDetail({
  perfilId,
  groupedPermissions,
  expandedModules,
  toggleModule,
}: {
  perfilId: string
  groupedPermissions: Record<string, any[]>
  expandedModules: Set<string>
  toggleModule: (key: string) => void
}) {
  const { data: perfilPerms, isLoading } = usePerfilPermissions(perfilId)

  // Converter para Set rápido de lookup
  const permMap = useMemo(() => {
    const map = new Map<string, ScopeType>()
    if (perfilPerms) {
      for (const pp of perfilPerms) {
        const key = (pp as any).permission?.key || pp.permission_id
        map.set(key, pp.scope_type)
      }
    }
    return map
  }, [perfilPerms])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      {Object.entries(groupedPermissions).map(([moduleKey, permissions]) => {
        const isExpanded = expandedModules.has(moduleKey)
        const activeCount = permissions.filter(p => permMap.has(p.key)).length

        return (
          <div key={moduleKey} className="border-b last:border-b-0">
            {/* Módulo Header */}
            <button
              onClick={() => toggleModule(moduleKey)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                )}
                <span className="font-medium text-sm capitalize">{moduleKey}</span>
                <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[11px] text-zinc-500">
                  {activeCount}/{permissions.length}
                </span>
              </div>
              {activeCount > 0 && (
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Permissões do módulo */}
            {isExpanded && (
              <div className="px-4 pb-3">
                <div className="grid gap-1">
                  {permissions.map(perm => {
                    const hasIt = permMap.has(perm.key)
                    const scope = permMap.get(perm.key)

                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                          hasIt ? 'bg-emerald-50' : 'bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {hasIt ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="h-4 w-4 text-zinc-300" />
                          )}
                          <div>
                            <span className={hasIt ? 'text-zinc-900' : 'text-zinc-400'}>{perm.descricao}</span>
                            <span className="ml-2 text-[10px] text-zinc-400 font-mono">{perm.key}</span>
                          </div>
                        </div>
                        {hasIt && scope && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[11px] font-medium">
                            {SCOPE_LABELS[scope]}
                          </span>
                        )}
                        {perm.requires_approval && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium ml-2">
                            Requer Aprovação
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
