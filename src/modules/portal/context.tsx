import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useResponsavel, useVinculosAtivos } from './hooks'

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

  // Auto-selecionar se só tem 1 aluno
  useEffect(() => {
    if (vinculos && vinculos.length > 0 && !alunoSelecionado) {
      const primeiro = vinculos[0]
      if (primeiro.aluno) {
        setAlunoSelecionado(primeiro.aluno)
        setTenantId(primeiro.aluno.tenant_id)
      }
    }
  }, [vinculos, alunoSelecionado])

  const selecionarAluno = (vinculo: any) => {
    if (vinculo.aluno) {
      setAlunoSelecionado(vinculo.aluno)
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
