# Correção do Módulo de Funcionários

## Problema
Erro 403 (Forbidden) ao tentar cadastrar funcionários no Supabase.

## Causa
A tabela `funcionarios` não tinha políticas RLS (Row Level Security) configuradas corretamente para permitir que gestores de escola criem e gerenciem funcionários.

## Solução

### 1. Executar Scripts SQL no Supabase

Acesse o **SQL Editor** do Supabase e execute os seguintes scripts na ordem:

#### Script 1: `database/updates/019_fix_funcionarios_rls.sql`
Este script:
- Habilita RLS na tabela `funcionarios`
- Cria políticas para SELECT, INSERT, UPDATE e DELETE
- Garante que todas as colunas necessárias existam
- Cria trigger para atualizar `updated_at` automaticamente
- Cria índices para performance

#### Script 2: `database/updates/020_funcionarios_tabelas_relacionadas.sql`
Este script:
- Cria tabela `funcionarios_historico` para rastreabilidade
- Cria tabela `funcionarios_acessos` para log de login
- Cria view `funcionarios_completos` com dados consolidados
- Cria função `funcionario_tem_acesso_area()` para verificar permissões
- Adiciona triggers para sincronização entre módulos

### 2. Como Executar

1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Copie o conteúdo de `019_fix_funcionarios_rls.sql`
5. Cole no editor e clique em **Run**
6. Repita o processo para `020_funcionarios_tabelas_relacionadas.sql`

### 3. Verificar Permissões

Após executar os scripts, verifique no Supabase:

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'funcionarios';

-- Verificar se a tabela tem RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'funcionarios';

-- Testar inserção (substitua <tenant_id> pelo ID da escola)
INSERT INTO funcionarios (tenant_id, nome_completo, funcao, status)
VALUES ('<tenant_id>', 'Teste', 'Professor', 'ativo');
```

## Estrutura da Tabela Funcionarios

```
funcionarios
├── id (UUID, PK)
├── tenant_id (UUID, FK -> escolas.id)
├── nome_completo (TEXT)
├── como_chamado (TEXT, opcional)
├── funcao (TEXT)
├── salario_bruto (NUMERIC)
├── dia_pagamento (INTEGER, 1-31)
├── data_admissao (DATE)
├── status (TEXT: ativo | inativo | afastado | demitido)
├── user_id (UUID, FK -> auth.users.id, opcional)
├── email (TEXT, opcional)
├── areas_acesso (TEXT[], opcional)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## Sincronização Entre Módulos

### Funcionários → Auth
- Quando um funcionário recebe acesso, é criado um usuário em `auth.users`
- O `user_id` é vinculado ao funcionário na tabela `funcionarios`
- O funcionário pode fazer login com email/senha

### Funcionários → Escola
- `tenant_id` vincula o funcionário à escola
- Quando a escola é desativada, todos os funcionários são desativados automaticamente

### Funcionários → Áreas de Acesso
- `areas_acesso` é um array com as áreas permitidas
- Ex: `['Financeiro', 'Pedagógico', 'Secretaria']`
- A função `funcionario_tem_acesso_area()` verifica permissões

## Histórico e Logs

### funcionarios_historico
Registra todas as alterações nos funcionários:
- Tipo de alteração (criacao, atualizacao, desativacao)
- Dados antigos e novos (JSONB)
- Usuário responsável pela alteração

### funcionarios_acessos
Registra logs de login:
- Data/hora do acesso
- IP address
- User agent
- Sucesso/falha

## Melhorias no Código

O arquivo `service.ts` foi atualizado para:
- Remover casts `as any` desnecessários
- Adicionar tratamento de erro adequado com logs
- Validar `tenant_id` antes de inserir
- Adicionar funções auxiliares:
  - `buscarPorUserId()`: Busca funcionário pelo usuário auth
  - `verificarAcesso()`: Verifica se funcionário tem acesso a uma área

## Próximos Passos

1. **Executar scripts SQL** no Supabase
2. **Testar cadastro** de funcionários em http://localhost:5173/funcionarios
3. **Verificar logs** no console do navegador e do Supabase
4. **Testar login** de funcionário criado
5. **Implementar verificação de áreas** nos outros módulos (Financeiro, Pedagógico, etc.)

## Troubleshooting

### Erro 403 persiste
Verifique se:
- O usuário logado é gestor da escola
- A coluna `gestor_user_id` está preenchida na tabela `escolas`
- As políticas RLS foram criadas corretamente

### Funcionário não consegue login
Verifique se:
- O `user_id` foi vinculado corretamente
- O email foi confirmado (se required)
- As áreas de acesso estão configuradas

### Dados não aparecem
Verifique no console:
- Se o `tenant_id` está sendo enviado corretamente
- Se há erros nas políticas RLS
- Se o usuário tem permissão para ler os dados
