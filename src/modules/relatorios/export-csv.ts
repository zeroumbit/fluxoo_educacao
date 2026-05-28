import type { ExportColumn, ExportReportDefinition } from './export-registry'
import type { CsvCell } from './export-utils'

function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function buildCsvContent(headers: string[], rows: string[][]): string {
  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n')
}

function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
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

function formatCellValue(
  value: unknown,
  column: ExportColumn,
): string {
  if (column.format) return column.format(value)
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export async function exportReportAsCSV<TData extends Record<string, unknown>>(
  report: ExportReportDefinition<TData>,
  data: TData[],
): Promise<void> {
  const headers = report.columns.map((c) => c.header)
  const rows = data.map((row) =>
    report.columns.map((col) => formatCellValue(row[col.key], col)),
  )

  const csvContent = buildCsvContent(headers, rows)

  const filename =
    typeof report.filename === 'function'
      ? report.filename({ tenantId: '', filters: {} })
      : report.filename

  downloadTextFile(csvContent, filename, 'text/csv;charset=utf-8;')
}
