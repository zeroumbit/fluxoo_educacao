#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = join(import.meta.dirname, '..')

console.log('Verificando ambiente de desenvolvimento...\n')

let hasErrors = false

const nodeVersion = process.version
const nodeMajor = Number.parseInt(nodeVersion.slice(1), 10)
if (nodeMajor < 18) {
  console.error(`Node.js versao ${nodeVersion} - Requerido: v18+`)
  hasErrors = true
} else {
  console.log(`Node.js: ${nodeVersion}`)
}

const envCandidates = [join(ROOT_DIR, '.env.local'), join(ROOT_DIR, '.env')]
const envPath = envCandidates.find((candidate) => existsSync(candidate))

if (!envPath) {
  console.error('Arquivo .env.local ou .env nao encontrado')
  console.log('   Crie .env.local com as variaveis locais')
  hasErrors = true
} else {
  console.log('Arquivo de ambiente: encontrado')

  const envContent = readFileSync(envPath, 'utf8')
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=`, 'm')
    if (!regex.test(envContent)) {
      console.error(`Variavel ${varName} nao definida`)
      hasErrors = true
      continue
    }

    const value = envContent.match(new RegExp(`^${varName}=(.+)$`, 'm'))?.[1]
    if (!value || value.includes('seu-') || value === 'sua-chave-anon-aqui') {
      console.warn(`${varName}: parece ser um valor padrao`)
    } else {
      console.log(`${varName}: configurada`)
    }
  }

  if (/^VITE_.*SERVICE_ROLE.*=/mi.test(envContent)) {
    console.error('Service role key nunca pode usar prefixo VITE_')
    hasErrors = true
  }
}

const nodeModulesPath = join(ROOT_DIR, 'node_modules')
if (!existsSync(nodeModulesPath)) {
  console.error('node_modules nao encontrado')
  console.log('   Execute: npm install')
  hasErrors = true
} else {
  console.log('node_modules: instalado')
}

const packagePath = join(ROOT_DIR, 'package.json')
if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
  console.log(`Projeto: ${pkg.name || 'sem nome'} v${pkg.version || '0.0.0'}`)
}

console.log(`\n${'='.repeat(50)}`)

if (hasErrors) {
  console.error('\nForam encontrados erros na configuracao do ambiente.')
  console.log('   Siga as instrucoes acima para corrigir.\n')
  process.exit(1)
}

console.log('\nAmbiente configurado corretamente!')
console.log('   Execute: npm run dev\n')
