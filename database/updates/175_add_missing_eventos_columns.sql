-- ==========================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA EVENTOS
-- ==========================================================

ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fim TIME,
ADD COLUMN IF NOT EXISTS local TEXT;

-- Garantir que as permissões de RLS continuem funcionando
-- (Já existem políticas FOR ALL, então novas colunas são cobertas automaticamente)

-- Atualizar eventos existentes com o horário padrão solicitado pelo usuário
UPDATE public.eventos 
SET hora_inicio = '08:00', 
    hora_fim = '17:00' 
WHERE hora_inicio IS NULL;
