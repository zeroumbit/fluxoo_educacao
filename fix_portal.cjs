const fs = require('fs');
const file = 'src/modules/portal/hooks.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/queryKey: \['portal', 'dashboard', alunoSelecionado\?\.id, tenantId, turmaId\]/g, 
                          'queryKey: QueryKeys.PORTAL.DASHBOARD(alunoSelecionado?.id as string, tenantId, turmaId)');

content = content.replace(/queryKey: \['portal', 'dashboard', aId, tId, turmaId\]/g, 
                          'queryKey: QueryKeys.PORTAL.DASHBOARD(aId, tId, turmaId)');

content = content.replace(/queryKey: \['portal', 'frequencia', alunoSelecionado\?\.id, tenantId, mes\]/g, 
                          'queryKey: QueryKeys.PORTAL.FREQUENCIA(alunoSelecionado?.id as string, tenantId, mes)');

content = content.replace(/queryKey: \['portal', 'boletins', alunoSelecionado\?\.id, tenantId\]/g, 
                          'queryKey: QueryKeys.PORTAL.BOLETINS(alunoSelecionado?.id as string, tenantId)');

if (!content.includes('import { QueryKeys }')) {
  content = 'import { QueryKeys } from \"@/lib/query-keys\"\n' + content;
}

fs.writeFileSync(file, content);
console.log('Fixed hooks.ts');
