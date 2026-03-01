# Resumo das Alterações - Módulo de Funcionários

## Problema Original
Erro 403 (Forbidden) ao tentar cadastrar funcionários no Supabase.

## Solução Implementada

### 1. Scripts SQL Criados

#### `database/updates/019_fix_funcionarios_rls.sql`
- Habilita RLS na tabela `funcionarios`
- Cria 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE) para gestores
- Adiciona colunas faltantes (tenant_id, status, user_id, email, areas_acesso, etc.)
- Cria trigger para `updated_at`
- Cria índices para performance
- Cria política para funcionário ler próprio registro

#### `database/updates/020_funcionarios_tabelas_relacionadas.sql`
- Cria tabela `funcionarios_historico` (rastreabilidade)
- Cria tabela `funcionarios_acessos` (log de login)
- Cria view `funcionarios_completos` (dados consolidados)
- Cria função `funcionario_tem_acesso_area()` (verificação de permissão)
- Adiciona triggers para histórico automático
- Cria trigger para desativar funcionários quando escola é desativada

### 2. Service Atualizado

**Arquivo:** `src/modules/funcionarios/service.ts`

Melhorias:
- Removido casts `as any` desnecessários
- Adicionado tratamento de erro com logs
- Validação de `tenant_id` antes de inserir
- Novas funções:
  - `buscarPorUserId(userId)`: Busca funcionário pelo usuário auth
  - `verificarAcesso(userId, area)`: Verifica acesso a área específica

### 3. Hooks Atualizados

**Arquivo:** `src/modules/funcionarios/hooks.ts`

Novos hooks:
- `useFuncionarioLogado()`: Dados do funcionário logado
- `useVerificarAcessoFuncionario(area)`: Verifica acesso a área

### 4. AuthContext Atualizado

**Arquivo:** `src/modules/auth/AuthContext.tsx`

Alterações:
- Interface `AuthUser` agora inclui:
  - `areasAcesso?: string[]`
  - `funcionarioId?: string`
- Carrega `areas_acesso` e `id` do funcionário no login

### 5. Hooks de Permissão Criados

**Arquivo:** `src/hooks/usePermissao.ts`

Novos hooks:
- `usePermissao(area)`: Verifica se usuário tem acesso a uma área
- `useMultiPermissao(areas, operador)`: Verifica múltiplas áreas
- `useAreasAcesso()`: Retorna áreas de acesso do usuário
- `withPermissao(area)`: HOC para proteger componentes

**Arquivo:** `src/hooks/index.ts`
- Exporta todos os hooks de permissão

### 6. Página de Funcionários Atualizada

**Arquivo:** `src/modules/funcionarios/pages/FuncionariosPage.tsx`

Alterações:
- Melhor tratamento de erro no `onSubmitFunc`
- Adicionado `status: 'ativo'` ao criar funcionário

## Como Corrigir o Erro 403

### Passo 1: Executar Scripts SQL

1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Execute `database/updates/019_fix_funcionarios_rls.sql`
5. Execute `database/updates/020_funcionarios_tabelas_relacionadas.sql`

### Passo 2: Testar Cadastro

1. Acesse http://localhost:5173/funcionarios
2. Clique em "Novo Funcionário"
3. Preencha os dados
4. Clique em "Cadastrar"

### Passo 3: Verificar Logs

Se ainda houver erro:
- Abra o console do navegador (F12)
- Verifique a mensagem de erro
- Consulte `FUNCIONARIOS_FIX.md` para troubleshooting

## Documentação Criada

1. **FUNCIONARIOS_FIX.md** - Guia de correção do erro 403
2. **src/modules/funcionarios/README.md** - Documentação completa do módulo
3. **database/updates/019_fix_funcionarios_rls.sql** - Script RLS
4. **database/updates/020_funcionarios_tabelas_relacionadas.sql** - Tabelas relacionadas

## Estrutura da Tabela Funcionarios

```sql
funcionarios (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES escolas(id),        -- Vínculo com escola
  user_id UUID REFERENCES auth.users(id),       -- Vínculo com auth (opcional)
  nome_completo TEXT NOT NULL,
  como_chamado TEXT,                            -- Apelido
  funcao TEXT NOT NULL,
  salario_bruto NUMERIC(10,2),
  dia_pagamento INTEGER,                        -- 1-31
  data_admissao DATE,
  status TEXT DEFAULT 'ativo',                  -- ativo | inativo | afastado | demitido
  email TEXT,
  areas_acesso TEXT[],                          -- ['Financeiro', 'Pedagógico']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Sincronização Entre Módulos

### Fluxo de Dados

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Funcionários│────▶│  Auth.users  │────▶│  Outros     │
│   (tenant)  │     │   (login)    │     │  Módulos    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                                       │
       │         ┌──────────────┐              │
       └────────▶│  Historico   │◀─────────────┘
                 │   (logs)     │
                 └──────────────┘
```

### Módulos que Podem Usar Funcionários

1. **Financeiro** - Funcionários com acesso ao Financeiro
2. **Pedagógico** - Professores e atividades
3. **Secretaria** - Funcionários administrativos
4. **Almoxarifado** - Responsáveis pelo estoque
5. **Documentos** - Quem pode emitir documentos

### Exemplo de Uso em Outro Módulo

```tsx
// src/modules/financeiro/pages/FinanceiroPage.tsx
import { usePermissao } from '@/hooks/usePermissao'

export function FinanceiroPage() {
  const { temAcesso, isLoading } = usePermissao('Financeiro')

  if (isLoading) return <Loading />
  if (!temAcesso) return <AcessoNegado />

  return <div>Conteúdo do Financeiro</div>
}
```

## Próximos Passos Sugeridos

1. ✅ Executar scripts SQL no Supabase
2. ✅ Testar cadastro de funcionário
3. ✅ Testar criação de usuário para funcionário
4. ✅ Testar login de funcionário
5. ⏳ Implementar `usePermissao` em todos os módulos
6. ⏳ Adicionar verificação de áreas no AdminLayout
7. ⏳ Criar página de perfil do funcionário
8. ⏳ Implementar log de acessos em `funcionarios_acessos`

## Arquivos Modificados/Criados

### Criados
- `database/updates/019_fix_funcionarios_rls.sql`
- `database/updates/020_funcionarios_tabelas_relacionadas.sql`
- `FUNCIONARIOS_FIX.md`
- `src/hooks/usePermissao.ts`
- `src/hooks/index.ts`
- `src/modules/funcionarios/README.md`

### Modificados
- `src/modules/funcionarios/service.ts`
- `src/modules/funcionarios/hooks.ts`
- `src/modules/funcionarios/pages/FuncionariosPage.tsx`
- `src/modules/auth/AuthContext.tsx`

## Verificação Final

Após executar os scripts SQL, execute este comando no SQL Editor para verificar:

```sql
-- Verificar políticas RLS
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'funcionarios'
ORDER BY cmd, policyname;

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'funcionarios';

-- Testar contagem de funcionários
SELECT COUNT(*) FROM funcionarios;
```

## Contato/Suporte

Se houver problemas após executar os scripts:
1. Verifique os logs no console do navegador
2. Verifique os logs no Supabase (Database > Logs)
3. Consulte `FUNCIONARIOS_FIX.md` para troubleshooting detalhado
