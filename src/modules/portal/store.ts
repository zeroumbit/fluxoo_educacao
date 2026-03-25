import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AlunoVinculado {
  id: string
  nome_completo: string
  nome_social: string | null
  data_nascimento: string
  status: string
  tenant_id: string
  filial_id: string | null
  turma_id: string | null
  foto_url: string | null
  turma: { id: string; nome: string; turno: string; horario?: string | null; valor_mensalidade?: number | null } | null
  filial: { nome_unidade: string } | null
  valor_matricula: number | null
}

interface PortalState {
  alunoSelecionado: AlunoVinculado | null
  setAlunoSelecionado: (aluno: AlunoVinculado | null) => void
  clearStore: () => void
  ultimaRefreshedAt: number | null
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set: any) => ({
      alunoSelecionado: null as null | AlunoVinculado,
      ultimaRefreshedAt: null as null | number,
      setAlunoSelecionado: (aluno: AlunoVinculado | null) => set({ 
        alunoSelecionado: aluno, 
        ultimaRefreshedAt: Date.now() 
      }),
      clearStore: () => set({ alunoSelecionado: null, ultimaRefreshedAt: null }),
    }),
    {
      name: 'fluxoo-portal-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
