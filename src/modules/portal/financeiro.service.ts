import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { getConfiguracoesFinanceiras } from '@/modules/configuracoes/service'

export const portalFinanceiroService = {
  /**
   * Obtém faturas do aluno com auto-reparo condicional.
   * Garante que todas as mensalidades até dezembro existam conforme a regra de matrícula.
   */
  async obterFaturasDoAluno(alunoId: string, tenantId: string, anoLetivo: number = new Date().getFullYear()) {
    try {
      // 1. Busca informações do aluno e sua matrícula ativa para o ano
      const { data: aluno, error: alunoError } = await (supabase.from('alunos' as any) as any)
        .select(`
          id, 
          data_ingresso, 
          matriculas!inner(data_matricula, ano_letivo, status)
        `)
        .eq('id', alunoId)
        .eq('tenant_id', tenantId)
        .eq('matriculas.ano_letivo', anoLetivo)
        .eq('matriculas.status', 'ativa')
        .maybeSingle()

      if (alunoError) {
        logger.error('[portalFinanceiroService] Erro ao buscar aluno/matricula:', alunoError)
      }

      // Se não tem matrícula ativa ou erro ao buscar, apenas retornamos o que existir no banco sem reparar
      if (!aluno || !aluno.matriculas?.[0]) {
        return this.buscarCobrancasBase(alunoId, tenantId, anoLetivo)
      }

      const matricula = aluno.matriculas[0] as any
      const dataInicioStr = aluno.data_ingresso || matricula.data_matricula
      
      // 2. Calcula total esperado (Mês de início até Dezembro)
      const partes = dataInicioStr.split('-')
      const anoInicio = parseInt(partes[0], 10)
      
      // Determina o mês de início do cálculo para este ano letivo
      let mesInicioCalculo = 1
      if (anoInicio === anoLetivo) {
        mesInicioCalculo = parseInt(partes[1], 10) // Mês da matrícula
      } else if (anoInicio > anoLetivo) {
        // Matrícula futura (ex: aluno matriculado em 2027), não gera cobranças para 2026
        return this.buscarCobrancasBase(alunoId, tenantId, anoLetivo)
      }

      const totalEsperado = 12 - mesInicioCalculo + 1

        // 3. Verificação Leve (Count)
        const { count, error: countError } = await supabase
          .from('cobrancas')
          .select('id', { count: 'exact', head: true })
          .eq('aluno_id', alunoId)
          .eq('tenant_id', tenantId)
          .eq('ano_letivo', anoLetivo)
          .eq('tipo_cobranca', 'mensalidade')
          .neq('status', 'cancelado')

        if (countError) throw countError

        // 4. O portal do responsável não cria/repara cobranças.
        // Reparos financeiros devem rodar por rotina/admin com permissão explícita.
        if (count !== null && count < totalEsperado) {
          logger.warn('[portalFinanceiroService] Mensalidades incompletas detectadas no portal. Reparo deve ser executado por rotina/admin.', {
            alunoId,
            tenantId,
            anoLetivo,
            esperado: totalEsperado,
            atual: count,
          })
        }


      // 5. Retorno dos Dados Ordenados
      return this.buscarCobrancasBase(alunoId, tenantId, anoLetivo)
    } catch (error) {
      logger.error('[portalFinanceiroService] Erro ao obter faturas:', error)
      throw error
    }
  },

  /**
   * Busca as cobranças base no banco
   */
  async buscarCobrancasBase(alunoId: string, tenantId: string, anoLetivo: number) {
    // 1. Busca configuração centralizada para encargos
    const config = await getConfiguracoesFinanceiras(tenantId);
    const usarViewEncargos = config?.multa_juros_habilitado !== false;
    const target = usarViewEncargos ? 'vw_cobrancas_com_encargos' : 'cobrancas';

    // 2. Busca faturas
    const { data, error } = await supabase
      .from(target as any)
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelado')
      .order('data_vencimento', { ascending: true })

    if (error) throw error
    
    // 3. Normalização de Status (vencida -> atrasada)
    const res = (data as any[]) || []
    const diasCarencia = config?.dias_carencia || 0
    const hoje = new Date()
    hoje.setHours(23, 59, 59, 999)

    return res.map((c: any) => {
      if (c.status === 'pago' || c.status === 'cancelado') return c

      const dataVenc = new Date(c.data_vencimento + 'T12:00:00')
      const diasAtraso = Math.floor((hoje.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24))

      if (diasAtraso > diasCarencia) {
        return { ...c, status: 'atrasado' }
      } else if (diasAtraso <= 0) {
        return { ...c, status: 'a_vencer' }
      }
      return c
    })
  }
}
