import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PortalModalPageProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  icon: any
  children: React.ReactNode
  colorClass?: string
}

export function PortalModalPage({
  open,
  onOpenChange,
  title,
  subtitle,
  icon: Icon,
  children,
  colorClass = "bg-indigo-600"
}: PortalModalPageProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-full sm:max-w-4xl p-0 overflow-hidden bg-white h-[100dvh] sm:h-auto sm:max-h-[95vh] flex flex-col border-0 sm:border rounded-none sm:rounded-3xl">
        <div className={cn(colorClass, "p-6 sm:p-8 text-white shrink-0 relative")}>
          <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mb-4 sm:hidden" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon size={24} className="opacity-70" />
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">{title}</DialogTitle>
              </div>
              {subtitle && (
                <DialogDescription className="text-white/60 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  {subtitle}
                </DialogDescription>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors -mr-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
