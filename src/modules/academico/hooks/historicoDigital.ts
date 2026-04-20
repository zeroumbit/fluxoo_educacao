import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/AuthContext'
import { 
  emitirHistoricoOficial, 
  listarHistoricosAluno,
  buscarHistoricoPorHash,
  type EmitirHistoricoResult 
} from '../services/historicoDigitalService'

export function useEmitirHistorico() {
  const { authUser } = useAuth()
  const qc = useQueryClient()
  
  return useMutation({
    mutationFn: async ({
      alunoId,
      tenantId,
      transferenciaId,
      incluirDadosSaude = false
    }: {
      alunoId: string
      tenantId: string
      transferenciaId?: string | null
      incluirDadosSaude?: boolean
    }): Promise<EmitirHistoricoResult> => {
      return await emitirHistoricoOficial(
        alunoId,
        tenantId,
        transferenciaId || null,
        incluirDadosSaude,
        authUser?.user.id
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['historicos_aluno'] })
    }
  })
}

export function useListarHistoricosAluno(alunoId: string, tenantId: string) {
  return useQuery({
    queryKey: ['historicos_aluno', alunoId, tenantId],
    queryFn: () => listarHistoricosAluno(alunoId, tenantId),
    enabled: !!alunoId && !!tenantId
  })
}

export function useBuscarHistoricoPorHash(hash: string, tenantId: string) {
  return useQuery({
    queryKey: ['historico_hash', hash, tenantId],
    queryFn: () => buscarHistoricoPorHash(hash, tenantId),
    enabled: !!hash && !!tenantId
  })
}