import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkStudents() {
  const { data, error } = await supabase
    .from('alunos')
    .select('id, nome_completo, status')
    .limit(5)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Students:', JSON.stringify(data, null, 2))
  }
}

checkStudents()
