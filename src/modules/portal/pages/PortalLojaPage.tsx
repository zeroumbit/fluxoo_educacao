import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePortalContext } from '../context'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  ShoppingCart,
  Search,
  BookOpen,
  Tag,
  Star,
  Package,
  Plus,
  Users,
  Info,
  ChevronRight,
  ArrowLeft,
  Heart,
  ShieldCheck,
  Truck,
  MapPin,
  ChevronDown,
  ShoppingBag,
  GraduationCap,
  Shirt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'

// Helper de vibração
const vibrate = (ms: number | number[] = 20) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  price_promocional?: number
  price_pix?: number
  price_installments?: number
  category: 'livros' | 'materiais' | 'serviços' | 'vestuario'
  subcategory?: 'escolares' | 'ficção'
  image: string
  rating: number
  sponsored?: boolean
  capa?: 'comum' | 'dura'
  entrega_gratis?: boolean
  metadata?: { label: string, value: string }[]
  reviews?: { id: string, user: string, rating: number, comment: string, date: string }[]
}

const PRODUCTS: Product[] = [
  {
    id: 'l1',
    name: 'Matemática Avançada Vol. 2',
    description: 'Livro didático focado em preparação para o vestibular e concursos militares. Conteúdo atualizado.',
    price: 159.90,
    price_promocional: 129.90,
    price_pix: 119.90,
    price_installments: 135.00,
    category: 'livros',
    subcategory: 'escolares',
    capa: 'dura',
    entrega_gratis: true,
    image: 'https://images.unsplash.com/photo-1543004629-142a76c50c9e?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    sponsored: true,
    metadata: [
      { label: 'Editora', value: 'Pedagógica Pro' },
      { label: 'ISBN', value: '978-85-00-00000-0' },
      { label: 'Páginas', value: '450' },
      { label: 'Ano', value: '2024' }
    ],
    reviews: [
      { id: 'r1', user: 'Marcos Silva', rating: 5, comment: 'Excelente conteúdo, muito focado no que cai nos exames.', date: '02 Mar 2024' },
      { id: 'r2', user: 'Ana Paula', rating: 4, comment: 'Muito bom, mas poderia ter mais exercícios resolvidos.', date: '15 Fev 2024' }
    ]
  },
  {
    id: 'l2',
    name: 'O Enigma da Torre',
    description: 'Suspense psicológico que desafia a percepção da realidade através de uma narrativa imersiva.',
    price: 59.90,
    price_promocional: 45.00,
    price_pix: 39.90,
    price_installments: 49.90,
    category: 'livros',
    subcategory: 'ficção',
    capa: 'comum',
    entrega_gratis: false,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    metadata: [
      { label: 'Autor', value: 'J. M. Arantes' },
      { label: 'Gênero', value: 'Suspense' },
      { label: 'Idioma', value: 'Português' }
    ],
    reviews: [
      { id: 'r3', user: 'Julia Lima', rating: 5, comment: 'Não consegui parar de ler. Final surpreendente!', date: '10 Jan 2024' }
    ]
  },
  {
    id: 'm1',
    name: 'Kit Escolar Fundamental I',
    description: 'Conjunto completo contendo cadernos, lápis de cor, estojo e mochila temática desenvolvida por especialistas.',
    price: 189.90,
    price_promocional: 169.90,
    price_pix: 159.90,
    price_installments: 175.00,
    category: 'materiais',
    entrega_gratis: true,
    sponsored: true,
    image: 'https://images.unsplash.com/photo-1572948852275-231cb30026e1?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    metadata: [
      { label: 'Itens', value: '12 peças' },
      { label: 'Material', value: 'Poliéster Ultra' },
      { label: 'Garantia', value: '1 ano' }
    ],
    reviews: [
      { id: 'r4', user: 'Ricardo Santos', rating: 5, comment: 'Mochila muito resistente, meu filho adorou.', date: '20 Fev 2024' }
    ]
  },
  {
    id: 's1',
    name: 'Reforço de Matemática (Mensal)',
    description: 'Acompanhamento personalizado para alunos com dificuldades em lógica, álgebra e aritmética básica.',
    price: 250.00,
    price_promocional: 220.00,
    price_pix: 200.00,
    price_installments: 230.00,
    category: 'serviços',
    sponsored: true,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    rating: 5.0,
    metadata: [
      { label: 'Formato', value: 'Híbrido' },
      { label: 'Duração', value: '60 min / aula' },
      { label: 'Frequência', value: '2x por semana' }
    ],
    reviews: [
      { id: 'r5', user: 'Carla Menezes', rating: 5, comment: 'O professor é excelente, as notas do meu filho melhoraram muito.', date: '12 Mar 2024' }
    ]
  },
  {
    id: 'v1',
    name: 'Uniforme Escolar - Camiseta Oficial',
    description: 'Camiseta oficial da escola, tecido dry-fit de alta qualidade, resistente a múltiplas lavagens.',
    price: 45.00,
    price_pix: 40.50,
    price_installments: 45.00,
    category: 'vestuario',
    entrega_gratis: false,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    metadata: [
      { label: 'Tamanhos', value: 'P, M, G, GG' },
      { label: 'Material', value: '100% Algodão' }
    ]
  }
]

