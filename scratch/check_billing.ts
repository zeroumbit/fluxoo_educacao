import { createClient } from '@supabase/supabase-client'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY // Or Service Role if I had it

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkSchool() {
  console.log('--- Verificando Escola ---')
  const { data: escolas, error } = await supabase
    .from('escolas')
    .select('id, razao_social, email_gestor, status_assinatura')
    .eq('email_gestor', 'fluxoosoftware@gmail.com')
  
  if (error) {
    console.error('Erro ao buscar escola:', error)
    return
  }
  
  console.log('Escolas encontradas:', JSON.stringify(escolas, null, 2))

  if (escolas && escolas.length > 0) {
    const tenantId = escolas[0].id
    console.log(`--- Verificando Faturas para Tenant: ${tenantId} ---`)
    const { data: faturas, error: faturasError } = await supabase
      .from('faturas')
      .select('*')
      .eq('tenant_id', tenantId)
    
    if (faturasError) {
      console.error('Erro ao buscar faturas:', faturasError)
    } else {
      console.log('Faturas encontradas:', JSON.stringify(faturas, null, 2))
    }

    console.log(`--- Verificando Assinatura para Tenant: ${tenantId} ---`)
    const { data: assinaturas, error: assinaturasError } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('tenant_id', tenantId)
    
    if (assinaturasError) {
      console.error('Erro ao buscar assinatura:', assinaturasError)
    } else {
      console.log('Assinaturas encontradas:', JSON.stringify(assinaturas, null, 2))
    }
  }
}

checkSchool()
