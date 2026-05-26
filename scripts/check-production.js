#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const rootDir = join(import.meta.dirname, '..')
const envFiles = ['.env.local', '.env'].map((name) => join(rootDir, name))
const envPath = envFiles.find((file) => existsSync(file))
const nodeMajor = Number.parseInt(process.version.slice(1), 10)
const findings = []
const warnings = []

if (nodeMajor !== 24) {
  findings.push(`Node ${process.version} detectado; producao deve usar Node 24.x.`)
}

if (!envPath) {
  findings.push('Arquivo .env.local ou .env nao encontrado para validar configuracao.')
} else {
  const envContent = readFileSync(envPath, 'utf8')
  const requiredPublicVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

  for (const name of requiredPublicVars) {
    if (!new RegExp(`^${name}=.+`, 'm').test(envContent)) {
      findings.push(`${name} ausente.`)
    }
  }

  if (/^VITE_.*SERVICE_ROLE.*=/mi.test(envContent)) {
    findings.push('Service role key com prefixo VITE_ detectada. Isso exporia a chave no bundle.')
  }

  if (/^SUPABASE_SERVICE_ROLE_KEY=.+/m.test(envContent)) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY existe localmente. Confirme que ela nao esta versionada e rotacione se ja foi exposta.')
  }

  if (!/^VITE_SENTRY_DSN=.+/m.test(envContent)) {
    warnings.push('VITE_SENTRY_DSN ausente. Producao ficara sem captura remota de erros.')
  }
}

if (findings.length) {
  console.error('\nCheck de producao falhou:')
  for (const finding of findings) console.error(`- ${finding}`)
  if (warnings.length) {
    console.warn('\nAvisos:')
    for (const warning of warnings) console.warn(`- ${warning}`)
  }
  process.exit(1)
}

console.log('Check de producao sem bloqueios.')
if (warnings.length) {
  console.warn('\nAvisos:')
  for (const warning of warnings) console.warn(`- ${warning}`)
}
