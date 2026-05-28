import { rbacService } from '@/modules/rbac/service'
import { exportRegistry } from './export-registry'
import { exportReportAsCSV } from './export-csv'
import { exportReportAsPdf } from './export-pdf'
import { exportReportAsXlsx } from './export-xlsx'
import type { ExportFormat, ExportFetchParams } from './export-registry'
import type { AuthUser } from '@/modules/auth/AuthContext'

export interface ExportRequest {
  reportKey: string
  format: ExportFormat
  authUser: AuthUser
  filters?: Record<string, unknown>
}

export const exportService = {
  async execute(request: ExportRequest): Promise<void> {
    const report = exportRegistry.get(request.reportKey)
    if (!report) throw new Error(`Relatório "${request.reportKey}" não encontrado no registro.`)

    if (!request.authUser) throw new Error('Usuário não autenticado.')

    const hasPermission = await exportService.validarPermissao(
      request.authUser,
      report.permissionKey,
    )
    if (!hasPermission) throw new Error('Você não tem permissão para exportar este relatório.')

    const params: ExportFetchParams = {
      tenantId: request.authUser.tenantId,
      userId: request.authUser.funcionarioId || request.authUser.user?.id,
      filters: request.filters,
    }

    const data = await report.fetchData(params)

    switch (request.format) {
      case 'xlsx':
        await exportReportAsXlsx(report, data, params)
        break
      case 'csv':
        await exportReportAsCSV(report, data)
        break
      case 'pdf':
        await exportReportAsPdf(report, data, params)
        break
    }

    await exportService.registrarAuditoria({
      authUser: request.authUser,
      reportKey: request.reportKey,
      format: request.format,
      rowCount: data.length,
      filters: request.filters,
    })
  },

  async validarPermissao(
    authUser: AuthUser,
    permissionKey: string,
  ): Promise<boolean> {
    if (authUser.isSuperAdmin || authUser.isGestor) return true
    if (!authUser.user?.id) return false
    return true
  },

  async registrarAuditoria(input: {
    authUser: AuthUser
    reportKey: string
    format: ExportFormat
    rowCount: number
    filters?: Record<string, unknown>
  }): Promise<void> {
    if (!input.authUser.tenantId || !input.authUser.user?.id) return

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
  },

  listarRelatoriosDisponiveis(authUser: AuthUser) {
    return exportRegistry
      .list()
      .filter(() => true)
  },
}
