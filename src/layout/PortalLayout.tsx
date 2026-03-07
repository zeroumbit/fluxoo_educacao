import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { PortalProvider } from '@/modules/portal/context'
import { cn } from '@/lib/utils'
import { 
  GraduationCap, 
  Home, 
  Activity,
  Megaphone, 
  DollarSign, 
  FileText, 
  LogOut, 
  ShoppingCart, 
  Settings,
  Calendar,
  ChevronDown,
  Menu,
  User,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// --- COMPONENTES DE UI REUTILIZÁVEIS ---

const NavLinkDesktop = ({ icon: Icon, label, to, end, hasDropdown }: { icon: any, label: string, to?: string, end?: boolean, hasDropdown?: boolean }) => {
  const content = (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
      "text-slate-500 hover:text-teal-600 hover:bg-teal-50"
    )}>
      <Icon size={16} />
      {label}
      {hasDropdown && <ChevronDown size={14} className="ml-1 opacity-50" />}
    </div>
  );

  if (hasDropdown || !to) return content;

  return (
    <NavLink 
      to={to}
      end={end}
      className={({ isActive }) => 
        cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[12px] uppercase tracking-wider transition-all",
          isActive 
          ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
          : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'
        )
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

const MobileBottomNavItem = ({ icon: Icon, label, to, onClick, isActive }: { icon: any, label: string, to?: string, onClick?: () => void, isActive?: boolean }) => {
  const content = (
    <div 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-all",
        isActive ? "text-teal-600" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-full transition-all",
        isActive ? "bg-teal-50 scale-110" : ""
      )}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
    </div>
  );

  if (to && !onClick) {
    return (
      <NavLink to={to} className="flex-1">
        {({ isActive }) => (
          <div className={cn(
            "flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-all",
            isActive ? "text-teal-600" : "text-slate-400"
          )}>
             <div className={cn(
                "p-1.5 rounded-full transition-all",
                isActive ? "bg-teal-50 scale-110" : ""
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            <span className="text-[10px] font-bold tracking-tight">{label}</span>
          </div>
        )}
      </NavLink>
    );
  }

  return content;
};

export function PortalLayout() {
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
       window.location.href = '/login'
    }
  }

  const menuItems = [
    { label: 'Agenda', icon: Calendar, to: '/portal/agenda' },
    { label: 'Boletim', icon: FileText, to: '/portal/boletim' },
    { label: 'Documentos', icon: FileText, to: '/portal/documentos' },
    { label: 'Frequência', icon: Activity, to: '/portal/frequencia' },
    { label: 'Autorizações', icon: ShieldCheck, to: '/portal/autorizacoes' },
    { label: 'Avisos', icon: Megaphone, to: '/portal/avisos' },
    { label: 'Financeiro', icon: DollarSign, to: '/portal/cobrancas' },
    { label: 'Loja', icon: ShoppingCart, to: '/portal/loja' },
    { label: 'Perfil', icon: User, to: '/portal/perfil' }, 
  ]

  return (
    <PortalProvider>
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col relative">
        
        {/* 1. Menu Principal Superior - Desktop */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
                <GraduationCap size={24} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-tighter text-slate-800 italic uppercase">Fluxoo<span className="text-teal-500">Edu</span></h1>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Portal da Família</p>
              </div>
            </div>

            {/* Links Desktop */}
            <div className="hidden lg:flex items-center gap-1">
              <NavLinkDesktop icon={Home} label="Home" to="/portal" end />
              
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <NavLinkDesktop icon={User} label="Aluno" hasDropdown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-2 rounded-2xl shadow-xl border-slate-100">
                  <DropdownMenuItem onClick={() => navigate('/portal/agenda')} className="flex items-center gap-2 p-3 font-medium rounded-xl focus:bg-teal-50 focus:text-teal-600 cursor-pointer">
                    <Calendar size={16} /> Agenda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/portal/boletim')} className="flex items-center gap-2 p-3 font-medium rounded-xl focus:bg-teal-50 focus:text-teal-600 cursor-pointer">
                    <FileText size={16} /> Boletim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/portal/documentos')} className="flex items-center gap-2 p-3 font-medium rounded-xl focus:bg-teal-50 focus:text-teal-600 cursor-pointer">
                    <FileText size={16} /> Documentos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/portal/autorizacoes')} className="flex items-center gap-2 p-3 font-medium rounded-xl focus:bg-teal-50 focus:text-teal-600 cursor-pointer">
                    <ShieldCheck size={16} /> Autorizações
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <NavLinkDesktop icon={DollarSign} label="Financeiro" to="/portal/cobrancas" />
              <NavLinkDesktop icon={Megaphone} label="Avisos" to="/portal/avisos" />
              <NavLinkDesktop icon={ShoppingCart} label="Loja" to="/portal/loja" />
              <NavLinkDesktop icon={User} label="Perfil" to="/portal/perfil" />
            </div>

            <div className="flex items-center gap-4 border-l border-slate-100 pl-6 lg:ml-0">
               <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase">{authUser?.nome}</p>
                  <p className="text-xs font-bold text-teal-600">Responsável</p>
               </div>
               <button 
                onClick={handleSignOut}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
               >
                  <LogOut size={18} />
               </button>
            </div>
          </div>
        </nav>

        {/* 2. Área de Conteúdo Dinâmico */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 pb-32 lg:pb-12">
          <Outlet />
        </main>
 
        {/* 3. Navegação Mobile (Material Design Style) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-around pb-safe">
          <MobileBottomNavItem 
            icon={Home} 
            label="Home" 
            to="/portal" 
          />
          <MobileBottomNavItem 
            icon={DollarSign} 
            label="Financeiro" 
            to="/portal/cobrancas" 
          />
          
          {/* Central Hamburger / Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
               <div className="flex flex-col items-center justify-center flex-1 gap-1 py-1">
                 <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30 -translate-y-4">
                   <Menu size={24} />
                 </div>
                 <span className="text-[10px] font-bold tracking-tight text-slate-400 -translate-y-3">Menu</span>
               </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[32px] p-6 h-[70vh]">
              <SheetHeader>
                <SheetTitle className="text-left font-black italic tracking-tighter text-2xl flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                    <GraduationCap size={18} />
                  </div>
                  FLUXOO<span className="text-teal-500">EDU</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div 
                    key={item.label}
                    onClick={() => {
                      navigate(item.to)
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600">
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-3">
                 <button 
                  onClick={handleSignOut}
                  className="flex items-center justify-between w-full p-4 rounded-xl bg-red-50 text-red-600 font-bold"
                 >
                    Sair da Conta <LogOut size={18} />
                 </button>
              </div>
            </SheetContent>
          </Sheet>

          <MobileBottomNavItem 
            icon={ShoppingCart} 
            label="Loja" 
            to="/portal/loja" 
          />
          <MobileBottomNavItem 
            icon={User} 
            label="Perfil" 
            to="/portal/perfil" 
          />
        </div>
 
        {/* 4. Footer Institucional - Somente Desktop/Large */}
        <footer className="bg-white border-t border-slate-100 pt-20 pb-20 lg:pb-40 px-8 hidden md:block">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter">FLUXOO<span className="text-teal-500">EDU</span></h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Inovação na comunicação escolar, trazendo transparência e praticidade para o dia a dia da sua família.
              </p>
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
