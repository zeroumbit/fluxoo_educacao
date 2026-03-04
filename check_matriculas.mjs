import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: m } = await supabase.from('matriculas').select('id, aluno_id, serie_ano, status, ano_letivo')
  console.log(JSON.stringify(m, null, 2))
}

run()
