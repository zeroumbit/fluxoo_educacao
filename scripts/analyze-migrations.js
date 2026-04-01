import { createClient } from '@supabase/supabase-js';
import { readdir } from 'fs/promises';
import { join } from 'path';

// Carregar variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Copie .env.example para .env e preencha com suas credenciais do Supabase');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Mapeia migrations para suas características no banco
 * Adicione mais migrations conforme necessário
 */
const migrationMap = {
  '001_add_numero_escolas.sql': { table: 'escolas', column: 'numero_escolas' },
  '002_fix_escolas_cadastro_fields.sql': { table: 'escolas', column: 'nome_fantasia' },
  '004_full_billing_schema.sql': { table: 'cobrancas' },
  '010_add_enderecos_alunos_responsaveis.sql': { table: 'enderecos' },
  '012_add_senha_hash_responsaveis.sql': { table: 'responsaveis', column: 'senha_hash' },
  '015_add_filial_id_planos_aula.sql': { table: 'planos_aula', column: 'filial_id' },
  '025_almoxarifado_rls.sql': { table: 'materiais' },
  '033_pix_qr_code_image.sql': { table: 'cobrancas', column: 'pix_qr_code_base64' },
  '034_boletim_alunos.sql': { table: 'boletins' },
  '036_add_logo_url_escolas.sql': { table: 'escolas', column: 'logo_url' },
  '042_add_categoria_contas_pagar.sql': { table: 'contas_pagar', column: 'categoria' },
  '043_add_aluno_descontos.sql': { table: 'alunos', column: 'desconto_valor' },
  '050_rbac_v2_enterprise.sql': { table: 'permissoes' },
  '056_add_data_ingresso.sql': { table: 'matriculas', column: 'data_ingresso' },
  '062_marketplace_categorias.sql': { table: 'marketplace_categorias' },
  '065_turmas_grade_academica.sql': { table: 'turmas', column: 'grade_academica_id' },
  '080_enable_rls_all_tables.sql': { check: 'rls_enabled' },
  '081_fix_responsaveis_login_cpf.sql': { table: 'responsaveis', column: 'cpf' },
  '083_materialized_view_fechamento.sql': { view: 'vw_fechamento_bimestre' },
  '091_secure_portal_login.sql': { table: 'portal_logins' },
  '114_add_tipo_empresa_planos.sql': { table: 'planos', column: 'tipo_empresa' },
  '118_add_genero_alunos.sql': { table: 'alunos', column: 'genero' },
  '120_diario_classe_boletim_v2.sql': { table: 'diario_classe' },
  '135_marketplace_enhanced.sql': { table: 'marketplace_produtos' },
  '20260320_materiais_escolares.sql': { table: 'materiais_escolares' },
  'disciplinas_seed.sql': { table: 'disciplinas' },
  'livros_migration.sql': { table: 'livros' },
};

async function checkTableExists(tableName) {
  const { data, error } = await supabase.rpc('check_table_exists', { table_name: tableName });
  if (error) {
    // Fallback: tenta consultar information_schema
    const { data: infoData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .single();
    return !!infoData;
  }
  return !!data;
}

async function checkColumnExists(tableName, columnName) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', tableName)
    .eq('table_schema', 'public')
    .eq('column_name', columnName)
    .single();
  return !!data;
}

async function checkViewExists(viewName) {
  const { data, error } = await supabase
    .from('information_schema.views')
    .select('table_name')
    .eq('table_name', viewName)
    .eq('table_schema', 'public')
    .single();
  return !!data;
}

async function getLocalMigrations() {
  const updatesDir = join(process.cwd(), 'database', 'updates');
  
  try {
    const files = await readdir(updatesDir);
    return files.filter(f => f.endsWith('.sql')).sort();
  } catch (error) {
    console.error('❌ Erro ao ler pasta database/updates:', error.message);
    return [];
  }
}

async function analyzeMigrationsSmart() {
  console.log('='.repeat(70));
  console.log('🔍 ANÁLISE INTELIGENTE DE MIGRATIONS - FLUXOO EDU');
  console.log('='.repeat(70));
  console.log();

  const localMigrations = await getLocalMigrations();
  console.log(`📁 Total de arquivos de migration encontrados: ${localMigrations.length}`);
  console.log();

  const applied = [];
  const notApplied = [];
  const unknown = [];

  console.log('🔎 Verificando migrations conhecidas...\n');

  for (const [migration, config] of Object.entries(migrationMap)) {
    if (!localMigrations.includes(migration)) {
      continue;
    }

    let isApplied = false;
    let checkInfo = '';

    if (config.table) {
      const tableExists = await checkTableExists(config.table);
      if (tableExists) {
        if (config.column) {
          isApplied = await checkColumnExists(config.table, config.column);
          checkInfo = `coluna ${config.column}`;
        } else if (config.view) {
          isApplied = await checkViewExists(config.view);
          checkInfo = `view ${config.view}`;
        } else {
          isApplied = true;
          checkInfo = `tabela ${config.table}`;
        }
      }
    }

    if (isApplied) {
      applied.push({ migration, checkInfo });
      console.log(`   ✅ ${migration} (${checkInfo})`);
    } else {
      notApplied.push({ migration, checkInfo });
      console.log(`   ⏳ ${migration} (${checkInfo}) - NÃO APLICADA`);
    }
  }

  // Verificar migrations sem mapeamento
  const knownMigrations = Object.keys(migrationMap);
  const unmapped = localMigrations.filter(m => !knownMigrations.includes(m));

  console.log();
  console.log('❓ MIGRATIONS SEM MAPEAMENTO (verificação manual necessária):');
  console.log('-'.repeat(70));
  unmapped.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m}`);
  });

  console.log();
  console.log('='.repeat(70));
  console.log('📊 RESUMO:');
  console.log('='.repeat(70));
  console.log(`   ✅ Aplicadas (detectadas): ${applied.length}`);
  console.log(`   ⏳ Não aplicadas: ${notApplied.length}`);
  console.log(`   ❓ Sem mapeamento: ${unmapped.length}`);
  console.log();

  if (notApplied.length > 0) {
    console.log('⚠️  MIGRATIONS NÃO APLICADAS:');
    notApplied.forEach(({ migration, checkInfo }) => {
      console.log(`   - ${migration} (verifica: ${checkInfo})`);
    });
    console.log();
  }

  // Gerar script de limpeza
  console.log('💡 RECOMENDAÇÕES:');
  console.log('-'.repeat(70));
  console.log('1. Crie a tabela de controle de migrations no Supabase:');
  console.log(`
   CREATE TABLE IF NOT EXISTS migrations (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) UNIQUE NOT NULL,
     applied_at TIMESTAMP DEFAULT NOW(),
     description TEXT
   );
`);

  console.log('2. Registre as migrations já aplicadas:');
  applied.forEach(({ migration }) => {
    console.log(`   INSERT INTO migrations (name) VALUES ('${migration}');`);
  });

  console.log();
  console.log('3. Para identificar migrations não utilizadas:');
  console.log('   - Migrations de correção (007, 013, 022, etc.) podem ser consolidadas');
  console.log('   - Migrations de rollback (073_rollback) podem ser removidas se não usadas');
  console.log('   - Migrations duplicadas (ex: 032_*, 041_*, 046_*, 048_*) podem ser unificadas');
  console.log();
}

analyzeMigrationsSmart().catch(console.error);
