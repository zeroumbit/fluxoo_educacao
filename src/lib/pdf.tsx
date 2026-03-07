import { Document, Page, Text, View, StyleSheet, Font, pdf, type DocumentProps } from '@react-pdf/renderer'

// Registrar fonte customizada (opcional - usa fontes do sistema por padrão)
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2'
})

// Estilos base para todos os PDFs
export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#14b8a6',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: -1,
  },
  logoAccent: {
    color: '#14b8a6',
  },
  meta: {
    textAlign: 'right',
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    fontWeight: 'black',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  hashValidacao: {
    fontSize: 7,
    color: '#14b8a6',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#475569',
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  declaration: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    fontSize: 9,
    color: '#475569',
    textAlign: 'justify',
  },
})

// Componente de assinatura
export const SignatureBlock = ({ name, role }: { name: string; role: string }) => (
  <View style={{ marginTop: 60, textAlign: 'center' }}>
    <View style={{ height: 1, backgroundColor: '#cbd5e1', marginBottom: 10 }} />
    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}>{name}</Text>
    <Text style={{ fontSize: 8, color: '#64748b' }}>{role}</Text>
  </View>
)

// Função utilitária para gerar PDF
export async function generatePdfDocument(document: React.ReactElement<DocumentProps>) {
  const blob = await pdf(document).toBlob()
  return blob
}

// Função para download do PDF
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Função para abrir PDF em nova aba
export function openPdfInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
