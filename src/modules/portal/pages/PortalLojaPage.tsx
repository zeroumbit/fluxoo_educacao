import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePortalContext } from '../context'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Search,
  Package,
  Users,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Heart,
  Plus,
  Star,
  Truck,
  Tag,
  Store,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  useMarketplaceCategorias, 
  useLojistas, 
  useProfissionais 
} from '@/modules/super-admin/marketplace.hooks'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

const IconMap: Record<string, any> = {
  Package, Users, Briefcase, ShoppingBag, Heart, Star, Truck, Store
}

export function PortalLojaPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoading: loadingCtx } = usePortalContext()
  
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: dbCategorias, isLoading: loadingCategorias } = useMarketplaceCategorias()
  const { data: lojistas, isLoading: loadingLojistas } = useLojistas()
  const { data: profissionais, isLoading: loadingProfissionais } = useProfissionais()

  const isLoading = loadingCtx || loadingCategorias || loadingLojistas || loadingProfissionais

  const hasRealData = (lojistas && lojistas.length > 0) || (profissionais && profissionais.length > 0)

  useEffect(() => {
    const cat = searchParams.get('cat')
    if (cat) setActiveCategory(cat.toLowerCase())
    else setActiveCategory('all')
  }, [searchParams])

  const handleRefresh = () => {
    if (isRefreshing) return
    vibrate([20, 10, 20])
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const handleCategoryChange = (cat: string) => {
    vibrate(15)
    setActiveCategory(cat)
  }

  if (isLoading) {
    return (
      <div className="pt-[env(safe-area-inset-top,24px)] px-4">
        <div className="space-y-12 animate-pulse">
          <div className="h-10 w-48 bg-slate-100 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-48 bg-white border border-slate-50 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!hasRealData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 pt-[env(safe-area-inset-top,24px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
            <Store size={48} className="text-slate-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Loja em Construção
            </h2>
            <p className="text-slate-500 font-medium">
              Em breve você encontrará aqui produtos, serviços e profissionais recomendados pela escola.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/portal')}
            className="bg-slate-900 hover:bg-teal-600 text-white rounded-xl font-bold px-8"
          >
            Voltar ao Portal
          </Button>
        </motion.div>
      </div>
    )
  }

  const activeNavCategories = dbCategorias?.map(cat => ({
    id: cat.id,
    slug: cat.nome.toLowerCase(),
    label: cat.nome,
    icon: IconMap[cat.icone as keyof typeof IconMap] || Package
  })) || []

  const filteredProfissionais = profissionais?.filter((p: any) => {
    if (!searchTerm) return true;
    const searchStr = searchTerm.toLowerCase();
    const areas = p.areas_interesse?.join(' ').toLowerCase() || '';
    const cpf = p.cpf || '';
    return areas.includes(searchStr) || cpf.includes(searchStr);
  }) || []

  return (
    <div className="flex flex-col gap-6 pb-32 animate-in fade-in duration-700 pt-[env(safe-area-inset-top,24px)] mt-4 px-4 md:px-8">
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center gap-2 py-4 text-teal-500 font-black italic uppercase tracking-widest text-[10px]"
          >
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Atualizando...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 group cursor-pointer w-fit" aria-label="Informações da loja">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
            <MapPin size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              Marketplace da Escola
            </span>
            <span className="text-xs font-bold text-slate-700 leading-none">
              Lojistas e Profissionais
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <Input
              placeholder={isMobile ? "Buscar profissionais..." : "Busque por profissionais ou serviços..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-100 border-0 text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md transition-all active:scale-90"
              aria-label="Favoritos"
            >
              <Heart size={20} />
            </button>
          </div>
        </div>

        <nav className="flex items-center justify-start gap-6 py-2 overflow-x-auto scrollbar-hide scroll-smooth">
          <button
            onClick={() => handleCategoryChange('all')}
            className={cn(
              "flex items-center gap-2 text-sm font-bold transition-all hover:text-teal-600 group shrink-0",
              activeCategory === 'all' ? "text-teal-600 scale-105" : "text-slate-500"
            )}
          >
            <Package size={16} className={cn("transition-colors", activeCategory === 'all' ? "text-teal-500" : "text-slate-400 group-hover:text-teal-500")} />
            <span className="whitespace-nowrap italic">Ver Todos</span>
          </button>
          {activeNavCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={cn(
                "flex items-center gap-2 text-sm font-bold transition-all hover:text-teal-600 group shrink-0",
                activeCategory === cat.slug ? "text-teal-600 scale-105" : "text-slate-500"
              )}
            >
              <cat.icon size={16} className={cn("transition-colors", activeCategory === cat.slug ? "text-teal-500" : "text-slate-400 group-hover:text-teal-500")} />
              <span className="whitespace-nowrap italic">{cat.label}</span>
              <ChevronDown size={12} className={cn("transition-all text-slate-300", activeCategory === cat.slug ? "text-teal-500 rotate-180" : "group-hover:text-teal-500")} />
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-12">
        {(activeCategory === 'all' || activeCategory === 'profissionais' || activeCategory === 'serviços') && profissionais && profissionais.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none italic uppercase flex items-center gap-2">
                  <Briefcase size={20} className="text-teal-500" /> Profissionais
                </h2>
                <p className="text-xs font-bold text-slate-400 italic">Prestadores de serviço qualificados</p>
              </div>
              <Badge className="bg-teal-100 text-teal-600 border-0 font-bold">
                {filteredProfissionais.length} disponível{filteredProfissionais.length !== 1 ? 'eis' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfissionais
                .slice(0, 12)
                .map((prof: any, idx: number) => (
                  <motion.div
                    key={prof.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                      <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                        <div className="h-14 w-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 font-black text-xl italic group-hover:bg-teal-500 group-hover:text-white transition-colors uppercase">
                          {prof.areas_interesse?.[0]?.substring(0, 1) || 'P'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tighter italic">
                            {prof.nome || 'Profissional Disponível'}
                          </h4>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prof.areas_interesse?.slice(0, 2).map((area: string) => (
                              <Badge key={area} className="bg-slate-100 text-slate-400 border-0 text-[8px] font-black uppercase px-2 py-0">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} className={cn(
                              star <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200"
                            )} />
                          ))}
                          <span className="text-[10px] font-bold text-slate-400 ml-1">4.0</span>
                        </div>
                        <Button 
                          className="w-full h-10 bg-slate-50 hover:bg-teal-500 hover:text-white text-slate-400 border-0 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                          onClick={() => {
                            vibrate(15);
                          }}
                        >
                          Ver Perfil Completo
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </section>
        )}

        {(activeCategory === 'all' || activeCategory === 'lojistas') && lojistas && lojistas.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-slate-100">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-800 italic uppercase flex items-center gap-2">
                  <Store size={20} className="text-orange-500" /> Lojistas Parceiros
                </h2>
                <p className="text-xs font-bold text-slate-400 italic">Escolas e fornecedores credenciados</p>
              </div>
              <Badge className="bg-orange-100 text-orange-600 border-0 font-bold">
                {lojistas.length} parceiro{lojistas.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lojistas.slice(0, 6).map((loj: any, idx: number) => (
                <motion.div
                  key={loj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-sm bg-white rounded-2xl p-4 flex gap-4 items-center hover:shadow-md transition-all cursor-pointer group">
                    <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <ShoppingBag size={24} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-800 truncate">{loj.razao_social}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{loj.categoria || 'Comércio Local'}</span>
                      {loj.descricao && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{loj.descricao}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
