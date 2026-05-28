import { rbacService } from '@/modules/rbac/service'
import type { AuthUser } from '@/modules/auth/AuthContext'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export type CsvCell = string | number | boolean | null | undefined

export type ExportAuditInput = {
  authUser: AuthUser | null
  reportKey: string
  format: ExportFormat
  rowCount: number
  filters?: Record<string, unknown>
}

function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function buildCsvContent(headers: string[], rows: CsvCell[][]): string {
  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function auditReportExport(input: ExportAuditInput): Promise<void> {
  if (!input.authUser?.tenantId || !input.authUser.user?.id) return

  await rbacService.criarAuditLog({
    tenant_id: input.authUser.tenantId,
    user_id: input.authUser.user.id,
    acao: `relatorio.export.${input.reportKey}.${input.format}`,
    recurso_id: input.authUser.tenantId,
    valor_anterior: null,
    valor_novo: {
      report_key: input.reportKey,
      format: input.format,
      row_count: input.rowCount,
      filters: input.filters || {},
    },
    motivo_declarado: 'Exportacao de relatorio solicitada pelo usuario',
    ip_address: null,
    user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
  })
}
