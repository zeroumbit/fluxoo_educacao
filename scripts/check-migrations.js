import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente
function loadLocalEnv() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_API_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env local para validar migrations com segurança.');
  console.error('Nunca versione SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function getAppliedMigrations() {
  console.log('🔍 Consultando migrations aplicadas no banco de dados...\n');
  
  // Tenta consultar a tabela de migrations (padrão do Supabase)
  const { data, error } = await supabase
    .from('migrations')
    .select('name, applied_at')
    .order('applied_at', { ascending: true });

  if (error) {
    console.log('⚠️  Tabela "migrations" não encontrada ou sem acesso');
    console.log('   Erro:', error.message);
    console.log('\n💡 Dica: Execute no SQL Editor do Supabase:');
    console.log('   CREATE TABLE IF NOT EXISTS migrations (');
    console.log('     id SERIAL PRIMARY KEY,');
    console.log('     name VARCHAR(255) UNIQUE NOT NULL,');
    console.log('     applied_at TIMESTAMP DEFAULT NOW()');
    console.log('   );');
    return null;
  }

  return data || [];
}

async function getLocalMigrations() {
  const updatesDir = join(process.cwd(), 'database', 'updates');
  
  try {
    const files = await readdir(updatesDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    
    return sqlFiles.map(file => ({
      name: file,
      path: join('database', 'updates', file)
    }));
  } catch (error) {
    console.error('❌ Erro ao ler pasta database/updates:', error.message);
    return [];
  }
}

async function analyzeMigrations() {
  console.log('='.repeat(60));
  console.log('📊 ANÁLISE DE MIGRATIONS - FLUXOO EDU');
  console.log('='.repeat(60));
  console.log();

  const [appliedMigrations, localMigrations] = await Promise.all([
    getAppliedMigrations(),
    getLocalMigrations()
  ]);

  if (appliedMigrations === null) {
    console.error('\n❌ Não foi possível validar migrations no banco.');
    console.error('   Corrija a conexão/acesso ao Supabase ou crie a tabela de controle antes do deploy.\n');
    process.exit(1);
  }

  const appliedNames = new Set(appliedMigrations.map(m => m.name));
  const localNames = new Set(localMigrations.map(m => m.name));

  // Migrations aplicadas no banco
  const appliedOnly = appliedMigrations.filter(m => localNames.has(m.name));
  
  // Migrations locais que estão no banco
  const appliedAndLocal = localMigrations.filter(m => appliedNames.has(m.name));
  
  // Migrations locais NÃO aplicadas no banco
  const notApplied = localMigrations.filter(m => !appliedNames.has(m.name));
  
  // Migrations no banco mas não existem mais localmente
  const orphaned = appliedMigrations.filter(m => !localNames.has(m.name));

  console.log('📁 Migrations LOCAIS:', localMigrations.length);
  console.log('✅ Migrations APLICADAS no banco:', appliedMigrations.length);
  console.log();

  if (notApplied.length > 0) {
    console.log('⚠️  MIGRATIONS NÃO APLICADAS NO BANCO:');
    console.log('-'.repeat(60));
    notApplied.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name}`);
    });
    console.log();
  }

  if (orphaned.length > 0) {
    console.log('🗑️  MIGRATIONS ÓRFÃS (no banco, mas sem arquivo local):');
    console.log('-'.repeat(60));
    orphaned.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (aplicada em: ${m.applied_at || 'N/A'})`);
    });
    console.log();
  }

  if (appliedAndLocal.length > 0) {
    console.log('✅ MIGRATIONS APLICADAS E PRESENTES:');
    console.log('-'.repeat(60));
    appliedAndLocal.forEach((m, i) => {
      const appliedInfo = appliedMigrations.find(am => am.name === m.name);
      console.log(`   ${i + 1}. ${m.name} ${appliedInfo?.applied_at ? `(aplicada em: ${appliedInfo.applied_at})` : ''}`);
    });
    console.log();
  }

  // Resumo
  console.log('='.repeat(60));
  console.log('📋 RESUMO:');
  console.log('='.repeat(60));
  console.log(`   Total de arquivos locais: ${localMigrations.length}`);
  console.log(`   Aplicadas no banco: ${appliedAndLocal.length}`);
  console.log(`   Pendentes de aplicar: ${notApplied.length}`);
  console.log(`   Órfãs (pode deletar): ${orphaned.length}`);
  console.log();

  if (notApplied.length === 0 && orphaned.length === 0) {
    console.log('✨ Todas as migrations estão sincronizadas!');
  }

  // Sugestão de limpeza
  if (orphaned.length > 0) {
    console.log('💡 AÇÃO RECOMENDADA:');
    console.log('   As migrations órfãs podem ser deletadas com segurança:');
    orphaned.forEach(m => {
      console.log(`   - ${m.name}`);
    });
    console.log();
    console.log('   Para deletar, execute no Supabase SQL Editor:');
    const deleteStatements = orphaned.map(m => 
      `DELETE FROM migrations WHERE name = '${m.name}';`
    ).join('\n   ');
    console.log('   ' + deleteStatements);
    console.log();
  }

  if (notApplied.length > 0) {
    console.log('💡 AÇÃO RECOMENDADA:');
    console.log('   Aplique as migrations pendentes no Supabase SQL Editor');
    console.log();
  }
}

// Executar análise
analyzeMigrations().catch(console.error);
