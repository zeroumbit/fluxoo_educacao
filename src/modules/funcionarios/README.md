# Sincronização de Funcionários entre Módulos

## Visão Geral

O módulo de Funcionários agora está totalmente integrado com:
- **Supabase Auth** (autenticação)
- **Escolas** (tenant/multi-tenancy)
- **Demais módulos** (Financeiro, Pedagógico, Secretaria, etc.)

## Estrutura de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    FUNCIONÁRIOS                             │
├─────────────────────────────────────────────────────────────┤
│ id (UUID)                                                   │
│ tenant_id → escolas.id                                      │
│ user_id → auth.users.id (opcional, para login)              │
│ nome_completo                                               │
│ como_chamado (apelido)                                      │
│ funcao                                                      │
│ salario_bruto                                               │
│ dia_pagamento (1-31)                                        │
│ data_admissao                                               │
│ status (ativo | inativo | afastado | demitido)              │
│ email                                                       │
│ areas_acesso (TEXT[])                                       │
│ created_at, updated_at                                      │
└─────────────────────────────────────────────────────────────┘
```

## Como Funciona a Sincronização

### 1. Cadastro de Funcionário

```
Funcionários Page
      ↓
funcionariosService.criar()
      ↓
INSERT INTO funcionarios (tenant_id, nome_completo, funcao, ...)
      ↓
Trigger: funcionarios_historico_log
      ↓
INSERT INTO funcionarios_historico (alteracao_tipo = 'criacao')
```

### 2. Criar Acesso (Login)

```
Botão "Criar Acesso"
      ↓
funcionariosService.criarUsuarioEscola()
      ↓
1. supabase.auth.signUp() → Cria em auth.users
      ↓
2. UPDATE funcionarios SET user_id = auth_user_id
      ↓
3. Funcionário pode fazer login
```

### 3. Login do Funcionário

```
Login Page
      ↓
supabase.auth.signInWithPassword()
      ↓
AuthContext.loadUserProfile()
      ↓
SELECT * FROM funcionarios WHERE user_id = auth.uid()
      ↓
Define: authUser.areasAcesso, authUser.funcionarioId
      ↓
Redireciona para dashboard
```

### 4. Verificação de Permissão

```tsx
// Em qualquer módulo
import { usePermissao } from '@/hooks/usePermissao'

function FinanceiroPage() {
  const { temAcesso } = usePermissao('Financeiro')
  
  if (!temAcesso) return <Navigate to="/nao-autorizado" />
  
  return <div>...</div>
}
```

## Uso em Outros Módulos

### Exemplo: Financeiro

```tsx
import { usePermissao } from '@/hooks/usePermissao'

export function FinanceiroPage() {
  const { temAcesso, isLoading } = usePermissao('Financeiro')

  if (isLoading) return <Loading />
  if (!temAcesso) return <AcessoNegado />

  return (
    <div>
      <h1>Financeiro</h1>
      {/* Conteúdo do financeiro */}
    </div>
  )
}
```

### Exemplo: Múltiplas Áreas

```tsx
import { useMultiPermissao } from '@/hooks/usePermissao'

export function RelatoriosPage() {
  // Precisa de acesso a Financeiro OU Pedagógico
  const { temAcesso } = useMultiPermissao(
    ['Financeiro', 'Pedagógico'], 
    'algum' // OR
  )

  if (!temAcesso) return <AcessoNegado />

  return <div>...</div>
}
```

### Exemplo: HOC (Higher Order Component)

```tsx
import { withPermissao } from '@/hooks/usePermissao'

// Protege o componente inteiro
const FinanceiroPageComPermissao = withPermissao('Financeiro')(FinanceiroPage)

