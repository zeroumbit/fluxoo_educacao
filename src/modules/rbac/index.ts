/**
 * Módulo RBAC V2.2 — Barrel exports
 */

// Types
export * from './types'

// Service
export { rbacService } from './service'

// React Query Hooks
export * from './hooks'

// Components
export { PermissionGate, PermissionGateWithTooltip } from './components/PermissionGate'
export { PermissionMatrix } from './components/PermissionMatrix'

// Pages
export { PerfisPage } from './pages/PerfisPage'
export { AuditoriaPage } from './pages/AuditoriaPage'
