const fs = require('fs');
const files = [
  'src/modules/academico/hooks.ts',
  'src/modules/alunos/hooks.ts',
  'src/modules/comunicacao/hooks.ts',
  'src/modules/filiais/hooks.ts',
  'src/modules/financeiro/hooks.ts',
  'src/modules/frequencia/hooks.ts',
  'src/modules/funcionarios/hooks.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  if (content.includes('QueryKeys.DASHBOARD') && !content.includes('import { QueryKeys }')) {
    content = 'import { QueryKeys } from \"@/lib/query-keys\"\n' + content;
    fs.writeFileSync(f, content);
  }
});
