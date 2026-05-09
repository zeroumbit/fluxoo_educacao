import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data: notificacoes, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('tipo', 'PAGAMENTO_PIX_MANUAL')
    .eq('resolvida', false)

  console.log(`Found ${notificacoes?.length} un-resolved PIX notifications.`)
  for (const n of notificacoes || []) {
    console.log(`ID: ${n.id}`)
    console.log(`Metadata: ${JSON.stringify(n.metadata, null, 2)}`)
  }
}

main().catch(console.error)
