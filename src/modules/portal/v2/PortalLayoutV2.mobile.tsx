import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNavV2 } from './components/BottomNavV2';

export function PortalLayoutV2Mobile() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased relative font-sans">
      <main className="flex-1 w-full max-w-md mx-auto pb-24 overflow-x-hidden">
        {/* Usamos wait para evitar a sobreposição durante o drill-down */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Bottom bar que cobre toda a base em mobile view */}
      <BottomNavV2 />
    </div>
  );
}
