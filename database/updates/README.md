# Atualizações do Banco de Dados

Este diretório contém os scripts SQL para atualizar o banco de dados.

## Como Aplicar as Atualizações

### Opção 1: Pelo Dashboard do Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo SQL
5. Clique em **Run**

### Opção 2: Pelo CLI do Supabase (se estiver usando localmente)

```bash
supabase db push
```

---

## Scripts Disponíveis

### 001_add_numero_escolas.sql

Adiciona o campo `numero` na tabela `escolas` para armazenar o número do endereço.

**O que faz:**
- Adiciona coluna `numero` VARCHAR(20) com valor padrão NULL
- Coluna é opcional (pode ser nula)

**SQL:**
```sql
ALTER TABLE escolas
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL;
```

---

## Próximos Passos

Sempre que uma nova funcionalidade ou campo for adicionado:

1. **Crie um novo arquivo SQL** neste diretório com numeração sequencial
   - Ex: `002_nova_tabela.sql`, `003_nova_coluna.sql`

2. **Atualize os tipos TypeScript** em `src/lib/database.types.ts`

3. **Atualize os schemas de validação** nos formulários

4. **Teste localmente** antes de aplicar em produção

---

## Histórico

| Data | Script | Descrição |
|------|--------|-----------|
| 2026-02-28 | 001_add_numero_escolas.sql | Adiciona campo número no endereço da escola |
