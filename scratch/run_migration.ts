import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Step 1: Diagnosticar — quantas notificações PIX existem no banco (bypass RLS via RPC)
  // Primeiro vamos logar como um gestor para ter permissão RLS
  console.log('=== DIAGNÓSTICO ===')
  
  // Sem autenticação, vamos verificar se a tabela é acessível
  const { data: allNotifs, error: errAll } = await supabase
    .from('notificacoes')
    .select('id, tipo, metadata, resolvida, lida, tenant_id')
    .eq('tipo', 'PAGAMENTO_PIX_MANUAL')
    .limit(20)

  if (errAll) {
    console.error('Erro ao buscar notificações (provavelmente RLS):', errAll.message)
    console.log('')
    console.log('RLS está bloqueando. Precisamos executar o SQL diretamente no Supabase Dashboard.')
    console.log('Copie e cole o conteúdo do arquivo database/updates/188_fix_pix_notifications.sql')
    console.log('no SQL Editor do Supabase Dashboard: https://supabase.com/dashboard/project/phuyqtdpedfigbfsevte/sql/new')
    return
  }

  console.log(`Encontradas ${allNotifs?.length || 0} notificações PIX MANUAL`)
  
  if (allNotifs && allNotifs.length > 0) {
    for (const n of allNotifs) {
      const meta = n.metadata as any
      console.log(`  ID: ${n.id}`)
      console.log(`    resolvida: ${n.resolvida}, lida: ${n.lida}`)
      console.log(`    responsavel_nome: ${meta?.responsavel_nome || '❌ VAZIO'}`)
      console.log(`    aluno_nome: ${meta?.aluno_nome || '❌ VAZIO'}`)
      console.log(`    valor_total: ${meta?.valor_total || '❌ VAZIO'}`)
      console.log(`    tipo_cobranca: ${meta?.tipo_cobranca || '❌ VAZIO'}`)
      console.log(`    cobranca_ids: ${JSON.stringify(meta?.cobranca_ids || [])}`)
      console.log('')
    }

    // Step 2: Para cada notificação com metadata incompleta, corrigir via JS
    const toFix = allNotifs.filter(n => {
      const meta = n.metadata as any
      return !meta?.responsavel_nome || !meta?.aluno_nome || !meta?.valor_total
    })
    
    console.log(`\n=== CORREÇÃO: ${toFix.length} notificações para corrigir ===`)
    
    for (const n of toFix) {
      const meta = n.metadata as any
      const cobrancaIds = meta?.cobranca_ids || []
      
      if (!cobrancaIds || cobrancaIds.length === 0) {
        console.log(`  Notificação ${n.id}: sem cobranca_ids, pulando.`)
        continue
      }

      // Buscar dados das cobranças
      const { data: cobData, error: cobError } = await supabase
        .from('cobrancas')
        .select(`
          id, valor, descricao, tipo_cobranca, aluno_id, tenant_id,
          alunos:aluno_id (
            nome_completo,
            matriculas (
              status,
              turma:turma_id (nome)
            )
          )
        `)
        .in('id', cobrancaIds)

      if (cobError || !cobData || cobData.length === 0) {
        console.error(`  Erro ao buscar cobranças de ${n.id}:`, cobError?.message)
        continue
      }

      const totalValor = cobData.reduce((acc, c) => acc + Number(c.valor || 0), 0)

      const alunosTurmasInfo = cobData.map(c => {
        const aluno = c.alunos as any
        const matriculaAtiva = aluno?.matriculas?.find((m: any) => m.status === 'ativa')
        return {
          nome: aluno?.nome_completo || '',
          turma: matriculaAtiva?.turma?.nome || 'Sem Turma'
        }
      })

      const alunosNomes = [...new Set(alunosTurmasInfo.map(a => a.nome).filter(Boolean))].join(', ')
      const turmasNomes = [...new Set(alunosTurmasInfo.map(a => a.turma))].join(', ')
      const meses = [...new Set(cobData.map(c => c.descricao).filter(Boolean))].join('; ')
      const tipos = [...new Set(cobData.map(c => c.tipo_cobranca).filter(Boolean))]
        .map(t => t === 'mensalidade' ? 'Mensalidade' : t === 'matricula' ? 'Matrícula' : t)
        .join(', ') || 'Mensalidade'

      // Buscar nome do responsável
      let responsavelNome = meta?.responsavel_nome || ''
      if (!responsavelNome && meta?.responsavel_id) {
        const { data: respData } = await supabase
          .from('responsaveis')
          .select('nome')
          .eq('id', meta.responsavel_id)
          .maybeSingle()
        responsavelNome = respData?.nome || ''
      }
      if (!responsavelNome && cobData[0]?.aluno_id) {
        const { data: arData } = await supabase
          .from('aluno_responsavel')
          .select('responsaveis(nome)')
          .eq('aluno_id', cobData[0].aluno_id)
          .limit(1)
          .maybeSingle()
        responsavelNome = (arData as any)?.responsaveis?.nome || 'Responsável'
      }

      const newMetadata = {
        ...meta,
        responsavel_nome: responsavelNome || 'Responsável',
        aluno_nome: alunosNomes || meta?.aluno_nome || '',
        turma_nome: turmasNomes || meta?.turma_nome || '',
        valor_total: totalValor || meta?.valor_total || 0,
        meses_referencia: meses || meta?.meses_referencia || '',
        tipo_cobranca: tipos || meta?.tipo_cobranca || 'Mensalidade'
      }

      const { error: updateError } = await supabase
        .from('notificacoes')
        .update({ metadata: newMetadata })
        .eq('id', n.id)

      if (updateError) {
        console.error(`  ❌ Erro ao atualizar ${n.id}:`, updateError.message)
      } else {
        console.log(`  ✅ Atualizado ${n.id}: ${responsavelNome} → ${alunosNomes} → R$ ${totalValor}`)
      }
    }
  }

  // Step 3: Instruções para o trigger (precisa ser via SQL Editor)
  console.log('\n=== TRIGGER AUTO-RESOLUÇÃO ===')
  console.log('O trigger precisa ser criado via SQL Editor do Supabase.')
  console.log('Copie a PARTE 2 do arquivo: database/updates/188_fix_pix_notifications.sql')
  console.log(`URL: https://supabase.com/dashboard/project/phuyqtdpedfigbfsevte/sql/new`)
}

main().catch(console.error)
