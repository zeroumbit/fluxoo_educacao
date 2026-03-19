import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { useIsMobile } from '@/hooks/use-mobile'

interface AdaptiveModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'peek' | 'half' | 'full'
  maxWidth?: string // e.g. "sm:max-w-[550px]"
}

export function AdaptiveModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'half',
  maxWidth = 'sm:max-w-[550px]'
}: AdaptiveModalProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <BottomSheet 
        isOpen={open} 
        onClose={onClose} 
        title={title} 
        size={size}
      >
        <div className="space-y-4 pt-2">
          {description && (
            <p className="text-sm text-slate-500 font-medium">
              {description}
            </p>
          )}
          {children}
          {footer && (
            <div className="pt-4 border-t border-slate-100 mt-6 pb-20">
              {footer}
            </div>
          )}
        </div>
      </BottomSheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${maxWidth} rounded-xl border-0 shadow-2xl p-0 overflow-hidden bg-slate-50`}>
        <DialogHeader className="p-6 bg-white border-b border-slate-100">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 leading-none">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs font-semibold text-slate-500 mt-1.5 leading-none">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <DialogFooter className="p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
