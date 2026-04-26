import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Bell, Users, Copy } from 'lucide-react';
import { usePortalContext } from '../../context';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { usePortalNotifications } from '@/hooks/useNotifications';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NativeHeaderProps {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  onCopyId?: (id: string) => void;
}

export function NativeHeader({ 
  title, 
  showBack = false, 
  showNotifications = true,
  onBack,
  onCopyId
}: NativeHeaderProps) {
  const navigate = useNavigate();
  const { responsavel, vinculos, selecionarAluno, alunoSelecionado, isMultiAluno } = usePortalContext();
  const { data: notifications } = usePortalNotifications(responsavel?.id);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="header-mobile-native">
      <div className="flex items-center gap-3">
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 active:bg-slate-50 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}
        
        <div className="flex flex-col">
          {title === 'Home' && responsavel ? (
            <>
              <span className="text-[13px] text-slate-500 font-medium leading-tight">Olá,</span>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
                {responsavel.nome?.split(' ')[0]}
              </h1>
            </>
          ) : (
            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Student Selector - Improved "Select" */}
        {vinculos && vinculos.length > 0 && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button 
                className="btn-premium-select"
                aria-label="Selecionar aluno"
              >
                <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm ring-2 ring-white overflow-hidden">
                   {alunoSelecionado?.foto_url ? (
                     <img src={alunoSelecionado.foto_url} alt="" className="w-full h-full object-cover" />
                   ) : (
                     alunoSelecionado ? getInitials(alunoSelecionado.nome_completo) : <Users size={14} />
                   )}
                </div>
                {isMultiAluno && <ChevronDown size={14} className="text-slate-400" />}
              </button>
            </SheetTrigger>
            
            <SheetContent 
              side="bottom" 
              className="rounded-t-[32px] p-0 border-t border-slate-100 max-h-[92vh] h-[92vh] overflow-hidden flex flex-col bg-white"
            >
               <SheetHeader className="p-6 pb-2 border-b border-slate-50 shrink-0">
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                  <SheetTitle className="text-[20px] font-bold text-slate-900 tracking-tight text-center">
                     Escolha o Aluno
                  </SheetTitle>
               </SheetHeader>
               
               <div className="p-4 space-y-3 overflow-y-auto flex-1 pb-safe">
                  {vinculos.map((v) => (
                    <motion.button
                      key={v.aluno?.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        selecionarAluno(v);
                        setIsSheetOpen(false);
                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-[20px] transition-all border",
                        alunoSelecionado?.id === v.aluno?.id 
                          ? "bg-teal-50 border-teal-200 shadow-sm" 
                          : "bg-white border-slate-100 active:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold shadow-sm overflow-hidden",
                        alunoSelecionado?.id === v.aluno?.id ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {v.aluno?.foto_url ? (
                          <img src={v.aluno.foto_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(v.aluno?.nome_completo || 'A')
                        )}
                      </div>
                      
                      <div className="flex flex-col text-left flex-1 min-w-0">
                         <span className={cn(
                           "text-[16px] font-bold tracking-tight truncate",
                           alunoSelecionado?.id === v.aluno?.id ? "text-teal-900" : "text-slate-800"
                         )}>
                            {v.aluno?.nome_completo}
                         </span>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-[12px] font-medium text-slate-400">
                              {v.aluno?.turma?.nome || 'Sem turma'}
                           </span>
{v.aluno?.codigo_transferencia && (
                               <>
                                 <span className="text-slate-200 text-[10px]">•</span>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onCopyId?.(v.aluno.codigo_transferencia);
                                     if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                                   }}
                                   className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md active:scale-95 transition-transform"
                                 >
                                    <Copy size={10} />
                                    ID: {v.aluno.codigo_transferencia}
                                 </button>
                               </>
                            )}
                         </div>
                      </div>
                      
                      {alunoSelecionado?.id === v.aluno?.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                      )}
                    </motion.button>
                  ))}
               </div>
            </SheetContent>
          </Sheet>
        )}

        {showNotifications && (
          <NotificationBell
            total={notifications?.total || 0}
            items={notifications?.items || []}
          />
        )}
      </div>
    </header>
  );
}
