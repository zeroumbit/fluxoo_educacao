import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Zap, 
  Bell, 
  ShieldCheck, 
  Share, 
  PlusSquare, 
  Smartphone,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PwaInstallPromptProps {
  onDismiss?: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ onDismiss }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // 2. Check if already installed
    // @ts-ignore
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    // 3. Check if dismissed recently (last 7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    let isDismissed = false;
    if (dismissedAt) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDaysInMs) {
        isDismissed = true;
      }
    }

    if (isStandalone || isDismissed) {
      setIsVisible(false);
      return;
    }

    // 4. Handle Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Give some time for the page to settle
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. For iOS, we show manually since there's no native prompt
    if (isIOS) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
    // Optional: Save to localStorage to not show again for some time
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };


  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-4 left-3 right-3 z-[100] pointer-events-auto sm:left-auto sm:right-4 sm:max-w-md pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="bg-white rounded-[40px] shadow-[0_30px_70px_-15px_rgba(20,184,166,0.4)] border border-teal-50 p-6 md:p-8 overflow-hidden relative">
          
          {/* Botão Fechar Discreto */}
          <button 
            onClick={handleDismiss}
            className="absolute top-6 right-6 p-1.5 bg-slate-50 text-slate-300 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={14} />
          </button>

          {/* Cabeçalho Compacto */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-teal-500 rounded-[20px] shadow-lg shadow-teal-500/30 flex items-center justify-center text-white font-black text-2xl italic tracking-tighter shrink-0">
              F
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tighter leading-tight">
                Fluxoo <span className="text-teal-500">Edu</span>
              </h3>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">
                App Oficial
              </p>
            </div>
          </div>

          {/* Grid de Benefícios */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: Zap, label: "Rápido", color: "text-amber-500", bg: "bg-amber-50" },
              { icon: Bell, label: "Alertas", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: ShieldCheck, label: "Seguro", color: "text-emerald-500", bg: "bg-emerald-50" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon size={14} />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{item.label}</span>
              </div>
            ))}
          </div>

          {/* CONTEÚDO DINÂMICO */}
          {platform === 'ios' ? (
            <div className="bg-slate-900 rounded-[30px] p-5 text-white shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center text-white">
                   <Smartphone size={14} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-teal-400">Instalar no Safari</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black text-teal-400 shrink-0 border border-white/5">1</div>
                  <p className="text-[11px] font-bold">Toque em <strong className="text-teal-300 italic">Compartilhar</strong> <Share size={12} className="inline mx-1 mb-1" /></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black text-teal-400 shrink-0 border border-white/5">2</div>
                  <p className="text-[11px] font-bold">Selecione <strong className="text-teal-300 italic">Tela de Início</strong> <PlusSquare size={12} className="inline mx-1 mb-1" /></p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 text-center">
                 <button 
                  onClick={handleDismiss}
                  className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-slate-300 transition-colors"
                 >
                   Agora não
                 </button>
              </div>

              {/* Seta animada apontando para a barra do Safari */}
              <motion.div 
                animate={{ y: [0, 5, 0] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-teal-500/50"
              >
                <ArrowDown size={16} />
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleInstallClick}
                className="w-full py-5 bg-teal-500 text-white rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/40 hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Download size={18} className="animate-bounce" /> Instalar Grátis
              </button>
              <button 
                onClick={handleDismiss}
                className="w-full py-2 text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] hover:text-slate-600 transition-colors text-center"
              >
                Agora Não
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
