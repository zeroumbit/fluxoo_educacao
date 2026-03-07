-- ==========================================
-- SCHEMA: MÓDULO DE AUTORIZAÇÕES DE RESPONSÁVEIS
-- Fluxoo Educação — Matrizes de Autorização Legais (LGPD/ECA)
-- Execute no Editor SQL do Supabase
-- ==========================================

-- ==========================================
-- 1. MODELOS DE AUTORIZAÇÃO (Templates globais + por escola)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.autorizacoes_modelos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.escolas(id) ON DELETE CASCADE, -- NULL = global (padrão do sistema)
    categoria text NOT NULL, -- 'matricula', 'saude', 'imagem', 'conduta', 'tecnologia', 'transporte', 'alimentacao', 'inclusao', 'religiosidade', 'projetos', 'eventos'
    titulo text NOT NULL,
    descricao_curta text NOT NULL, -- Descrição resumida para listagem
    texto_completo text NOT NULL, -- Texto legal completo que o responsável deve ler
    obrigatoria boolean DEFAULT false, -- Se true, não pode ser desativada
    ativa boolean DEFAULT true,
    ordem integer DEFAULT 0, -- Ordem de exibição dentro da categoria
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 2. RESPOSTAS DOS RESPONSÁVEIS POR ALUNO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.autorizacoes_respostas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    modelo_id uuid NOT NULL REFERENCES public.autorizacoes_modelos(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    responsavel_id uuid NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    aceita boolean NOT NULL DEFAULT false,
    texto_lido boolean DEFAULT false, -- confirma que o responsável rolou/leu o texto
    ip_address text, -- Para auditoria jurídica
    data_resposta timestamptz DEFAULT now(),
    data_revogacao timestamptz, -- Quando foi desautorizado (para histórico)
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(modelo_id, aluno_id, responsavel_id) -- Um responsável só pode ter uma resposta por modelo+aluno
);

