-- Ajuste nas políticas de RLS para Boletins
-- Garante que o Admin consiga salvar e o Responsável consiga ler

-- 1. Remover políiticas antigas se existirem
DROP POLICY IF EXISTS "Escolas veem apenas seus boletins" ON public.boletins;
DROP POLICY IF EXISTS "Responsaveis veem boletins dos seus alunos" ON public.boletins;

-- 2. Política para Gestores/Escolas (CRUD completo)
CREATE POLICY "Gestores podem gerenciar boletins da sua escola"
ON public.boletins FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT id FROM public.escolas 
    WHERE gestor_user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT id FROM public.escolas 
    WHERE gestor_user_id = auth.uid()
  )
);

-- 3. Política para Responsáveis (Apenas Leitura dos seus alunos)
CREATE POLICY "Responsaveis podem ver boletins dos seus filhos"
ON public.boletins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.aluno_responsavel ar
    WHERE ar.aluno_id = boletins.aluno_id
    AND ar.responsavel_id IN (
      SELECT id FROM public.responsaveis WHERE user_id = auth.uid()
    )
    AND ar.status = 'ativo'
  )
);
