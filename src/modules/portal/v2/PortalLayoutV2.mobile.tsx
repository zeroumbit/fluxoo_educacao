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
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 text-slate-800 antialiased relative font-sans">
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
        - pb-32: Amplo espaço na parte inferior para garantir que o conteúdo nunca fique atrás do BottomNavV2 (~68px)
        - max-w-md: largura máxima para simular viewport mobile em tablets/desktop
        - overflow-x-hidden: previne scroll horizontal indesejado
      */}
      <main className="flex-1 w-full max-w-md mx-auto pb-40 pb-safe overflow-x-hidden overflow-y-auto overscroll-contain">
        {/* 
          Page transitions - padrão nativo iOS/Android
          - iOS: edge swipe gesture (da direita para esquerda)
          - Android: back button gesture (de baixo para cima)
          - Spring animation: sensação de física natural
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 450, damping: 38, mass: 1 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 
        Bottom Navigation Bar
        - Fixed position na parte inferior
        - Safe area bottom para home indicator (iOS) e gesture bar (Android)
        - Rounded top corners para visual moderno
      */}
      <BottomNavV2 />
    </div>
  );
}
