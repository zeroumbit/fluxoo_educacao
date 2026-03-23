import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://phuyqtdpedfigbfsevte.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '' // Need service role to bypass RLS and see everything

if (!supabaseKey) {
  console.error('Service role key not found in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigate() {
  const cnpj = '36.991.323/0001-31'
  const email = 'fluxoosoftware@gmail.com'

  console.log(`Searching for CNPJ: ${cnpj} and Email: ${email}...`)

  const results: any = {}

  // Check escolas
  const { data: escolas } = await supabase.from('escolas').select('*').or(`cnpj.eq."${cnpj}",email_gestor.eq."${email}"`)
  results.escolas = escolas

  // Check assinaturas
  if (escolas && escolas.length > 0) {
    const ids = escolas.map(e => e.id)
    const { data: assinaturas } = await supabase.from('assinaturas').select('*').in('tenant_id', ids)
    results.assinaturas = assinaturas
  }

  // Check faturas
  if (escolas && escolas.length > 0) {
    const ids = escolas.map(e => e.id)
    const { data: faturas } = await supabase.from('faturas').select('*').in('tenant_id', ids)
    results.faturas = faturas
  }

  // Check filiais
  if (escolas && escolas.length > 0) {
    const ids = escolas.map(e => e.id)
    const { data: filiais } = await supabase.from('filiais').select('*').in('tenant_id', ids)
    results.filiais = filiais
  }

  console.log('Search Results:', JSON.stringify(results, null, 2))
}

investigate()
