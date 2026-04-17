import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AlunoVinculado } from '@/types/shared'

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