-- ==========================================
-- 3. LOG DE AUDITORIA DE AUTORIZAÇÕES (Imutável)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.autorizacoes_auditoria (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    modelo_id uuid NOT NULL,
    aluno_id uuid NOT NULL,
    responsavel_id uuid NOT NULL,
    acao text NOT NULL CHECK (acao IN ('autorizou', 'revogou', 'releu')),
    texto_versao_hash text, -- Hash do texto para garantir que o texto lido é o mesmo
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_autorizacoes_modelos_tenant ON public.autorizacoes_modelos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_respostas_aluno ON public.autorizacoes_respostas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_respostas_responsavel ON public.autorizacoes_respostas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_autorizacoes_respostas_modelo ON public.autorizacoes_respostas(modelo_id);

-- ==========================================
-- TRIGGERS updated_at
-- ==========================================
DO $$ 
BEGIN
    BEGIN
        CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.autorizacoes_modelos 
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.autorizacoes_respostas 
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- ==========================================
-- DESABILITAR RLS (padrão do projeto)
-- ==========================================
ALTER TABLE public.autorizacoes_modelos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_respostas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.autorizacoes_auditoria DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. INSERIR MODELOS GLOBAIS (tenant_id = NULL = Sistema)
-- ==========================================

-- CATEGORIA: Matrícula e Documentação Inicial
INSERT INTO public.autorizacoes_modelos (id, tenant_id, categoria, titulo, descricao_curta, texto_completo, obrigatoria, ordem) VALUES
(uuid_generate_v4(), NULL, 'matricula', 'Contrato de Prestação de Serviços Educacionais', 
 'Aceite dos termos e obrigações do contrato educacional para o ano letivo.', 
 'Declaro, na qualidade de responsável legal e financeiro pelo aluno, que li, compreendi e concordo integralmente com todas as cláusulas do Contrato de Prestação de Serviços Educacionais referente ao presente ano letivo. Aceito as obrigações financeiras ali estabelecidas, bem como as diretrizes pedagógicas institucionais, reconhecendo que o presente aceite digital, autenticado por login e senha, possui validade jurídica equivalente à assinatura física em papel.',
 true, 10),

(uuid_generate_v4(), NULL, 'matricula', 'Declaração de Veracidade de Documentos',
 'Confirmação da autenticidade de todos os documentos apresentados na matrícula.',
 'Declaro, sob as penas do Artigo 299 do Código Penal Brasileiro (Falsidade Ideológica), que todas as informações prestadas neste ato de matrícula e os documentos anexados (físicos ou digitais) são autênticos, atuais e verdadeiros. Comprometo-me a manter o cadastro atualizado junto à secretaria e eximo a instituição de ensino de qualquer responsabilidade decorrente de dados incorretos ou omissões.',
 true, 20),

(uuid_generate_v4(), NULL, 'matricula', 'Autorização para Inclusão em Cadastro Escolar (LGPD)',
 'Consentimento para coleta e tratamento de dados pessoais conforme a LGPD.',
 'Em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), consinto de forma livre, expressa e inequívoca com a coleta, armazenamento e tratamento dos dados pessoais e sensíveis do aluno menor de idade, visando o seu melhor interesse (Art. 14, § 1º). Autorizo a utilização destes dados exclusivamente para finalidades educacionais, administrativas, de segurança física e cumprimento de obrigações legais impostas pelo Ministério da Educação (MEC).',
 true, 30),

-- CATEGORIA: Saúde e Emergências
(uuid_generate_v4(), NULL, 'saude', 'Ficha de Saúde do Aluno',
 'Ateste de veracidade das informações de saúde e compromisso de atualização.',
 'Atesto a veracidade e a precisão das informações médicas, diagnósticos e histórico de saúde declarados na Ficha Anamnese do aluno. Reconheço ser minha exclusiva responsabilidade informar imediatamente à secretaria da escola, formalmente e por escrito, sobre o surgimento de novas alergias, intolerâncias, síndromes ou condições médicas que afetem o bem-estar e a rotina do menor.',
 true, 10),

(uuid_generate_v4(), NULL, 'saude', 'Autorização para Administração de Medicamentos',
 'Autoriza a escola a ministrar medicamentos mediante receita médica.',
 'Autorizo a equipe escolar a ministrar medicamentos ao aluno SOMENTE mediante a apresentação de receita médica atualizada (com o respectivo CRM), com dosagem e horários claros, acompanhada do medicamento na embalagem original. Isento a instituição e os seus colaboradores de qualquer responsabilidade civil e penal por eventuais reações adversas, efeitos colaterais imprevisíveis ou choque anafilático decorrentes da administração estritamente fiel à prescrição fornecida.',
 false, 20),

(uuid_generate_v4(), NULL, 'saude', 'Autorização para Atendimento Médico de Emergência',
 'Autoriza a escola a providenciar atendimento emergencial em caso de acidente grave.',
 'No estrito cumprimento do direito fundamental à vida e à saúde (Art. 7º do ECA), autorizo a escola a providenciar atendimento emergencial imediato (acionamento do SAMU ou encaminhamento para o pronto-socorro ou hospital mais próximo) em caso de acidentes graves ou mal súbito, caso não seja possível estabelecer contato imediato nos números de emergência cadastrados. Os custos hospitalares, de transporte ou médicos decorrentes serão de inteira responsabilidade familiar.',
 false, 30),

(uuid_generate_v4(), NULL, 'saude', 'Declaração de Vacinação',
 'Compromisso com a manutenção do esquema vacinal conforme o ECA.',
 'Declaro ciência de que a apresentação da Carteira de Vacinação atualizada é obrigatória para a efetivação da matrícula, conforme previsto no Art. 14, § 1º, do ECA. Comprometo-me a manter o esquema vacinal do aluno rigorosamente em dia com as diretrizes do Programa Nacional de Imunizações (PNI), assumindo a responsabilidade legal perante as autoridades sanitárias em caso de omissão.',
 true, 40),

-- CATEGORIA: Imagem e Comunicação
(uuid_generate_v4(), NULL, 'imagem', 'Autorização de Uso de Imagem e Voz',
 'Cessão gratuita e irrevogável de uso de imagem e voz para fins institucionais.',
 'Cedo e autorizo, de forma gratuita, universal, irrevogável e por tempo indeterminado, a utilização da imagem e voz do aluno(a) captadas no ambiente escolar ou em eventos externos oficiais. Esta autorização abrange o uso institucional, pedagógico e informativo em redes sociais da escola, site institucional, folhetos, anuários e materiais impressos, sendo estritamente vedado qualquer uso que fira a dignidade, a imagem e a honra do menor, conforme prevê o ECA e a LGPD.',
 false, 10),

(uuid_generate_v4(), NULL, 'imagem', 'Autorização para Publicação de Trabalhos Escolares',
 'Autoriza a exposição e publicação de trabalhos acadêmicos do aluno.',
 'Autorizo a exposição, publicação e o compartilhamento de produções intelectuais, artísticas, científicas ou acadêmicas criadas pelo aluno no âmbito das disciplinas escolares. A publicação poderá ocorrer em murais físicos, plataformas digitais de ensino, jornais escolares e redes sociais oficiais, garantindo-se sempre a correta atribuição de autoria ao aluno, visando a valorização do seu percurso pedagógico.',
 false, 20),

(uuid_generate_v4(), NULL, 'imagem', 'Consentimento para Comunicação Digital (WhatsApp/E-mail)',
 'Autoriza a inclusão em grupos e listas de transmissão institucionais.',
 'Autorizo a inclusão dos meus contatos telefônicos e de e-mail nas listas de transmissão institucionais e grupos oficiais geridos pela escola (WhatsApp, Telegram, etc.). Consinto com o recebimento de informativos, lembretes financeiros e alertas pedagógicos. Concordo em manter o decoro, a cordialidade e o respeito nas interações com o corpo docente e outros pais, respeitando os horários comerciais e os Termos de Uso das referidas plataformas.',
 false, 30),

-- CATEGORIA: Conduta e Convivência
(uuid_generate_v4(), NULL, 'conduta', 'Ciência do Regimento Escolar',
 'Confirmação de leitura e aceite do Regimento Escolar e Manual de Convivência.',
 'Declaro que tive amplo acesso, li, compreendi e concordo integralmente com o Regimento Escolar e o Manual de Convivência da instituição. Comprometo-me a atuar em forte parceria com a escola para garantir que o menor cumpra os seus deveres acadêmicos, respeite as normas de civilidade, o código de vestimenta (uso de uniforme) e os horários estabelecidos.',
 true, 10),

(uuid_generate_v4(), NULL, 'conduta', 'Termo de Responsabilidade por Danos Patrimoniais',
 'Compromisso de ressarcimento por danos causados pelo aluno ao patrimônio escolar.',
 'Ciente do que dispõe o Código Civil Brasileiro (Art. 932, inciso I), que trata da responsabilidade dos pais pelos filhos menores, assumo a responsabilidade objetiva e comprometo-me a ressarcir ou reparar integralmente os custos relativos a qualquer dano causado pelo aluno ao patrimônio físico, tecnológico (computadores, tablets), mobiliário da escola ou a bens de terceiros, seja de forma culposa ou dolosa.',
 true, 20),

(uuid_generate_v4(), NULL, 'conduta', 'Ciência de Medidas Disciplinares',
 'Autoriza a aplicação de sanções pedagógicas progressivas em caso de infrações.',
 'Estou ciente do sistema de sanções pedagógicas adotado pela escola, que inclui orientações verbais, advertências escritas, afastamento temporário (suspensão) e, em casos extremos, o cancelamento da matrícula (transferência compulsória). Autorizo a aplicação destas medidas de forma progressiva, razoável e proporcional pela coordenação pedagógica em resposta a infrações ao regimento, agressões ou práticas comprovadas de bullying.',
 true, 30),

-- CATEGORIA: Tecnologia e Internet
(uuid_generate_v4(), NULL, 'tecnologia', 'Autorização para Uso de Dispositivos Pessoais (BYOD)',
 'Autoriza o porte e uso de dispositivos eletrônicos pessoais para fins pedagógicos.',
 'Autorizo que o aluno porte e utilize dispositivos eletrônicos pessoais (celular, tablet, notebook) no ambiente escolar ESTRITAMENTE quando solicitado pelo professor para fins pedagógicos. Declaro estar ciente de que o uso indevido resultará na retenção do aparelho (entregue apenas aos pais no final do turno) e isento a instituição de qualquer responsabilidade em caso de perda, furto, roubo ou dano acidental ao equipamento.',
 false, 10),

(uuid_generate_v4(), NULL, 'tecnologia', 'Autorização para Acesso à Internet e Wi-Fi',
 'Autoriza o acesso à rede institucional com ciência dos Termos de Uso.',
 'Autorizo o aluno a acessar a rede de internet institucional (Wi-Fi). Tenho conhecimento de que a escola utiliza filtros (firewalls) para bloquear conteúdos impróprios. Contudo, assumo responsabilidade solidária caso o aluno, burlando as regras, utilize a rede para práticas ilícitas, cyberbullying, acesso a conteúdos inadequados para a idade ou invasão de sistemas, em conformidade com o Marco Civil da Internet.',
 false, 20),

(uuid_generate_v4(), NULL, 'tecnologia', 'Termo para Plataformas Digitais de Aprendizagem',
 'Autoriza o compartilhamento de dados básicos com plataformas educacionais parceiras.',
 'Autorizo, nos limites da LGPD, que a escola compartilhe o nome, a turma e a data de nascimento do aluno com provedores de tecnologia educacional parceiros (ex: Google Workspace for Education, Microsoft Teams, Plataformas de Editoras) EXCLUSIVAMENTE para a criação do e-mail institucional e credenciais de acesso essenciais para a realização de tarefas, provas online e acompanhamento acadêmico.',
 false, 30),

-- CATEGORIA: Transporte e Saída
(uuid_generate_v4(), NULL, 'transporte', 'Autorização para Transporte Escolar / Translados',
 'Autoriza o transporte em veículos da frota escolar ou empresas terceirizadas.',
 'Autorizo o transporte do aluno em veículos da frota escolar ou empresas terceirizadas devidamente credenciadas pela escola para atividades de rotina, visitas de estudo, deslocamentos entre polos (se aplicável) ou logística de entrada/saída. A escola assegura a utilização de veículos devidamente vistoriados pelos órgãos de trânsito e conduzidos por motoristas habilitados.',
 false, 10),

(uuid_generate_v4(), NULL, 'transporte', 'Autorização para o Aluno Ir Embora Sozinho',
 'Autoriza o aluno a deixar as dependências da escola desacompanhado.',
 'No pleno exercício do meu poder familiar e avaliando a maturidade do menor, AUTORIZO EXPRESSAMENTE que o aluno deixe as dependências da escola DESACOMPANHADO após o término do seu horário regular de aulas. A partir do exato momento em que o aluno ultrapassa as catracas/portões da instituição para a via pública, isento a escola de toda e qualquer responsabilidade civil e criminal sobre o seu trajeto e guarda.',
 false, 20),

-- CATEGORIA: Alimentação
(uuid_generate_v4(), NULL, 'alimentacao', 'Autorização para Lanches Diferenciados (Festividades)',
 'Autoriza o consumo de lanches especiais em datas comemorativas.',
 'Autorizo que o aluno consuma lanches diferenciados (doces, bolos, salgados) enviados por outros pais ou organizados pela escola em ocasiões de confraternizações, Páscoa, Dia das Crianças e aniversários. Declaro que o menor NÃO possui restrições severas não controláveis. (Nota: Crianças com dietas restritivas severas deverão consumir apenas os itens enviados na própria lancheira).',
 false, 10),

(uuid_generate_v4(), NULL, 'alimentacao', 'Responsabilidade sobre Restrições Alimentares',
 'Confirmação de responsabilidade sobre possível contaminação cruzada em ambiente escolar.',
 'Caso o aluno possua restrições alimentares declaradas na ficha de saúde, afirmo que o instruí de forma clara a não compartilhar lanches com os colegas. Reconheço que, embora a escola monitore os intervalos e o refeitório, em um ambiente de convívio social aberto a escola não pode garantir a ausência total de contaminação cruzada caso a criança aceite alimentos alheios sem supervisão direta contínua.',
 false, 20),

-- CATEGORIA: Inclusão e AEE
(uuid_generate_v4(), NULL, 'inclusao', 'Autorização para Atendimento Educacional Especializado (AEE)',
 'Autoriza triagens e acompanhamentos por profissionais de psicologia/psicopedagogia.',
 'Autorizo a equipe pedagógica a submeter o aluno a observações, triagens em sala de aula e acompanhamentos pontuais realizados pelos profissionais de psicologia ou psicopedagogia do Núcleo de Apoio da escola, com o objetivo exclusivo de identificar precocemente potenciais dificuldades de aprendizagem, superdotação ou necessidades de adaptação metodológica.',
 false, 10),

(uuid_generate_v4(), NULL, 'inclusao', 'Compartilhamento e Guarda de Laudos Médicos',
 'Autoriza o armazenamento de laudos e diagnósticos com acesso restrito.',
 'Autorizo o armazenamento de laudos, avaliações neuropsicológicas e diagnósticos clínicos entregues à escola, com garantia de sigilo e acesso restrito (Art. 11, LGPD). Consinto com o compartilhamento interno destas informações exclusivamente com a coordenação e com os professores titulares que atuam diretamente com o aluno, para a devida compreensão das suas necessidades e aplicação de estratégias de inclusão.',
 false, 20),

(uuid_generate_v4(), NULL, 'inclusao', 'Plano Educacional Individualizado (PEI)',
 'Ciência e anuência com a elaboração e aplicação do PEI.',
 'Declaro ciência e anuência com a elaboração, aplicação e avaliação contínua do Plano Educacional Individualizado (PEI) ou das flexibilizações curriculares propostas pela escola para atender às necessidades específicas do aluno, garantindo o apoio pedagógico e a equidade no processo avaliativo.',
 false, 30),

-- CATEGORIA: Projetos e Parcerias
(uuid_generate_v4(), NULL, 'projetos', 'Autorização para Avaliações e Competições Externas',
 'Autoriza a participação em olimpíadas, feiras e competições representando a escola.',
 'Autorizo o aluno a representar a escola em competições esportivas, olimpíadas do conhecimento (Matemática, Física, Robótica), feiras científicas e simulações internacionais. Autorizo o envio dos dados cadastrais básicos do aluno exigidos para as inscrições nas plataformas dos respectivos órgãos organizadores (governamentais ou privados).',
 false, 10),

(uuid_generate_v4(), NULL, 'projetos', 'Projetos com Terceiros e Intercâmbio',
 'Autoriza apresentação do perfil acadêmico para programas de intercâmbio e orientação vocacional.',
 'Autorizo a escola a realizar inscrições preliminares ou a apresentar o perfil acadêmico do aluno a instituições de ensino superior, ONGs, programas de Intercâmbio e empresas integradoras de Jovem Aprendiz (CIEE, etc.), exclusivamente no contexto de feiras de profissões, ofertas de bolsas de estudo ou projetos de orientação vocacional.',
 false, 20),

-- CATEGORIA: Eventos
(uuid_generate_v4(), NULL, 'eventos', 'Autorização Genérica para Saídas Locais',
 'Autoriza saídas pedagógicas de curta duração no entorno da escola.',
 'Autorizo a saída do aluno das dependências físicas da instituição, APENAS durante o turno letivo e SEMPRE sob a supervisão direta de professores/monitores, para atividades pedagógicas de curta duração no entorno próximo (ida a praças, parques do bairro, bibliotecas municipais vizinhas ou caminhadas de observação ecológica).',
 false, 10),

(uuid_generate_v4(), NULL, 'eventos', 'Termo de Ciência para Eventos Noturnos',
 'Ciência de responsabilidade pela pontualidade em eventos noturnos escolares.',
 'Declaro estar ciente de que a participação do aluno em eventos escolares que ocorram no período noturno (Feira de Ciências, Festa Junina, Halloween, Formaturas) exige o cumprimento rigoroso dos horários de início e término estipulados pela instituição, assumindo a responsabilidade por pontualidade no momento de buscar o menor, sob pena de acionamento do Conselho Tutelar em caso de abandono após o encerramento do evento.',
 false, 20)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.autorizacoes_modelos IS 'Modelos de termos de autorização — globais (tenant_id NULL) ou personalizados por escola';
COMMENT ON TABLE public.autorizacoes_respostas IS 'Respostas dos responsáveis para cada autorização, por aluno';
COMMENT ON TABLE public.autorizacoes_auditoria IS 'Log imutável de todas as ações de autorização/revogação para fins jurídicos';
