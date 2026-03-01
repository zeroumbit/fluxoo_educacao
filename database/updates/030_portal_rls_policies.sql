-- Migration 030: Políticas de Segurança (RLS) para o Portal do Responsável
-- Libera acesso para que os pais vejam seus próprios dados e os dados de seus filhos

-- 1. Tabela 'responsaveis' (O pai vê seu próprio perfil)
DROP POLICY IF EXISTS "Pais podem ver seu próprio perfil" ON public.responsaveis;
CREATE POLICY "Pais podem ver seu próprio perfil" 
ON public.responsaveis FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Tabela 'aluno_responsavel' (O pai vê a ligação entre ele e seus filhos)
DROP POLICY IF EXISTS "Pais podem ver seus próprios vínculos" ON public.aluno_responsavel;
CREATE POLICY "Pais podem ver seus próprios vínculos" 
ON public.aluno_responsavel FOR SELECT 
TO authenticated 
USING (responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid()));

-- 3. Tabela 'alunos' (O pai vê apenas dados dos alunos que estão vinculados a ele)
DROP POLICY IF EXISTS "Pais podem ver dados dos seus filhos" ON public.alunos;
CREATE POLICY "Pais podem ver dados dos seus filhos" 
ON public.alunos FOR SELECT 
TO authenticated 
USING (id IN (
    SELECT aluno_id FROM public.aluno_responsavel 
    WHERE responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
));

-- 4. Tabela 'frequencias' (O pai vê as faltas/presenças dos filhos)
DROP POLICY IF EXISTS "Pais veem frequencia dos filhos" ON public.frequencias;
CREATE POLICY "Pais veem frequencia dos filhos" 
ON public.frequencias FOR SELECT 
TO authenticated 
USING (aluno_id IN (
    SELECT aluno_id FROM public.aluno_responsavel 
    WHERE responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
));

-- 5. Tabela 'cobrancas' (O pai vê apenas cobranças dos filhos vinculados)
DROP POLICY IF EXISTS "Pais veem cobrancas vinculadas" ON public.cobrancas;
CREATE POLICY "Pais veem cobrancas vinculadas" 
ON public.cobrancas FOR SELECT 
TO authenticated 
USING (aluno_id IN (
    SELECT aluno_id FROM public.aluno_responsavel 
    WHERE responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
));

-- 6. Tabela 'mural_avisos' (Permitir que pais vejam avisos da sua escola)
-- Busca avisos onde o tenant_id da escola bate com o tenant_id do seu filho vinculado
DROP POLICY IF EXISTS "Pais veem avisos da sua escola" ON public.mural_avisos;
CREATE POLICY "Pais veem avisos da sua escola" 
ON public.mural_avisos FOR SELECT 
TO authenticated 
USING (tenant_id IN (
    SELECT tenant_id FROM public.alunos 
    WHERE id IN (
        SELECT aluno_id FROM public.aluno_responsavel 
        WHERE responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
    )
));
