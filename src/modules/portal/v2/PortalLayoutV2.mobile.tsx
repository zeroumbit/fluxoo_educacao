import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNavV2 } from './components/BottomNavV2';

export function PortalLayoutV2Mobile() {
  const location = useLocation();

  return (
    // Layout base com safe areas para dispositivos com notch (iOS) e gesture bar (Android)
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased relative font-sans">
      {/* 
        Main content area
        - pb-32: Amplo espaço na parte inferior para garantir que o conteúdo nunca fique atrás do BottomNavV2 (~68px)
        - max-w-md: largura máxima para simular viewport mobile em tablets/desktop
        - overflow-x-hidden: previne scroll horizontal indesejado
      */}
      <main className="flex-1 w-full max-w-md mx-auto pb-[env(safe-area-inset-bottom,120px)] overflow-x-hidden overflow-y-auto">
        {/* 
          Page transitions - padrão nativo iOS/Android
          - iOS: edge swipe gesture (da direita para esquerda)
          - Android: back button gesture (de baixo para cima)
          - Spring animation: sensação de física natural
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32, mass: 0.9 }}
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
