import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: livros, error } = await supabase.from('livros').select('id, titulo, capa_url')
  if (error) {
    console.error(error)
  } else {
    console.log(JSON.stringify(livros, null, 2))
  }
}

run()
