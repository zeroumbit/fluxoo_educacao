import React, { useState, useCallback } from "react"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

/**
 * Pull-to-Refresh simplificado sem drag do framer-motion
 * (framer drag="y" conflita com scroll nativo do conteúdo).
 * Usa touch events nativos para detectar gesto de puxar.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Só ativa pull se scroll no topo
    const target = e.currentTarget
    if (target.scrollTop <= 0) {
      setStartY(e.touches[0].clientY)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startY) return
    const target = e.currentTarget
    if (target.scrollTop > 0) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    if (diff > 0 && diff < 150) {
      setPullDistance(diff)
    }
  }, [startY])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 70 && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }, [pullDistance, isRefreshing, onRefresh])

  const showIndicator = pullDistance > 10 || isRefreshing

  return (
    <div
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador visual */}
      {showIndicator && (
        <div
          className="flex justify-center items-center py-3 transition-all duration-200"
          style={{ height: isRefreshing ? 48 : Math.min(pullDistance * 0.5, 48) }}
        >
          <RefreshCw
            className={`h-5 w-5 text-indigo-500 transition-transform ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / 70, 1),
            }}
          />
        </div>
      )}
      {children}
    </div>
  )
}
