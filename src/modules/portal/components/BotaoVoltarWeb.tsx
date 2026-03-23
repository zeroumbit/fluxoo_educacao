import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BotaoVoltarWebProps {
  className?: string
  onClick?: () => void
  to?: string
}

export function BotaoVoltarWeb({ className, onClick, to }: BotaoVoltarWebProps) {
  const navigate = useNavigate()

  const handleVoltar = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleVoltar}
      className={cn(
        "w-12 h-12 rounded-2xl bg-white border border-slate-200",
        "flex items-center justify-center text-slate-500",
        "hover:bg-slate-50 transition-colors shadow-sm",
        className
      )}
    >
      <ArrowLeft className="w-6 h-6" />
    </motion.button>
  )
}
