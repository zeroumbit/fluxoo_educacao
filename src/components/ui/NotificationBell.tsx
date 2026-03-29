import React, { useState, useEffect } from 'react';
import { Bell, ExternalLink, X, ChevronDown, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  label: string;
  href: string;
  category?: 'SUPER ADMIN' | 'ESCOLAS' | 'PORTAL' | string;
}

interface NotificationBellProps {
  total: number;
  items: NotificationItem[];
  className?: string;
  onItemClick?: () => void;
}

// Helper de vibração nativa
const vibrate = (ms: number | number[] = 15) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

export function NotificationBell({ total, items, className, onItemClick }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggle = () => {
    vibrate(20);
    setIsOpen(!isOpen);
  };

  const handleItemClick = (href: string) => {
    vibrate(10);
    setIsOpen(false);
    navigate(href);
    if (onItemClick) onItemClick();
  };

  // Agrupa notificações por categoria
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'OUTROS';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  const categories = Object.keys(itemsByCategory);

  const NotificationContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Alertas</h3>
          <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest leading-none mt-1">
            {total} Novas Atualizações
          </p>
        </div>
        {!isMobile && (
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-300 transition-colors">
            <X size={20} />
          </button>
        )}
        {isMobile && (
          <div className="w-12 h-1 bg-slate-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2 opacity-50" />
        )}
      </div>

      {/* List */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 space-y-4",
        isMobile ? "max-h-[70vh]" : "max-h-[400px]"
      )}>
        {items.length > 0 ? (
          categories.map((category) => (
            <div key={category} className="space-y-3">
              <div className="px-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{category}</p>
              </div>
              
              <div className="grid gap-2">
                {itemsByCategory[category].map((item, idx) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleItemClick(item.href)}
                    className="w-full flex items-center gap-4 p-4 rounded-[20px] bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all text-left border border-transparent hover:border-slate-100 group active:scale-[0.98]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-all border border-slate-100 group-hover:border-teal-500/20 shrink-0">
                      <BellRing size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black text-slate-800 leading-tight group-hover:text-slate-900 italic uppercase tracking-tight truncate">{item.label}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                        Ver Detalhes <ExternalLink size={10} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center space-y-4">
             <div className="relative inline-block">
                <div className="absolute inset-0 bg-teal-500/10 blur-2xl rounded-full animate-pulse" />
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 text-teal-500 relative z-10">
                   <Bell size={36} />
                </div>
             </div>
             <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-800 italic uppercase">Tudo em dia!</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Não encontramos nenhum alerta pendente no momento.</p>
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-50 mt-auto">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">Monitoramento Fluxoo Alertas</p>
      </div>
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "relative p-2 rounded-xl transition-all active:scale-95 border",
          isOpen 
            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
        )}
        aria-label="Notificações"
      >
        <Bell className={cn("w-6 h-6", isOpen && "animate-bounce")} />
        {total > 0 && (
          <span className={cn(
            "absolute top-0 right-0 -mr-1 -mt-1 w-5 h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 animate-in zoom-in duration-300 shadow-lg",
            isOpen ? "bg-teal-500 border-slate-900" : "bg-red-500 border-white"
          )}>
            {total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99]"
            />

            {isMobile ? (
              /* MOBILE BOTTOM SHEET (DRAWER) */
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[100] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom,20px)] border-t border-slate-100"
              >
                <NotificationContent />
              </motion.div>
            ) : (
              /* WEB POPOVER */
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                className="absolute right-0 mt-4 w-[380px] bg-white rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.2)] border border-slate-100 z-[100] overflow-hidden"
              >
                <NotificationContent />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
