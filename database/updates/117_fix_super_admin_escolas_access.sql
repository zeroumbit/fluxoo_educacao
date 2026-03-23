-- ==============================================================================
-- 🛡️ MIGRATION 117: FIX SUPER ADMIN ACCESS & BILLING RLS
-- Descrição: Corrige o acesso do Super Admin à tabela 'escolas' e restaura
-- as políticas de 'faturas' e 'assinaturas' que estavam ausentes no loop universal.
-- ==============================================================================

-- 1. ESCOLAS - Reforçar acesso do Super Admin (Garantia por e-mail no JWT)
DROP POLICY IF EXISTS "Universal_Modify_Escolas" ON public.escolas;
CREATE POLICY "Universal_Modify_Escolas" ON public.escolas FOR ALL TO authenticated USING (
    -- Próprio tenant (Gestor)
    id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    OR gestor_user_id = auth.uid() 
    OR 
    -- Super Admin (Check extensivo)
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
) WITH CHECK (
    id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    OR gestor_user_id = auth.uid() 
    OR 
    -- Super Admin (Check extensivo)
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
);

-- 2. ASSINATURAS - Restaurar política universal (Faltava na 114)
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Universal_Select_Assinaturas" ON public.assinaturas;
DROP POLICY IF EXISTS "Universal_Modify_Assinaturas" ON public.assinaturas;

CREATE POLICY "Universal_Select_Assinaturas" ON public.assinaturas FOR SELECT TO authenticated USING (
    tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
    OR tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid())
    OR (auth.jwt()->'user_metadata'->>'role' = 'super_admin' OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true OR auth.jwt()->>'email' = 'zeroumbit@gmail.com')
);

CREATE POLICY "Universal_Modify_Assinaturas" ON public.assinaturas FOR ALL TO authenticated USING (
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
    OR tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
) WITH CHECK (
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
    OR tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
);

-- 3. FATURAS - Restaurar política universal (Faltava na 114)
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Universal_Select_Faturas" ON public.faturas;
DROP POLICY IF EXISTS "Universal_Modify_Faturas" ON public.faturas;

-- Nota: Select geral já existe via migration 116 para onboarding, mas vamos garantir o acesso administrativo
DROP POLICY IF EXISTS "Universal_Select_Faturas_Admin" ON public.faturas;
CREATE POLICY "Universal_Select_Faturas_Admin" ON public.faturas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Universal_Modify_Faturas" ON public.faturas FOR ALL TO authenticated USING (
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
    OR tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
) WITH CHECK (
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
    OR tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
);

-- 4. SOLICITAÇÕES DE UPGRADE - Restaurar acesso
ALTER TABLE public.solicitacoes_upgrade ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Universal_Select_Upgrade" ON public.solicitacoes_upgrade;
DROP POLICY IF EXISTS "Universal_Modify_Upgrade" ON public.solicitacoes_upgrade;

CREATE POLICY "Universal_Select_Upgrade" ON public.solicitacoes_upgrade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Universal_Modify_Upgrade" ON public.solicitacoes_upgrade FOR ALL TO authenticated USING (
    (
        auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
        OR COALESCE((auth.jwt()->>'is_super_admin')::boolean, false) = true
        OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
    )
    OR tenant_id = NULLIF(COALESCE(auth.jwt()->'user_metadata'->>'tenant_id', auth.jwt()->'app_metadata'->>'tenant_id', auth.jwt()->>'tenant_id'), '')::uuid
) WITH CHECK (true);

-- 5. CONFIGURAÇÃO DE RECEBIMENTO - Permitir UPDATE for Super Admin
DROP POLICY IF EXISTS "Universal_Modify_ConfigRecebimento" ON public.configuracao_recebimento;
CREATE POLICY "Universal_Modify_ConfigRecebimento" ON public.configuracao_recebimento FOR ALL TO authenticated USING (
    auth.jwt()->'user_metadata'->>'role' = 'super_admin' 
    OR auth.jwt()->>'email' = 'zeroumbit@gmail.com'
) WITH CHECK (true);
