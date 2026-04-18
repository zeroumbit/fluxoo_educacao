import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const welcomeService = {
  /**
   * Dispara o informativo de boas-vindas e transparência financeira
   * @param matriculaId ID da matrícula concluída
   */
  async sendWelcomeRelease(matriculaId: string) {
    // 1. Busca dados completos da matrícula
    const { data: matricula, error: mError } = await supabase
      .from('matriculas')
      .select(`
        *,
        aluno:alunos(
          id, 
          nome_completo, 
          tenant_id,
          responsaveis:aluno_responsavel(
            is_financeiro,
            responsavel:responsaveis(id, nome)
          )
        ),
        turma:turmas(id, nome, valor_mensalidade)
      `)
      .eq('id', matriculaId)
      .single()

    if (mError || !matricula) {
      console.error('Erro ao buscar dados da matrícula para Welcome Release:', mError)
      throw new Error('Matrícula não encontrada.')
    }

    const aluno = matricula.aluno as any
    const responsaveisFinanceiros = aluno.responsaveis
      ?.filter((r: any) => r.is_financeiro)
      .map((r: any) => r.responsavel) || []

    if (responsaveisFinanceiros.length === 0) {
      console.warn('Nenhum responsável financeiro encontrado para esta matrícula:', matriculaId)
      return
    }

    // 2. Lógica Financeira (Pro-Rata)
    const valorMensalidadeIntegral = (matricula.turma as any)?.valor_mensalidade || matricula.valor_matricula || 0
    const dataMatricula = new Date(matricula.data_matricula + 'T12:00:00')
    
    // Dias no mês atual
    const ultimoDiaMesDate = new Date(dataMatricula.getFullYear(), dataMatricula.getMonth() + 1, 0)
    const ultimoDiaMes = ultimoDiaMesDate.getDate()
    
    // Dias restantes (incluindo o dia da matrícula)
    const diaInicio = dataMatricula.getDate()
    const diasRestantes = ultimoDiaMes - diaInicio + 1
    
    const valorProporcional = (valorMensalidadeIntegral / ultimoDiaMes) * diasRestantes
    const periodoProRata = `de ${format(dataMatricula, 'dd/MM/yyyy')} até ${format(ultimoDiaMesDate, 'dd/MM/yyyy')}`

    // 3. Persistência para cada responsável financeiro
    const notificacoes = responsaveisFinanceiros.map((resp: any) => ({
      tenant_id: matricula.tenant_id,
      responsavel_id: resp.id,
      aluno_id: aluno.id,
      matricula_id: matricula.id,
      tipo: 'WELCOME_RELEASE',
      titulo: '🎉 Bem-vindo ao Fluxoo EDU!',
      conteudo_json: {
        nome_responsavel: resp.nome,
        nome_aluno: aluno.nome_completo,
        valor_matricula: matricula.valor_matricula,
        dias_proporcionais: diasRestantes,
        valor_proporcional: Number(valorProporcional.toFixed(2)),
        periodo_pro_rata: periodoProRata,
        valor_mensalidade_integral: valorMensalidadeIntegral,
      },
      lida: false
    }))

    const { error: nError } = await (supabase.from('notificacoes_familia' as any) as any)
      .insert(notificacoes)

    if (nError) {
      console.error('Erro ao salvar notificações de boas-vindas:', nError)
      throw nError
    }

    return { success: true, count: notificacoes.length }
  }
}
