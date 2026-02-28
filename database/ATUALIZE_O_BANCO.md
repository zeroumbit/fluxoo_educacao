# 🗄️ Atualização do Banco de Dados

## ⚠️ AÇÃO NECESSÁRIA

### 📋 Campos pendentes no banco de dados

#### 1. Tabela `filiais` - Campos de endereço

Os campos **`numero`**, **`estado`** e **`cidade`** foram adicionados ao formulário de cadastro de unidades/filiais, mas **ainda não existem no banco de dados**.

**Para aplicar:**

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para o SQL Editor**
   - Menu lateral → **SQL Editor**

3. **Execute o script SQL**
   - Copie o conteúdo do arquivo `updates/009_add_campos_endereco_filiais.sql`
   - Cole no editor
   - Clique em **Run**

**Script SQL (copie e execute):**

```sql
-- Adiciona campos de endereço detalhado na tabela filiais
-- Permite que escolas tenham unidades em estados e cidades diferentes

ALTER TABLE public.filiais
ADD COLUMN IF NOT EXISTS numero VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estado VARCHAR(2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) DEFAULT NULL;

COMMENT ON COLUMN public.filiais.numero IS 'Número do endereço da unidade';
COMMENT ON COLUMN public.filiais.estado IS 'UF do estado onde fica a unidade';
COMMENT ON COLUMN public.filiais.cidade IS 'Cidade onde fica a unidade';
```

4. **Verifique se funcionou**
   - Vá em **Table Editor** → `filiais`
   - Clique em ⚙️ (configurações da tabela)
   - Verifique se as colunas `numero`, `estado` e `cidade` aparecem na lista

---

## ✅ Após aplicar

Os campos **número**, **estado** e **cidade** serão salvos automaticamente ao cadastrar novas unidades.

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
| 2026-02-28 | `numero`, `estado`, `cidade` | `filiais` | ⏳ Aguardando aplicação |
| 2026-02-28 | `numero` | `escolas` | ✅ Aplicado |
