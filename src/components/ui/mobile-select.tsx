"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { Select as RadixSelect, SelectTrigger as RadixSelectTrigger, SelectValue as RadixSelectValue, SelectContent as RadixSelectContent, SelectItem as RadixSelectItem } from "./select"

interface Option {
  value: string;
  label: string;
}

interface MobileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  title?: string;
  className?: string;
}

export function MobileSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  title = "Selecionar",
  className
}: MobileSelectProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(false)
  
  const selectedOption = options.find(o => o.value === value)

  if (!isMobile) {
    return (
      <RadixSelect value={value} onValueChange={onValueChange}>
        <RadixSelectTrigger className={cn("w-full", className)}>
          <RadixSelectValue placeholder={placeholder} />
        </RadixSelectTrigger>
        <RadixSelectContent>
          {options.map((opt) => (
            <RadixSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </RadixSelectItem>
          ))}
        </RadixSelectContent>
      </RadixSelect>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button 
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm active:scale-[0.98] transition-all",
            className
          )}
        >
          <span className={selectedOption ? "text-slate-900" : "text-slate-400 font-medium"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="rounded-t-[32px] p-0 border-t border-slate-100 pb-[env(safe-area-inset-bottom,24px)] min-h-[40vh]">
        <SheetHeader className="p-6 pb-2 border-b border-slate-50">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <SheetTitle className="text-[18px] font-bold text-slate-900 text-center uppercase tracking-wider">{title}</SheetTitle>
        </SheetHeader>
        
        <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onValueChange(opt.value);
                setIsOpen(false);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-colors",
                value === opt.value ? "bg-teal-50 text-teal-600" : "hover:bg-slate-50 text-slate-700"
              )}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={18} className="text-teal-600" />}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
