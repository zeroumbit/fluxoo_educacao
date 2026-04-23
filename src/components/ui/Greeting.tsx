import { useAuth } from '@/modules/auth/AuthContext'
import { format } from 'date-fns'

export function Greeting() {
  const { authUser } = useAuth()
  const now = new Date()
  const hour = now.getHours()
  const name = authUser?.nome?.split(' ')[0] || ''
  
  let greeting = 'Boa noite'
  if (hour >= 5 && hour < 12) greeting = 'Bom dia'
  else if (hour >= 12 && hour < 18) greeting = 'Boa tarde'

  return (
    <div className="flex flex-col gap-0.5">
       <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
         {greeting} <span className="text-indigo-600 dark:text-indigo-400">{name}</span>,
       </h1>
       <p className="text-sm lg:text-base font-medium text-zinc-600 dark:text-zinc-400">
         Bem-vindo de volta.
       </p>
       <p className="text-[10px] lg:text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-widest mt-1">
         Agora são {format(now, 'HH:mm')}
       </p>
    </div>
  )
}
