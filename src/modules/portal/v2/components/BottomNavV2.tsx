
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Receipt, 
  Bell, 
  ShoppingBag, 
  Menu,
  User,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from '@/modules/auth/AuthContext';
import { usePortalContext } from '@/modules/portal/context';
import { cn } from '@/lib/utils';

// Verifica se existem lojistas ou profissionais cadastrados no marketplace
// NOTA: Tabelas 'lojistas' e 'curriculos' podem ter RLS restritivo para role 'responsavel'.
// Por isso tratamos erros 403/PGRST silenciosamente e cacheamos o resultado.
const fetchLojaStatus = async (): Promise<number> => {
  let total = 0;
  
  try {
    const { count, error } = await supabase
      .from('lojistas' as any)
      .select('id', { count: 'exact', head: true });
    if (!error) total += count || 0;
  } catch {
    // RLS block ou tabela inexistente — ignora silenciosamente
  }

  try {
    const { count, error } = await supabase
      .from('curriculos' as any)
      .select('id', { count: 'exact', head: true })
      .or('busca_vaga.eq.true,presta_servico.eq.true');
    if (!error) total += count || 0;
  } catch {
    // RLS block ou tabela inexistente — ignora silenciosamente
  }

  return total;
};

export const BottomNavV2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { responsavel } = usePortalContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: lojaCount } = useQuery({
    queryKey: ['portal-loja-status'],
    queryFn: fetchLojaStatus,
    retry: false, // Não re-tentar se RLS bloquear (403)
    staleTime: 30 * 60 * 1000, // 30 min — raramente muda
    gcTime: 60 * 60 * 1000, // 1h no garbage collector
  });

  const showLoja = (lojaCount || 0) > 0;

  const leftItems = [
    { label: 'Home', icon: Home, path: '/portal' },
    { label: 'Alunos', icon: Users, path: '/portal/alunos' },
  ];

  const rightItems = [
    { label: 'Financeiro', icon: Receipt, path: '/portal/financeiro' },
    { label: 'Avisos', icon: Bell, path: '/portal/avisos' },
  ];

  const handleLinkClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsMenuOpen(false);
  };

  // Menu completo para o Burger
  const menuFullItems = [
    { label: 'Página Inicial', icon: Home, path: '/portal', desc: 'Resumo geral e alertas' },
    { label: 'Meus Filhos', icon: Users, path: '/portal/alunos', desc: 'Dados e boletins' },
    { label: 'Mural de Avisos', icon: Bell, path: '/portal/avisos', desc: 'Notificações da escola' },
    { label: 'Financeiro', icon: CreditCard, path: '/portal/financeiro', desc: 'Faturas e pagamentos' },
    ...(showLoja ? [{ label: 'Loja Online', icon: ShoppingBag, path: '/portal/loja', desc: 'Marketplace da escola' }] : []),
    { label: 'Meu Perfil', icon: User, path: '/portal/perfil', desc: 'Dados cadastrais' },
    { label: 'Documentos', icon: ClipboardList, path: '/portal/documentos', desc: 'Contratos e arquivos' },
    { label: 'Privacidade', icon: Shield, path: '/portal/perfil', desc: 'Termos e LGPD' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="mx-auto w-full flex items-center justify-around h-20 px-4 relative">
        
        {/* Lado Esquerdo */}
        {leftItems.map((item) => (
          <NavItem key={item.path} item={item} location={location} onClick={handleLinkClick} />
        ))}

        {/* Botão Central (Hamburger Elevado) - COR VERDE (TEAL/EMERALD) */}
        <div className="relative -mt-4">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-100 dark:shadow-none -translate-y-4 border-4 border-white dark:border-slate-900 relative z-50 focus:outline-none"
              >
                <Menu size={28} strokeWidth={2.5} />
              </motion.button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="rounded-t-[32px] p-0 border-t border-slate-100 dark:border-slate-800 h-[85vh] overflow-y-auto">
              <div className="p-6 space-y-6 pb-12">
                <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-4 text-left">
                    <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-black text-slate-900 dark:text-white">Menu do Portal</SheetTitle>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesso Rápido à Família</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="grid grid-cols-1 gap-2.5">
                  {menuFullItems.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => { navigate(action.path); handleLinkClick(); }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group"
                    >
                      <div className="h-11 w-11 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-teal-500 shadow-sm transition-colors">
                        <action.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{action.label}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{action.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-400 transition-colors" />
                    </button>
                  ))}
                </div>

                <div className="pt-4 mt-4">
                   <button
                    onClick={() => { signOut?.(); handleLinkClick(); }}
                    className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-black text-xs uppercase tracking-wider"
                   >
                     <LogOut size={18} />
                     Finalizar Sessão
                   </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Lado Direito */}
        {rightItems.map((item) => (
          <NavItem key={item.path} item={item} location={location} onClick={handleLinkClick} />
        ))}

      </div>
    </nav>
  );
};

const NavItem = ({ item, location, onClick }: { item: any, location: any, onClick: () => void }) => {
  const isActive = location.pathname === item.path || (item.path !== '/portal' && location.pathname.startsWith(item.path));
  
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 min-w-[64px]",
        isActive ? "text-teal-500 scale-110" : "text-zinc-400"
      )}
    >
      <div className="relative">
        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className="h-6 w-6" />
        {isActive && (
          <motion.div
            layoutId="nav-glow-portal"
            className="absolute -inset-2 bg-teal-50 dark:bg-teal-900/20 rounded-full -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>
      <span className="text-[10px] font-bold tracking-tight">
        {item.label}
      </span>
    </NavLink>
  );
};
