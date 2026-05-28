import type { ExportReportDefinition, ExportFetchParams } from './export-registry'

function downloadBlob(blob: Blob, filename: string): void {
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

export async function exportReportAsXlsx<TData extends Record<string, unknown>>(
  report: ExportReportDefinition<TData>,
  data: TData[],
  params: ExportFetchParams,
): Promise<void> {
  const XLSX = await import('xlsx')

  const filename =
    typeof report.filename === 'function'
      ? report.filename(params).replace(/\.csv$/, '.xlsx')
      : report.filename.replace(/\.csv$/, '.xlsx')

  const headers = report.columns.map((c) => c.header)
  const rows = data.map((row) =>
    report.columns.map((col) => {
      const raw = row[col.key]
      if (col.format) return col.format(raw)
      if (raw === null || raw === undefined) return ''
      if (typeof raw === 'object') return JSON.stringify(raw)
      return raw
    }),
  )

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  const colWidths = report.columns.map((col, i) => {
    const headerLen = col.header.length
    const maxDataLen = rows.reduce((max, row) => {
      const val = String(row[i] ?? '')
      return Math.max(max, val.length)
    }, 0)
    const width = Math.max(headerLen, maxDataLen, 12)
    return { wch: Math.min(width + 3, 60) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, filename)
}
