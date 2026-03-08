import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BotaoVoltarProps {
  className?: string
  onClick?: () => void
}

export function BotaoVoltar({ className, onClick }: BotaoVoltarProps) {
  const navigate = useNavigate()

  const handleVoltar = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={handleVoltar}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl",
        "bg-white border border-slate-100 shadow-sm",
        "text-slate-600 hover:text-teal-600 hover:border-teal-200",
        "font-bold text-xs uppercase tracking-wider transition-all",
        "active:bg-slate-50",
        className
      )}
    >
      <ArrowLeft size={16} />
      Voltar
    </motion.button>
  )
}
