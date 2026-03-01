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
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao sair:', error)
      window.location.href = '/login'
    }
  }

  return (
    <PortalProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
        {/* Header - Teal Deep */}
        <header className="sticky top-0 z-40 bg-[#134E4A] text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#14B8A6] flex items-center justify-center shadow-inner">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Portal do Responsável</h1>
                <p className="text-xs text-teal-100 opacity-90">{authUser?.nome}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut} 
              className="text-teal-50 text-white/80 hover:text-white hover:bg-teal-800 transition-all rounded-full px-4"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair</span>
            </Button>
          </div>
        </header>

        {/* Navigation Tabs - White with Teal highlights */}
        <nav className="sticky top-[64px] z-30 bg-white border-b border-[#E2E8F0] shadow-sm">
          <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar py-1">
            {portalNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap',
                    isActive
                      ? 'border-[#14B8A6] text-[#14B8A6] bg-teal-50/50'
                      : 'border-transparent text-[#64748B] hover:text-[#14B8A6] hover:bg-zinc-50'
                  )
                }
              >
                <item.icon className={cn("h-4 w-4", "flex-shrink-0")} />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </PortalProvider>
  )
}
