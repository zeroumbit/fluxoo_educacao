import React, { useState } from 'react'
import {
  ShoppingCart,
  Search,
  BookOpen,
  Tag,
  Star,
  Package,
  Plus,
  X,
  Users,
  Info,
  ChevronRight,
  ArrowLeft,
  Heart,
  ShieldCheck
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
import { useIsMobile } from '@/hooks/use-mobile'

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
  price_credit?: number
  category: 'livros' | 'materiais' | 'serviços'
  subcategory?: 'escolares' | 'ficção'
  image: string
  rating: number
  popular?: boolean
  metadata?: { label: string, value: string }[]
  reviews?: { id: string, user: string, rating: number, comment: string, date: string }[]
}

const PRODUCTS: Product[] = [
  {
    id: 'l1',
    name: 'Matemática Avançada Vol. 2',
    description: 'Livro didático focado em preparação para o vestibular e concursos militares. Conteúdo atualizado com as últimas provas.',
    price: 159.90,
    price_promocional: 129.90,
    price_pix: 119.90,
    price_credit: 135.00,
    category: 'livros',
    subcategory: 'escolares',
    image: 'https://images.unsplash.com/photo-1543004629-142a76c50c9e?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
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
    price_credit: 49.90,
    category: 'livros',
    subcategory: 'ficção',
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
    price_credit: 175.00,
    category: 'materiais',
    image: 'https://images.unsplash.com/photo-1572948852275-231cb30026e1?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    popular: true,
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
    price_credit: 230.00,
    category: 'serviços',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    rating: 5.0,
    popular: true,
    metadata: [
      { label: 'Formato', value: 'Híbrido' },
      { label: 'Duração', value: '60 min / aula' },
      { label: 'Frequência', value: '2x por semana' }
    ],
    reviews: [
      { id: 'r5', user: 'Carla Menezes', rating: 5, comment: 'O professor é excelente, as notas do meu filho melhoraram muito.', date: '12 Mar 2024' }
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

export function PortalLojaPage() {
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState<'livros' | 'materiais' | 'serviços'>('livros')
  const [activeSubcategory, setActiveSubcategory] = useState<'escolares' | 'ficção' | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading] = useState(false)

  const filteredProducts = PRODUCTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeCategory === 'livros') {
      const matchSub = activeSubcategory === 'all' || p.subcategory === activeSubcategory
      return p.category === 'livros' && matchSub && matchSearch
    }
    
    return p.category === activeCategory && matchSearch
  })

  const handleCategoryChange = (cat: 'livros' | 'materiais' | 'serviços') => {
    vibrate(15)
    setActiveCategory(cat)
    if (cat !== 'livros') setActiveSubcategory('all')
  }

  const handleProductClick = (product: Product) => {
    vibrate(20)
    setSelectedProduct(product)
  }

  if (isLoading) return <LojaSkeleton />

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 font-sans">

      {/* 1. Header & Marketplace Menu */}
      <div className="flex flex-col gap-6">
        {/* Marketplace Menu Bar */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-1.5 flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-50 p-1 rounded-lg">
             <button 
                onClick={() => handleCategoryChange('livros')}
                className={cn(
                  "px-4 h-9 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                  activeCategory === 'livros' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-indigo-600"
                )}
             >
                Livros
             </button>
             {activeCategory === 'livros' && (
               <div className="flex items-center ml-2 border-l border-slate-200 pl-2 gap-1 animate-in slide-in-from-left-2 duration-300">
                  <button 
                    onClick={() => setActiveSubcategory('all')}
                    className={cn(
                      "px-3 h-7 rounded text-[9px] font-bold uppercase transition-all",
                      activeSubcategory === 'all' ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setActiveSubcategory('escolares')}
                    className={cn(
                      "px-3 h-7 rounded text-[9px] font-bold uppercase transition-all",
                      activeSubcategory === 'escolares' ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    Escolares
                  </button>
                  <button 
                    onClick={() => setActiveSubcategory('ficção')}
                    className={cn(
                      "px-3 h-7 rounded text-[9px] font-bold uppercase transition-all",
                      activeSubcategory === 'ficção' ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    Ficção
                  </button>
               </div>
             )}
          </div>

          <button 
            onClick={() => handleCategoryChange('materiais')}
            className={cn(
              "px-4 h-11 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeCategory === 'materiais' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Package size={16} /> Materiais Escolares
          </button>

          <button 
            onClick={() => handleCategoryChange('serviços')}
            className={cn(
              "px-4 h-11 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeCategory === 'serviços' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Users size={16} /> Serviços
          </button>

          <div className="ml-auto flex items-center gap-2 pr-2 border-l border-slate-100 pl-4">
            <button className="h-11 px-4 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
               <Tag size={16} /> Pedidos
            </button>
            <button className="h-11 w-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center relative hover:bg-indigo-100 transition-colors">
               <ShoppingCart size={20} />
               <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">0</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative group max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <Input 
              placeholder="Digite o que você está procurando..."
              className="h-12 pl-12 pr-6 bg-white border border-slate-100 rounded-xl text-sm font-bold placeholder:text-slate-300 shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* 2. Grid de Produtos - Refatorado */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.03 }}
              className="group"
            >
              <div 
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
              >
                {/* Visual Area */}
                <div className="h-44 relative overflow-hidden bg-slate-50">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  {product.popular && (
                    <div className="absolute top-2 left-2">
                       <Badge className="bg-indigo-600 text-white font-bold text-[8px] uppercase px-2 py-0.5 rounded-md border-0">
                         Destaque
                       </Badge>
                    </div>
                  )}
                </div>

                {/* Info Area */}
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 leading-normal line-clamp-2">
                       {product.description}
                    </p>
                  </div>

                  {/* Preços */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium tracking-tight">Normal:</span>
                      <span className="font-bold text-slate-400 line-through">R$ {product.price.toFixed(2)}</span>
                    </div>
                    {product.price_promocional && (
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-1">
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">Promocional:</span>
                        <span className="text-sm font-bold text-indigo-600">R$ {product.price_promocional.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-1 mt-1">
                       <div className="bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/30">
                          <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-widest text-center">Pix</p>
                          <p className="text-[11px] font-bold text-emerald-700 leading-none text-center">R$ {product.price_pix?.toFixed(2)}</p>
                       </div>
                       <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest text-center">Crédito</p>
                          <p className="text-[11px] font-bold text-slate-700 leading-none text-center">R$ {product.price_credit?.toFixed(2)}</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-3">
                    <Button 
                      className="w-full h-9 bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg transition-all border-0 shadow-none font-bold text-xs gap-2"
                      onClick={(e) => { e.stopPropagation(); vibrate(20); }}
                    >
                      <Plus size={16} /> Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-8 bg-slate-50/50 rounded-[56px] border-4 border-dashed border-slate-100 mx-1">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-100">
              <Search size={48} />
            </div>
            <div className="space-y-3 px-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Catálogo Vazio</h3>
              <p className="text-slate-400 text-sm font-bold italic leading-relaxed max-w-xs mx-auto">Não localizamos itens correspondentes para "{searchTerm}" neste departamento.</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Banner Informativo - Estilo Pro Max */}
      <div className="bg-slate-900 rounded-[56px] p-12 md:p-16 text-white relative overflow-hidden group shadow-2xl mx-1 border border-slate-800">
         <div className="absolute right-0 top-0 p-16 opacity-5 -mr-24 -mt-24 rotate-12 transition-transform group-hover:scale-110 duration-1000 pointer-events-none">
            <Package size={450} />
         </div>
         <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 text-center md:text-left">
            <div className="w-20 h-20 rounded-[32px] bg-teal-500/20 backdrop-blur-md flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/30 shadow-2xl">
               <ShieldCheck size={40} />
            </div>
            <div className="space-y-4 grow">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-teal-400">Garantia Institucional</h4>
               <p className="text-base font-bold text-slate-400 leading-relaxed italic max-w-2xl">
                 Todos os itens e serviços listados possuem curadoria pedagógica e validação direta da rede de ensino para sua segurança total.
               </p>
            </div>
            <Button className="h-16 px-12 rounded-[24px] bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all active:scale-95 shadow-2xl border-0 shrink-0">
              Histórico de Pedidos
            </Button>
         </div>
      </div>

      {/* 4. Detalhes do Produto - Versão Híbrida (Dialog Web / Sheet Mobile) */}
      {isMobile ? (
        <Sheet open={!!selectedProduct} onOpenChange={(open) => { if(!open) setSelectedProduct(null); vibrate(10); }}>
          <SheetContent side="bottom" className="rounded-t-[32px] border-0 p-0 overflow-hidden bg-white shadow-2xl h-auto max-h-[95vh] focus:outline-none focus:ring-0">
            <div className="p-4">
              <ProductDetailsContent product={selectedProduct} onClose={() => setSelectedProduct(null)} isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => { if(!open) setSelectedProduct(null); }}>
          <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] p-0 rounded-2xl overflow-hidden border-0 shadow-2xl bg-slate-50">
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
               <Badge className="bg-indigo-600 text-white border-0 font-bold text-[10px] uppercase px-3 py-1 rounded-md shadow-lg">
                 {product.category === 'livros' ? 'Livro' : product.category === 'materiais' ? 'Material' : 'Serviço'}
               </Badge>
               {product.popular && (
                  <Badge className="bg-amber-500 text-white border-0 font-bold text-[10px] uppercase px-3 py-1 rounded-md shadow-lg">
                    Destaque
                  </Badge>
               )}
            </div>
            {!isMobile && (
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all border border-white/30"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Coluna 2: Conteúdo Detalhado */}
          <div className={cn(
            "flex-1 p-6 space-y-12",
            !isMobile && "md:p-12"
          )}>
            {/* Cabeçalho do Produto */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]">
                  <Star size={16} className="fill-indigo-600" /> {product.rating} • {product.reviews?.length || 0} Avaliações
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
                  <Button className="w-full h-16 bg-indigo-600 text-white rounded-xl font-bold text-lg uppercase tracking-widest shadow-xl shadow-indigo-100 border-0">
                     Comprar Agora
                  </Button>
               </div>
            )}

            {/* Tabs de Detalhes Adicionais */}
            <div className="space-y-8">
               <div className="flex items-center gap-8 border-b border-slate-100 pb-2">
                  <span className="text-sm font-bold text-slate-900 border-b-2 border-indigo-600 pb-2">Avaliações</span>
                  <span className="text-sm font-bold text-slate-400">Especificações</span>
               </div>
               
               <div className="space-y-6">
                  {product.reviews?.map(review => (
                    <div key={review.id} className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {review.user.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{review.user}</p>
                                <div className="flex items-center gap-1">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} size={10} className={cn("fill-indigo-600", i >= review.rating && "text-slate-300 fill-transparent")} />
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
                          <p className="text-xs font-bold text-indigo-600">R$ {item.price_promocional?.toFixed(2) || item.price.toFixed(2)}</p>
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
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartão de Crédito</p>
                 <p className="text-lg font-bold text-slate-700 leading-none">R$ {product.price_credit?.toFixed(2)}</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase line-through">R$ {product.price.toFixed(2)}</p>
                 <p className="text-xl font-bold text-indigo-600 leading-none">R$ {product.price_promocional?.toFixed(2)}</p>
              </div>
              <Button 
                className="h-14 px-12 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-indigo-100 font-bold uppercase tracking-[0.2em] text-xs border-0 transition-all active:scale-95"
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

function PriceCards({ product }: { product: Product }) {
  return (
    <div className="grid grid-cols-2 gap-3">
       <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/50">
          <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1 tracking-widest">Pagamento via PIX</p>
          <p className="text-2xl font-bold text-emerald-700 leading-none tracking-tight">R$ {product.price_pix?.toFixed(2)}</p>
       </div>
       <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Cartão de Crédito</p>
          <p className="text-2xl font-bold text-slate-700 leading-none tracking-tight">R$ {product.price_credit?.toFixed(2)}</p>
       </div>
    </div>
  )
}

function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
