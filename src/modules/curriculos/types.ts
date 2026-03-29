import type { Curriculo, FormacaoAcademica, ExperienciaProfissional, Certificacao } from '@/lib/database.types'

export interface CurriculoLista extends Omit<Curriculo, 'formacao' | 'experiencia' | 'certificacoes'> {
  formacao: FormacaoAcademica[]
  experiencia: ExperienciaProfissional[]
  certificacoes: Certificacao[]
  funcionarios?: {
    nome_completo: string
    funcao: string | null
  } | null
  usuarios_sistema?: {
    email_login: string
  } | null
}

export interface FiltrosCurriculo {
  areas?: string[]
  search?: string
  disponibilidadeTipo?: string[]
}

export const AREAS_INTERESSE = [
  { value: 'docencia', label: 'Docência' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'recepcao', label: 'Recepção' },
  { value: 'biblioteca', label: 'Biblioteca' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'arte', label: 'Arte' },
  { value: 'tecnologia', label: 'Tecnologia' },
] as const

export const DISPONIBILIDADE_TIPOS = [
  { value: 'tempo_integral', label: 'Tempo Integral' },
  { value: 'meio_periodo', label: 'Meio Período' },
  { value: 'substituicoes', label: 'Substituições' },
  { value: 'eventual', label: 'Eventual/Freelance' },
] as const
