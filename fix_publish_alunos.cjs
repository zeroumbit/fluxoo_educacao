const fs = require('fs');
const file = 'src/modules/alunos/hooks.ts';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import { cacheEvents }')) {
  content = 'import { cacheEvents } from \"@/lib/cache-events\"\n' + content;
}

content = content.replace(
  /mutationFn: \(aluno: AlunoInsert\) => alunoService\.criar\((.*?)\),\s*onSuccess: \(\) => {/g,
  "mutationFn: (aluno: AlunoInsert) => alunoService.criar(),\n    onSuccess: (data: any) => {\n      if(data) cacheEvents.publish('ALUNO_CRIADO', { alunoId: data.id, tenantId: data.tenant_id });"
);

content = content.replace(
  /mutationFn: \(\{ id, aluno \}: \{ id: string; aluno: AlunoUpdate \}\) =>\s*alunoService\.atualizar\((.*?)\),\s*onSuccess: \(_, variables\) => {/g,
  "mutationFn: ({ id, aluno }: { id: string; aluno: AlunoUpdate }) =>\n      alunoService.atualizar(),\n    onSuccess: (data: any, variables) => {\n      if(data) cacheEvents.publish('ALUNO_ATUALIZADO', { alunoId: variables.id, tenantId: data.tenant_id });"
);

fs.writeFileSync(file, content);
