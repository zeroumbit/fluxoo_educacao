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
      // signOut() já faz o redirecionamento via window.location.href
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-500 text-white py-4 px-8 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 z-[9999] shadow-xl sticky top-0 overflow-hidden"
          >
            <WifiOff size={18} className="animate-pulse" /> Você está offline — Verifique sua conexão para continuar navegando
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/portal')}>
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md">
              <img src={CorujaIcon} alt="Fluxoo" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 italic uppercase">Fluxoo<span className="text-teal-500">Edu</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Portal da Família V2</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl font-bold tracking-wide text-sm transition-all ${
                    isActive 
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' 
                      : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
            <button
              onClick={() => navigate('/portal/perfil')}
              className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors font-bold text-sm"
              disabled={isLoggingOut}
            >
              <User size={18} /> Meu Perfil
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isLoggingOut ? 'Saindo...' : 'Sair'}
            >
              {isLoggingOut ? (
                <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-8 relative">
        <Outlet />
      </main>
    </div>
  );
}
