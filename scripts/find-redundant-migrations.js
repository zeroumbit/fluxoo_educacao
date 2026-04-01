/**
 * Script para identificar migrations redundantes ou que podem ser deletadas
 * 
 * Critérios de análise:
 * 1. Migrations de rollback/rollback (ex: 073_rollback)
 * 2. Migrations de correção que foram substituídas (ex: 007, 022, 086)
 * 3. Migrations duplicadas com mesmo propósito
 * 4. Migrations "hotfix" que foram incorporadas
 * 5. Migrations de diagnóstico (ex: 024_diagnostico)
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const updatesDir = join(process.cwd(), 'database', 'updates');

// Padrões de migrations que podem ser candidatas a remoção
const patterns = {
  rollback: /rollback/i,
  hotfix: /hotfix/i,
  diagnostico: /diagnostico|diagnóstico/i,
  correcao: /corre[çc][aã]o|correction|fix/i,
  emergencia: /emergencia|emergency|urgente/i,
  cleanup: /cleanup|limpeza/i,
  temporary: /temporary|temp|provisorio/i,
  test: /test|teste/i,
};

// Migrations que parecem ser substituídas por versões posteriores
const supersededPatterns = [
  { pattern: /fix_rls/i, description: 'Correção RLS (pode ter sido consolidada)' },
  { pattern: /gestor_acesso/i, description: 'Acesso gestor (múltiplas versões)' },
  { pattern: /portal_rls/i, description: 'RLS do portal (consolidado em versões recentes)' },
  { pattern: /rbac.*fix/i, description: 'Correção RBAC (pode ter sido unificado)' },
];

async function analyzeMigrations() {
  const files = await readdir(updatesDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

  console.log('='.repeat(80));
  console.log('🔍 ANÁLISE DE MIGRATIONS REDUNDANTES - FLUXOO EDU');
  console.log('='.repeat(80));
  console.log();

  const candidates = {
    rollback: [],
    hotfix: [],
    diagnostico: [],
    correcao: [],
    emergencia: [],
    cleanup: [],
    duplicated: [],
    superseded: [],
  };

  // Analisar cada arquivo
  sqlFiles.forEach(file => {
    const name = file.replace('.sql', '');

    // Verificar padrões
    Object.entries(patterns).forEach(([key, regex]) => {
      if (regex.test(name)) {
        candidates[key].push(file);
      }
    });

    // Verificar se foi substituído
    supersededPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(name)) {
        candidates.superseded.push({ file, description });
      }
    });
  });

  // Identificar duplicatas por número (ex: 013_*, 032_*, 041_*)
  const numberedMigrations = sqlFiles.reduce((acc, file) => {
    const match = file.match(/^(\d+)_/);
    if (match) {
      const num = match[1];
      if (!acc[num]) acc[num] = [];
      acc[num].push(file);
    }
    return acc;
  }, {});

  Object.entries(numberedMigrations).forEach(([num, files]) => {
    if (files.length > 1) {
      candidates.duplicated.push({ number: num, files });
    }
  });

  // Exibir resultados
  console.log('📊 TOTAL DE ARQUIVOS SQL:', sqlFiles.length);
  console.log();

  // Rollbacks
  if (candidates.rollback.length > 0) {
    console.log('🔄 MIGRATIONS DE ROLLBACK (podem ser removidas se não usadas):');
    console.log('-'.repeat(80));
    candidates.rollback.forEach(f => console.log(`   - ${f}`));
    console.log();
  }

  // Hotfixes
  if (candidates.hotfix.length > 0) {
    console.log('🔥 HOTFIXES (verificar se foram incorporados):');
    console.log('-'.repeat(80));
    candidates.hotfix.forEach(f => console.log(`   - ${f}`));
    console.log();
  }

  // Diagnósticos
  if (candidates.diagnostico.length > 0) {
    console.log('📋 DIAGNÓSTICOS (provavelmente seguros para remover):');
    console.log('-'.repeat(80));
    candidates.diagnostico.forEach(f => console.log(`   - ${f}`));
    console.log();
  }

  // Emergenciais
  if (candidates.emergencia.length > 0) {
    console.log('🚨 CORREÇÕES EMERGENCIAIS (verificar se consolidadas):');
    console.log('-'.repeat(80));
    candidates.emergencia.forEach(f => console.log(`   - ${f}`));
    console.log();
  }

  // Cleanup
  if (candidates.cleanup.length > 0) {
    console.log('🧹 CLEANUP (podem ser removidas após aplicação):');
    console.log('-'.repeat(80));
    candidates.cleanup.forEach(f => console.log(`   - ${f}`));
    console.log();
  }

  // Duplicadas por número
  if (candidates.duplicated.length > 0) {
    console.log('🔢 MIGRATIONS COM MESMO NÚMERO (verificar redundância):');
    console.log('-'.repeat(80));
    candidates.duplicated.forEach(({ number, files }) => {
      console.log(`   #${number}:`);
      files.forEach(f => console.log(`      - ${f}`));
    });
    console.log();
  }

  // Superseded
  if (candidates.superseded.length > 0) {
    console.log('⏸️  MIGRATIONS POSSIVELMENTE SUBSTITUÍDAS:');
    console.log('-'.repeat(80));
    const grouped = candidates.superseded.reduce((acc, { file, description }) => {
      if (!acc[description]) acc[description] = [];
      acc[description].push(file);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([desc, files]) => {
      console.log(`   ${desc}:`);
      files.forEach(f => console.log(`      - ${f}`));
    });
    console.log();
  }

  // Resumo
  console.log('='.repeat(80));
  console.log('📋 RESUMO DA ANÁLISE:');
  console.log('='.repeat(80));
  console.log(`   Rollbacks: ${candidates.rollback.length}`);
  console.log(`   Hotfixes: ${candidates.hotfix.length}`);
  console.log(`   Diagnósticos: ${candidates.diagnostico.length}`);
  console.log(`   Emergenciais: ${candidates.emergencia.length}`);
  console.log(`   Cleanup: ${candidates.cleanup.length}`);
  console.log(`   Duplicadas (número): ${candidates.duplicated.length} grupos`);
  console.log(`   Possivelmente substituídas: ${candidates.superseded.length}`);
  console.log();

  // Recomendações
  console.log('💡 RECOMENDAÇÕES:');
  console.log('-'.repeat(80));
  console.log('1. ANTES DE DELETAR: Verifique no Supabase se as mudanças foram aplicadas');
  console.log('2. Crie a tabela de controle de migrations para rastreamento futuro');
  console.log('3. Migrations de diagnóstico e rollback são seguros para remover');
  console.log('4. Para correções múltiplas, mantenha apenas a última versão aplicada');
  console.log('5. Documente quais migrations foram consolidadas em um arquivo README');
  console.log();

  // Gerar lista de candidatos seguros
  const safeToDelete = [
    ...candidates.diagnostico,
    ...candidates.rollback.filter(f => !candidates.diagnostico.includes(f)),
  ];

  if (safeToDelete.length > 0) {
    console.log('🗑️  CANDIDATOS SEGUROS PARA DELETAR (após verificação):');
    console.log('-'.repeat(80));
    safeToDelete.forEach(f => console.log(`   - ${f}`));
    console.log();
  }
}

analyzeMigrations().catch(console.error);
