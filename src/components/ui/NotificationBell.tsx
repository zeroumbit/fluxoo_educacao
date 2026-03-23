import React, { useState } from 'react';
import { Bell, ExternalLink, X } from 'lucide-react';
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

export function NotificationBell({ total, items, className, onItemClick }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (href: string) => {
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

  return (
    <div className={cn("relative z-50", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95 border border-slate-100"
        aria-label="Notificações"
      >
        <Bell className="w-6 h-6" />
        {total > 0 && (
          <span className="absolute top-0 right-0 -mr-1 -mt-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
            {total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/10 md:bg-transparent z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-[300px] md:w-[350px] bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Notificações</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{total} alertas ativos</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-300">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-2">
                {items.length > 0 ? (
                  categories.map((category) => (
                    <div key={category} className="mb-4 last:mb-0">
                      {/* Category Header */}
                      <div className="px-3 py-2 mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{category}</p>
                      </div>
                      
                      {/* Items da categoria */}
                      <div className="space-y-1">
                        {itemsByCategory[category].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item.href)}
                            className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all border border-transparent group-hover:border-slate-100 shrink-0">
                              <Bell size={18} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-slate-900">{item.label}</p>
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                Ver Detalhes <ExternalLink size={10} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <Bell size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">Tudo em dia!</p>
                      <p className="text-[10px] font-medium text-slate-300 italic">Você não tem novas notificações.</p>
                    </div>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Central de Alertas Fluxoo</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
