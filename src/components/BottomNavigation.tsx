import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BottomNavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

interface BottomNavigationProps {
  items: BottomNavigationItem[]
}

export function BottomNavigation({ items }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-lg lg:hidden">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-2 transition-all duration-200',
                isActive
                  ? 'text-[#14B8A6]'
                  : 'text-[#64748B] hover:text-[#14B8A6]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-[#14B8A6]' : ''
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    isActive ? 'text-[#14B8A6]' : ''
                  )}
                >
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
