import React from 'react';

// ==========================================
// 1. Ficha de Matrícula
// ==========================================
export const FichaMatriculaContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Dados Pessoais do Aluno</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</p>
            <p className="text-sm font-bold text-slate-700">{data?.nome || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RG</p>
            <p className="text-sm font-bold text-slate-700">{data?.rg || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF</p>
            <p className="text-sm font-bold text-slate-700">{data?.cpf || 'Não informado'}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Filiação e Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome da Mãe</p>
            <p className="text-sm font-bold text-slate-700">{data?.nomeMae || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Pai</p>
            <p className="text-sm font-bold text-slate-700">{data?.nomePai || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CPF do Responsável</p>
            <p className="text-sm font-bold text-slate-700">{data?.cpfResponsavel || data?.cpfPai || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone de Emergência</p>
            <p className="text-sm font-bold text-slate-700">{data?.telefoneEmergencia || 'Não informado'}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Endereço e Origem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</p>
            <p className="text-sm font-bold text-slate-700">{data?.endereco || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Naturalidade</p>
            <p className="text-sm font-bold text-slate-700">{data?.naturalidade || 'Não informado'}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Dados da Matrícula</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ano Letivo</p>
            <p className="text-sm font-bold text-slate-700">{data?.anoLetivo || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Série/Ano</p>
            <p className="text-sm font-bold text-slate-700">{data?.serieAno || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Turno</p>
            <p className="text-sm font-bold text-slate-700">{data?.turno || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data da Matrícula</p>
            <p className="text-sm font-bold text-slate-700">{data?.dataMatricula || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor da Matrícula</p>
            <p className="text-sm font-bold text-teal-600">
              {data?.valorMatricula ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valorMatricula) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Declaro, para os devidos fins de direito, que as informações cadastrais prestadas neste documento são verdadeiras e assumo total responsabilidade por mantê-las atualizadas junto à secretaria da instituição.
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 2. Ficha Individual do Aluno
// ==========================================
export const FichaIndividualContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Síntese Pedagógica</h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações do Professor</p>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          {data?.sintesePedagogica || 'Nenhuma observação registrada para o período atual. O aluno tem demonstrado desenvolvimento adequado em relação às expectativas de aprendizagem estabelecidas para a etapa.'}
        </p>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Acompanhamento Socioemocional</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integração Escolar</p>
            <p className="text-sm font-bold text-slate-700">{data?.socioemocional?.integracao || 'Adequada'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disciplina e Conduta</p>
            <p className="text-sm font-bold text-slate-700">{data?.socioemocional?.disciplina || 'Excelente'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organização Pessoal</p>
            <p className="text-sm font-bold text-slate-700">{data?.socioemocional?.organizacao || 'Em desenvolvimento'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Declaração de Matrícula
// ==========================================
export const DeclaracaoMatriculaContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-8">
      <div className="px-4">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Declaramos, para os devidos fins, que o(a) aluno(a) <span className="font-bold text-slate-800">{data?.nome || '[NOME DO ALUNO]'}</span>,
          nascido(a) em <span className="font-bold text-slate-800">{data?.dataNascimento || '[DATA]'}</span>, portador(a) do
          RG nº <span className="font-bold text-slate-800">{data?.rg || '[RG]'}</span>, encontra-se regularmente matriculado(a)
          e frequentando as aulas nesta instituição de ensino, na turma <span className="font-bold text-slate-800 text-blue-500">{data?.turma || '[TURMA]'}</span>,
          turno <span className="font-bold text-slate-800">{data?.turno || '[TURNO]'}</span>, durante o ano letivo em curso.
        </p>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validade do Documento</p>
          <p className="text-sm font-bold text-slate-700">30 dias a partir da data de emissão</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código de Validação Digital (HASH)</p>
          <p className="text-sm font-mono font-bold text-blue-500">{data?.hashValidacao || 'A8F9-2B3C-4D5E-7F8C'}</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. Histórico Escolar
// ==========================================
export const HistoricoEscolarContent = ({ data }: { data: any }) => {
  const notas = data?.notas || [
    { disciplina: 'Língua Portuguesa', media: '8.5', faltas: 2, situacao: 'Aprovado' },
    { disciplina: 'Matemática', media: '7.0', faltas: 4, situacao: 'Aprovado' },
    { disciplina: 'Ciências', media: '9.0', faltas: 0, situacao: 'Aprovado' },
    { disciplina: 'História', media: '8.0', faltas: 1, situacao: 'Aprovado' }
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Componente Curricular</th>
              <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Média Final</th>
              <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Faltas</th>
              <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notas.map((nota: any, index: number) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-sm font-bold text-slate-700">{nota.disciplina}</td>
                <td className="p-4 text-sm font-bold text-slate-700 text-center">{nota.media}</td>
                <td className="p-4 text-sm text-slate-600 text-center">{nota.faltas}</td>
                <td className="p-4 text-sm font-bold text-slate-700 text-right">
                  <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${nota.situacao === 'Aprovado' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {nota.situacao}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Parecer Final do Conselho de Classe</p>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          {data?.parecerFinal || 'O aluno foi considerado APTO e APROVADO para prosseguimento regular de seus estudos no período letivo subsequente.'}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 5. Transferência
// ==========================================
export const TransferenciaContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="px-4">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Atestamos que o(a) discente <span className="font-bold text-slate-800">{data?.nome || '[NOME]'}</span>,
          matriculado(a) na turma <span className="font-bold text-slate-800 text-blue-500">{data?.turma || '[TURMA]'}</span>, requereu transferência
          desta Unidade Escolar na presente data.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed text-justify mt-4">
          O Histórico Escolar oficial e definitivo será emitido e disponibilizado ao responsável legal
          no prazo de até 30 (trinta) dias após a assinatura deste documento. Esta declaração possui validade
          provisória estrita para fins de matrícula em nossa instituição destino.
        </p>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Interno de Documentação</p>
        <p className="text-sm font-bold text-slate-700">Aguardando emissão do dossiê final</p>
      </div>
    </div>
  );
};

// ==========================================
// 6. Desistência
// ==========================================
export const DesistenciaContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex items-start gap-4">
        <div className="bg-red-500 text-white p-2 rounded-full mt-1 shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tighter text-red-900 mb-2">Termo Oficial de Cancelamento de Vaga</h3>
          <p className="text-sm text-red-800 leading-relaxed text-justify">
            Eu, <span className="font-bold">{data?.responsavelFinanceiro || data?.nomePai || '[NOME DO RESPONSÁVEL]'}</span>, inscrito no CPF sob o nº
            <span className="font-bold"> {data?.cpfResponsavel || '[CPF]'}</span>, formalizo pelo presente termo o CANCELAMENTO DA VAGA
            e rescisão do contrato de prestação de serviços educacionais referente ao aluno(a) <span className="font-bold">{data?.nome || '[NOME]'}</span>.
          </p>
        </div>
      </div>

      <div className="px-4">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Declaro estar plenamente ciente de que a formalização desta desistência sujeita-me às normas e obrigações
          financeiras contratuais residuais previstas, incluindo multas proporcionais ou mensalidades pendentes de quitação até
          a presente data.
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 7. Autorização para Saída Antecipada
// ==========================================
export const SaidaAntecipadaContent = ({ data }: { data: any }) => {
  const pessoasAutorizadas = data?.pessoasAutorizadasSaida || ['Maria Silva (Avó)', 'João Mendes (Tio)'];

  return (
    <div className="space-y-6">
      <div className="px-4">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Na qualidade de responsável legal, autorizo a saída antecipada do(a) aluno(a) <span className="font-bold text-slate-800">{data?.nome || '[NOME]'}</span>,
          antes do término regulamentar do turno <span className="font-bold text-slate-800">{data?.turno || '[TURNO]'}</span>, exclusivamente quando acompanhado pelas pessoas formalmente listadas abaixo.
        </p>
      </div>

      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Pessoas Autorizadas a Retirar o Aluno</h3>
        <ul className="space-y-3">
          {pessoasAutorizadas.map((pessoa: string, index: number) => (
            <li key={index} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-sm font-bold text-slate-700">{pessoa}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
        <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-bold text-orange-800">
          Aviso da Portaria: A liberação ocorrerá única e exclusivamente mediante a apresentação de um documento oficial com foto da pessoa autorizada.
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 8. Autorização para Uso de Imagem
// ==========================================
export const TermoImagemContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="px-4">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Pelo presente instrumento, eu, responsável legal pelo aluno(a) <span className="font-bold text-violet-700">{data?.nome || '[NOME]'}</span>,
          AUTORIZO o uso de sua imagem, voz e nome em peças promocionais, redes sociais, site institucional, murais e materiais impressos
          destinados à divulgação de atividades pedagógicas, culturais e recreativas da escola.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed text-justify mt-4">
          Esta autorização é concedida a título gratuito, em caráter definitivo e irrevogável, não requerendo em nenhuma
          hipótese qualquer compensação financeira ou notificação prévia por parte da instituição de ensino.
        </p>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
        <div className="w-6 h-6 rounded bg-violet-500 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Termo Jurídico Aceito Digitalmente</p>
          <p className="text-sm font-bold text-slate-700">Assinatura validada e arquivada via sistema eletrônico.</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. Ficha de Saúde do Aluno
// ==========================================
export const FichaSaudeContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Alergias Conhecidas
          </p>
          <p className="text-sm font-bold text-red-700">{data?.alergias || 'Nenhuma alergia relatada'}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Tipo Sanguíneo</p>
          <p className="text-sm font-bold text-red-700">{data?.tipoSanguineo || 'Não informado'}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Informações Médicas</h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Medicamentos Controlados ou Uso Contínuo</p>
        <p className="text-sm font-bold text-slate-700">{data?.medicamentosControlados || 'Nenhum medicamento registrado.'}</p>
      </div>

      <div className="px-4 border-l-4 border-slate-200">
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Em caso de emergência ou mal súbito, a escola fica expressamente autorizada a encaminhar o aluno ao
          pronto-socorro/unidade de saúde mais próxima ou acionar serviço de urgência, comprometendo-se a informar imediatamente a família.
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 10. Termo de Responsabilidade (Material Escolar)
// ==========================================
export const TermoMaterialContent = ({ data }: { data: any }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
        <h3 className="text-lg font-black tracking-tighter text-slate-800 mb-4">Termo Patrimonial e Guarda de Materiais</h3>

        <p className="text-sm text-slate-600 leading-relaxed text-justify mb-4">
          Declaro ter recebido a lista oficial de materiais da série correspondente para o aluno(a) <span className="font-bold text-slate-800">{data?.nome || '[NOME]'}</span>.
          Reconheço que é de minha responsabilidade providenciar e repor ao longo do ano os itens de uso individual.
        </p>

        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          <span className="font-bold text-slate-700">Cláusula de Isenção:</span> Fico ciente e de acordo que a instituição de ensino
          NÃO assume qualquer responsabilidade corporativa por perdas, furtos ou danos a itens de valor, joias, celulares,
          tablets ou outros equipamentos eletrônicos de qualquer espécie que o aluno traga consigo para as dependências da escola
          sem requisição formal prévia do corpo docente.
        </p>
      </div>

      <div className="px-4">
        <p className="text-sm text-slate-500 italic text-justify">
          A assinatura eletrônica deste documento nas diretrizes da instituição garante a ciência total das regras patrimoniais dispostas no regimento interno.
        </p>
      </div>
    </div>
  );
};
