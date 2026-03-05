import { Document, Page, View, Text } from '@react-pdf/renderer'
import { baseStyles, SignatureBlock } from '@/lib/pdf'

interface FichaMatriculaData {
  nome: string
  rg: string
  cpf: string
  dataNascimento: string
  endereco: string
  nomeMae: string
  nomePai: string
  cpfResponsavel: string
  telefoneEmergencia: string
  naturalidade: string
  turma: string
  turno: string
  anoLetivo: string | number
  serieAno: string
  dataMatricula: string
  valorMatricula: number
  hashValidacao: string
}

export function FichaMatriculaPDF({ data }: { data: FichaMatriculaData }) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <View style={baseStyles.header}>
          <View style={baseStyles.logo}>
            <View style={baseStyles.logoIcon}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'black' }}>F</Text>
            </View>
            <View>
              <Text style={baseStyles.logoText}>Fluxoo<span style={baseStyles.logoAccent}>Edu</span></Text>
              <Text style={baseStyles.subtitle}>Sistema de Gestão Escolar</Text>
            </View>
          </View>
          <View style={baseStyles.meta}>
            <Text style={baseStyles.metaLabel}>Data de Emissão</Text>
            <Text style={baseStyles.metaValue}>{new Date().toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        {/* Título */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.title}>FICHA DE MATRÍCULA</Text>
          <Text style={baseStyles.subtitle}>Registro oficial de vínculo escolar</Text>
        </View>

        {/* Dados do Aluno */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Dados do Aluno</Text>
          <View style={{ backgroundColor: '#f8fafc', padding: 15, borderRadius: 8 }}>
            <View style={baseStyles.row}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Nome Completo</Text>
                <Text style={baseStyles.value}>{data.nome}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Data de Nascimento</Text>
                <Text style={baseStyles.value}>{data.dataNascimento}</Text>
              </View>
              <View style={{ ...baseStyles.col, marginLeft: 20 }}>
                <Text style={baseStyles.label}>Naturalidade</Text>
                <Text style={baseStyles.value}>{data.naturalidade}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>RG</Text>
                <Text style={baseStyles.value}>{data.rg}</Text>
              </View>
              <View style={{ ...baseStyles.col, marginLeft: 20 }}>
                <Text style={baseStyles.label}>CPF</Text>
                <Text style={baseStyles.value}>{data.cpf}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Endereço</Text>
                <Text style={baseStyles.value}>{data.endereco}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dados dos Responsáveis */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Dados dos Responsáveis</Text>
          <View style={{ backgroundColor: '#f8fafc', padding: 15, borderRadius: 8 }}>
            <View style={baseStyles.row}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Nome da Mãe</Text>
                <Text style={baseStyles.value}>{data.nomeMae}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Nome do Pai</Text>
                <Text style={baseStyles.value}>{data.nomePai}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>CPF do Responsável</Text>
                <Text style={baseStyles.value}>{data.cpfResponsavel}</Text>
              </View>
              <View style={{ ...baseStyles.col, marginLeft: 20 }}>
                <Text style={baseStyles.label}>Telefone de Emergência</Text>
                <Text style={baseStyles.value}>{data.telefoneEmergencia}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dados da Matrícula */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.sectionTitle}>Dados da Matrícula</Text>
          <View style={{ backgroundColor: '#f0fdf4', padding: 15, borderRadius: 8, borderLeft: 3, borderLeftColor: '#14b8a6' }}>
            <View style={baseStyles.row}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Ano Letivo</Text>
                <Text style={baseStyles.value}>{data.anoLetivo}</Text>
              </View>
              <View style={{ ...baseStyles.col, marginLeft: 20 }}>
                <Text style={baseStyles.label}>Série/Ano</Text>
                <Text style={baseStyles.value}>{data.serieAno}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Turma</Text>
                <Text style={baseStyles.value}>{data.turma}</Text>
              </View>
              <View style={{ ...baseStyles.col, marginLeft: 20 }}>
                <Text style={baseStyles.label}>Turno</Text>
                <Text style={baseStyles.value}>{data.turno}</Text>
              </View>
            </View>
            <View style={{ ...baseStyles.row, marginTop: 10 }}>
              <View style={baseStyles.col}>
                <Text style={baseStyles.label}>Data da Matrícula</Text>
                <Text style={baseStyles.value}>{data.dataMatricula}</Text>
              </View>
              <View style={{ ...baseStyles.col, marginLeft: 20 }}>
                <Text style={baseStyles.label}>Valor da Matrícula</Text>
                <Text style={baseStyles.value}>R$ {data.valorMatricula.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assinatura */}
        <SignatureBlock name="Direção / Secretaria" role="Responsável pela Matrícula" />

        {/* Footer */}
        <View style={baseStyles.footer}>
          <Text style={baseStyles.footerText}>
            Documento gerado eletronicamente por Fluxoo Educação - Sistema de Gestão Escolar
          </Text>
          <Text style={baseStyles.hashValidacao}>Hash de validação: {data.hashValidacao}</Text>
        </View>
      </Page>
    </Document>
  )
}
