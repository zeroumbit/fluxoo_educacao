import { supabase } from '@/lib/supabase'
import { defineReport } from '@/modules/relatorios/export-registry'
import type { ExportFetchParams } from '@/modules/relatorios/export-registry'

function formatDate(value: unknown): string {
  if (!value) return ''
  const d = new Date(String(value))
  return d.toLocaleDateString('pt-BR')
}

const statusLabels: Record<string, string> = {
  presente: 'Presente',
  falta: 'Falta',
  justificada: 'Falta Justificada',
}

export function registrarExportacoesFrequencia() {
  defineReport({
    key: 'frequencia.registros',
    name: 'Registros de Frequência',
    description: 'Registros de frequência por turma e data',
    permissionKey: 'academico.frequencia.view',
    filename: `frequencia-${new Date().toISOString().split('T')[0]}.csv`,
    columns: [
      { key: 'aluno', header: 'Aluno' },
      { key: 'data_aula', header: 'Data da Aula', format: formatDate },
      { key: 'status', header: 'Status' },
      { key: 'turma', header: 'Turma' },
    ],
    async fetchData(params: ExportFetchParams) {
      const { data } = await supabase
        .from('frequencias')
        .select('*, alunos!inner(nome_completo), turmas!inner(nome)')
        .eq('tenant_id', params.tenantId)
        .order('data_aula', { ascending: false })
        .limit(5000)
        .returns<Record<string, unknown>[]>()

      if (!data) return []

      return data.map((row: Record<string, unknown>) => ({
        aluno: (row.alunos as Record<string, unknown> | null)?.nome_completo || '',
        data_aula: row.data_aula || '',
        status: statusLabels[String(row.status || '')] || row.status || '',
        turma: (row.turmas as Record<string, unknown> | null)?.nome || '',
      }))
    },
  })
}
