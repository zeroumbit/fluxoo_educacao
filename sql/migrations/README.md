# Supabase RLS Migrations

Scripts SQL para gerenciar Row Level Security (RLS) do Supabase.

## Estrutura

```
sql/
└── migrations/
    ├── 001_rls_gestor_full_access.sql    # Políticas para gestor (escola + filiais)
    └── README.md
```

## Como Aplicar

### Via Supabase Dashboard
1. Acesse **SQL Editor**
2. Copie o conteúdo do arquivo `.sql`
3. Execute

### Via Supabase CLI
```bash
supabase db push
# ou
psql -h <host> -U <user> -d <database> -f sql/migrations/001_rls_gestor_full_access.sql
```

## Políticas Criadas

### `configuracoes_escola`
- `gestor_config_select` - Gestor pode ler configurações
- `gestor_config_insert` - Gestor pode criar configurações
- `gestor_config_update` - Gestor pode atualizar configurações
- `gestor_config_delete` - Gestor pode excluir configurações
- `super_admin_all_config` - Super admin tem acesso total

### `configuracoes_escola_historico`
- `gestor_historico_select` - Gestor pode ver histórico

### `filiais`
- `gestor_filiais_all` - Gestor tem acesso total às filiais
- `super_admin_all_filiais` - Super admin tem acesso total

## Funções Auxiliares

### `is_gestor_da_escola(p_tenant_id)`
Verifica se o usuário autenticado é gestor da escola através do `gestor_user_id`.

```sql
SELECT is_gestor_da_escola('uuid-da-escola');
```

## Rollback

Para remover as políticas criadas por esta migration:

```sql
DROP POLICY IF EXISTS "gestor_config_select" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_config_insert" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_config_update" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_config_delete" ON configuracoes_escola;
DROP POLICY IF EXISTS "gestor_historico_select" ON configuracoes_escola_historico;
DROP POLICY IF EXISTS "gestor_filiais_all" ON filiais;
DROP POLICY IF EXISTS "super_admin_all_config" ON configuracoes_escola;
DROP POLICY IF EXISTS "super_admin_all_filiais" ON filiais;
DROP FUNCTION IF EXISTS is_gestor_da_escola(uuid);
```