import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink, useSearchParams } from 'react-router-dom'
import { 
  Search, 
  User, 
  ShoppingBag, 
  Heart, 
  ShoppingCart, 
  MapPin,
  ChevronDown,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '@/modules/auth/AuthContext'
import { PortalProvider } from '@/modules/portal/context'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ShopLayout() {
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

  const address = authUser?.endereco
  const formattedAddress = address?.logradouro 
    ? `${address.logradouro}, ${address.numero || 'S/N'} - ${address.cidade}/${address.estado}`
    : "Endereço não cadastrado"

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchTerm) {
      setSearchParams({ q: searchTerm })
    } else {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('q')
      setSearchParams(newParams)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      window.location.href = '/login'
    }
  }

  return (
    <PortalProvider>
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
        {/* Header Principal - Alinhado à UI do Portal */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 border-b border-slate-100 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            <div className="flex items-center gap-4 md:gap-12">
              {/* Logo */}
              <div 
                className="flex items-center gap-3 cursor-pointer shrink-0 md:w-56"
                onClick={() => navigate('/portal')}
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                  <GraduationCap size={24} />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-black tracking-tighter text-slate-800 italic uppercase leading-none">
                    Fluxoo<span className="text-teal-500">Loja</span>
                  </h1>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Marketplace da Família</p>
                </div>
              </div>

              {/* Busca - Estilo Portal */}
              <form onSubmit={handleSearch} className="flex-1 relative max-w-2xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                <Input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="O que você está procurando hoje?"
                  className="h-11 pl-11 pr-4 bg-slate-50 border-slate-100 rounded-xl text-sm font-medium placeholder:text-slate-400 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 transition-all"
                />
              </form>

              {/* Menus Desktop */}
              <div className="hidden lg:flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-600 uppercase tracking-tight">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                        <User size={18} />
                      </div>
                      <span className="max-w-[100px] truncate">{authUser?.nome?.split(' ')[0]}</span>
                      <ChevronDown size={14} className="opacity-40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-slate-100">
                    <DropdownMenuItem onClick={() => navigate('/portal/perfil')} className="flex items-center gap-2 p-3 font-medium rounded-xl focus:bg-teal-50 focus:text-teal-600 cursor-pointer">
                      <User size={16} /> Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/portal')} className="flex items-center gap-2 p-3 font-bold text-teal-600 rounded-xl focus:bg-teal-50 cursor-pointer">
                      <GraduationCap size={16} /> Voltar ao Portal
                    </DropdownMenuItem>
                    <div className="h-px bg-slate-100 my-1" />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 p-3 font-medium text-red-500 rounded-xl focus:bg-red-50 focus:text-red-600 cursor-pointer">
                      Sair da Conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-8 bg-slate-100" />

                <div className="flex items-center gap-1">
                  <button className="p-3 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all relative group">
                    <ShoppingBag size={22} />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all text-[8px] font-black uppercase tracking-tighter bg-teal-600 text-white px-1 rounded shadow-sm">Compras</span>
                  </button>

                  <button className="p-3 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                    <Heart size={22} />
                  </button>

                  <button className="h-12 w-12 rounded-xl bg-teal-500 text-white flex items-center justify-center relative hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                    <ShoppingCart size={22} />
                    <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                      0
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Segunda Linha - Endereço e Categorias */}
            <div className="flex items-center gap-4 md:gap-12 text-xs font-bold text-slate-500 border-t border-slate-50 pt-2 pb-1 overflow-hidden">
              <div className="flex items-start gap-1.5 text-slate-400 cursor-pointer group transition-colors shrink-0 md:w-56 overflow-hidden">
                <MapPin size={14} className="mt-1 group-hover:animate-bounce group-hover:text-teal-600 shrink-0" />
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="uppercase tracking-tight text-[10px] text-slate-400 group-hover:text-teal-600 transition-colors truncate">
                    Enviar para {authUser?.nome?.split(' ')[0]}
                  </span>
                  <span className="text-slate-600 truncate text-[11px] font-medium transition-colors group-hover:text-teal-600">
                    {formattedAddress}
                  </span>
                </div>
              </div>

              {/* Menu de Categorias - Alinhado com o início da barra de busca */}
              <nav className="hidden md:flex items-center gap-8 mt-1">
                <NavLink to="/portal/loja?cat=livros" className={({ isActive }) => cn("uppercase tracking-[0.15em] text-[10px] hover:text-teal-600 transition-colors shrink-0", isActive && "text-teal-600")}>Livros</NavLink>
                <NavLink to="/portal/loja?cat=material-escolar" className="uppercase tracking-[0.15em] text-[10px] hover:text-teal-600 transition-colors shrink-0">Material Escolar</NavLink>
                <NavLink to="/portal/loja?cat=vestuario" className="uppercase tracking-[0.15em] text-[10px] hover:text-teal-600 transition-colors shrink-0">Vestuário</NavLink>
              </nav>

              <div className="hidden md:block ml-auto mt-1">
                <NavLink to="/portal/loja/vender" className="uppercase tracking-widest text-[10px] text-teal-600 font-black flex items-center gap-1 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-all border border-teal-100 whitespace-nowrap">
                  Vender Items
                </NavLink>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header Sub-nav */}
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-around shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-wider hover:bg-teal-50 hover:text-teal-600 transition-all">
              <ShoppingBag size={18} /> Compras
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-wider hover:bg-teal-50 hover:text-teal-600 transition-all">
              <Heart size={18} /> Favoritos
            </button>
            <button className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-wider hover:bg-teal-50 hover:text-teal-600 transition-all">
              <ShoppingCart size={18} /> Carrinho
              <span className="absolute top-1 right-2 bg-teal-600 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-white">0</span>
            </button>
        </div>

        {/* Conteúdo Principal */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:py-8">
          <Outlet />
        </main>

        <footer className="bg-white border-t border-slate-200 p-8 mt-auto">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Fluxoo Loja - Marketplace Escolar
            </p>
          </div>
        </footer>
      </div>
    </PortalProvider>
  )
}
