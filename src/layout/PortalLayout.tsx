import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import { PortalProvider } from '@/modules/portal/context'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  User,
  CalendarCheck,
  Megaphone,
  CreditCard,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const portalNav = [
  { name: 'Meu Aluno', href: '/portal', icon: User, end: true },
  { name: 'Frequência', href: '/portal/frequencia', icon: CalendarCheck },
  { name: 'Avisos', href: '/portal/avisos', icon: Megaphone },
  { name: 'Cobranças', href: '/portal/cobrancas', icon: CreditCard },
  { name: 'Fila Virtual', href: '/portal/fila', icon: TrendingUp },
]

export function PortalLayout() {
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <PortalProvider>
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-indigo-50/30">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-base">Portal do Responsável</h1>
                <p className="text-xs text-muted-foreground">{authUser?.nome}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-red-600">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="sticky top-[61px] z-30 bg-white/60 backdrop-blur-md border-b">
          <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
            {portalNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </PortalProvider>
  )
}
