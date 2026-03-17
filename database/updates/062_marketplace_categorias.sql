-- ==========================================================
-- 🛒 MIGRATION 062: MARKETPLACE E CATEGORIAS
-- Descrição: Cria estrutura para categorias globais do marketplace
--            e configurações da plataforma.
-- ==========================================================

-- 1. Tabela de Categorias do Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    icone TEXT DEFAULT 'Package', -- Nome do ícone do lucide
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.marketplace_categorias ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança
-- Política para Super Admin (Acesso Total)
CREATE POLICY "super_admin_all_categorias" ON public.marketplace_categorias
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin');

-- Todos os usuários autenticados podem ler as categorias (para exibir no marketplace)
CREATE POLICY "all_read_categorias" ON public.marketplace_categorias
    FOR SELECT TO authenticated USING (true);

-- 4. Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_marketplace_categorias_updated_at
    BEFORE UPDATE ON public.marketplace_categorias
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Seed de Categorias Iniciais
INSERT INTO public.marketplace_categorias (nome, descricao, icone) VALUES
('Livros', 'Livros didáticos, literatura e material de apoio', 'BookOpen'),
('Materiais', 'Papelaria, estojos, mochilas e outros itens escolares', 'Package'),
('Serviços', 'Aulas particulares, reforço escolar e monitoria', 'Users'),
('Vestuário', 'Uniformes oficiais, camisetas de eventos e agasalhos', 'Tag')
ON CONFLICT (nome) DO NOTHING;
