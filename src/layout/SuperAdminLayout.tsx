import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  History,
  Menu,
  LogOut,
  ShieldCheck,
  ChevronRight,
  FileText,
  QrCode,
  ArrowUpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const superAdminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Escolas', href: '/admin/escolas', icon: Building2 },
  { name: 'Planos & Módulos', href: '/admin/planos', icon: ClipboardList },
  { name: 'Faturas', href: '/admin/faturas', icon: FileText },
  { name: 'Upgrades', href: '/admin/upgrades', icon: ArrowUpCircle },
  { name: 'Config. Recebimento', href: '/admin/config-recebimento', icon: QrCode },
  { name: 'Logs', href: '/admin/logs', icon: History },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center shadow-md">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight text-indigo-950">Gestão Empresa</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Super Admin</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {superAdminNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-blue-600' : '')} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-blue-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2.5 px-3 hover:bg-zinc-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs">
                  SA
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium truncate">{authUser?.nome}</p>
                </div>
                <p className="text-xs text-muted-foreground font-semibold">
                  SUPER ADMIN
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/5">
              <LogOut className="mr-2 h-4 w-4" />
              Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
