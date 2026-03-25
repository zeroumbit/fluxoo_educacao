-- ====================================================================================
-- MIGRAÇÃO 127: AJUSTE DE CAMPOS PERFIL PORTAL (PARIDADE COM ADMIN)
-- Objetivo: Garantir que o Portal use as mesmas colunas do Admin e Storage para Foto.
-- ====================================================================================

-- 1. Garantir coluna de Foto se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'foto_url') THEN
        ALTER TABLE public.alunos ADD COLUMN foto_url TEXT;
    END IF;
END $$;

-- Nota: As colunas de endereço (logradouro, numero, bairro, etc) já existem conforme database.types.ts.
-- Nota: As colunas de saúde (patologias, medicamentos, observacoes_saude) já existem conforme database.types.ts.

-- 2. Garantir coluna 'genero' (Usuário reportou erro com 'sexo')
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alunos' AND column_name = 'genero') THEN
        ALTER TABLE public.alunos ADD COLUMN genero TEXT;
    END IF;
END $$;

-- 3. Criar Bucket de Fotos (IDEM ANTERIOR, mas garantindo segurança)
-- Execute via Interface do Supabase se falhar aqui.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('alunos_fotos', 'alunos_fotos', true) ON CONFLICT (id) DO NOTHING;

-- 4. Função de Proteção de Atualização (Blindagem Administrativa)
-- Versão corrigida com os campos reais da tabela
CREATE OR REPLACE FUNCTION public.tr_check_aluno_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o usuário logado for 'responsavel', bloquear alteração de campos críticos
    IF (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'responsavel' THEN
        -- Campos que o responsável NÃO pode alterar (Integridade Escolar)
        IF NEW.nome_completo <> OLD.nome_completo OR
           NEW.data_nascimento <> OLD.data_nascimento OR
           NEW.tenant_id <> OLD.tenant_id OR
           NEW.filial_id <> OLD.filial_id OR
           NEW.status <> OLD.status OR
           NEW.cpf IS DISTINCT FROM OLD.cpf THEN
            RAISE EXCEPTION 'Responsáveis não podem alterar dados de identificação crítica. Contate a secretaria.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Reaplicar Trigger
DROP TRIGGER IF EXISTS tr_check_aluno_update_portal ON public.alunos;
CREATE TRIGGER tr_check_aluno_update_portal
BEFORE UPDATE ON public.alunos
FOR EACH ROW EXECUTE FUNCTION public.tr_check_aluno_update();

-- 6. Políticas de RLS para as novas colunas (Geralmente a Universal_Update já cobre, mas vamos reforçar)
DROP POLICY IF EXISTS "Responsável_Update_Dados_Aluno" ON public.alunos;
CREATE POLICY "Responsável_Update_Dados_Aluno" ON public.alunos
FOR UPDATE TO authenticated
USING ( id IN (SELECT public.get_my_children()) )
WITH CHECK ( id IN (SELECT public.get_my_children()) );
