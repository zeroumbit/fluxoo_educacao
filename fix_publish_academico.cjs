const fs = require('fs');
const file = 'src/modules/academico/hooks.ts';
let content = fs.readFileSync(file, 'utf-8');

// Replace standard qc.invalidateQueries with publish for Matricula
content = content.replace(
  /onSuccess:\s*\(\)\s*=>\s*\{([\s\S]*?qc\.invalidateQueries\(\{ queryKey: \['matriculas'\] \})/,
  "onSuccess: (data: any, variables: any) => {\n      if (data) cacheEvents.publish('MATRICULA_CRIADA', { matriculaId: data.id, tenantId: data.tenant_id, turmaId: data.turma_id, alunoId: data.aluno_id });"
);

fs.writeFileSync(file, content);
