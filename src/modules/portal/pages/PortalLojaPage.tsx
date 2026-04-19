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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

  const _handleRefresh = () => {
    if (isRefreshing) return
    vibrate([20, 10, 20])
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const handleCategoryChange = (cat: string) => {
    vibrate(15)
    setActiveCategory(cat)
  }

<<<<<<< HEAD
=======
  const handleProductClick = (product: Product) => {
    vibrate(20)
    setSelectedProduct(product)
  }

  const activeNavCategories = dbCategorias?.map(cat => ({
    id: cat.id,
    slug: cat.nome.toLowerCase(),
    label: cat.nome,
    icon: IconMap[cat.icone as keyof typeof IconMap] || Package
  })) || []

  // Mock de Seções
  const _sections = [
    { id: 'promocao', title: 'Ofertas Relâmpago', category: 'all', products: PRODUCTS },
    { id: 'livros', title: 'Livros e Didáticos', category: 'livros', products: PRODUCTS.filter(p => p.category === 'livros') },
  ]

>>>>>>> DESENVOLVIMENTO
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
<<<<<<< HEAD
=======

      {/* 4. Carrinho Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden bg-slate-50 border-0 flex flex-col pt-[env(safe-area-inset-top,24px)]">
          <SheetHeader className="p-6 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <ShoppingBag size={24} className="text-teal-500" /> Meus Itens
              </SheetTitle>
              <Badge className="bg-teal-100 text-teal-600 border-0 font-bold px-3 py-1 uppercase">2 Itens</Badge>
            </div>
            <SheetDescription className="text-slate-400 font-bold italic">Gerencie seu carrinho e finalize sua compra.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {[PRODUCTS[0], PRODUCTS[1]].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>
                  <p className="font-black text-teal-600 text-sm">R$ {item.price_promocional?.toFixed(2) || item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 space-y-4 pb-[env(safe-area-inset-bottom,24px)]">
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                <span className="font-black text-slate-800 uppercase text-xs">Total</span>
                <span className="text-xl font-black text-teal-600 tracking-tight">R$ 299,80</span>
             </div>
             <Button 
                className="w-full h-14 bg-slate-900 hover:bg-teal-600 text-white rounded-xl font-black uppercase tracking-widest italic shadow-xl shadow-slate-200 transition-all border-0"
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  vibrate(40);
                  setTimeout(() => { setIsProcessing(false); setIsCartOpen(false); }, 2000);
                }}
             >
                {isProcessing ? "Processando..." : "Ir para o Checkout"}
             </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 5. Modal de Produto */}
      {isMobile ? (
        <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <SheetContent side="bottom" className="rounded-t-[32px] border-0 p-0 overflow-hidden bg-white shadow-2xl h-auto max-h-[90vh]">
            <ProductDetailsContent product={selectedProduct} onClose={() => setSelectedProduct(null)} isMobile />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl p-0 rounded-2xl overflow-hidden border-0 bg-white">
            <ProductDetailsContent product={selectedProduct} onClose={() => setSelectedProduct(null)} isMobile={false} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function StoreHomeCard({ product, onClick, index, _isCarousel }: { product: Product, onClick: () => void, index: number, isCarousel?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="bg-white rounded-2xl border border-slate-100 p-2.5 h-full flex flex-col gap-3 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 relative">
          <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute top-2 right-2">
             <button 
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); vibrate(10); }}
             >
                <Heart size={14} />
             </button>
          </div>
          {product.price_promocional && (
            <div className="absolute bottom-2 left-2">
               <Badge className="bg-rose-500 text-white border-0 font-black text-[8px] uppercase px-2 py-0.5 shadow-lg">Oferta</Badge>
            </div>
          )}
        </div>
        
        <div className="px-1 flex flex-col gap-1.5 grow">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.category}</p>
          <h4 className="text-[13px] font-black text-slate-800 line-clamp-2 leading-none tracking-tight grow">{product.name}</h4>
          
          <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-teal-600 uppercase">A partir de</span>
                <span className="text-base font-black text-teal-600 leading-none">R$ {(product.price_pix || product.price_promocional || product.price).toFixed(2)}</span>
             </div>
             <button 
                className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white hover:bg-teal-600 transition-all active:scale-90"
                onClick={(e) => { e.stopPropagation(); vibrate(20); }}
              >
                <Plus size={16} />
              </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ProductDetailsContent({ product, onClose, isMobile }: { product: Product | null, onClose: () => void, isMobile: boolean }) {
  if (!product) return null;
  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className={cn("relative shrink-0", isMobile ? "h-64" : "w-1/2 h-[500px]")}>
        <img src={product.image} className="w-full h-full object-cover" />
        <button onClick={onClose} className="absolute top-4 left-4 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold border-1 border-white/30">X</button>
      </div>
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="space-y-2">
          <Badge className="bg-teal-100 text-teal-600 uppercase text-[10px] border-0">{product.category}</Badge>
          <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tighter">{product.name}</h2>
          <p className="text-sm text-slate-500 font-medium italic">{product.description}</p>
        </div>
        
        <div className="space-y-4 mt-auto">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Preço Especial</p>
              <p className="text-3xl font-black text-teal-600 tracking-tight">R$ {product.price_promocional?.toFixed(2) || product.price.toFixed(2)}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 line-through">R$ {product.price.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Economize 15%</span>
            </div>
          </div>
          <Button className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest italic border-0 shadow-xl shadow-slate-200">
            Adicionar à Mochila
          </Button>
        </div>
      </div>
>>>>>>> DESENVOLVIMENTO
    </div>
  )
}
