import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('fluxoo-cookies-accepted')
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('fluxoo-cookies-accepted', 'true')
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('fluxoo-cookies-accepted', 'false')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:max-w-md z-[100]"
        >
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
                <Cookie size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 uppercase italic">
                  Cookies & Privacidade
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência educacional e garantir a segurança da plataforma conforme a LGPD.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Button 
                  onClick={handleAccept}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold py-6 text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20"
                >
                  Aceitar Tudo
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDecline}
                  className="rounded-xl font-bold py-6 text-xs uppercase tracking-widest border-slate-100 text-slate-400 hover:text-slate-600"
                >
                  Negar
                </Button>
              </div>
              
              <div className="flex justify-center items-center gap-4 pt-2">
                <Link 
                  to="/politica-cookies" 
                  className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
                >
                  Política de Cookies
                </Link>
                <span className="text-slate-100 italic">|</span>
                <Link 
                  to="/politica-privacidade" 
                  className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
                >
                  Privacidade
                </Link>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2 opacity-50">
               <ShieldCheck size={12} className="text-teal-500" />
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Plataforma 100% LGPD Compliance</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