export default FinanceiroPageComPermissao
```

## Scripts SQL

### Executar no Supabase SQL Editor

1. **`database/updates/019_fix_funcionarios_rls.sql`**
   - Habilita RLS
   - Cria políticas de acesso
   - Adiciona colunas faltantes
   - Cria triggers de updated_at

2. **`database/updates/020_funcionarios_tabelas_relacionadas.sql`**
   - Cria tabela `funcionarios_historico`
   - Cria tabela `funcionarios_acessos`
   - Cria view `funcionarios_completos`
   - Cria função `funcionario_tem_acesso_area()`

### Como Executar

```sql
-- 1. Copie o conteúdo de 019_fix_funcionarios_rls.sql
-- 2. Cole no SQL Editor do Supabase
-- 3. Clique em "Run"
-- 4. Repita para 020_funcionarios_tabelas_relacionadas.sql
```

## Tabelas Relacionadas

### funcionarios_historico

```sql
CREATE TABLE funcionarios_historico (
  id UUID PRIMARY KEY,
  funcionario_id UUID REFERENCES funcionarios(id),
  tenant_id UUID REFERENCES escolas(id),
  alteracao_tipo TEXT, -- 'criacao', 'atualizacao', 'desativacao'
  alteracao_dados JSONB, -- dados antigos e novos
  usuario_responsavel UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ
)
```

### funcionarios_acessos

```sql
CREATE TABLE funcionarios_acessos (
  id UUID PRIMARY KEY,
  funcionario_id UUID REFERENCES funcionarios(id),
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES escolas(id),
  data_acesso TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  sucesso BOOLEAN
)
```

## Hooks Disponíveis

### useFuncionarios()
Lista todos os funcionários do tenant

### useCriarFuncionario()
Cria novo funcionário

### useAtualizarFuncionario()
Atualiza dados do funcionário

### useExcluirFuncionario()
Desativa funcionário (exclusão lógica)

### useCriarUsuarioEscola()
Cria usuário auth e vincula ao funcionário

### useFuncionarioLogado()
Busca dados do funcionário logado

### useVerificarAcessoFuncionario(area)
Verifica se funcionário tem acesso a uma área

### usePermissao(area)
Hook genérico para verificar permissão em qualquer módulo

### useMultiPermissao(areas, operador)
Verifica múltiplas áreas de acesso

### useAreasAcesso()
Retorna array de áreas de acesso do usuário

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                           │
└─────────────────────────────────────────────────────────────┘

1. GESTÃO CADASTRA FUNCIONÁRIO
   ┌──────────────┐
   │ Funcionários │
   │    Page      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Criar       │
   │  Funcionário │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  INSERT INTO │
   │  funcionarios│
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Trigger:    │
   │  Historico   │
   └──────────────┘

2. GESTÃO CRIA ACESSO
   ┌──────────────┐
   │  Criar       │
   │  Usuário     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Auth SignUp │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  UPDATE      │
   │  funcionarios│
   │  SET user_id │
   └──────────────┘

3. FUNCIONÁRIO LOGA
   ┌──────────────┐
   │  Login Page  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Auth        │
   │  SignIn      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  AuthContext │
   │  loadProfile │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  SELECT FROM │
   │  funcionarios│
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Define      │
   │  areasAcesso │
   └──────────────┘

4. FUNCIONÁRIO ACESSA MÓDULO
   ┌──────────────┐
   │  Financeiro  │
   │    Page      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  usePermissao│
   │  ('Financeiro')│
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Verifica    │
   │  areasAcesso │
   └──────┬───────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌───────┐   ┌──────────┐
│ Tem   │   │ Não Tem  │
│ Acesso│   │ Acesso   │
└───┬───┘   └────┬─────┘
    │            │
    ▼            ▼
┌────────┐  ┌──────────┐
│ Render │  │ Redirec. │
│ Page   │  │ Negado   │
└────────┘  └──────────┘
```

## Troubleshooting

### Erro 403 ao criar funcionário
- Executar scripts SQL no Supabase
- Verificar se `tenant_id` está sendo enviado
- Verificar políticas RLS

### Funcionário não consegue login
- Verificar se `user_id` está vinculado
- Verificar se email foi confirmado
- Verificar senha

### Permissão não funciona
- Verificar se `areas_acesso` está preenchido
- Verificar se hook `usePermissao` está sendo usado corretamente
- Verificar se AuthContext carregou as áreas

## Próximos Passos

1. Executar scripts SQL no Supabase
2. Testar cadastro de funcionário
3. Testar criação de usuário
4. Testar login de funcionário
5. Implementar `usePermissao` em todos os módulos
6. Adicionar log de acessos em `funcionarios_acessos`
