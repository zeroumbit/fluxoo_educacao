import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Lock, ShieldCheck, FileText, ChevronLeft, Printer, Eye, Share2, User, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function PrivacidadePage() {
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
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Privacidade</p>
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
              Política de Privacidade <span className="text-teal-500">Fluxoo Edu</span>
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
              A <strong>FLUXOO EDU</strong>, tecnologia do grupo <strong>pescaprecos.com</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 21.582.343/0001-81, sediada na Rua Paulino Barroso, 777, Canindé/CE, apresenta sua Política de Privacidade em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
            </p>
            
            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
              <p className="text-xs font-bold text-blue-900 leading-relaxed text-center uppercase tracking-tight">
                AO UTILIZAR A PLATAFORMA FLUXOO EDU, VOCÊ CONCORDA COM AS PRÁTICAS DESCRITAS NESTA POLÍTICA DE PRIVACIDADE.
              </p>
            </div>
          </section>

          {/* 1. Definições */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">1</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Definições Importantes</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { t: 'Dados Pessoais', d: 'Informações que identificam você (Nome, CPF, E-mail).' },
                { t: 'Titular', d: 'Pessoa natural a quem se referem os dados pessoais.' },
                { t: 'Controlador', d: 'Quem toma as decisões sobre o tratamento dos dados.' },
                { t: 'Operador', d: 'Quem realiza o tratamento em nome do controlador.' }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="block text-[10px] font-black text-teal-600 uppercase mb-1">{item.t}</span>
                  <p className="text-xs text-slate-600 font-medium">{item.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Coleta de Dados */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">2</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Dados Coletados</h2>
            </div>
            
            <div className="space-y-4">
              <div className="overflow-hidden border border-slate-100 rounded-3xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Tipo de Dado</th>
                      <th className="px-6 py-4">Finalidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    <tr><td className="px-6 py-4 font-black">Identificação</td><td className="px-6 py-4">Nome completo, CPF e data de nascimento para controle de acesso.</td></tr>
                    <tr><td className="px-6 py-4 font-black">Comunicação</td><td className="px-6 py-4">E-mail e Telefone para avisos escolares e suporte.</td></tr>
                    <tr><td className="px-6 py-4 font-black">Acadêmicos</td><td className="px-6 py-4">Matrícula, notas, frequência e desempenho pedagógico.</td></tr>
                    <tr><td className="px-6 py-4 font-black">Técnicos</td><td className="px-6 py-4">IP, tipo de dispositivo e logs de acesso para segurança.</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase mb-1">Dados de Menores</h4>
                  <p className="text-xs text-amber-800/80 font-medium leading-relaxed">
                    Tratamos dados de crianças e adolescentes estritamente para fins educacionais e apenas com o consentimento expresso dos responsáveis legais.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Compartilhamento */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">4</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Compartilhamento</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              A <strong>Fluxoo Edu</strong> NÃO vende ou aluga seus dados. O compartilhamento ocorre apenas com a <strong>Escola Contratante</strong> (Controladora), prestadores de serviços técnicos essenciais (hospedagem, pagamentos) ou por obrigação legal.
            </p>
          </section>

          {/* 5. Segurança */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">5</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Segurança dos Dados</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: ShieldCheck, t: 'Criptografia' },
                { icon: Eye, t: 'Monitoramento' },
                { icon: Lock, t: 'Acesso Restrito' },
                { icon: Share2, t: 'Backups' }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center gap-3 text-center transition-transform hover:scale-105">
                  <item.icon size={24} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">{item.t}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Direitos */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">6</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Seus Direitos (LGPD)</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium mb-4">
              Você pode exercer seus direitos a qualquer momento entrando em contato com nosso Encarregado de Dados (DPO):
            </p>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-wrap gap-x-8 gap-y-4 justify-center">
              {['Acesso', 'Correção', 'Exclusão', 'Portabilidade', 'Revogação'].map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase">{r}</span>
                </div>
              ))}
            </div>
          </section>

          {/* DPO / Contato */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 space-y-4">
               <div className="flex items-center gap-2 text-teal-600">
                  <User size={18} />
                  <h3 className="font-black uppercase tracking-tight">Encarregado (DPO)</h3>
               </div>
               <div className="space-y-1 text-xs text-teal-800 font-bold">
                  <p>E-mail: fluxoosoftware@gmail.com</p>
                  <p>Telefone: (85) 9 9727-7128</p>
               </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 text-slate-600">
                  <Building2 size={18} />
                  <h3 className="font-black uppercase tracking-tight">Sede Legal</h3>
               </div>
               <div className="space-y-1 text-xs text-slate-500 font-bold">
                  <p>JOSE SERGIO DIAS PEREIRA ME</p>
                  <p>Paulino Barroso, 777 – Canindé/CE</p>
                  <p>CEP 62700-000</p>
               </div>
            </div>
          </section>

          {/* Sumário Executivo */}
          <div className="pt-12 text-center border-t border-slate-50">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
              Fluxoo Tecnologia • Privacidade e Transparência
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
