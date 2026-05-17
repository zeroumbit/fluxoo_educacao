-- ============================================================
-- 211_fix_transferencias_manual_destination_columns.sql
-- Garante compatibilidade do motor de notificações de transferência
-- com bases que foram criadas antes do destino híbrido.
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transferencias_escolares'
          AND column_name = 'escola_destino_nome_manual'
    ) THEN
        ALTER TABLE public.transferencias_escolares
        ADD COLUMN escola_destino_nome_manual TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'transferencias_escolares'
          AND column_name = 'escola_destino_cnpj_manual'
    ) THEN
        ALTER TABLE public.transferencias_escolares
        ADD COLUMN escola_destino_cnpj_manual TEXT;
    END IF;
END $$;

COMMENT ON COLUMN public.transferencias_escolares.escola_destino_nome_manual IS
  'Nome da escola destino quando a transferência aponta para instituição fora da rede.';

COMMENT ON COLUMN public.transferencias_escolares.escola_destino_cnpj_manual IS
  'CNPJ da escola destino quando a transferência aponta para instituição fora da rede.';
