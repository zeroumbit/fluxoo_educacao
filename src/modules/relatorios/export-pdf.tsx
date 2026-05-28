import { pdf } from '@react-pdf/renderer'
import { ReportPdfTemplate } from '@/lib/pdf-reports/ReportPdfTemplate'
import type { ExportReportDefinition, ExportFetchParams } from './export-registry'

function downloadPdf(blob: Blob, filename: string): void {
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

export async function exportReportAsPdf<TData extends Record<string, unknown>>(
  report: ExportReportDefinition<TData>,
  data: TData[],
  params: ExportFetchParams,
): Promise<void> {
  const filename =
    typeof report.filename === 'function'
      ? report.filename(params).replace(/\.csv$/, '.pdf')
      : report.filename.replace(/\.csv$/, '.pdf')

  const pdfDoc = (
    <ReportPdfTemplate
      title={report.name}
      subtitle={report.description}
      columns={report.columns}
      data={data}
    />
  )

  const blob = await pdf(pdfDoc).toBlob()
  downloadPdf(blob, filename)
}
