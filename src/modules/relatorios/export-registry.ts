import type { AuthUser } from '@/modules/auth/AuthContext'

export type ExportFormat = 'csv' | 'pdf' | 'xlsx'

export interface ExportColumn {
  key: string
  header: string
  format?: (value: unknown) => string
}

export interface ExportFetchParams {
  tenantId: string
  userId?: string
  filters?: Record<string, unknown>
}

export interface ExportReportDefinition<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  key: string
  name: string
  description: string
  permissionKey: string
  filename: string | ((params: ExportFetchParams) => string)
  columns: ExportColumn[]
  fetchData: (params: ExportFetchParams) => Promise<TData[]>
}

class ExportRegistry {
  private reports = new Map<string, ExportReportDefinition>()

  register<TData extends Record<string, unknown>>(
    report: ExportReportDefinition<TData>,
  ): void {
    if (this.reports.has(report.key)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[ExportRegistry] Report "${report.key}" already registered. Overwriting.`,
        )
      }
    }
    this.reports.set(report.key, report as ExportReportDefinition)
  }

  get(key: string): ExportReportDefinition | undefined {
    return this.reports.get(key)
  }

  list(): ExportReportDefinition[] {
    return Array.from(this.reports.values())
  }

  has(key: string): boolean {
    return this.reports.has(key)
  }
}

export const exportRegistry = new ExportRegistry()

export function defineReport<TData extends Record<string, unknown>>(
  definition: ExportReportDefinition<TData>,
): ExportReportDefinition<TData> {
  exportRegistry.register(definition)
  return definition
}
