import React, { type ReactNode } from 'react'
import { motion, type PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Trash2, Edit2 } from 'lucide-react'

interface NativeCardProps {
  children: ReactNode
  onClick?: () => void
  onDelete?: () => void
  onEdit?: () => void
  className?: string
  layoutId?: string
  swipeable?: boolean
}

/**
 * Card com feedback tátil nativo (whileTap scale 0.97).
 * Suporta swipe-to-action horizontal quando swipeable=true.
 */
export function NativeCard({
  children,
  onClick,
  onDelete,
  onEdit,
  className,
  layoutId,
  swipeable = false
}: NativeCardProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-80, -20], [1, 0])
  const editOpacity = useTransform(x, [20, 80], [0, 1])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -60 && onDelete) {
      onDelete()
    } else if (info.offset.x > 60 && onEdit) {
      onEdit()
    }
    // Always reset
    x.set(0)
  }

  const cardContent = (
    <motion.div
      layoutId={layoutId}
      style={swipeable ? { x } : undefined}
      drag={swipeable ? "x" : false}
      dragConstraints={{ left: onDelete ? -80 : 0, right: onEdit ? 80 : 0 }}
      dragElastic={0.15}
      onDragEnd={swipeable ? handleDragEnd : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={cn(
        "relative z-10 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100/80 dark:border-slate-700/50",
        onClick && "cursor-pointer active:shadow-inner",
        className
      )}
    >
      {children}
    </motion.div>
  )

  if (!swipeable) return cardContent

  return (
    <div className="relative">
      {/* Background swipe actions */}
      <div className="absolute inset-0 flex items-center justify-between px-5 rounded-2xl overflow-hidden pointer-events-none">
        <motion.div style={{ opacity: editOpacity }} className="flex items-center gap-2 text-indigo-600">
          <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center">
            <Edit2 className="h-4 w-4" />
          </div>
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-2 text-rose-600">
          <div className="h-9 w-9 rounded-full bg-rose-50 flex items-center justify-center">
            <Trash2 className="h-4 w-4" />
          </div>
        </motion.div>
      </div>
      {cardContent}
    </div>
  )
}
