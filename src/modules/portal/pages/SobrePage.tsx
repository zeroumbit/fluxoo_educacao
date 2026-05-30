import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowLeft,Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SobrePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(-1)}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 italic uppercase leading-none">ZERO1BIT</h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Venture Builder</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl font-bold text-slate-400 hover:text-indigo-600">
            <ArrowLeft size={18} className="mr-2" /> Voltar
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 shadow-sm mb-6">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Quem Somos
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.05]">ZERO1BIT Venture Builder</h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
            Fundada em <strong>Canindé, Ceará</strong>, a ZERO1BIT é uma venture builder que transforma ideias em
            produtos digitais. Nascemos com a missão de democratizar a tecnologia no Brasil, criando soluções
            que atendem tanto o consumidor final (<strong>B2C</strong>) quanto empresas e instituições (<strong>B2B</strong>).
          </p>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
            Somos uma startup de tecnologia focada em resultados reais. Cada produto nosso nasce de uma
            necessidade observada no mercado e é desenvolvido com arquitetura moderna, design funcional e
            performance de ponta. Do planejamento à operação, acompanhamos cada etapa para garantir que a
            tecnologia entregue valor de verdade.
          </p>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-3xl">
            Hoje nosso ecossistema inclui soluções como <strong>Temrango</strong> (delivery),
            <strong> Pescaprecos</strong> (marketplace), <strong>Fluxoo Doc</strong> (gestão de documentos),
            <strong> Fluxoo Legisla</strong>, <strong>Fluxoo Edu</strong> (gestão escolar) e
            <strong> Essencial PDV</strong> — além de serviços sob medida para empresas que precisam de
            tecnologia para crescer.
          </p>
        </motion.div>
      </main>
    </div>
  )
}
