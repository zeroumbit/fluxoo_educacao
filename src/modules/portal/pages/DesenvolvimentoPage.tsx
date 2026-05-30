import { Button } from '@/components/ui/button'
import { ArrowLeft,Code,GraduationCap,Laptop } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const technologies = [
  ['Front-end', 'React, Next.js, Tailwind CSS'],
  ['Mobile', 'React Native, Flutter, Expo'],
  ['Back-end', 'Node.js, Java, PHP, TypeScript, Postgres'],
  ['Infra', 'AWS, Cloudflare, Docker'],
  ['Design', 'UI/UX com foco em conversão'],
]

export function DesenvolvimentoPage() {
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
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Criação de Software</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl font-bold text-slate-400 hover:text-teal-600">
            <ArrowLeft size={18} className="mr-2" /> Voltar
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 shadow-sm mb-6">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          Engenharia de Produto
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05]">Desenvolvimento de Software & Apps</h1>

        <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Transformamos ideias em produtos digitais funcionais. Seja um MVP para validar um negócio,
          um aplicativo mobile para alcançar novos clientes ou um sistema web completo para
          operacionalizar sua empresa — a ZERO1BIT projeta, constrói e entrega.
        </p>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Nosso processo começa com descoberta: entendemos o problema, o usuário e o contexto antes
          de escrever uma linha de código. Depois avançamos em ciclos curtos com entregas frequentes,
          garantindo que o produto evolua com base em feedback real.
        </p>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
          Trabalhamos com startups em estágio inicial que precisam de um MVP sólido para apresentar
          a investidores, empresas estabelecidas que querem digitalizar processos internos, e
          instituições que necessitam de sistemas sob medida com alta disponibilidade e segurança.
        </p>

        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <Laptop className="h-5 w-5 text-indigo-500" />
            <span className="font-bold text-sm text-slate-800">Tecnologias que dominamos</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            {technologies.map(([area, techs]) => (
              <li key={area} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {area}: {techs}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
