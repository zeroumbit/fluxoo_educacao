import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { ExportColumn } from '@/modules/relatorios/export-registry'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7W0Q5n-wU.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7W0Q5n-wU.woff2',
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#1a1a2e',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    borderRadius: 4,
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 7,
    fontWeight: 700,
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    padding: 8,
    fontSize: 8,
    color: '#3f3f46',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#a1a1aa',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  generatedAt: {
    fontSize: 7,
    color: '#d4d4d8',
    marginTop: 4,
  },
})

interface ReportPdfTemplateProps {
  title: string
  subtitle?: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
}

export function ReportPdfTemplate({
  title,
  subtitle,
  columns,
  data,
}: ReportPdfTemplateProps) {
  const generatedAt = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle || 'Relatório exportado'}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {columns.map((col) => (
              <View key={col.key} style={{ ...styles.tableHeaderCell, flex: 1 }}>
                <Text>{col.header}</Text>
              </View>
            ))}
          </View>

          {data.length === 0 && (
            <View style={styles.tableRow}>
              <View style={{ ...styles.tableCell, flex: 1 }}>
                <Text>Nenhum dado disponível</Text>
              </View>
            </View>
          )}

          {data.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                ...styles.tableRow,
                backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#fafafa',
              }}
            >
              {columns.map((col) => {
                const raw = row[col.key]
                const display = col.format ? col.format(raw) : String(raw ?? '')
                return (
                  <View key={col.key} style={{ ...styles.tableCell, flex: 1 }}>
                    <Text>{display}</Text>
                  </View>
                )
              })}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Fluxoo EDU — Relatório gerado em {generatedAt}
        </Text>
      </Page>
    </Document>
  )
}
