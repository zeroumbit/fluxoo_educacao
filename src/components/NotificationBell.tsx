import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NotificationItem {
  id: string
  label: string
  href: string
}

interface NotificationBellProps {
  count: number
  items: NotificationItem[]
  isLoading?: boolean
}

export function NotificationBell({ count, items, isLoading }: NotificationBellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className={cn("h-5 w-5 text-slate-500", count > 0 && "animate-tada")} />
          {count > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white border-2 border-white rounded-full text-[10px] font-bold"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-slate-100">
        <DropdownMenuLabel className="px-3 py-2 text-sm font-bold text-slate-800">
          Notificações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            Carregando notificações...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Nenhuma notificação por enquanto.</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {items.map((item) => (
              <DropdownMenuItem key={item.id} asChild className="p-0 focus:bg-transparent">
                <Link
                  to={item.href}
                  className="flex flex-col gap-1 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Clique para ver detalhes
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
