const LOCAL_STORAGE_KEYS = [
  'fluxoo_rbac_cache',
  'fluxoo-portal-storage',
  'aluno_cadastro_draft',
  'aluno_cadastro_step',
  'aluno_cadastro_draft_mobile',
  'aluno_cadastro_step_mobile',
  'matricula_draft',
  'matricula_dialog_open',
  'fluxoo_funcionario_cadastro_data',
  'fluxoo_escola_cadastro_data',
  'fluxoo_escola_cadastro_step',
  'fluxoo_marketplace_cadastro_data',
  'fluxoo_marketplace_cadastro_step',
  'fluxoo_marketplace_cadastro_tipo',
]

const SESSION_STORAGE_KEYS = [
  'fluxoo_login_attempts',
  'fluxoo-rbac-store',
]

function removeKeys(storage: Storage, keys: string[]) {
  for (const key of keys) {
    try {
      storage.removeItem(key)
    } catch {
      // Storage cleanup must never block logout.
    }
  }
}

export function clearSensitiveClientState() {
  if (typeof window === 'undefined') return

  removeKeys(window.localStorage, LOCAL_STORAGE_KEYS)
  removeKeys(window.sessionStorage, SESSION_STORAGE_KEYS)
}
