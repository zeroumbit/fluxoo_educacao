import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/AuthContext'
import { toast } from 'sonner'

// ─── Tipos Fortemente Tipados ─────────────────────────────────────────────────

export interface ConfigAcademica {
  divisao_etapas: '4_bimestres' | '3_trimestres' | '2_semestres'
  media_aprovacao: number
  media_recuperacao_minima: number
  frequencia_minima_perc: number
  casas_decimais: number
  reprovacao_automatica_por_falta: boolean
}

export interface ConfigFinanceira {
  multa_atraso_perc: number
  juros_mora_mensal_perc: number
  dia_vencimento_padrao: number
  dias_carencia: number
  desconto_irmaos_perc: number
  multa_fixa: number
  pix_manual: boolean
  chave_pix: string
  nome_favorecido: string
  instrucoes_pix: string
  pix_auto: boolean
  presencial: boolean
  contrato_modelo?: string
  qtd_mensalidades_automaticas: number // Quantidade de mensalidades para gerar automaticamente
  cobrar_matricula: boolean            // Se a escola cobra taxa de matrícula
  valor_matricula_padrao: number       // Valor padrão para a matrícula (pode ser sobrescrito)
}

export interface ConfigOperacional {
  tolerancia_atraso_minutos: number
  idade_minima_saida_desacompanhada: number
  exige_foto_terceiros: boolean
  exige_documento_portaria: boolean
  validade_temp_dias: number
  push_saida: boolean
}

export interface ConfigConduta {
  limite_atrasos_penalidade: number
  notifica_pais_falta: boolean
}

export interface ConfigCalendario {
  inicio_aulas: string
  termino_aulas: string
  dias_letivos: number
  carga_horaria: number
}

export interface TenantSettings {
  id: string
  tenant_id: string
  contexto: string
  config_academica: ConfigAcademica
  config_financeira: ConfigFinanceira
  config_operacional: ConfigOperacional
  config_conduta: ConfigConduta
  config_calendario: ConfigCalendario
  vigencia_inicio: string
  vigencia_fim: string | null
  updated_at: string
}

export type UpdateTenantSettingsPayload = Partial<
  Pick<TenantSettings, 'config_academica' | 'config_financeira' | 'config_operacional' | 'config_conduta' | 'config_calendario'>
>

// ─── Valores Padrão ───────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: Omit<TenantSettings, 'id' | 'tenant_id' | 'updated_at' | 'vigencia_fim'> = {
  contexto: 'escola',
  config_academica: {
    divisao_etapas: '4_bimestres',
    media_aprovacao: 6.0,
    media_recuperacao_minima: 3.0,
    frequencia_minima_perc: 75,
    casas_decimais: 1,
    reprovacao_automatica_por_falta: true,
  },
  config_financeira: {
    multa_atraso_perc: 2.0,
    juros_mora_mensal_perc: 1.0,
    dia_vencimento_padrao: 10,
    dias_carencia: 5,
    desconto_irmaos_perc: 10,
    multa_fixa: 0,
    pix_manual: true,
    chave_pix: '',
    nome_favorecido: '',
    instrucoes_pix: '',
    pix_auto: false,
    presencial: true,
    contrato_modelo: '',
    qtd_mensalidades_automaticas: 12, // Padrão: 12 mensalidades (ano letivo completo)
    cobrar_matricula: true,           // Padrão: cobrar matrícula
    valor_matricula_padrao: 0,        // Valor padrão sugerido
  },
  config_operacional: {
    tolerancia_atraso_minutos: 15,
    idade_minima_saida_desacompanhada: 12,
    exige_foto_terceiros: true,
    exige_documento_portaria: true,
    validade_temp_dias: 30,
    push_saida: true,
  },
  config_conduta: {
    limite_atrasos_penalidade: 3,
    notifica_pais_falta: true,
  },
  config_calendario: {
    inicio_aulas: '2026-02-01',
    termino_aulas: '2026-12-15',
    dias_letivos: 200,
    carga_horaria: 800,
  },
  vigencia_inicio: new Date().toISOString().split('T')[0],
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useTenantSettings() {
  const { authUser } = useAuth()
  const queryClient = useQueryClient()
  const tenantId = authUser?.tenantId

  const query = useQuery<TenantSettings | null>({
    queryKey: ['tenant_settings', tenantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('configuracoes_escola' as any) as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('contexto', 'escola')
        .is('vigencia_fim', null)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      return (data as TenantSettings | null) ?? null
    },
    enabled: !!tenantId && tenantId !== 'super_admin',
    staleTime: 1000 * 60 * 60, // 1 hora — muda raramente
  })

  const mutation = useMutation({
    mutationFn: async (updates: UpdateTenantSettingsPayload) => {
      if (!tenantId) throw new Error('Tenant não identificado.')

      // Se já existe configuração, faz update (trigger arquiva o histórico automaticamente)
      if (query.data?.id) {
        const { error } = await (supabase.from('configuracoes_escola' as any) as any)
          .update({
            ...updates,
            updated_by: authUser?.user?.id,
          })
          .eq('id', query.data.id)

        if (error) throw error
      } else {
        // Primeiro acesso: cria a configuração com os defaults + updates
        const { error } = await (supabase.from('configuracoes_escola' as any) as any)
          .insert({
            ...DEFAULT_CONFIG,
            tenant_id: tenantId,
            ...updates,
            updated_by: authUser?.user?.id,
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_settings', tenantId] })
      toast.success('Configurações salvas!', {
        description: 'Histórico arquivado automaticamente no banco.',
      })
    },
    onError: (err: any) => {
      // Exibe erros do banco (ex: violação legal da trigger) de forma amigável
      const msg = err?.message || 'Erro ao salvar configurações.'
      toast.error('Erro de conformidade', { description: msg })
    },
  })

  // Retorna os dados reais ou os defaults se ainda não configurou
  const config: TenantSettings = {
    ...(DEFAULT_CONFIG as any),
    ...(query.data || {}),
  }

  return {
    config,
    rawData: query.data,
    isLoading: query.isLoading,
    updateConfig: mutation.mutate,
    isSaving: mutation.isPending,
  }
}

// ─── Hook de Histórico ────────────────────────────────────────────────────────

export function useTenantSettingsHistory() {
  const { authUser } = useAuth()

  return useQuery({
    queryKey: ['tenant_settings_history', authUser?.tenantId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('configuracoes_escola_historico' as any) as any)
        .select('*')
        .eq('tenant_id', authUser!.tenantId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data as any[]) || []
    },
    enabled: !!authUser?.tenantId && authUser.tenantId !== 'super_admin',
    staleTime: 1000 * 60 * 5,
  })
}
