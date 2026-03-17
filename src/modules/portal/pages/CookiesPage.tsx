import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Cookie, ShieldCheck, FileText, ChevronLeft, Printer, Info, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function CookiesPage() {
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
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Cookies</p>
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
              <Cookie size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-800 uppercase italic">
              Política de Cookies <span className="text-teal-500">Fluxoo Edu</span>
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
              Esta Política de Cookies explica o que são cookies, como os utilizamos na Plataforma <strong>Fluxoo EDU</strong>, quais as finalidades de cada tipo e como você pode gerenciar suas preferências em conformidade com a <strong>LGPD</strong>.
            </p>
            
            <div className="bg-teal-50/50 p-6 rounded-3xl border border-teal-100 space-y-4">
              <p className="text-xs font-bold text-teal-900 leading-relaxed text-center uppercase tracking-tight">
                AO UTILIZAR A PLATAFORMA E CONTINUAR A NAVEGAÇÃO, VOCÊ CONCORDA COM A UTILIZAÇÃO DE COOKIES DE ACORDO COM ESTA POLÍTICA.
              </p>
            </div>
          </section>

          {/* 1. O que são cookies */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">1</div>
               <h2 className="text-lg font-black uppercase tracking-tight">O que são Cookies?</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita sites. Eles funcionam como uma "memória", permitindo que a plataforma lembre de suas preferências e melhore sua experiência de navegação, sem conter vírus ou acessar informações privadas do seu dispositivo.
            </p>
          </section>

          {/* 3. Tipos de Cookies */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">3</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Tipos de Cookies Utilizados</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                   <ShieldCheck size={16} className="text-teal-600" /> Estritamente Necessários
                </h4>
                <p className="text-xs text-slate-500 font-medium">Essenciais para o funcionamento básico e segurança (Login, Sessão, Proteção CSRF). Não podem ser desativados.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-100">session_id</div>
                  <div className="bg-white p-2 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-100">auth_token</div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                <h4 className="text-sm font-black text-blue-800 uppercase flex items-center gap-2">
                   <Settings size={16} className="text-blue-600" /> Funcionalidade
                </h4>
                <p className="text-xs text-blue-600/80 font-medium">Permitem lembrar escolhas (idioma, tema claro/escuro) para uma experiência personalizada.</p>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                <h4 className="text-sm font-black text-emerald-800 uppercase flex items-center gap-2">
                   <Info size={16} className="text-emerald-600" /> Desempenho e Analytics
                </h4>
                <p className="text-xs text-emerald-600/80 font-medium">Coletam informações anônimas sobre o tráfego e comportamento para melhorarmos a ferramenta.</p>
              </div>
            </div>
          </section>

          {/* 4. Terceiros */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">4</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Cookies de Terceiros</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-justify font-medium">
              Utilizamos serviços como <strong>Google Analytics</strong> para análise de tráfego e <strong>Supabase</strong> para autenticação segura. Cada um possui sua própria política de privacidade que recomendamos consultar.
            </p>
          </section>

          {/* 5. Gestão */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-slate-800">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black">5</div>
               <h2 className="text-lg font-black uppercase tracking-tight">Gestão de Cookies</h2>
            </div>
            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Settings size={120} />
               </div>
               <p className="text-sm font-medium leading-relaxed opacity-90 relative z-10">
                 Você pode gerenciar os cookies através das configurações do seu navegador, bloqueando ou excluindo-os. Note que a desativação de cookies essenciais poderá comprometer recursos críticos da plataforma.
               </p>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-2 relative z-10">
                  {['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'].map(nav => (
                    <div key={nav} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center">{nav}</div>
                  ))}
               </div>
            </div>
          </section>

          {/* 7. DPO */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 space-y-4">
               <div className="flex items-center gap-2 text-teal-600">
                  <ShieldCheck size={18} />
                  <h3 className="font-black uppercase tracking-tight">Encarregado (DPO)</h3>
               </div>
               <div className="space-y-1 text-xs text-teal-800 font-bold">
                  <p>E-mail: fluxoosoftware@gmail.com</p>
                  <p>Contato: (85) 9 9727-7128</p>
               </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
               <div className="flex items-center gap-2 text-slate-600">
                  <FileText size={18} />
                  <h3 className="font-black uppercase tracking-tight">Legislação</h3>
               </div>
               <p className="text-xs text-slate-500 font-bold leading-relaxed">
                 Regido pelas leis da República Federativa do Brasil, em especial pela Lei nº 13.709/2018 (LGPD).
               </p>
            </div>
          </section>

          {/* Footer do Card */}
          <div className="pt-12 text-center border-t border-slate-50">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
              Fluxoo Tecnologia • Transparência de Dados
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
