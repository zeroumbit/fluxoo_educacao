-- =============================================================================
-- 040: Funções de Funcionários
-- Cria tabela de catálogo de funções (globais + custom por escola)
-- Adiciona coluna funcoes[] à tabela funcionarios (multi-função)
-- =============================================================================

-- Tabela de catálogo de funções escolares
CREATE TABLE IF NOT EXISTS funcoes_escola (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES escolas(id) ON DELETE CASCADE, -- NULL = função global/padrão
  nome        text NOT NULL,
  categoria   text NOT NULL DEFAULT 'Outros',
  is_padrao   boolean NOT NULL DEFAULT false, -- true = pré-carregada, false = criada pela escola
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, nome)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_funcoes_escola_tenant   ON funcoes_escola (tenant_id);
CREATE INDEX IF NOT EXISTS idx_funcoes_escola_padrao   ON funcoes_escola (is_padrao) WHERE is_padrao = true;

-- RLS
ALTER TABLE funcoes_escola ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funcoes_escola_select" ON funcoes_escola
  FOR SELECT USING (
    tenant_id IS NULL  -- funções globais: todos podem ver
    OR tenant_id = (SELECT id FROM escolas WHERE id = auth.uid()
                    UNION
                    SELECT tenant_id FROM funcionarios WHERE user_id = auth.uid()
                    LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM escolas WHERE gestor_user_id = auth.uid() AND id = funcoes_escola.tenant_id
    )
  );

CREATE POLICY "funcoes_escola_insert" ON funcoes_escola
  FOR INSERT WITH CHECK (
    tenant_id IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM escolas WHERE gestor_user_id = auth.uid() AND id = funcoes_escola.tenant_id)
      OR EXISTS (SELECT 1 FROM funcionarios WHERE user_id = auth.uid() AND tenant_id = funcoes_escola.tenant_id)
    )
  );

CREATE POLICY "funcoes_escola_delete" ON funcoes_escola
  FOR DELETE USING (
    is_padrao = false
    AND EXISTS (
      SELECT 1 FROM escolas WHERE gestor_user_id = auth.uid() AND id = funcoes_escola.tenant_id
    )
  );

-- Adiciona coluna funcoes (array de nomes de função) na tabela funcionarios
ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS funcoes text[] DEFAULT '{}';

-- Popula funcoes[] a partir da coluna legada funcao (se existir)
UPDATE funcionarios
SET funcoes = ARRAY[funcao]
WHERE funcao IS NOT NULL AND funcao <> '' AND (funcoes IS NULL OR funcoes = '{}');

