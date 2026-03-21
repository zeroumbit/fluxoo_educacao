-- ==============================================================================
-- 🔒 CORREÇÃO: RESTAURAR CONEXÃO ESCOLA-PORTAL E FLEXIBILIZAR ROLES
-- ==============================================================================

-- 1. POLÍTICAS PARA A TABELA 'escolas'
-- Fundamental para que o portal mostre o nome e logo da escola para os pais.
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público limitado às escolas" ON public.escolas;
CREATE POLICY "Acesso público limitado às escolas" ON public.escolas 
FOR SELECT TO authenticated, anon 
USING (true); -- Escolas são públicas para leitura (nome, slug, logo)

-- 2. AJUSTE NAS POLÍTICAS DE ALUNOS E RESPONSÁVEIS (Incluindo Admin/SuperAdmin)
-- Garante que o painel administrativo não quebre.

-- --- ALUNOS ---
DROP POLICY IF EXISTS "Alunos_Full_Access_Admin" ON public.alunos;
CREATE POLICY "Alunos_Full_Access_Admin" ON public.alunos 
FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('admin', 'super_admin') );

-- --- RESPONSÁVEIS ---
DROP POLICY IF EXISTS "Responsaveis_Full_Access_Admin" ON public.responsaveis;
CREATE POLICY "Responsaveis_Full_Access_Admin" ON public.responsaveis 
FOR ALL TO authenticated 
USING ( (auth.jwt() ->> 'role') IN ('admin', 'super_admin') );

-- 3. GARANTIR ACESSO DO GESTOR AOS DADOS DA PRÓPRIA ESCOLA
-- Às vezes a role no JWT pode vir como 'admin' em vez de 'gestor'.
DROP POLICY IF EXISTS "RP_Responsaveis_Gestor_V2" ON public.responsaveis;
CREATE POLICY "RP_Responsaveis_Gestor_V2" ON public.responsaveis FOR SELECT TO authenticated 
USING ( 
    (auth.jwt() ->> 'role') IN ('gestor', 'admin') 
    AND public.check_gestor_acesso_responsavel(id, (auth.jwt() ->> 'tenant_id')::uuid) 
);

-- 4. CONFIGURAÇÕES FINANCEIRAS E MURAL (Garantir que Gestor/Admin vejam)
DROP POLICY IF EXISTS "RP_Avisos_Gestor_V2" ON public.mural_avisos;
CREATE POLICY "RP_Avisos_Gestor_V2" ON public.mural_avisos FOR ALL TO authenticated 
USING ( 
    (auth.jwt() ->> 'role') IN ('gestor', 'admin') 
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

DROP POLICY IF EXISTS "RP_ConfigFin_Gestor_V2" ON public.config_financeira;
CREATE POLICY "RP_ConfigFin_Gestor_V2" ON public.config_financeira FOR ALL TO authenticated 
USING ( 
    (auth.jwt() ->> 'role') IN ('gestor', 'admin') 
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
);

-- 5. TABELA DE CONFIGURAÇÃO DE RECEBIMENTO (MERCADO PAGO / PIX)
-- O Onboarding e a Escola precisam ler isso.
ALTER TABLE public.configuracao_recebimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública config recebimento" ON public.configuracao_recebimento;
CREATE POLICY "Leitura pública config recebimento" ON public.configuracao_recebimento 
FOR SELECT TO authenticated, anon 
USING (true);

-- 6. GARANTIR QUE OS PAIS VEJAM AS ESCOLAS DE SEUS FILHOS (CASO UNIQUE TENANT)
-- Mesmo que a política global de Escolas seja true, garantimos aqui.
DROP POLICY IF EXISTS "Pais veem escolas dos filhos" ON public.escolas;
CREATE POLICY "Pais veem escolas dos filhos" ON public.escolas FOR SELECT TO authenticated 
USING (
    id IN (SELECT tenant_id FROM public.alunos WHERE public.is_my_child(id))
);