// --- SKELETON LOADING ---
const LojaSkeleton = () => (
  <div className="space-y-12 animate-pulse px-1">
    <div className="h-10 w-48 bg-slate-100 rounded-lg" />
    <div className="flex gap-4 overflow-hidden">
        <div className="w-48 h-12 bg-white border border-slate-50 rounded-full shrink-0" />
        <div className="w-48 h-12 bg-white border border-slate-50 rounded-full shrink-0" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-white border border-slate-50 rounded-[48px]" />)}
    </div>
  </div>
)

// --- ASSETS INTERNOS (Gerados para a loja) ---
const ASSETS = {
  books: '/assets/store/featured_books.png',
  supplies: '/assets/store/featured_supplies.png',
  uniforms: '/assets/store/featured_uniforms.png',
  pros: '/assets/store/featured_pros.png'
}


export function PortalLojaPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { isLoading: loadingCtx } = usePortalContext()
  const [searchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<'livros' | 'materiais' | 'serviços' | 'vestuario' | 'all'>('all')
  const [activeSubcategory, setActiveSubcategory] = useState<'escolares' | 'ficção' | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Efeito para simular carregamento inicial da loja e melhorar UX
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const isHomeView = !searchTerm && activeCategory === 'all'

  // Sincronizar busca e categoria da URL
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearchTerm(q)

    const cat = searchParams.get('cat')
    if (cat === 'livros') setActiveCategory('livros')
    else if (cat === 'material-escolar') setActiveCategory('materiais')
    else if (cat === 'vestuario') setActiveCategory('vestuario')
    else setActiveCategory('all')
  }, [searchParams])

  const filteredProducts = PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      p.description.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeCategory === 'all') return matchSearch

    if (activeCategory === 'livros') {
      const matchSub = activeSubcategory === 'all' || p.subcategory === activeSubcategory
      return p.category === 'livros' && matchSub && matchSearch
    }
    
    return p.category === activeCategory && matchSearch
  })

  const mockSections = [
    { id: 'books', title: 'Melhores ofertas de livros', category: 'livros', image: ASSETS.books },
    { id: 'supplies', title: 'Tudo pra seu dia a dia em materiais', category: 'materiais', image: ASSETS.supplies },
    { id: 'fashion', title: 'Moda escolar perfeita', category: 'vestuario', image: ASSETS.uniforms },
    { id: 'pros', title: 'Profissionais para seu filho', category: 'serviços', image: ASSETS.pros },
  ]

  const handleCategoryChange = (cat: 'livros' | 'materiais' | 'serviços' | 'vestuario' | 'all') => {
    vibrate(15)
    setActiveCategory(cat)
    if (cat !== 'livros') setActiveSubcategory('all')
  }

  const handleProductClick = (product: Product) => {
    vibrate(20)
    setSelectedProduct(product)
  }

  if (isLoading || loadingCtx) return (
    <div className="pt-[env(safe-area-inset-top,24px)] px-4">
      <LojaSkeleton />
    </div>
  )

  return (
    <div className="flex flex-col gap-8 pb-32 animate-in fade-in duration-700 pt-[env(safe-area-inset-top,20px)] mt-4">
      {/* 1. Header Especial da Loja (Baseado no Sketch) */}
      <div className="flex flex-col gap-6">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Localização */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
              <MapPin size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Enviar para <span className="text-slate-900">Sérgio</span> — CEP: 62700-000</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700 leading-none">Rua paulino Barroso de castro...</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          {/* Barra de Busca Grande */}
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <Input 
              placeholder="Busque por livros, materiais escolares ou serviços educacionais" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-15 pl-14 pr-6 rounded-[22px] bg-slate-100 border-0 text-base font-bold placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Ícones de Interação */}
          <div className="flex items-center gap-4">
            <button className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md transition-all">
              <Heart size={22} />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="h-12 px-6 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-3 hover:bg-teal-600 shadow-xl shadow-slate-200 transition-all group active:scale-95"
            >
              <ShoppingBag size={20} />
              <span className="font-bold text-sm tracking-wide">Meus Itens</span>
              <div className="bg-teal-500 text-white text-[10px] font-black h-5 w-5 rounded-lg flex items-center justify-center">2</div>
            </button>
          </div>
        </div>

        {/* Secondary Menu (Categorias) - Alinhado à esquerda na WEB */}
        <nav className="flex items-center justify-start gap-8 py-2 overflow-x-auto scrollbar-hide scroll-smooth">
          {[
            { id: 'livros', label: 'Livros', icon: BookOpen },
            { id: 'materiais', label: 'Materiais escolares', icon: Tag },
            { id: 'vestuario', label: 'Vestuário', icon: Shirt },
            { id: 'serviços', label: 'Serviços educacionais', icon: GraduationCap }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as any)}
              className={cn(
                "flex items-center gap-2 text-sm font-bold transition-all hover:text-teal-600 group shrink-0",
                activeCategory === cat.id ? "text-teal-600 scale-105" : "text-slate-500"
              )}
            >
              <cat.icon size={16} className={cn("transition-colors", activeCategory === cat.id ? "text-teal-500" : "text-slate-400 group-hover:text-teal-500")} />
              <span className="whitespace-nowrap italic">{cat.label}</span>
              <ChevronDown size={14} className={cn("transition-all text-slate-300", activeCategory === cat.id ? "text-teal-500 rotate-180" : "group-hover:text-teal-500")} />
            </button>
          ))}
        </nav>
      </div>

      {isHomeView ? (
        /* 2. Conteúdo Estilo Home (Sections) */
        <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {mockSections.map((section, sectionIdx) => (
            <section key={section.id} className="flex flex-col gap-8">
              <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none italic uppercase">{section.title}</h2>
                  <p className="text-sm font-bold text-slate-400 italic">Principais itens recomendados para sua família</p>
                </div>
                <button 
                  onClick={() => setActiveCategory(section.category as any)}
                  className="text-sm font-black text-teal-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-8"
                >
                  ver todos
                </button>
              </div>

              {/* Grid de Ofertas/Cards - 5 CAIXAS POR COLUNA HORIZONTAL NO DESKTOP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* O primeiro card é um banner/promo da seção no sketch */}
                <div className="col-span-1 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 min-h-[320px] relative group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500">
                   <img src={section.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                   <div className="absolute bottom-8 left-8 right-8">
                      <span className="inline-block px-3 py-1 bg-teal-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-md mb-3 shadow-lg">Destaque</span>
                      <h3 className="text-xl font-black text-white leading-tight mb-2">Coleção {section.id === 'books' ? 'Literária 2024' : 'Modern School'}</h3>
                      <p className="text-white/60 text-xs font-bold leading-relaxed line-clamp-2 italic">Curadoria exclusiva preparada pela coordenação pedagógica para este ano letivo.</p>
                   </div>
                </div>

                {/* Itens Reais filtrados como exemplos */}
                {PRODUCTS.filter(p => p.category === section.category).slice(0, 4).map((product, pIdx) => (
                  <StoreHomeCard key={product.id} product={product} onClick={() => handleProductClick(product)} index={pIdx} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* 3. Grid de Busca/Resultados - 5 COLUNAS NO DESKTOP */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <StoreSearchCard key={product.id} product={product} onClick={() => handleProductClick(product)} index={idx} />
            ))}
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-32 text-center space-y-8 bg-slate-50/50 rounded-3xl border-4 border-dashed border-slate-100 mx-1 focus:outline-none">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-100">
                <Search size={48} />
              </div>
              <div className="space-y-3 px-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Resultado Vazio</h3>
                <p className="text-slate-400 text-sm font-bold italic leading-relaxed max-w-xs mx-auto">Não localizamos itens correspondentes para "{searchTerm}".</p>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="rounded-xl font-bold mt-4">Limpar Filtros</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Banner Institucional - Menos Arredondado */}
      <div className="bg-slate-900 rounded-3xl p-12 md:p-16 text-white relative overflow-hidden group shadow-2xl mt-8">
         <div className="absolute right-0 top-0 p-16 opacity-5 -mr-24 -mt-24 rotate-12 transition-transform group-hover:scale-110 duration-1000 pointer-events-none">
            <Package size={450} />
         </div>
         <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 text-center md:text-left">
            <div className="w-20 h-20 rounded-2xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/30 shadow-2xl">
               <ShieldCheck size={40} />
            </div>
            <div className="space-y-4 grow">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-teal-400">Garantia Institucional</h4>
               <p className="text-base font-bold text-slate-400 leading-relaxed italic max-w-2xl">
                 Todos os itens e serviços listados possuem curadoria pedagógica e validação direta da rede de ensino para sua segurança total.
               </p>
            </div>
            <Button className="h-16 px-12 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all active:scale-95 shadow-2xl border-0 shrink-0">
              Histórico de Pedidos
            </Button>
         </div>
      </div>

      {/* 5. Carrinho / Meus Itens Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-hidden bg-slate-50 border-0 flex flex-col">
          <SheetHeader className="p-6 bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <ShoppingBag size={24} className="text-teal-500" /> Meus Itens
              </SheetTitle>
              <Badge className="bg-teal-100 text-teal-600 border-0 font-bold px-3 py-1 uppercase">2 Itens</Badge>
            </div>
            <SheetDescription className="text-slate-400 font-bold italic">Gerencie seu carrinho e finalize sua compra com segurança institucional.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {/* Simulando Itens no Carrinho */}
            {[PRODUCTS[0], PRODUCTS[2]].map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-right duration-500">
                <div className="h-20 w-20 rounded-xl overflow-hidden shrink-0 border border-slate-50">
                  <img src={item.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1 italic">{item.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-black text-teal-600">R$ {item.price_promocional?.toFixed(2) || item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                       <button className="h-6 w-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors">-</button>
                       <span className="text-xs font-black">1</span>
                       <button className="h-6 w-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold hover:bg-teal-600 transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 space-y-6 mt-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-400 italic">Subtotal</span>
                <span className="font-black text-slate-800">R$ 299,80</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-400 italic">Frete</span>
                <span className="font-black text-emerald-500 uppercase tracking-widest text-[10px]">Entrega Institucional Grátis</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-lg font-black italic uppercase tracking-tighter">Total Geral</span>
                <span className="text-2xl font-black text-teal-600 tracking-tight">R$ 299,80</span>
              </div>
            </div>
            
            <Button className="w-full h-16 bg-slate-900 hover:bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-slate-200 transition-all active:scale-95 border-0">
              Ir para o Checkout
            </Button>
            
            <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed italic">
              Seus itens estão reservados por tempo limitado. <br/>
              Finalize para garantir os estoques institucionais.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Detalhes do Produto - Versão Híbrida (Dialog Web / Sheet Mobile) */}
      {isMobile ? (
        <Sheet open={!!selectedProduct} onOpenChange={(open) => { if(!open) setSelectedProduct(null); vibrate(10); }}>
          <SheetContent side="bottom" className="rounded-t-[32px] border-0 p-0 overflow-hidden bg-white shadow-2xl h-auto max-h-[95vh] focus:outline-none focus:ring-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Detalhes do Produto</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <ProductDetailsContent product={selectedProduct} onClose={() => setSelectedProduct(null)} isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => { if(!open) setSelectedProduct(null); }}>
          <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 rounded-2xl overflow-hidden border-0 shadow-2xl bg-slate-50">
            <DialogHeader className="sr-only">
              <DialogTitle>Detalhes do Produto</DialogTitle>
            </DialogHeader>
            <ProductDetailsContent product={selectedProduct} onClose={() => setSelectedProduct(null)} isMobile={false} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Sub-componente para o conteúdo dos detalhes (Reutilizável e Responsivo)
function ProductDetailsContent({ product, onClose, isMobile }: { product: Product | null, onClose: () => void, isMobile: boolean }) {
  if (!product) return null;

  const recomendacoes = PRODUCTS.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div className={cn(
      "flex flex-col h-full bg-white",
      !isMobile && "relative overflow-hidden"
    )}>
      {/* Scroll View Principal */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={cn(
          "flex flex-col",
          !isMobile && "md:flex-row"
        )}>
          {/* Coluna 1: Imagem (Sticky no desktop) */}
          <div className={cn(
            "relative",
            isMobile ? "h-64" : "md:w-[45%] md:h-[600px] md:sticky md:top-0"
          )}>
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute top-6 left-6 flex gap-2">
               <Badge className="bg-teal-600 text-white border-0 font-bold text-[10px] uppercase px-3 py-1 rounded-md shadow-lg">
                 {product.category === 'livros' ? 'Livro' : product.category === 'materiais' ? 'Material' : 'Serviço'}
               </Badge>
               {product.sponsored && (
                  <Badge className="bg-amber-500 text-white border-0 font-bold text-[10px] uppercase px-3 py-1 rounded-md shadow-lg">
                    Patrocinado
                  </Badge>
               )}
            </div>
          </div>

          {/* Coluna 2: Conteúdo Detalhado */}
          <div className={cn(
            "flex-1 p-6 space-y-12",
            !isMobile && "md:p-12"
          )}>
            {/* Cabeçalho do Produto */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-[0.2em]">
                  <Star size={16} className="fill-teal-600" /> {product.rating} • {product.reviews?.length || 0} Avaliações
               </div>
               <h2 className={cn(
                 "font-bold text-slate-900 leading-none tracking-tighter",
                 isMobile ? "text-3xl" : "text-5xl"
               )}>
                  {product.name}
               </h2>
               <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
                  {product.description}
               </p>
            </div>

            {/* Grid de Informações Técnicas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 border-b border-slate-100">
               {product.metadata?.map((meta, i) => (
                 <div key={i} className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{meta.label}</p>
                    <p className="text-sm font-bold text-slate-800">{meta.value}</p>
                 </div>
               ))}
            </div>

            {/* Bloco de Preços e Compra (Mobile Only) */}
            {isMobile && (
               <div className="space-y-6">
                  <PriceCards product={product} />
                  <Button className="w-full h-16 bg-teal-600 text-white rounded-xl font-bold text-lg uppercase tracking-widest shadow-xl shadow-teal-100 border-0">
                     Comprar Agora
                  </Button>
               </div>
            )}

            {/* Tabs de Detalhes Adicionais */}
            <div className="space-y-8">
               <div className="flex items-center gap-8 border-b border-slate-100 pb-2">
                  <span className="text-sm font-bold text-slate-900 border-b-2 border-teal-600 pb-2">Avaliações</span>
                  <span className="text-sm font-bold text-slate-400">Especificações</span>
               </div>
               
               <div className="space-y-6">
                  {product.reviews?.map(review => (
                    <div key={review.id} className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                                {review.user.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{review.user}</p>
                                <div className="flex items-center gap-1">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} size={10} className={cn("fill-teal-600", i >= review.rating && "text-slate-300 fill-transparent")} />
                                   ))}
                                </div>
                             </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{review.date}</p>
                       </div>
                       <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Recomendações */}
            {recomendacoes.length > 0 && (
               <div className="space-y-6 pt-12 border-t border-slate-100">
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">Quem comprou também levou</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {recomendacoes.map(item => (
                       <div key={item.id} className="group cursor-pointer space-y-2 p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all">
                          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                             <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.category}</p>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</p>
                          <p className="text-xs font-bold text-teal-600">R$ {item.price_promocional?.toFixed(2) || item.price.toFixed(2)}</p>
                       </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Compra - Desktop (Sticky Bottom) */}
      {!isMobile && (
        <div className="h-24 bg-white border-t border-slate-100 px-12 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-50">
           <div className="flex items-center gap-12">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço à vista (PIX)</p>
                 <p className="text-3xl font-bold text-emerald-600 leading-none tracking-tight">R$ {product.price_pix?.toFixed(2)}</p>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parcelado:</p>
                 <p className="text-lg font-bold text-slate-700 leading-none">R$ {product.price_installments?.toFixed(2)}</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase line-through">R$ {product.price.toFixed(2)}</p>
                 <p className="text-xl font-bold text-teal-600 leading-none">R$ {product.price_promocional?.toFixed(2)}</p>
              </div>
              <Button
                className="h-14 px-12 bg-teal-600 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-teal-100 font-bold uppercase tracking-[0.2em] text-xs border-0 transition-all active:scale-95"
                onClick={() => { vibrate(40); onClose(); }}
              >
                 Confirmar Compra
              </Button>
           </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTES AUXILIARES ---

// --- SUB-COMPONENTES AUXILIARES ---

/**
 * 1. StoreHomeCard (View Principal/Seções)
 * Focado em visual limpo, favoritar e botão de adicionar rápido (+)
 */
function StoreHomeCard({ product, onClick, index }: { product: Product, onClick: () => void, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group"
      onClick={onClick}
    >
      <div className="bg-white rounded-2xl border border-slate-100 p-3 h-full flex flex-col gap-3 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all duration-300">
        {/* Imagem (aspecto 4/5) */}
        <div className="aspect-[4/5] rounded-xl overflow-hidden bg-slate-50 relative">
          <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          
          {/* Botão de Favoritar (Top Right) */}
          <div className="absolute top-3 right-3">
             <button 
              className="h-9 w-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); vibrate(10); }}
             >
                <Heart size={16} />
             </button>
          </div>

          {/* Badge Oferta */}
          {product.price_promocional && (
            <div className="absolute bottom-3 left-3">
               <Badge className="bg-rose-500 text-white border-0 font-black text-[9px] uppercase px-3 py-1 shadow-lg shadow-rose-200">Oferta</Badge>
            </div>
          )}
        </div>
        
        <div className="px-2 flex-1 flex flex-col gap-1.5">
          {/* Categoria */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category}</p>
          
          {/* Nome (2 linhas) */}
          <h4 className="text-[15px] font-black text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem] tracking-tight">{product.name}</h4>
          
          <div className="mt-auto pt-3 flex flex-col gap-1">
             {/* Preço original riscado */}
             {product.price_promocional && (
                <span className="text-[10px] font-bold text-slate-400 line-through">R$ {product.price.toFixed(2)}</span>
             )}
             
             {/* Preço PIX em destaque (Teal) */}
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider">No PIX</span>
                   <span className="text-lg font-black text-teal-600 leading-none">R$ {(product.price_pix || product.price_promocional || product.price).toFixed(2)}</span>
                </div>
                
                {/* Botão Adicionar Rápido (+) */}
                <button 
                  className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white hover:bg-teal-600 transition-all shadow-lg active:scale-95"
                  onClick={(e) => { e.stopPropagation(); vibrate(20); }}
                >
                  <Plus size={18} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * 2. StoreSearchCard (Grid de Resultados)
 * Focado em detalhes comparativos, badges adicionais e botão full-width
 */
function StoreSearchCard({ product, onClick, index }: { product: Product, onClick: () => void, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      className="group"
      onClick={onClick}
    >
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer">
        {/* Visual Area */}
        <div className="h-48 relative overflow-hidden bg-slate-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Badge Patrocinado */}
          {product.sponsored && (
            <div className="absolute top-2 left-2">
               <Badge className="bg-amber-400 text-white font-bold text-[9px] uppercase px-2.5 py-1 rounded-md border-0 shadow-md">
                 Patrocinado
               </Badge>
            </div>
          )}

          {/* Badge Entrega Grátis */}
          {product.entrega_gratis && (
            <div className="absolute bottom-2 left-2">
               <Badge className="bg-emerald-500 text-white font-bold text-[8px] uppercase px-2 py-0.5 rounded-md border-0 shadow-md flex items-center gap-1">
                 <Truck size={10} /> Entrega Grátis
               </Badge>
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-3.5 flex-1 flex flex-col gap-2.5">
          {/* Título e Descrição */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight min-h-[2.5rem]">
              {product.name}
            </h4>
            <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
               {product.description}
            </p>
          </div>

          {/* Preços */}
          <div className="space-y-2 pt-1">
            {/* Preço Normal Riscado ("De:") */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">De:</span>
              <span className="text-xs font-medium text-slate-400 line-through">R$ {product.price.toFixed(2)}</span>
            </div>
            
            {/* Preço Parcelado */}
            {product.price_installments && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">Parcelado:</span>
                <span className="text-sm font-bold text-slate-700">R$ {product.price_installments.toFixed(2)}</span>
              </div>
            )}
            
            {/* Preço PIX em destaque (Card Verde) */}
            {product.price_pix && (
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest text-center mb-0.5">À vista no Pix</p>
                <p className="text-lg font-black text-emerald-700 leading-none text-center">R$ {product.price_pix.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Botão Adicionar (Full Width) */}
          <div className="mt-auto pt-1">
            <Button
              className="w-full h-9 bg-slate-900 hover:bg-teal-600 text-white rounded-lg transition-all border-0 shadow-md shadow-slate-200 font-bold text-xs gap-2"
              onClick={(e) => { e.stopPropagation(); vibrate(20); }}
            >
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PriceCards({ product }: { product: Product }) {
  return (
    <div className="grid grid-cols-2 gap-3">
       <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/50">
          <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1 tracking-widest">Pagamento via PIX</p>
          <p className="text-2xl font-bold text-emerald-700 leading-none tracking-tight">R$ {product.price_pix?.toFixed(2)}</p>
       </div>
       <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Parcelado</p>
          <p className="text-2xl font-bold text-slate-700 leading-none tracking-tight">R$ {product.price_installments?.toFixed(2)}</p>
       </div>
    </div>
  )
}
