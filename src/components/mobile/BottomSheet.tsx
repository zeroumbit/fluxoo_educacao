import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'peek' | 'half' | 'full'
  title?: string
}

const sizeVariants = {
  peek: 'h-[40vh]',
  half: 'h-[60vh]',
  full: 'h-[92vh]'
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  size = 'half',
  title
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] z-[101] bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden",
              sizeVariants[size]
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ y: '100%', translateX: '-50%' }}
            animate={{ y: 0, translateX: '-50%' }}
            exit={{ y: '100%', translateX: '-50%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose()
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {title && (
              <div className="px-6 py-2 shrink-0">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
