import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNavV2 } from './components/BottomNavV2';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

export function PortalLayoutV2Mobile() {
  const location = useLocation();
  const isOnline = useOnlineStatus();

  return (
    // Layout base com safe areas para dispositivos com notch (iOS) e gesture bar (Android)
    <div className="flex flex-col h-[100dvh] bg-slate-50 text-slate-800 antialiased relative font-sans overflow-hidden">
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-500 text-white py-3 px-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 z-[9999] shadow-lg sticky top-0"
          >
            <WifiOff size={14} className="animate-pulse" /> Sem Conexão — Algumas funções podem estar limitadas
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        Main content area
        - pb-24: Espaço na parte inferior para garantir que o conteúdo nunca fique atrás do BottomNavV2 (~80px + safe area)
        - max-w-md: largura máxima para simular viewport mobile em tablets/desktop
        - flex-1 overflow-y-auto: essencial para o scroll interno funcionar
      */}
      <main className="flex-1 w-full max-w-md mx-auto pb-safe overflow-y-auto scroll-smooth">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 450, damping: 38, mass: 1 }}
            className="flex flex-col min-h-full pb-24"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavV2 />
    </div>
  );
}
