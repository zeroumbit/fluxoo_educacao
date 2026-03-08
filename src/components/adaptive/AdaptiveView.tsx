import React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

interface AdaptiveViewProps {
  web: React.ReactNode
  mobile: React.ReactNode
  breakpoint?: number
}

/**
 * Componente que alterna entre visões Web e Mobile baseado no breakpoint.
 * Útil para separar implementações complexas que seriam difíceis de manter em um único arquivo.
 */
export function AdaptiveView({ web, mobile, breakpoint = 768 }: AdaptiveViewProps) {
  const isMobile = useIsMobile(breakpoint)

  return <>{isMobile ? mobile : web}</>
}
