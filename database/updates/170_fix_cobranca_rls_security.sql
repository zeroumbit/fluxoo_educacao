-- ==============================================================================
-- 🛡️ MIGRATION 170: RLS SECURITY HARDENING (REMOÇÃO DO "UNIVERSAL_MODIFY")
-- Risco: CRÍTICO | Impacto: Famílias tinham permissão de UPDATE via tenant_id.
-- Correção: Remoção do Universal_Modify das tabelas críticas e recriação do 
-- acesso estrito condicionado ao Role ('funcionario' ou 'super_admin').
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. BACKUP E PREPARAÇÃO (Checklist Recomendação Adicional)
-- ==============================================================================
-- O backup das políticas originais ficará registrado no Histórico de Migrações do repo.
-- O script executa de forma transacional (BEGIN / COMMIT) garantindo consistência total.

-- ==============================================================================
-- 2. REMOÇÃO DAS POLÍTICAS VULNERÁVEIS
-- ==============================================================================
-- As políticas de 'Select' permanecem as "Universal_Select", pois elas possuem 
-- blindagem adequada via get_my_children() para leitura. O perigo estava apenas no MODIFY.

DROP POLICY IF EXISTS "Universal_Modify_cobrancas" ON public.cobrancas;
DROP POLICY IF EXISTS "Universal_Modify_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Universal_Modify_matriculas" ON public.matriculas;

-- ==============================================================================
-- 3. RECRIAÇÃO BLINDADA: APENAS STAFF/ESCOLA PODE MODIFICAR
-- ==============================================================================

-----------------------------
-- TABELA: COBRANCAS
-----------------------------
-- Permite ALL apenas para quem:
-- 1. For da mesma escola (tenant_id) OU for o gestor dono da escola
-- 2. AND obrigatoriamente tiver a tag de 'funcionario' ou 'super_admin'
CREATE POLICY "Strict_Staff_Modify_Cobrancas" ON public.cobrancas FOR ALL TO authenticated USING (
    (
        tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR
        tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
    AND 
    (
        auth.jwt()->'user_metadata'->>'role' IN ('funcionario', 'super_admin')
        OR 
        COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
    )
) WITH CHECK (
    (
        tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR
        tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
    AND 
    (
        auth.jwt()->'user_metadata'->>'role' IN ('funcionario', 'super_admin')
        OR 
        COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
    )
);

-----------------------------
-- TABELA: FUNCIONARIOS
-----------------------------
CREATE POLICY "Strict_Staff_Modify_Funcionarios" ON public.funcionarios FOR ALL TO authenticated USING (
    (
        tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR
        tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
    AND 
    (
        auth.jwt()->'user_metadata'->>'role' IN ('funcionario', 'super_admin')
        OR 
        COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
    )
) WITH CHECK (
    (
        tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR
        tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
    AND 
    (
        auth.jwt()->'user_metadata'->>'role' IN ('funcionario', 'super_admin')
        OR 
        COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
    )
);

-----------------------------
-- TABELA: MATRICULAS
-----------------------------
CREATE POLICY "Strict_Staff_Modify_Matriculas" ON public.matriculas FOR ALL TO authenticated USING (
    (
        tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR
        tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
    AND 
    (
        auth.jwt()->'user_metadata'->>'role' IN ('funcionario', 'super_admin')
        OR 
        COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
    )
) WITH CHECK (
    (
        tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
        OR
        tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    )
    AND 
    (
        auth.jwt()->'user_metadata'->>'role' IN ('funcionario', 'super_admin')
        OR 
        COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
    )
);

COMMIT;

-- FIM DA MIGRAÇÃO
