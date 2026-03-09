/**
 * Página de Perfis de Acesso (RBAC V2.2)
 * /configuracoes/perfis
 */
import { useState } from 'react'
import { usePerfis, useCriarPerfil, useExcluirPerfil, usePermissions, usePerfilPermissions, useDefinirPermissoesPerfil, useOverrides } from '@/modules/rbac/hooks'
import { useAuth } from '@/modules/auth/AuthContext'
import { PermissionMatrix } from '@/modules/rbac/components/PermissionMatrix'
import { SCOPE_LABELS } from '@/modules/rbac/types'
import type { ScopeType } from '@/modules/rbac/types'
import { toast } from 'sonner'
import {
  Shield, Plus, Trash2, Edit3, ChevronRight, Users, AlertTriangle,
  Save, X, Eye, Settings2, Lock
} from 'lucide-react'

export function PerfisPage() {
  const { authUser } = useAuth()
  const { data: perfis, isLoading } = usePerfis()
  const { data: overrides } = useOverrides()
  const criarPerfil = useCriarPerfil()
  const excluirPerfil = useExcluirPerfil()
  const [activeTab, setActiveTab] = useState<'perfis' | 'matriz' | 'overrides'>('perfis')
  const [showCreate, setShowCreate] = useState(false)
  const [editingPerfilId, setEditingPerfilId] = useState<string | null>(null)

  // Form state
  const [newNome, setNewNome] = useState('')
  const [newDescricao, setNewDescricao] = useState('')
  const [newParent, setNewParent] = useState('')

  const handleCreate = async () => {
    if (!newNome.trim()) {
      toast.error('Nome do perfil é obrigatório')
      return
    }

    try {
      await criarPerfil.mutateAsync({
        tenant_id: authUser?.tenantId || null,
        nome: newNome.trim(),
        descricao: newDescricao.trim() || null,
        parent_perfil_id: newParent || null,
      })
      toast.success('Perfil criado com sucesso!')
      setShowCreate(false)
      setNewNome('')
      setNewDescricao('')
      setNewParent('')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar perfil')
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o perfil "${nome}"? Usuários vinculados perderão as permissões.`)) return

    try {
      await excluirPerfil.mutateAsync(id)
      toast.success('Perfil excluído')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir perfil')
    }
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600" />
            Controle de Acesso (RBAC)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie perfis de acesso, permissões e exceções do sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {[
          { key: 'perfis' as const, label: 'Perfis', icon: Users },
          { key: 'matriz' as const, label: 'Matriz Visual', icon: Eye },
          { key: 'overrides' as const, label: 'Exceções', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'perfis' && (
        <div className="space-y-4">
          {/* Botão criar */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4" />
            Novo Perfil
          </button>

          {/* Form criar */}
          {showCreate && (
            <div className="bg-white border rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" />
                Criar Novo Perfil
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Nome *</label>
                  <input
                    value={newNome}
                    onChange={e => setNewNome(e.target.value)}
                    placeholder="Ex: Auxiliar Pedagógico"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Herda de (opcional)</label>
                  <select
                    value={newParent}
                    onChange={e => setNewParent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Nenhum (perfil raiz)</option>
                    {perfis?.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">Descrição</label>
                <textarea
                  value={newDescricao}
                  onChange={e => setNewDescricao(e.target.value)}
                  placeholder="Descreva o propósito deste perfil..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={criarPerfil.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {criarPerfil.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Criar Perfil
                </button>
              </div>
            </div>
          )}

          {/* Lista de perfis */}
          <div className="grid gap-3">
            {perfis?.map(perfil => (
              <div
                key={perfil.id}
                className="bg-white border rounded-xl p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      perfil.tenant_id ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{perfil.nome}</h3>
                        {!perfil.tenant_id && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] rounded-full font-medium">
                            Template Fluxoo
                          </span>
                        )}
                        {perfil.parent_perfil_id && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full font-medium flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" /> Herda
                          </span>
                        )}
                      </div>
                      {perfil.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5">{perfil.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingPerfilId(editingPerfilId === perfil.id ? null : perfil.id)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Editar permissões"
                    >
                      <Settings2 className="h-4 w-4 text-zinc-500" />
                    </button>
                    {perfil.tenant_id && (
                      <button
                        onClick={() => handleDelete(perfil.id, perfil.nome)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir perfil"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Editor de permissões inline */}
                {editingPerfilId === perfil.id && (
                  <div className="mt-4 pt-4 border-t">
                    <PerfilPermissionEditor perfilId={perfil.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'matriz' && <PermissionMatrix />}

      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-amber-800">Exceções Ativas (Overrides)</h3>
              <p className="text-xs text-amber-700 mt-1">
                Usuários listados abaixo possuem permissões adicionais ou bloqueadas pontualmente, fora do perfil padrão.
              </p>
            </div>
          </div>

          {overrides && overrides.length > 0 ? (
            <div className="grid gap-2">
              {overrides.map((ov: any) => (
                <div key={ov.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      ov.status === 'allow' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {ov.status === 'allow' ? <Shield className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {ov.user?.funcionario?.nome_completo || ov.user?.email_login || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ov.status === 'allow' ? '✅ Concedida:' : '🚫 Bloqueada:'}{' '}
                        <span className="font-mono">{ov.permission?.key}</span>
                        {ov.permission?.descricao && ` — ${ov.permission.descricao}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(ov.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma exceção ativa</p>
              <p className="text-xs mt-1">Todos os usuários seguem seus perfis padrão.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Editor inline de permissões de um perfil
 */
function PerfilPermissionEditor({ perfilId }: { perfilId: string }) {
  const { data: allPermissions, isLoading: loadingPerms } = usePermissions()
  const { data: currentPerms, isLoading: loadingCurrent } = usePerfilPermissions(perfilId)
  const definirPermissoes = useDefinirPermissoesPerfil()

  const [selectedPerms, setSelectedPerms] = useState<Map<string, ScopeType>>(new Map())
  const [initialized, setInitialized] = useState(false)

  // Inicializar com permissões atuais
  if (!initialized && currentPerms && !loadingCurrent) {
    const map = new Map<string, ScopeType>()
    for (const pp of currentPerms) {
      map.set(pp.permission_id, pp.scope_type)
    }
    setSelectedPerms(map)
    setInitialized(true)
  }

  const togglePermission = (permId: string) => {
    setSelectedPerms(prev => {
      const next = new Map(prev)
      if (next.has(permId)) {
        next.delete(permId)
      } else {
        next.set(permId, 'toda_escola')
      }
      return next
    })
  }

  const updateScope = (permId: string, scope: ScopeType) => {
    setSelectedPerms(prev => {
      const next = new Map(prev)
      next.set(permId, scope)
      return next
    })
  }

  const handleSave = async () => {
    try {
      const permissoes = Array.from(selectedPerms.entries()).map(([permissionId, scope]) => ({
        permissionId,
        scope,
      }))
      await definirPermissoes.mutateAsync({ perfilId, permissoes })
      toast.success('Permissões atualizadas!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar permissões')
    }
  }

  if (loadingPerms || loadingCurrent) {
    return (
      <div className="flex items-center gap-2 py-4">
        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  // Agrupar por módulo
  const grouped: Record<string, typeof allPermissions> = {}
  for (const perm of allPermissions || []) {
    if (!grouped[perm.modulo_key]) grouped[perm.modulo_key] = []
    grouped[perm.modulo_key]!.push(perm)
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([moduleKey, perms]) => (
        <div key={moduleKey}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 capitalize">
            {moduleKey}
          </p>
          <div className="grid gap-1">
            {perms?.map(perm => {
              const isActive = selectedPerms.has(perm.id)
              const scope = selectedPerms.get(perm.id)

              return (
                <div key={perm.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive ? 'bg-indigo-50' : 'bg-zinc-50'
                }`}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => togglePermission(perm.id)}
                    className="accent-indigo-600 h-4 w-4"
                  />
                  <span className={`flex-1 ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`}>
                    {perm.descricao}
                  </span>
                  {isActive && (
                    <select
                      value={scope}
                      onChange={e => updateScope(perm.id, e.target.value as ScopeType)}
                      className="text-xs px-2 py-1 border rounded bg-white"
                    >
                      {Object.entries(SCOPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={definirPermissoes.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {definirPermissoes.isPending ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Permissões
        </button>
      </div>
    </div>
  )
}
