import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Receipt, Bell, ShoppingBag, User, LogOut, WifiOff } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import CorujaIcon from '@/assets/coruja_APPLE.svg';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { AnimatePresence, motion } from 'framer-motion';

export function PortalLayoutV2Web() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isOnline = useOnlineStatus();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: 'Visão Geral', icon: Home, path: '/portal', exact: true },
    { label: 'Alunos', icon: Users, path: '/portal/alunos' },
    { label: 'Financeiro', icon: Receipt, path: '/portal/financeiro' },
    { label: 'Notificações', icon: Bell, path: '/portal/avisos' },
    { label: 'Loja Online', icon: ShoppingBag, path: '/portal/loja' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-rose-500 text-white py-4 px-8 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 z-[100] shadow-xl overflow-hidden"
          >
            <WifiOff size={18} className="animate-pulse" /> Você está offline — Verifique sua conexão para continuar navegando
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Vertical */}
      <aside className="w-80 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col p-8 z-50 shrink-0">
        {/* Brand/Logo */}
        <div className="flex items-center gap-4 mb-12 cursor-pointer" onClick={() => navigate('/portal')}>
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 transition-transform hover:scale-105 active:scale-95">
            <img src={CorujaIcon} alt="Fluxoo" className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-slate-800 italic uppercase leading-none">
              Fluxoo<span className="text-teal-500">Edu</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Portal da Família</p>
          </div>
        </div>

        {/* Menu Principal */}
        <nav className="flex flex-col gap-3 flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-4">Menu Principal</span>
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-[20px] font-bold tracking-wide text-sm transition-all duration-300 group ${
                  isActive 
                    ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/20 translate-x-2' 
                    : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50 hover:translate-x-1'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    size={22} 
                    className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-500'} 
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar - Perfil e Logout */}
        <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
          <button
            onClick={() => navigate('/portal/perfil')}
            className="flex items-center gap-4 px-5 py-4 rounded-[20px] text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-all font-bold text-sm group"
            disabled={isLoggingOut}
          >
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-teal-100 transition-colors">
              <User size={20} className="text-slate-500 group-hover:text-teal-600" />
            </div>
            <span>Meu Perfil</span>
          </button>
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-4 px-5 py-4 rounded-[20px] text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm group disabled:opacity-50"
          >
            <div className="p-2 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
              {isLoggingOut ? (
                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={20} />
              )}
            </div>
            <span>{isLoggingOut ? 'Saindo...' : 'Sair da Conta'}</span>
          </button>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-12 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
