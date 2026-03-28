export const MODELOS_SISTEMA_PADRAO = [
  {
    categoria: 'matricula',
    titulo: 'Contrato de Prestação de Serviços Educacionais',
    descricao_curta: 'Aceite dos termos e obrigações do contrato educacional para o ano letivo.',
    texto_completo: 'Declaro, na qualidade de responsável legal e financeiro pelo aluno, que li, compreendi e concordo integralmente com todas as cláusulas do Contrato de Prestação de Serviços Educacionais referente ao presente ano letivo. Aceito as obrigações financeiras ali estabelecidas, bem como as diretrizes pedagógicas institucionais, reconhecendo que o presente aceite digital, autenticado por login e senha, possui validade jurídica equivalente à assinatura física em papel.',
    obrigatoria: true,
    ordem: 10
  },
  {
    categoria: 'matricula',
    titulo: 'Declaração de Veracidade de Documentos',
    descricao_curta: 'Confirmação da autenticidade de todos os documentos apresentados na matrícula.',
    texto_completo: 'Declaro, sob as penas do Artigo 299 do Código Penal Brasileiro (Falsidade Ideológica), que todas as informações prestadas neste ato de matrícula e os documentos anexados (físicos ou digitais) são autênticos, atuais e verdadeiros. Comprometo-me a manter o cadastro atualizado junto à secretaria e eximo a instituição de ensino de qualquer responsabilidade decorrente de dados incorretos ou omissões.',
    obrigatoria: true,
    ordem: 20
  },
  {
    categoria: 'matricula',
    titulo: 'Autorização para Inclusão em Cadastro Escolar (LGPD)',
    descricao_curta: 'Consentimento para coleta e tratamento de dados pessoais conforme a LGPD.',
    texto_completo: 'Em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), consinto de forma livre, expressa e inequívoca com a coleta, armazenamento e tratamento dos dados pessoais e sensíveis do aluno menor de idade, visando o seu melhor interesse (Art. 14, § 1º). Autorizo a utilização destes dados exclusivamente para finalidades educacionais, administrativas, de segurança física e cumprimento de obrigações legais impostas pelo Ministério da Educação (MEC).',
    obrigatoria: true,
    ordem: 30
  },
  {
    categoria: 'saude',
    titulo: 'Ficha de Saúde do Aluno',
    descricao_curta: 'Ateste de veracidade das informações de saúde e compromisso de atualização.',
    texto_completo: 'Atesto a veracidade e a precisão das informações médicas, diagnósticos e histórico de saúde declarados na Ficha Anamnese do aluno. Reconheço ser minha exclusiva responsabilidade informar imediatamente à secretaria da escola, formalmente e por escrito, sobre o surgimento de novas alergias, intolerâncias, síndromes ou condições médicas que afetem o bem-estar e a rotina do menor.',
    obrigatoria: true,
    ordem: 10
  },
  {
    categoria: 'saude',
    titulo: 'Autorização para Atendimento Médico de Emergência',
    descricao_curta: 'Autoriza a escola a providenciar atendimento emergencial em caso de acidente grave.',
    texto_completo: 'No estrito cumprimento do direito fundamental à vida e à saúde (Art. 7º do ECA), autorizo a escola a providenciar atendimento emergencial imediato (acionamento do SAMU ou encaminhamento para o pronto-socorro ou hospital mais próximo) em caso de acidentes graves ou mal súbito, caso não seja possível estabelecer contato imediato nos números de emergência cadastrados. Os custos hospitalares, de transporte ou médicos decorrentes serão de inteira responsabilidade familiar.',
    obrigatoria: false,
    ordem: 30
  },
  {
    categoria: 'imagem',
    titulo: 'Autorização de Uso de Imagem e Voz',
    descricao_curta: 'Cessão gratuita e irrevogável de uso de imagem e voz para fins institucionais.',
    texto_completo: 'Cedo e autorizo, de forma gratuita, universal, irrevogável e por tempo indeterminado, a utilização da imagem e voz do aluno(a) captadas no ambiente escolar ou em eventos externos oficiais. Esta autorização abrange o uso institucional, pedagógico e informativo em redes sociais da escola, site institucional, folhetos, anuários e materiais impressos, sendo estritamente vedado qualquer uso que fira a dignidade, a imagem e a honra do menor, conforme prevê o ECA e a LGPD.',
    obrigatoria: false,
    ordem: 10
  },
  {
    categoria: 'imagem',
    titulo: 'Autorização para Publicação de Trabalhos Escolares',
    descricao_curta: 'Autoriza a exposição e publicação de trabalhos acadêmicos do aluno.',
    texto_completo: 'Autorizo a exposição, publicação e o compartilhamento de produções intelectuais, artísticas, científicas ou acadêmicas criadas pelo aluno no âmbito das disciplinas escolares. A publicação poderá ocorrer em murais físicos, plataformas digitais de ensino, jornais escolares e redes sociais oficiais, garantindo-se sempre a correta atribuição de autoria ao aluno, visando a valorização do seu percurso pedagógico.',
    obrigatoria: false,
    ordem: 20
  },
  {
    categoria: 'conduta',
    titulo: 'Ciência do Regimento Escolar',
    descricao_curta: 'Confirmação de leitura e aceite do Regimento Escolar e Manual de Convivência.',
    texto_completo: 'Declaro que tive amplo acesso, li, compreendi e concordo integralmente com o Regimento Escolar e o Manual de Convivência da instituição. Comprometo-me a atuar em forte parceria com a escola para garantir que o menor cumpra os seus deveres acadêmicos, respeite as normas de civilidade, o código de vestimenta (uso de uniforme) e os horários estabelecidos.',
    obrigatoria: true,
    ordem: 10
  },
  {
    categoria: 'eventos',
    titulo: 'Autorização Genérica para Saídas Locais',
    descricao_curta: 'Autoriza saídas pedagógicas de curta duração no entorno da escola.',
    texto_completo: 'Autorizo a saída do aluno das dependências físicas da instituição, APENAS durante o turno letivo e SEMPRE sob a supervisão direta de professores/monitores, para atividades pedagógicas de curta duração no entorno próximo (ida a praças, parques do bairro, bibliotecas municipais vizinhas ou caminhadas de observação ecológica).',
    obrigatoria: false,
    ordem: 10
  }
];
