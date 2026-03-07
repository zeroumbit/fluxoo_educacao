import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { PortalProvider } from '@/modules/portal/context'
import { cn } from '@/lib/utils'
import { 
  GraduationCap, 
  Home, 
  Activity, 
  Megaphone, 
  DollarSign, 
  Clock, 
  FileText, 
  LogOut, 
  ShoppingCart, 
  Settings,
  Calendar
} from 'lucide-react'

// --- COMPONENTES DE UI REUTILIZÁVEIS ---

const NavLinkStyled = ({ icon: Icon, label, to, end }: { icon: any, label: string, to: string, end?: boolean }) => (
  <NavLink 
    to={to}
    end={end}
    className={({ isActive }) => 
      cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all",
        isActive 
        ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/30 scale-105' 
        : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
      )
    }
  >
    <Icon size={16} />
    {label}
  </NavLink>
);

const QuickActionFloating = ({ icon: Icon, label, colorName, onClick }: { icon: any, label: string, colorName: string, onClick?: () => void }) => (
  <div onClick={onClick} className="flex flex-col items-center gap-1 group cursor-pointer px-4">
    <div className={cn(
      "w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-300 shadow-sm relative group-hover:-translate-y-3",
      `bg-${colorName}-500/10`
    )}>
      <Icon size={24} className={`text-${colorName}-500`} />
    </div>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-center">
      {label}
    </span>
  </div>
);

export function PortalLayout() {
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
       window.location.href = '/login'
    }
  }

  return (
    <PortalProvider>
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
        
        {/* 1. Menu Principal Superior */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 py-5">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
                <GraduationCap size={32} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-slate-800 italic uppercase">Fluxoo<span className="text-teal-500">Edu</span></h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Portal da Família</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <NavLinkStyled icon={Home} label="Home" to="/portal" end />
              <NavLinkStyled icon={Calendar} label="Agenda" to="/portal/agenda" />
              <NavLinkStyled icon={FileText} label="Boletim" to="/portal/boletim" />
              <NavLinkStyled icon={DollarSign} label="Cobranças" to="/portal/cobrancas" />
              <NavLinkStyled icon={Megaphone} label="Avisos" to="/portal/avisos" />
            </div>

            <div className="flex items-center gap-4 border-l border-slate-100 pl-6 hidden lg:flex">
               <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">{authUser?.nome}</p>
                  <p className="text-xs font-bold text-teal-600">Acesso Responsável</p>
               </div>
               <button 
                onClick={handleSignOut}
                className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
               >
                  <LogOut size={20} />
               </button>
            </div>
          </div>
        </nav>

        {/* 2. Área de Conteúdo Dinâmico */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 space-y-12 pb-12">
          <Outlet />
        </main>
 
        {/* 3. Acesso Rápido Flutuante (Fixed) */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-6">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] rounded-[40px] p-5 flex justify-between items-center px-8">
             <QuickActionFloating icon={Activity} label="Frequência" colorName="teal" onClick={() => navigate('/portal/frequencia')} />
             <QuickActionFloating icon={FileText} label="Boletim" colorName="blue" onClick={() => navigate('/portal/boletim')} />
             <QuickActionFloating icon={DollarSign} label="Pagamentos" colorName="emerald" onClick={() => navigate('/portal/cobrancas')} />
             <QuickActionFloating icon={ShoppingCart} label="Loja" colorName="violet" onClick={() => navigate('/portal/loja')} />
             <QuickActionFloating icon={Settings} label="Perfil" colorName="slate" />
          </div>
        </div>
 
        {/* 4. Footer Institucional */}
        <footer className="bg-white border-t border-slate-100 pt-20 pb-60 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter">FLUXOO<span className="text-teal-500">EDU</span></h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Inovação na comunicação escolar, trazendo transparência e praticidade para o dia a dia da sua família.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Escola</h4>
              <ul className="text-sm font-bold text-slate-500 space-y-4">
                <li className="hover:text-teal-500 cursor-pointer flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div> Sobre Nós</li>
                <li className="hover:text-teal-500 cursor-pointer flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div> Regimento</li>
                <li className="hover:text-teal-500 cursor-pointer flex items-center gap-2 group"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div> Calendário 2026</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Ajuda</h4>
              <ul className="text-sm font-bold text-slate-500 space-y-4">
                <li className="hover:text-teal-500 cursor-pointer">Suporte ao Pai</li>
                <li className="hover:text-teal-500 cursor-pointer">Segurança de Dados</li>
                <li className="hover:text-teal-500 cursor-pointer">Privacidade</li>
              </ul>
            </div>
            <div className="space-y-6 text-center md:text-right flex flex-col justify-end">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© {new Date().getFullYear()} Fluxoo Tecnologia</p>
            </div>
          </div>
        </footer>
      </div>
    </PortalProvider>
  )
}
