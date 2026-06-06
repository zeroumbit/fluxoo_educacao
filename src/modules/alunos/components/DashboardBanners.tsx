import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/modules/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Banner } from '@/types/shared'

export function DashboardBanners() {
  const { authUser } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!authUser?.tenantId) {
      setIsLoading(false)
      return
    }

    const loadBanners = async () => {
      try {
        let cidadeEscola = ''

        // Se for o super_admin testando, pegamos a primeira cidade com escola
        if (authUser.role === 'super_admin' || authUser.tenantId === 'super_admin') {
          const { data: escolaData } = await supabase
            .from('escolas')
            .select('cidade')
            .not('cidade', 'is', null)
            .neq('cidade', '')
            .limit(1)
            .maybeSingle()
          cidadeEscola = escolaData?.cidade || ''
        } else {
          // Busca a cidade da escola atual
          const { data: escolaData } = await supabase
            .from('escolas')
            .select('cidade')
            .eq('id', authUser.tenantId)
            .maybeSingle()
          cidadeEscola = escolaData?.cidade || ''
        }

        if (!cidadeEscola) {
          setIsLoading(false)
          return
        }

        // Adiciona folga de 5 minutos no início para evitar problemas de fuso horário
        const now = new Date()
        const checkStart = new Date(now.getTime() + 5 * 60 * 1000).toISOString()
        const checkEnd = now.toISOString()

        const { data: bannersData } = await supabase
          .from('banners')
          .select('*')
          .eq('status', 'ativo')
          .ilike('cidade', cidadeEscola)
          .lte('data_inicio', checkStart)
          .gte('data_fim', checkEnd)
          .order('created_at', { ascending: false })
          .limit(5)

        // Embaralha os banners de forma randômica antes de salvar no estado
        const shuffledBanners = (bannersData || []).sort(() => Math.random() - 0.5)
        setBanners(shuffledBanners)
      } catch (err) {
        console.error('Erro ao carregar banners:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBanners()
  }, [authUser])
  const [closedBanners, setClosedBanners] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fluxoo:closed-banners')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Controle de tempo para liberação do fechamento (15 segundos)
  const [timeLeft, setTimeLeft] = useState(15)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Filtrar banners ativos que não foram fechados nesta sessão pelo usuário
  const visibleBanners = banners?.filter(b => !closedBanners.includes(b.id)) || []

  // Controlar o timer de 15 segundos para o slide atual
  useEffect(() => {
    if (visibleBanners.length === 0) return

    // Reiniciar contagem ao mudar de slide
    setTimeLeft(15)

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentSlide, visibleBanners.length])

  // Troca automática de slide a cada 5 segundos se o botão de fechar não estiver sob contagem ativa
  useEffect(() => {
    if (visibleBanners.length <= 1) return

    const autoPlayTimer = setInterval(() => {
      // Só avança o carrossel se a contagem regressiva deste slide já tiver finalizado (para dar tempo de ler)
      if (timeLeft === 0) {
        setCurrentSlide(prev => (prev + 1) % visibleBanners.length)
      }
    }, 6000)

    return () => clearInterval(autoPlayTimer)
  }, [visibleBanners.length, timeLeft])

  if (isLoading || visibleBanners.length === 0) return null

  const banner = visibleBanners[currentSlide]

  const handleClose = (id: string) => {
    if (timeLeft > 0) return // Prevenção de segurança

    const updated = [...closedBanners, id]
    setClosedBanners(updated)
    localStorage.setItem('fluxoo:closed-banners', JSON.stringify(updated))
    
    // Resetar slide atual para evitar índice fora dos limites
    if (currentSlide >= visibleBanners.length - 1) {
      setCurrentSlide(0)
    }
  }

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + visibleBanners.length) % visibleBanners.length)
  }

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % visibleBanners.length)
  }

  return (
    <div className="relative w-full max-w-[1216px] mx-auto overflow-hidden rounded-[2rem] border border-slate-200/60 shadow-lg shadow-zinc-100/50 bg-white mb-8 group">
      
      {/* Container de Transição dos Banners */}
      <div className="relative aspect-[1216/250] w-full min-h-[110px] md:min-h-[150px] lg:min-h-[180px] overflow-hidden">
        <a 
          href={banner.link_redirecionamento} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 block w-full h-full"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={banner.id}
              src={banner.url_imagem}
              alt={banner.nome}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="w-full h-full object-cover select-none"
            />
          </AnimatePresence>
        </a>
      </div>

      {/* Botão de Fechamento com Timer */}
      <div className="absolute top-4 right-4 z-20">
        {timeLeft > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/10 select-none text-[10px] font-black uppercase tracking-wider shadow-md shadow-black/10">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            Fechar em {timeLeft}s
          </div>
        ) : (
          <button
            onClick={() => handleClose(banner.id)}
            className="h-8 w-8 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white flex items-center justify-center transition-all border border-white/10 active:scale-90 shadow-md shadow-black/20 hover:scale-105"
            title="Fechar Banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Paginação e Setas (Apenas se houver mais de 1 banner) */}
      {visibleBanners.length > 1 && (
        <>
          {/* Seta Esquerda */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-all shadow-md active:scale-90 opacity-0 group-hover:opacity-100 hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Seta Direita */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-all shadow-md active:scale-90 opacity-0 group-hover:opacity-100 hover:scale-105"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicadores / Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {visibleBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                  index === currentSlide 
                    ? "w-6 bg-white" 
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
