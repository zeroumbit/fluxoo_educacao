import { createHash } from 'crypto';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const updatesDir = join(process.cwd(), 'database', 'updates');
const outputPath = join(process.cwd(), 'database', 'fix', 'baseline_migrations_from_local_files.sql');

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const files = readdirSync(updatesDir)
  .filter((file) => file.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b, 'en'));

const values = files.map((file) => {
  const content = readFileSync(join(updatesDir, file), 'utf8');
  const checksum = createHash('sha256').update(content).digest('hex');
  return `  (${sqlString(file)}, now(), ${sqlString('Baseline reconciled after production preflight. SQL content was not re-executed.')}, ${sqlString(checksum)}, NULL)`;
});

const sql = `-- ============================================================================
-- BASELINE: registrar migrations locais como reconciliadas em producao
--
-- IMPORTANTE:
--   - Este script NAO executa o conteudo das migrations antigas.
--   - Ele apenas registra os arquivos de database/updates em public.migrations.
--   - Use somente depois do preflight estrutural/RLS retornar limpo.
-- ============================================================================

BEGIN;

INSERT INTO public.migrations (name, applied_at, description, checksum, applied_by)
VALUES
${values.join(',\n')}
ON CONFLICT (name) DO UPDATE
SET
  checksum = EXCLUDED.checksum,
  description = EXCLUDED.description,
  applied_by = EXCLUDED.applied_by;

COMMIT;

SELECT
  COUNT(*) AS registered_migrations
FROM public.migrations;
`;

writeFileSync(outputPath, sql);
console.log(`Generated ${outputPath} with ${files.length} migrations.`);
