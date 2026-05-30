import { Button } from '@/components/ui/button'
import { ArrowLeft,GraduationCap,ShieldCheck,Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const steps = [
  'Diagnóstico técnico completo do seu projeto',
  'Definição de stack, arquitetura e boas práticas',
  'Acompanhamento remoto com reports semanais',
  'Mentoria para desenvolvedores do seu time',
  'Modelo flexível: horas avulsas ou retenção mensal',
]

export function ConsultoriaPage() {
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
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Consultoria</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl font-bold text-slate-400 hover:text-teal-600">
            <ArrowLeft size={18} className="mr-2" /> Voltar
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 shadow-sm mb-6">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Assessoria Técnica
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05]">Consultoria & CTO as a Service</h1>

        <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Sua empresa tem um bom produto, mas sente que a área de tecnologia poderia entregar mais?
          Muitos negócios enfrentam o mesmo dilema: têm demanda, mas falta direcionamento técnico
          para escalar sem acumular dívida técnica.
        </p>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
          A ZERO1BIT atua como uma diretoria de tecnologia sob demanda. Assumimos a liderança
          técnica do seu projeto — definindo arquitetura, escolhendo as ferramentas certas,
          organizando o fluxo de desenvolvimento e orientando seu time — sem o custo fixo de
          um CTO CLT.
        </p>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Nosso modelo é especialmente indicado para empresas em crescimento que já têm um
          produto rodando e precisam de profissionais experientes para levar a tecnologia ao
          próximo nível, ou para negócios que querem montar seu primeiro squad técnico com
          bases sólidas.
        </p>

        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-sm text-slate-800">Nosso método</span>
          </div>
          <ul className="space-y-3 text-sm text-slate-600">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" /> {step}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
