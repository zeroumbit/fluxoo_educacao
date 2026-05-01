const fs = require('fs');
const file = './src/modules/alunos/service.ts';
let content = fs.readFileSync(file, 'utf8');

let lines = content.split('\n');

// Part 1: from // 1. Verificar se responsável to let respData:
let start1 = lines.findIndex(l => l.includes('// 1. Verificar se responsável já existe'));
let end1 = lines.findIndex(l => l.includes('let respData: { id: string; cpf: string; user_id?: string | null } | null = null'));

if (start1 !== -1 && end1 !== -1) {
    let newChunk1 = [
        '    // 1. Verificar se responsável já existe pelo CPF (sempre buscar pelo limpo)',
        '    const { data: respExistente, error: respCheckError } = await supabase',
        '      .from(\'responsaveis\')',
        '      .select(\'id, cpf, user_id, email\')',
        '      .or(cpf.eq.\,cpf.eq.\)',
        '      .maybeSingle()',
        '',
        '    if (respCheckError) throw respCheckError',
        ''
    ].join('\n');
    lines.splice(start1, end1 - start1, newChunk1);
}

content = lines.join('\n');
lines = content.split('\n');

let start2 = lines.findIndex(l => l.includes('// 4. Criar novo responsável'));
if (start2 !== -1) {
   // find the else block before it
   start2 = start2 - 1;
}
let end2 = lines.findIndex(l => l.includes('// 3. Criar aluno'));

if (start2 !== -1 && end2 !== -1) {
    let newChunk2 = [
        '    } else {',
        '      // 4. Criar novo responsável',
        '      const insertPayload = {',
        '        ...responsavel,',
        '        cpf: cpfLimpo, // Garante CPF limpo no banco',
        '        user_id: authUserId',
        '      }',
        '',
        '      // Remove senha_hash do payload se veio como campo virtual (não é coluna real no insert direto)',
        '      const cleanPayload = { ...insertPayload }',
        '      delete (cleanPayload as any).senha // Remove campo virtual se existir',
        '',
        '      const { data: novaResp, error: respError } = await supabase.from(\'responsaveis\')',
        '        .insert(cleanPayload)',
        '        .select(\'id, cpf, user_id\')',
        '        .single()',
        '',
        '      if (respError) {',
        '        // Tratamento específico para erro de RLS (42501)',
        '        if (respError) {',
        '          logger.error(\'? Erro RLS ao inserir responsável. Payload: \', { ',
        '            ...cleanPayload, ',
        '            senha_hash: \'[REDACTED]\',',
        '            errorCode: (respError as any).code,',
        '            errorMessage: respError.message ',
        '          })',
        '',
        '          // Se for erro 42501 (Forbidden)',
        '          if ((respError as any).code === \'42501\') {',
        '            console.error(\'?? BLOQUEIO DE SEGURANÇA (RLS): O banco de dados recusou a inserção do responsável.\')',
        '            throw new Error(',
        '              \'Erro de permissão (RLS) ao cadastrar responsável. \' +',
        '              \'A política de segurança do banco precisa ser atualizada para permitir que gestores criem responsáveis.\'',
        '            )',
        '          }',
        '',
        '          throw respError',
        '        }',
        '        throw respError',
        '      }',
        '      respData = novaResp',
        '    }',
        ''
    ].join('\n');
    lines.splice(start2, end2 - start2, newChunk2);
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done');
