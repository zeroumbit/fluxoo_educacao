import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Faltando credenciais. Use node --env-file=.env check_db.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('--- BUSCANDO TURMAS E ALUNOS_IDS ---')
  const { data: turmas, error: errT } = await supabase.from('turmas').select('id, nome, alunos_ids')
  console.log(errT || JSON.stringify(turmas, null, 2))

  console.log('\n--- BUSCANDO VW_LIVROS_DISPONIVEIS_ALUNO ---')
  const { data: vw, error: errVw } = await supabase.from('vw_livros_disponiveis_aluno').select('*')
  console.log(errVw || JSON.stringify(vw, null, 2))
}

run()
