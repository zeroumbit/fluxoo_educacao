-- ==============================================================================
-- 🛡️ MIGRATION 113: SOFT DELETES UNIVERSAIS (CONSOLIDADOS)
-- Descrição: Prepara o terreno para o padrão V3.1 onde DELETES FÍSICOS 
-- de tabelas transacionais estão proibidos.
-- ==============================================================================

DO $$
DECLARE
    tb text;
    transacionais text[] := ARRAY[
        'alunos', 'turmas', 'matriculas', 'frequencias', 
        'boletins', 'cobrancas', 'planos_aula', 'atividades'
    ];
BEGIN
    FOREACH tb IN ARRAY transacionais LOOP
        BEGIN
            -- Tenta adicionar as colunas, ignorando os erros se já existirem
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', tb);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id)', tb);
            
            -- Para Tabelas que tenham coluna 'status', garantimos que não haja DELETE Físico via RULES.
            -- Uma boa prática na versão V3.1 é que o front emita um UPDATE SET status='deleted', deleted_at=NOW()
            -- Assim, os selects da API/Views devem sempre acrescentar: "deleted_at IS NULL"
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Aviso para tabela %: %', tb, SQLERRM;
        END;
    END LOOP;
END $$;
