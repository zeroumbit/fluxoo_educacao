import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MobilePageLayoutProps {
  title: string
  leftAction?: React.ReactNode
  rightActions?: React.ReactNode
  children: React.ReactNode
  className?: string
  stickyHeader?: React.ReactNode
}

export function MobilePageLayout({
  title,
  leftAction,
  rightActions,
  children,
  className,
  stickyHeader
}: MobilePageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950">
      {/* Top App Bar - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="mx-auto w-full max-w-[640px] h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {leftAction}
            <h1 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[200px] tracking-tight">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        </div>
      </header>

      {/* Sticky Header (Optional) - Positioned below Top Bar */}
      {stickyHeader && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-full max-w-[640px]">
            {stickyHeader}
          </div>
        </div>
      )}

      {/* Content Area */}
      <main 
        className={cn(
          "mx-auto w-full max-w-[640px] pt-16 pb-32 px-4 flex-1 scroll-smooth",
          stickyHeader && "pt-32", // Adjust padding if sticky header exists
          className
        )}
      >
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
