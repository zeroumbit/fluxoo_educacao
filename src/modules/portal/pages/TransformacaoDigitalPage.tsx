import { Button } from '@/components/ui/button'
import { ArrowLeft,Building2,FileText,Globe,GraduationCap,Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const deliveries = [
  'Portais institucionais com acessibilidade',
  'Sistemas de protocolo e gestão documental',
  'Plataformas de transparência e dados abertos',
  'Aplicativos para serviços ao cidadão',
  'Migração de sistemas legados para nuvem',
]

export function TransformacaoDigitalPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(-1)}>
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 italic uppercase leading-none">
                Fluxoo<span className="text-teal-500">Edu</span>
              </h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Setor Público</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl font-bold text-slate-400 hover:text-teal-600">
            <ArrowLeft size={18} className="mr-2" /> Voltar
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 shadow-sm mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Governo Digital
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05]">Transformação Digital para Gestão Pública</h1>

        <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Prefeituras, secretarias, <strong>câmaras de vereadores</strong> e órgãos públicos enfrentam o desafio de oferecer serviços
          digitais de qualidade com orçamento limitado e burocracia herdada. A ZERO1BIT desenvolve
          soluções que modernizam a gestão pública sem perder de vista a conformidade legal e a
          continuidade dos serviços.
        </p>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Criamos portais institucionais que funcionam como verdadeiras centrais de serviços para
          o cidadão, sistemas de protocolo que eliminam o papel, painéis de transparência que
          atendem à LAI (Lei de Acesso à Informação), e plataformas internas que integram
          secretarias e departamentos.
        </p>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Todos os nossos projetos para o setor público são construídos com tecnologia aberta,
          documentação completa e transferência de conhecimento — garantindo que a gestão não
          fique refém de um único fornecedor e possa dar manutenção com equipe própria.
        </p>

        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-emerald-500" />
            <span className="font-bold text-sm text-slate-800">O que entregamos</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            {deliveries.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Produtos no mercado */}
        <div className="mt-12 border-t border-slate-200 pt-10">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Produtos Próprios — Já no Mercado</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Fluxoo Doc</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Gestão de documentos digital. Organize, armazene e compartilhe contratos, ofícios,
                memorandos e processos administrativos com segurança e rastreabilidade completa.
                Ideal para prefeituras, câmaras e cartórios que precisam eliminar o papel sem
                perder o controle.
              </p>
              <a
                href="https://doc.fluxoo.com.br/login"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Acessar Fluxoo Doc <ArrowLeft className="h-3 w-3 rotate-180" />
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Fluxoo Legisla</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Gestão legislativa para câmaras de vereadores. Controle de proposições, tramitação
                de projetos, diário oficial, gestão de sessões e acompanhamento parlamentar —
                tudo em uma plataforma integrada que moderniza o trabalho do legislativo municipal.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-slate-400">
                Em breve disponível
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
