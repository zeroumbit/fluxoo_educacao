-- Migration 059: Expansão de Acesso RLS para Financeiro e Relatórios
-- Descrição: Permite que gestores e funcionários administrativos vejam 
--            os dados financeiros e relatórios da sua unidade.

-- 1. Garantir que a View de Fechamento tenha políticas de acesso claras
-- Como é uma VIEW com security_invoker = on, ela herdará as políticas da tabela 'cobrancas'
-- Mas precisamos garantir que as políticas de 'cobrancas' cubram todos os casos.

-- 2. Atualizar as políticas da tabela 'cobrancas'
-- Removemos a anterior que era limitada apenas ao Gestor via escolas.gestor_user_id
DROP POLICY IF EXISTS "Gestores acessam cobrancas da sua escola" ON public.cobrancas;
DROP POLICY IF EXISTS "Ver cobrancas do próprio tenant" ON public.cobrancas;

-- Política para Super Admin (Acesso Total)
DROP POLICY IF EXISTS "Super Admin total access on cobrancas" ON public.cobrancas;
CREATE POLICY "Super Admin total access on cobrancas" ON public.cobrancas
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Política para Gestores e Funcionários (Acesso por Tenant)
CREATE POLICY "Acesso por Tenant em cobrancas" ON public.cobrancas
    FOR ALL TO authenticated
    USING (
        (tenant_id IN (SELECT tenant_id FROM public.funcionarios WHERE user_id = auth.uid())) OR
        (tenant_id IN (SELECT id FROM public.escolas WHERE gestor_user_id = auth.uid()))
    );

-- Política para Responsáveis (Já existe na Migration 030, mas garantimos aqui)
-- DROP POLICY IF EXISTS "Pais veem cobrancas vinculadas" ON public.cobrancas;
-- (Mantemos a do portal pois ela filtra por aluno_id especificamente)

-- 3. Garantir acesso à View mv_fechamento_mensal
GRANT SELECT ON public.mv_fechamento_mensal TO authenticated;

-- 4. Criar política de leitura para a View de Fechamento (Se necessário)
-- Obs: Views com security_invoker já aplicam o RLS da tabela base.
