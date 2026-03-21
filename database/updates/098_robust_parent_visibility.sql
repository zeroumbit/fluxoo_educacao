-- ==============================================================================
-- 🚀 MIGRATION: VISIBILIDADE DE FILHOS (ROBUSTECIMENTO)
-- Descrição: Remove a dependência de 'role' no JWT para garantir que pais 
-- visualizem seus filhos mesmo sem custom claims no token.
-- ==============================================================================

-- 1. REPRODUZIR FUNÇÕES AUXILIARES (Garantindo que estão corretas)
CREATE OR REPLACE FUNCTION public.get_my_responsavel_id()
RETURNS uuid AS $$ 
    SELECT id FROM public.responsaveis WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_my_child(p_aluno_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.aluno_responsavel 
        WHERE aluno_id = p_aluno_id 
        AND responsavel_id = public.get_my_responsavel_id()
        AND status = 'ativo' -- Apenas vínculos ativos
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. POLÍTICAS DE 'alunos' E 'aluno_responsavel' (SEM DEP. DE ROLE)
-- Isso permite o acesso baseado APENAS no vínculo da tabela, o que é mais seguro e resiliente.

-- --- ALUNOS ---
DROP POLICY IF EXISTS "RP_Alunos_Pais" ON public.alunos;
DROP POLICY IF EXISTS "Portal_Alunos_Pais" ON public.alunos;
CREATE POLICY "Portal_Alunos_Pais_V2" ON public.alunos 
FOR SELECT TO authenticated 
USING ( public.is_my_child(id) );

-- --- ALUNO_RESPONSAVEL ---
DROP POLICY IF EXISTS "RP_AR_Pais" ON public.aluno_responsavel;
DROP POLICY IF EXISTS "Portal_Matriculas_Pais" ON public.aluno_responsavel;
CREATE POLICY "Portal_Vinculos_Pais_V2" ON public.aluno_responsavel 
FOR SELECT TO authenticated 
USING ( responsavel_id = public.get_my_responsavel_id() );

-- --- MATRICULAS (Para ver série/turma) ---
DROP POLICY IF EXISTS "Portal_Matriculas_Pais" ON public.matriculas;
CREATE POLICY "Portal_Matriculas_Pais_V2" ON public.matriculas 
FOR SELECT TO authenticated 
USING ( public.is_my_child(aluno_id) );

-- --- TURMAS ---
DROP POLICY IF EXISTS "Portal_Turmas_Select_Pais" ON public.turmas;
CREATE POLICY "Portal_Turmas_Pais_V2" ON public.turmas 
FOR SELECT TO authenticated 
USING ( public.is_my_child_turma(id) );

-- --- MURAL E AVISOS (Baseado no vínculo real de responsavel_id) ---
DROP POLICY IF EXISTS "RP_Avisos_Pais" ON public.mural_avisos;
DROP POLICY IF EXISTS "Portal_Mural_Pais" ON public.mural_avisos;
CREATE POLICY "Portal_Mural_Pais_V2" ON public.mural_avisos 
FOR SELECT TO authenticated 
USING ( 
    tenant_id IN (
        SELECT a.tenant_id FROM public.alunos a 
        JOIN public.aluno_responsavel ar ON ar.aluno_id = a.id
        WHERE ar.responsavel_id = public.get_my_responsavel_id()
    ) 
);