-- =============================================================================
-- Seed: Funções pré-definidas (globais — tenant_id NULL)
-- =============================================================================
INSERT INTO funcoes_escola (tenant_id, nome, categoria, is_padrao) VALUES
-- 1. Direção e Gestão Geral
(NULL, 'Diretor / Diretora', '1. Direção e Gestão Geral', true),
(NULL, 'Vice-Diretor / Vice-Diretora', '1. Direção e Gestão Geral', true),
(NULL, 'Coordenador Geral', '1. Direção e Gestão Geral', true),
(NULL, 'Superintendente Escolar', '1. Direção e Gestão Geral', true),
(NULL, 'Mantenedor', '1. Direção e Gestão Geral', true),
-- 2. Coordenação e Supervisão Pedagógica
(NULL, 'Coordenador Pedagógico', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Supervisor de Ensino', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Orientador Educacional', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Orientador de Estudos', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Coordenador de Área', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Coordenador de Projetos Especiais', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Coordenador de Educação Infantil', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Coordenador de Ensino Fundamental', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Coordenador de Ensino Médio', '2. Coordenação e Supervisão Pedagógica', true),
(NULL, 'Coordenador de Educação Inclusiva', '2. Coordenação e Supervisão Pedagógica', true),
-- 3. Corpo Docente
(NULL, 'Professor de Educação Infantil', '3. Corpo Docente', true),
(NULL, 'Professor de Ensino Fundamental I', '3. Corpo Docente', true),
(NULL, 'Professor de Língua Portuguesa', '3. Corpo Docente', true),
(NULL, 'Professor de Matemática', '3. Corpo Docente', true),
(NULL, 'Professor de Ciências', '3. Corpo Docente', true),
(NULL, 'Professor de Biologia', '3. Corpo Docente', true),
(NULL, 'Professor de Física', '3. Corpo Docente', true),
(NULL, 'Professor de Química', '3. Corpo Docente', true),
(NULL, 'Professor de História', '3. Corpo Docente', true),
(NULL, 'Professor de Geografia', '3. Corpo Docente', true),
(NULL, 'Professor de Filosofia', '3. Corpo Docente', true),
(NULL, 'Professor de Sociologia', '3. Corpo Docente', true),
(NULL, 'Professor de Artes', '3. Corpo Docente', true),
(NULL, 'Professor de Música', '3. Corpo Docente', true),
(NULL, 'Professor de Teatro', '3. Corpo Docente', true),
(NULL, 'Professor de Educação Física', '3. Corpo Docente', true),
(NULL, 'Professor de Inglês', '3. Corpo Docente', true),
(NULL, 'Professor de Espanhol', '3. Corpo Docente', true),
(NULL, 'Professor de Francês', '3. Corpo Docente', true),
(NULL, 'Professor de Alemão', '3. Corpo Docente', true),
(NULL, 'Professor de Libras', '3. Corpo Docente', true),
(NULL, 'Professor de Literatura', '3. Corpo Docente', true),
(NULL, 'Professor de Redação', '3. Corpo Docente', true),
(NULL, 'Professor de Informática / Tecnologia', '3. Corpo Docente', true),
(NULL, 'Professor de Robótica', '3. Corpo Docente', true),
(NULL, 'Professor de Projeto de Vida', '3. Corpo Docente', true),
(NULL, 'Professor de Ensino Religioso', '3. Corpo Docente', true),
(NULL, 'Professor de Empreendedorismo', '3. Corpo Docente', true),
(NULL, 'Professor de Educação Financeira', '3. Corpo Docente', true),
(NULL, 'Professor de Cidadania e Ética', '3. Corpo Docente', true),
-- 4. Equipe Técnico-Pedagógica
(NULL, 'Psicólogo Escolar', '4. Equipe Técnico-Pedagógica', true),
(NULL, 'Psicopedagogo', '4. Equipe Técnico-Pedagógica', true),
(NULL, 'Assistente Social', '4. Equipe Técnico-Pedagógica', true),
(NULL, 'Fonoaudiólogo Escolar', '4. Equipe Técnico-Pedagógica', true),
(NULL, 'Nutricionista Escolar', '4. Equipe Técnico-Pedagógica', true),
(NULL, 'Orientador Vocacional / Profissional', '4. Equipe Técnico-Pedagógica', true),
-- 5. Secretaria e Administração
(NULL, 'Secretário Escolar', '5. Secretaria e Administração', true),
(NULL, 'Assistente de Secretaria', '5. Secretaria e Administração', true),
(NULL, 'Auxiliar de Secretaria', '5. Secretaria e Administração', true),
(NULL, 'Responsável por Matrículas', '5. Secretaria e Administração', true),
(NULL, 'Atendente / Recepcionista', '5. Secretaria e Administração', true),
(NULL, 'Auxiliar Administrativo', '5. Secretaria e Administração', true),
(NULL, 'Assistente Financeiro', '5. Secretaria e Administração', true),
(NULL, 'Tesoureiro', '5. Secretaria e Administração', true),
(NULL, 'Analista de Recursos Humanos', '5. Secretaria e Administração', true),
(NULL, 'Auxiliar de Recursos Humanos', '5. Secretaria e Administração', true),
(NULL, 'Auxiliar de Departamento Pessoal', '5. Secretaria e Administração', true),
-- 6. Equipe de Apoio Pedagógico
(NULL, 'Monitor / Auxiliar de Sala', '6. Equipe de Apoio Pedagógico', true),
(NULL, 'Auxiliar de Educação Infantil', '6. Equipe de Apoio Pedagógico', true),
(NULL, 'Estagiário de Pedagogia', '6. Equipe de Apoio Pedagógico', true),
(NULL, 'Estagiário de Licenciaturas', '6. Equipe de Apoio Pedagógico', true),
(NULL, 'Tutor', '6. Equipe de Apoio Pedagógico', true),
(NULL, 'Acompanhante de Aluno com Deficiência', '6. Equipe de Apoio Pedagógico', true),
-- 7. Biblioteca e Laboratórios
(NULL, 'Bibliotecário', '7. Biblioteca e Laboratórios', true),
(NULL, 'Auxiliar de Biblioteca', '7. Biblioteca e Laboratórios', true),
(NULL, 'Técnico de Laboratório de Informática', '7. Biblioteca e Laboratórios', true),
(NULL, 'Técnico de Laboratório de Ciências', '7. Biblioteca e Laboratórios', true),
(NULL, 'Técnico de Laboratório de Robótica', '7. Biblioteca e Laboratórios', true),
(NULL, 'Monitor de Laboratório', '7. Biblioteca e Laboratórios', true),
-- 8. Orientação e Disciplina
(NULL, 'Coordenador de Disciplina', '8. Orientação e Disciplina', true),
(NULL, 'Orientador de Convivência', '8. Orientação e Disciplina', true),
(NULL, 'Inspetor de Alunos', '8. Orientação e Disciplina', true),
(NULL, 'Supervisor de Corredores / Pátio', '8. Orientação e Disciplina', true),
(NULL, 'Mediador de Conflitos', '8. Orientação e Disciplina', true),
-- 9. Equipe de Apoio Operacional
(NULL, 'Auxiliar de Serviços Gerais', '9. Equipe de Apoio Operacional', true),
(NULL, 'Zelador', '9. Equipe de Apoio Operacional', true),
(NULL, 'Jardineiro', '9. Equipe de Apoio Operacional', true),
(NULL, 'Porteiro / Vigia', '9. Equipe de Apoio Operacional', true),
(NULL, 'Segurança Patrimonial', '9. Equipe de Apoio Operacional', true),
(NULL, 'Motorista', '9. Equipe de Apoio Operacional', true),
(NULL, 'Monitor de Transporte Escolar', '9. Equipe de Apoio Operacional', true),
(NULL, 'Merendeiro / Cozinheiro', '9. Equipe de Apoio Operacional', true),
(NULL, 'Auxiliar de Cozinha', '9. Equipe de Apoio Operacional', true),
(NULL, 'Almoxarife', '9. Equipe de Apoio Operacional', true),
(NULL, 'Repositor de Materiais', '9. Equipe de Apoio Operacional', true),
-- 10. Tecnologia e Comunicação
(NULL, 'Analista de TI / Suporte Técnico', '10. Tecnologia e Comunicação', true),
(NULL, 'Técnico de Informática', '10. Tecnologia e Comunicação', true),
(NULL, 'Web Designer / Designer Gráfico', '10. Tecnologia e Comunicação', true),
(NULL, 'Social Media / Analista de Comunicação', '10. Tecnologia e Comunicação', true),
(NULL, 'Fotógrafo / Cinegrafista', '10. Tecnologia e Comunicação', true),
(NULL, 'Editor de Conteúdo', '10. Tecnologia e Comunicação', true),
(NULL, 'Produtor de Material Didático Digital', '10. Tecnologia e Comunicação', true),
-- 11. Manutenção e Infraestrutura
(NULL, 'Técnico de Manutenção Predial', '11. Manutenção e Infraestrutura', true),
(NULL, 'Eletricista', '11. Manutenção e Infraestrutura', true),
(NULL, 'Bombeiro Hidráulico', '11. Manutenção e Infraestrutura', true),
(NULL, 'Pintor', '11. Manutenção e Infraestrutura', true),
(NULL, 'Carpinteiro / Marceneiro', '11. Manutenção e Infraestrutura', true),
-- 12. Serviços Terceirizados
(NULL, 'Empresa de Limpeza (terceirizado)', '12. Serviços Terceirizados', true),
(NULL, 'Empresa de Alimentação (terceirizado)', '12. Serviços Terceirizados', true),
(NULL, 'Empresa de Vigilância / Segurança (terceirizado)', '12. Serviços Terceirizados', true),
(NULL, 'Empresa de Transporte Escolar (terceirizado)', '12. Serviços Terceirizados', true),
(NULL, 'Empresa de Tecnologia (terceirizado)', '12. Serviços Terceirizados', true),
-- 13. Atendimento e Relação com a Comunidade
(NULL, 'Atendente de Secretaria Virtual', '13. Atendimento e Comunidade', true),
(NULL, 'Assistente de Relacionamento com Pais e Alunos', '13. Atendimento e Comunidade', true),
(NULL, 'Ouvidor / Canal de Denúncias', '13. Atendimento e Comunidade', true),
(NULL, 'Representante de Atendimento Comercial', '13. Atendimento e Comunidade', true),
-- 14. Gestão Financeira e Comercial
(NULL, 'Gerente Comercial', '14. Gestão Financeira e Comercial', true),
(NULL, 'Consultor de Vendas / Matrículas', '14. Gestão Financeira e Comercial', true),
(NULL, 'Analista de Marketing Educacional', '14. Gestão Financeira e Comercial', true),
(NULL, 'Assistente de Cobrança', '14. Gestão Financeira e Comercial', true),
(NULL, 'Assistente de Bolsas e Descontos', '14. Gestão Financeira e Comercial', true),
-- 15. Outros Cargos Específicos
(NULL, 'Capelão', '15. Outros Cargos Específicos', true),
(NULL, 'Missionário / Religioso', '15. Outros Cargos Específicos', true),
(NULL, 'Instrutor de Música Instrumental', '15. Outros Cargos Específicos', true),
(NULL, 'Instrutor de Esportes Específicos', '15. Outros Cargos Específicos', true),
(NULL, 'Coordenador de Intercâmbio', '15. Outros Cargos Específicos', true),
(NULL, 'Coordenador de Eventos Escolares', '15. Outros Cargos Específicos', true),
(NULL, 'Coordenador de Voluntariado', '15. Outros Cargos Específicos', true),
(NULL, 'Coordenador de Pastoral / Ação Social', '15. Outros Cargos Específicos', true)
ON CONFLICT (tenant_id, nome) DO NOTHING;
