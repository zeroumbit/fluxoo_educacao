import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { PortalProvider } from '@/modules/portal/context'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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

// Helper de Vibração Tátil Subtil (Haptic Feedback)
const vibrate = (ms: number = 30) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

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

const MobileBottomNavItem = ({ icon: Icon, label, to, onClick, isActiveOverride }: { icon: any, label: string, to?: string, onClick?: () => void, isActiveOverride?: boolean }) => {
  const handleTap = () => {
    vibrate(30);
    if (onClick) onClick();
  };

  if (to && !onClick) {
    return (
      <NavLink to={to} className="flex-1 flex justify-center items-center min-h-[48px]" onClick={handleTap}>
        {({ isActive }) => {
          const active = isActiveOverride !== undefined ? isActiveOverride : isActive;
          return (
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 transition-all",
                active ? "text-teal-600" : "text-slate-400"
              )}
            >
              <motion.div 
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  active ? "bg-teal-50" : ""
                )}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              </motion.div>
              <span className={cn(
                  "text-[10px] font-bold tracking-tight transition-all duration-300",
                  active ? "max-h-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
              )}>{label}</span>
            </motion.div>
          );
        }}
      </NavLink>
    );
  }

  return (
    <div className="flex-1 flex justify-center items-center min-h-[48px]" onClick={handleTap}>
      <motion.div 
        whileTap={{ scale: 0.9 }}
        className={cn(
          "flex flex-col items-center justify-center gap-1 py-1 transition-all",
          isActiveOverride ? "text-teal-600" : "text-slate-400"
        )}
      >
        <motion.div 
          animate={{ scale: isActiveOverride ? 1.15 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={cn(
            "p-1.5 rounded-full transition-all",
            isActiveOverride ? "bg-teal-50" : ""
          )}
        >
          <Icon size={24} strokeWidth={isActiveOverride ? 2.5 : 2} />
        </motion.div>
        <span className={cn(
            "text-[10px] font-bold tracking-tight transition-all duration-300",
            isActiveOverride ? "max-h-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}>{label}</span>
      </motion.div>
    </div>
  );
};

export function PortalLayout() {
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    vibrate(50)
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

  // Page Animation Variants for SPA Transitions
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  } as const;

  return (
    <PortalProvider>
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col relative overflow-x-hidden">
        
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

        {/* 2. Área de Conteúdo Dinâmico (SPA Navigation with AnimatePresence) */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-12 pb-24 lg:pb-12 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
 
        {/* 3. Navegação Mobile (App Shell Bottom Nav Pattern) */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pt-1 pb-1">
          <div className="flex items-center justify-around w-full max-w-md mx-auto px-2">
            <MobileBottomNavItem 
              icon={Home} 
              label="Home" 
              to="/portal" 
            />
            <MobileBottomNavItem 
              icon={DollarSign} 
              label="Fatura" 
              to="/portal/cobrancas" 
            />
            
            {/* Central Hamburger / Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={(open) => {
              if (open) vibrate(20);
              setIsMobileMenuOpen(open);
            }}>
              <SheetTrigger asChild>
                <div className="flex-1 flex justify-center min-h-[48px]">
                  <motion.div whileTap={{ scale: 0.9 }} className="flex flex-col items-center justify-center gap-1 cursor-pointer select-none">
                    <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-500/40 -translate-y-4 ring-4 ring-[#f8fafc]">
                      <Menu size={24} />
                    </div>
                  </motion.div>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[32px] p-0 h-[80vh] flex flex-col bg-slate-50">
                <SheetHeader className="p-6 pb-2 shrink-0">
                  <div className="mx-auto w-12 h-1.5 bg-slate-200 rounded-full mb-4" />
                  <SheetTitle className="text-left font-black italic tracking-tighter text-2xl flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-md">
                      <GraduationCap size={18} />
                    </div>
                    Menu<span className="text-teal-500">Fluxoo</span>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                      <div 
                        key={item.label}
                        onClick={() => {
                          vibrate(15);
                          navigate(item.to);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex flex-col gap-3 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 active:bg-slate-50 transition-all select-none"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                          <item.icon size={24} />
                        </div>
                        <span className="font-bold text-slate-700 text-sm tracking-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 shrink-0 pb-[env(safe-area-inset-bottom,1.5rem)]">
                   <button 
                    onClick={handleSignOut}
                    className="flex items-center justify-between w-full p-4 rounded-2xl bg-red-50 text-red-600 font-bold active:bg-red-100 transition-colors"
                   >
                      Sair da Conta <LogOut size={20} />
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
