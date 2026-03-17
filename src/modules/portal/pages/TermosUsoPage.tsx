import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ShieldCheck, FileText, ChevronLeft, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function TermosUsoPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      {/* Header Fixo/Flutuante */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 italic uppercase leading-none">
                Fluxoo<span className="text-teal-500">Edu</span>
              </h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Termos de Uso</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.print()}
            className="rounded-xl font-bold text-slate-400 hover:text-teal-600"
          >
            <Printer size={18} className="mr-2" /> Imprimir
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-16 space-y-12"
        >
          {/* Título Principal */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-50 text-teal-500 mb-4">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
              Termos de Uso da Plataforma <span className="text-teal-500">Fluxoo Edu</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Última atualização: 17 de Março de 2026</p>
          </div>

          {/* Preâmbulo */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-teal-600">
               <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center font-black">0</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Preâmbulo</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              A <strong>FLUXOO EDU TECNOLOGIA LTDA.</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 21.582.343/0001-81, tecnologia do grupo Pescaprecos.com, com sede na Rua Paulino Barroso, 777, Canindé/CE, doravante denominada simplesmente <strong>FLUXOO EDU</strong>, disponibiliza esta Plataforma para uso de instituições de ensino, gestores, educadores, alunos e seus responsáveis legais, mediante aceitação dos termos e condições aqui previstos.
            </p>
            
            <div className="bg-teal-50/50 p-6 rounded-3xl border border-teal-100 space-y-4">
              <p className="text-sm font-bold text-teal-800">A FLUXOO EDU é uma Plataforma que oferece os seguintes serviços:</p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <li className="bg-white p-4 rounded-2xl shadow-sm border border-teal-100/50">
                  <span className="block text-teal-600 font-black text-xs uppercase mb-2">SaaS Educacional</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Software como ferramenta de gestão escolar, aprendizado e acompanhamento pedagógico.</p>
                </li>
                <li className="bg-white p-4 rounded-2xl shadow-sm border border-teal-100/50">
                  <span className="block text-teal-600 font-black text-xs uppercase mb-2">Suporte</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Procedimentos para auxiliar Escolas, Educadores e Alunos no uso da Plataforma.</p>
                </li>
                <li className="bg-white p-4 rounded-2xl shadow-sm border border-teal-100/50">
                  <span className="block text-teal-600 font-black text-xs uppercase mb-2">Data Analytics</span>
                  <p className="text-[11px] text-slate-500 leading-tight">Indicadores de engajamento, aprendizagem e satisfação para avaliação pedagógica.</p>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200">
              <p className="text-xs font-bold text-amber-900 leading-relaxed text-center">
                A PLATAFORMA NÃO SE CONFIGURA COMO OFERTA DE EDUCAÇÃO OU DE CURSO, DE FORMA QUE A FLUXOO EDU NÃO OUTORGA DIPLOMA OU CERTIFICADO ACADÊMICO, SENDO MERA FERRAMENTA DE APOIO À GESTÃO ESCOLAR.
              </p>
            </div>
          </section>

          {/* 1. Definições */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">1</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Definições</h2>
            </div>
            
            <div className="overflow-hidden border border-slate-100 rounded-3xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4 w-1/4">Termo</th>
                    <th className="px-6 py-4">Definição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  <tr><td className="px-6 py-4 font-black text-slate-800">Plataforma</td><td className="px-6 py-4">Ambiente virtual FLUXOO EDU, incluindo website, aplicativos mobile e demais extensões.</td></tr>
                  <tr><td className="px-6 py-4 font-black text-slate-800">Usuário</td><td className="px-6 py-4">Pessoa física que acesse ou utilize a Plataforma.</td></tr>
                  <tr><td className="px-6 py-4 font-black text-slate-800">Escola</td><td className="px-6 py-4">Instituição de ensino que contrata a Fluxoo Edu.</td></tr>
                  <tr><td className="px-6 py-4 font-black text-slate-800">Aluno</td><td className="px-6 py-4">Estudante vinculado à Escola Contratante.</td></tr>
                  <tr><td className="px-6 py-4 font-black text-slate-800">Responsável</td><td className="px-6 py-4">Pessoa que assiste e autoriza o uso da Plataforma por menor de idade.</td></tr>
                  <tr><td className="px-6 py-4 font-black text-slate-800">Conteúdo</td><td className="px-6 py-4">Todo material disponibilizado na Plataforma (textos, imagens, avaliações, etc).</td></tr>
                  <tr><td className="px-6 py-4 font-black text-slate-800">LGPD</td><td className="px-6 py-4">Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Aceitação */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">2</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Aceitação dos Termos</h2>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  <strong>2.1 Concordância:</strong> AO UTILIZAR A PLATAFORMA FLUXOO EDU, VOCÊ AUTOMATICAMENTE CONCORDA COM ESTES TERMOS DE USO E COM A POLÍTICA DE PRIVACIDADE, RESPONSABILIZANDO-SE INTEGRALMENTE POR TODO E QUAISQUER ATOS PRATICADOS.
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  <strong>2.4 Aceite por Menores:</strong> Para usuários menores de 18 anos, o cadastro e utilização da Plataforma dependem do consentimento expresso de seu Responsável Legal.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Cadastro */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">3</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Cadastro e Acesso</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              O acesso à Plataforma se dá por meio de login (CPF ou e-mail) e senha de uso pessoal e intransferível. Você é integralmente responsável pela guarda, sigilo e bom uso de sua senha. A Fluxoo Edu reserva-se o direito de recusar ou cancelar cadastros em caso de anormalidades ou informações inverídicas.
            </p>
          </section>

          {/* 4. Direitos e Obrigações */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">4</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Obrigações dos Usuários</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3 underline">Condutas Vedadas</h4>
                <ul className="space-y-2 text-xs text-rose-700/80 font-bold list-disc pl-4">
                  <li>Praticar discriminação, violência ou assédio;</li>
                  <li>Violar direitos autorais ou de privacidade;</li>
                  <li>Enviar spam ou mensagens não solicitadas;</li>
                  <li>Introduzir vírus ou códigos maliciosos;</li>
                  <li>Realizar engenharia reversa na plataforma.</li>
                </ul>
              </div>
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3 underline">Deveres</h4>
                <ul className="space-y-2 text-xs text-emerald-700/80 font-bold list-disc pl-4">
                  <li>Respeitar a legislação e bons costumes;</li>
                  <li>Manter dados sempre atualizados;</li>
                  <li>Zelar pelo sigilo da senha pessoal;</li>
                  <li>Usar a plataforma para fins educacionais.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Disponibilidade */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">5</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Disponibilidade e Suporte</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              A Plataforma é oferecida <strong>"no estado em que se encontra"</strong>. Embora busquemos disponibilidade de 24/7, a Fluxoo Edu não se responsabiliza por interrupções causadas por falhas de terceiros (energia, internet) ou manutenções necessárias.
            </p>
          </section>

          {/* 6. Propriedade Intelectual */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">6</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Propriedade Intelectual</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              Todo o código-fonte, design, logotipos e conteúdos pedagógicos são de propriedade exclusiva da <strong>Fluxoo Edu</strong>. O Usuário recebe apenas uma licença de uso limitada e revogável. É proibida qualquer reprodução não autorizada.
            </p>
          </section>

          {/* 7. Dados Pessoais */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">7</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Tratamento de Dados (LGPD)</h2>
            </div>
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 space-y-4">
              <p className="text-sm font-bold text-blue-900 leading-relaxed">
                A Fluxoo Edu atua como **Operadora** de dados conforme as instruções da Escola Contratante (**Controladora**). Respeitamos integralmente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">A</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Acesso</span>
                </div>
                <div className="bg-white p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">C</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Correção</span>
                </div>
                <div className="bg-white p-4 rounded-2xl flex flex-col items-center text-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">E</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Exclusão</span>
                </div>
              </div>
            </div>
          </section>

          {/* 9. Limitação */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">9</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Limitação de Responsabilidade</h2>
            </div>
            <p className="text-sm font-bold text-slate-400 leading-relaxed text-center uppercase tracking-tighter">
              EM NENHUMA CIRCUNSTÂNCIA A FLUXOO EDU SERÁ RESPONSABILIZADA POR DANOS INDIRETOS, INCIDENTAIS OU PUNITIVOS RESULTANTES DO USO INDEVIDO DA PLATAFORMA POR PARTE DOS USUÁRIOS OU FALHAS TÉCNICAS DE TERCEIROS.
            </p>
          </section>

          {/* 11 & 12. Foro e Canais */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-teal-600">
                  <ShieldCheck size={18} />
                  <h3 className="font-black uppercase tracking-tight">Foro de Eleição</h3>
               </div>
               <p className="text-xs text-slate-500 font-bold">Fica eleito o foro da comarca de **Canindé/CE** para dirimir quaisquer controvérsias.</p>
            </div>
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-teal-600">
                  <FileText size={18} />
                  <h3 className="font-black uppercase tracking-tight">Atendimento</h3>
               </div>
               <div className="space-y-1 text-xs text-slate-500 font-bold">
                  <p>E-mail: fluxoosoftware@gmail.com</p>
                  <p>Telefone: (85) 9 9727-7128</p>
                  <p>Rua Paulino Barroso, 777 – Canindé/CE</p>
               </div>
            </div>
          </section>

          {/* Footer do Card */}
          <div className="pt-12 text-center border-t border-slate-50">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
              Fluxoo Tecnologia • Inovação Educacional de Alto Nível
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
