import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useResponsavel, useVinculosAtivos } from './hooks'
import { supabase } from '@/lib/supabase'

interface AlunoVinculado {
  id: string
  nome_completo: string
  nome_social: string | null
  data_nascimento: string
  status: string
  tenant_id: string
  filial_id: string | null
  turma_id: string | null
  turma: { id: string; nome: string; turno: string } | null
  filial: { nome_unidade: string } | null
}

interface PortalContextType {
  responsavel: any | null
  alunoSelecionado: AlunoVinculado | null
  tenantId: string | null
  vinculos: any[]
  selecionarAluno: (vinculo: any) => void
  isMultiAluno: boolean
  isLoading: boolean
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export function PortalProvider({ children }: { children: ReactNode }) {
  const { data: responsavel, isLoading: loadingResp } = useResponsavel()
  const { data: vinculos, isLoading: loadingVinculos } = useVinculosAtivos()
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoVinculado | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Auto-selecionar se só tem 1 aluno e carregar dados da turma
  useEffect(() => {
    async function carregarDadosCompletos(vinculo: any) {
      if (!vinculo?.aluno) return

      // Tentar pegar matrícula ativa
      const { data: matricula } = await (supabase.from('matriculas' as any) as any)
         .select('turno, serie_ano, ano_letivo')
         .eq('aluno_id', vinculo.aluno.id)
         .eq('status', 'ativa')
         .maybeSingle()
      
      // Buscar turma que contém o aluno
      const { data: turma } = await supabase
        .from('turmas')
        .select('id, nome, turno')
        .eq('tenant_id', vinculo.aluno.tenant_id)
        .contains('alunos_ids', [vinculo.aluno.id])
        .maybeSingle()

      setAlunoSelecionado({
        ...vinculo.aluno,
        turma: turma || (matricula ? { id: '', nome: matricula.serie_ano, turno: matricula.turno } : null)
      })
      setTenantId(vinculo.aluno.tenant_id)
    }

    if (vinculos && vinculos.length > 0 && !alunoSelecionado) {
      carregarDadosCompletos(vinculos[0])
    }
  }, [vinculos, alunoSelecionado])

  const selecionarAluno = async (vinculo: any) => {
    if (vinculo.aluno) {
      const { data: matricula } = await (supabase.from('matriculas' as any) as any)
         .select('turno, serie_ano, ano_letivo')
         .eq('aluno_id', vinculo.aluno.id)
         .eq('status', 'ativa')
         .maybeSingle()
      
      const { data: turma } = await supabase
        .from('turmas')
        .select('id, nome, turno')
        .eq('tenant_id', vinculo.aluno.tenant_id)
        .contains('alunos_ids', [vinculo.aluno.id])
        .maybeSingle()

      setAlunoSelecionado({
        ...vinculo.aluno,
        turma: turma || (matricula ? { id: '', nome: matricula.serie_ano, turno: matricula.turno } : null)
      })
      setTenantId(vinculo.aluno.tenant_id)
    }
  }

  const isMultiAluno = (vinculos?.length || 0) > 1

  return (
    <PortalContext.Provider
      value={{
        responsavel: responsavel || null,
        alunoSelecionado,
        tenantId,
        vinculos: vinculos || [],
        selecionarAluno,
        isMultiAluno,
        isLoading: loadingResp || loadingVinculos,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}

export function usePortalContext() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortalContext deve ser usado dentro de PortalProvider')
  }
  return context
}
