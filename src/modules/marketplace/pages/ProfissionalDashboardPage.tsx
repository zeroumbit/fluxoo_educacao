import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/AuthContext'
import {
  Briefcase,
  FileUser,
  Search,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Star,
  Users,
  Settings,
  Bell,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  sub: string
  icon: any
  color: string
}

function MetricCard({ label, value, sub, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="border-0 shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
        <div className={cn("p-2 rounded-xl", color)}>
          <Icon size={18} />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-2xl font-black text-zinc-900 tracking-tight">{value}</div>
        <p className="text-[11px] font-medium text-zinc-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}

export function ProfissionalDashboardPage() {
  const navigate = useNavigate()
  const { authUser } = useAuth()

  const metrics = [
    { label: "Vagas Favoritas", value: "0", sub: "Aguardando retorno", icon: Heart, color: "bg-rose-50 text-rose-600" },
    { label: "Candidaturas", value: "0", sub: "Em andamento", icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Visualizações", value: "0", sub: "No seu perfil", icon: Users, color: "bg-indigo-50 text-indigo-600" },
    { label: "Avaliação", value: "5.0", sub: "Média profissional", icon: Star, color: "bg-amber-50 text-amber-600" }
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Painel do Profissional</p>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">Meu Perfil</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/profissional/curriculo')} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-11 px-6 font-bold shadow-lg shadow-indigo-100">
            <FileUser size={18} className="mr-2" /> Editar Currículo
          </Button>
        </div>
      </div>

      {/* Alerta de Perfil Completo */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-100">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
          <Sparkles size={160} />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-white font-bold">Quase lá, {authUser?.nome}!</h2>
            <p className="text-indigo-50/80 font-medium leading-relaxed">
              Complete seu currículo profissional para atrair mais olhares das escolas da rede Fluxoo. Profissionais com perfil 100% preenchido recebem até 5x mais convites.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
             <Button onClick={() => navigate('/profissional/curriculo')} className="bg-white text-indigo-700 hover:bg-zinc-100 rounded-xl h-11 px-6 font-bold">
              Completar Perfil Agora
            </Button>
            <Button variant="outline" onClick={() => navigate('/profissional/vagas')} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-11 px-6 font-bold">
              Explorar Vagas
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vagas em Destaque (Placeholder) */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between pt-[30px]">
              <div>
                <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Vagas Recomendadas</CardTitle>
                <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-widest">Baseado no seu perfil</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/profissional/vagas')} className="text-indigo-600 font-bold hover:bg-indigo-50">Explorar Tudo</Button>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="text-center py-12 space-y-4">
                <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center mx-auto text-zinc-300">
                  <Search size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-900">Encontre sua oportunidade</p>
                  <p className="text-sm text-zinc-500">Mantenha seu perfil atualizado e as melhores escolas entrarão em contato.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links Rápidos / Categorias */}
        <div>
          <Card className="border-0 shadow-sm rounded-[2.5rem] overflow-hidden bg-zinc-50/50">
            <CardHeader className="p-8 pb-4 pt-[30px]">
              <CardTitle className="text-xl font-black text-zinc-900 tracking-tight">Atalhos</CardTitle>
              <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-widest">Painel de Acesso</p>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {[
                { label: 'Meu Currículo', icon: FileUser, href: '/profissional/curriculo' },
                { label: 'Buscar Vagas', icon: Search, href: '/profissional/vagas' },
                { label: 'Mensagens / Convites', icon: MessageSquare, href: '/profissional/mensagens' },
                { label: 'Solicitar Avaliação', icon: Star, href: '/profissional/avaliacoes' },
              ].map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(link.href)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-zinc-100 hover:shadow-md hover:border-indigo-100 hover:-translate-y-1 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 group-hover:bg-indigo-50 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 transition-colors">
                    <link.icon size={20} />
                  </div>
                  <span className="font-bold text-zinc-700 group-hover:text-zinc-900 text-sm">{link.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Heart(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
    )
}
