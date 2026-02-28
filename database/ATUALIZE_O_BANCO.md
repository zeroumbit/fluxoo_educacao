# 🗄️ Atualização do Banco de Dados

## ⚠️ AÇÃO NECESSÁRIA

O campo **`numero`** foi adicionado ao formulário de cadastro de escola, mas **ainda não existe no banco de dados**.

### 📋 O que fazer:

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para o SQL Editor**
   - Menu lateral → **SQL Editor**

3. **Execute o script SQL**
   - Copie o conteúdo do arquivo `001_add_numero_escolas.sql`
   - Cole no editor
   - Clique em **Run**

### 📄 Script SQL (copie e execute):

```sql
-- Adiciona campo 'numero' na tabela escolas
ALTER TABLE escolas
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN escolas.numero IS 'Número do endereço da escola';
```

4. **Verifique se funcionou**
   - Vá em **Table Editor** → `escolas`
   - Clique em ⚙️ (configurações da tabela)
   - Verifique se a coluna `numero` aparece na lista

---

## ✅ Após aplicar

O campo **número** do endereço será salvo automaticamente ao cadastrar uma nova escola.

---

## 📝 Regra Importante

**A partir de agora:**
- Toda nova feature ou campo no frontend **deve** ter sua contraparte no banco de dados
- Scripts SQL devem ser salvos em `database/updates/` com numeração sequencial
- Tipos TypeScript em `src/lib/database.types.ts` devem ser atualizados

---

## 📚 Histórico de Atualizações

| Data | Campo | Tabela | Status |
|------|-------|--------|--------|
| 2026-02-28 | `numero` | `escolas` | ⏳ Aguardando aplicação |
