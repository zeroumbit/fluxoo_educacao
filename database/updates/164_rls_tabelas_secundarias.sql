-- ==============================================================================
-- 🚑 MIGRATION 164: RLS PARA TABELAS SECUNDÁRIAS (SEGURANÇA PASSIVA)
-- Problema: Várias tabelas secundárias como atividades_turmas e contas_pagar
--           estavam sem RLS, permitindo que usuários do sistema vissem dados
--           de outras escolas caso tivessem acesso direto à API (Supabase).
-- Solução:  Este script aplica RLS apenas se A TABELA AINDA NÃO POSSUIR NENHUMA POLÍTICA.
--           Isso garante risco zero de quebrar módulos que já funcionam.
-- ==============================================================================

BEGIN;

DO $$
BEGIN
  -- 1. atividades_turmas
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'atividades_turmas' AND schemaname = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'atividades_turmas' AND schemaname = 'public'
      ) THEN
        ALTER TABLE public.atividades_turmas ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "tenant_acesso_atividades_turmas" ON public.atividades_turmas
          FOR ALL TO authenticated
          USING (
            tenant_id = NULLIF(COALESCE(
              auth.jwt()->'user_metadata'->>'tenant_id',
              auth.jwt()->'app_metadata'->>'tenant_id',
              auth.jwt()->>'tenant_id'
            ), '')::uuid
            OR public.is_super_admin_v2()
          );
      END IF;
  END IF;

  -- 2. planos_aula_turmas
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planos_aula_turmas' AND schemaname = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'planos_aula_turmas' AND schemaname = 'public'
      ) THEN
        ALTER TABLE public.planos_aula_turmas ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "tenant_acesso_planos_aula_turmas" ON public.planos_aula_turmas
          FOR ALL TO authenticated
          USING (
            tenant_id = NULLIF(COALESCE(
              auth.jwt()->'user_metadata'->>'tenant_id',
              auth.jwt()->'app_metadata'->>'tenant_id',
              auth.jwt()->>'tenant_id'
            ), '')::uuid
            OR public.is_super_admin_v2()
          );
      END IF;
  END IF;

  -- 3. contas_pagar
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contas_pagar' AND schemaname = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'contas_pagar' AND schemaname = 'public'
      ) THEN
        ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "tenant_acesso_contas_pagar" ON public.contas_pagar
          FOR ALL TO authenticated
          USING (
            tenant_id = NULLIF(COALESCE(
              auth.jwt()->'user_metadata'->>'tenant_id',
              auth.jwt()->'app_metadata'->>'tenant_id',
              auth.jwt()->>'tenant_id'
            ), '')::uuid
            OR public.is_super_admin_v2()
          );
      END IF;
  END IF;

  -- 4. notificacoes
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notificacoes' AND schemaname = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notificacoes' AND schemaname = 'public'
      ) THEN
        ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "tenant_acesso_notificacoes" ON public.notificacoes
          FOR ALL TO authenticated
          USING (
            tenant_id = NULLIF(COALESCE(
              auth.jwt()->'user_metadata'->>'tenant_id',
              auth.jwt()->'app_metadata'->>'tenant_id',
              auth.jwt()->>'tenant_id'
            ), '')::uuid
            OR public.is_super_admin_v2()
          );
      END IF;
  END IF;

  -- 5. almoxarifado_itens
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'almoxarifado_itens' AND schemaname = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'almoxarifado_itens' AND schemaname = 'public'
      ) THEN
        ALTER TABLE public.almoxarifado_itens ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "tenant_acesso_almoxarifado_itens" ON public.almoxarifado_itens
          FOR ALL TO authenticated
          USING (
            tenant_id = NULLIF(COALESCE(
              auth.jwt()->'user_metadata'->>'tenant_id',
              auth.jwt()->'app_metadata'->>'tenant_id',
              auth.jwt()->>'tenant_id'
            ), '')::uuid
            OR public.is_super_admin_v2()
          );
      END IF;
  END IF;

  -- 6. fornecedores
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fornecedores' AND schemaname = 'public') THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fornecedores' AND schemaname = 'public'
      ) THEN
        ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "tenant_acesso_fornecedores" ON public.fornecedores
          FOR ALL TO authenticated
          USING (
            tenant_id = NULLIF(COALESCE(
              auth.jwt()->'user_metadata'->>'tenant_id',
              auth.jwt()->'app_metadata'->>'tenant_id',
              auth.jwt()->>'tenant_id'
            ), '')::uuid
            OR public.is_super_admin_v2()
          );
      END IF;
  END IF;

END $$;

COMMIT;

-- TESTE DE VERIFICAÇÃO PÓS-MIGRATION:
-- As tabelas afetadas não devem aparecer na lista (devem ter rowsecurity = true):
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
