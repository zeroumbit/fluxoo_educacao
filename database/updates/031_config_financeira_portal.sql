-- Migration 031: Adicionar colunas faltantes para o Portal do Responsável (Financeiro)
-- Garante que a escola tenha campos para exibir dados de pagamento aos pais

-- 1. Adicionar colunas de texto para instruções e favorecido
ALTER TABLE public.config_financeira 
ADD COLUMN IF NOT EXISTS nome_favorecido text,
ADD COLUMN IF NOT EXISTS instrucoes_responsavel text;

-- 2. Também garantir que a coluna 'pix_habilitado' exista (caso não esteja com esse nome exato)
-- Embora a migração 008 já crie, garantimos aqui.
ALTER TABLE public.config_financeira 
ADD COLUMN IF NOT EXISTS pix_habilitado boolean DEFAULT false;

-- 3. Caso a consulta no front-end esteja buscando por 'pix_chave_tipo' (visto em logs)
-- Adicionamos essa coluna também para evitar erros 400
ALTER TABLE public.config_financeira 
ADD COLUMN IF NOT EXISTS pix_chave_tipo text;

-- 4. Garantir que as permissões de leitura (RLS) existam para as escolas
-- O pai precisa conseguir ler as configurações da escola do seu filho
DROP POLICY IF EXISTS "Pais veem configs financeiras da sua escola" ON public.config_financeira;
CREATE POLICY "Pais veem configs financeiras da sua escola" 
ON public.config_financeira FOR SELECT 
TO authenticated 
USING (tenant_id IN (
    SELECT tenant_id FROM public.alunos 
    WHERE id IN (
        SELECT aluno_id FROM public.aluno_responsavel 
        WHERE responsavel_id IN (SELECT id FROM public.responsaveis WHERE user_id = auth.uid())
    )
));
