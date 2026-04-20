import React, { useState, useEffect } from 'react';
import { Bell, ExternalLink, X, Check, Trash2, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useNotificacoesActions } from '@/hooks/useNotifications';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';

export interface NotificationItem {
  id: string;
  label: string;
  href: string;
  category?: 'SUPER ADMIN' | 'ESCOLAS' | 'PORTAL' | string;
  notifications?: any[]; // Notificações individuais do banco
}

export interface NotificationBellProps {
  total: number;
  items: NotificationItem[];
  className?: string;
  onItemClick?: () => void;
  tenantId?: string;
}

// Helper de vibração nativa
const vibrate = (ms: number | number[] = 15) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

export function NotificationBell({ total, items, className, onItemClick, tenantId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { marcarComoLida, marcarComoResolvida } = useNotificacoesActions();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const _handleToggle = () => {
    vibrate(20);
    setIsOpen(!isOpen);
  };

  const handleItemClick = (href: string, notificacoes?: any[]) => {
    vibrate(10);
    setIsOpen(false);
    navigate(href);
    
    // Marca todas as notificações deste grupo como lidas
    if (notificacoes && notificacoes.length > 0) {
      const ids = notificacoes.map(n => n.id).filter(Boolean);
      if (ids.length > 0) {
        // Marca como lidas em background (não bloqueia navegação)
        ids.forEach(id => marcarComoLida.mutateAsync(id));
      }
    }
    
    if (onItemClick) onItemClick();
  };

  const handleMarcarResolvida = (e: React.MouseEvent, notificacaoId: string) => {
    e.stopPropagation();
    vibrate(30);
    marcarComoResolvida.mutate(notificacaoId);
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
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
          <div className="w-10 h-1 bg-slate-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2 opacity-50" />
        )}
      </div>

      {/* List */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 space-y-4 pb-12",
        isMobile ? "" : "max-h-[400px]"
      )}>
        {items.length > 0 ? (
          categories.map((category) => (
            <div key={category} className="space-y-3">
              <div className="px-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{category}</p>
              </div>

              <div className="grid gap-2">
                {itemsByCategory[category].map((item, _idx) => {
                  // Se tiver notificações individuais, renderiza cada uma
                  if (item.notifications && item.notifications.length > 0) {
                    return item.notifications.map((notif, notifIdx) => (
                      <motion.button
                        key={notif.id || `${item.id}-${notifIdx}`}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        onClick={() => handleItemClick(item.href, [notif])}
                        className="w-full flex items-center gap-3 p-4 rounded-[20px] bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all text-left border border-transparent hover:border-slate-100 group active:scale-[0.98] relative"
                      >
                        <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-all border border-slate-100 group-hover:border-teal-500/20 shrink-0">
                          <BellRing size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-black text-slate-800 leading-tight group-hover:text-slate-900 italic uppercase tracking-tight truncate">
                            {notif.titulo || item.label}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                            {notif.mensagem || 'Clique para ver detalhes'}
                          </p>
                        </div>
                        {/* Ações */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleMarcarResolvida(e, notif.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                            title="Marcar como resolvida (remove)"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.button>
                    ))
                  }
                  
                  // Renderização padrão (sem notificações individuais)
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      onClick={() => handleItemClick(item.href, [])}
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
                  )
                })}
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
      <div className="p-4 bg-slate-50/50 border-t border-slate-50 mt-auto shrink-0 pb-safe">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">Monitoramento Fluxoo Alertas</p>
      </div>
    </div>
  );

  return (
    <div className={cn("relative z-[50]", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            onClick={() => vibrate(20)}
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
        </SheetTrigger>

        {isMobile ? (
          <SheetContent 
            side="bottom" 
            className="rounded-t-[40px] p-0 border-t border-slate-100 h-[85vh] max-h-[85vh] overflow-hidden flex flex-col bg-white outline-none"
          >
            <NotificationContent />
          </SheetContent>
        ) : (
          <SheetContent 
            side="right" 
            className="w-[400px] p-0 overflow-hidden flex flex-col bg-white outline-none"
          >
            <NotificationContent />
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
