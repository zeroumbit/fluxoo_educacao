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
  SheetFooter 
} from '@/components/ui/sheet'
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
  category: 'material' | 'professores'
  image: string
  rating: number
  popular?: boolean
}

const PRODUCTS: Product[] = [
  {
    id: 'm1',
    name: 'Kit Escolar Fundamental I',
    description: 'Conjunto completo contendo cadernos, lápis de cor, estojo e mochila temática desenvolvida por especialistas.',
    price: 189.90,
    category: 'material',
    image: 'https://images.unsplash.com/photo-1572948852275-231cb30026e1?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    popular: true
  },
  {
    id: 'm2',
    name: 'Dicionário Escolar Ilustrado',
    description: 'Nova ortografia com ilustrações facilitadoras para o aprendizado infantil e juvenil.',
    price: 45.00,
    category: 'material',
    image: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f37?q=80&w=800&auto=format&fit=crop',
    rating: 4.5
  },
  {
    id: 'p1',
    name: 'Reforço de Matemática (Mensal)',
    description: 'Acompanhamento personalizado para alunos com dificuldades em lógica, álgebra e aritmética básica.',
    price: 250.00,
    category: 'professores',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    rating: 5.0,
    popular: true
  },
  {
    id: 'p2',
    name: 'Curso de Inglês Preparatório',
    description: 'Aulas extras focadas em conversação imersiva e preparação para exames internacionais.',
    price: 320.00,
    category: 'professores',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    rating: 4.9
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
  const [activeTab, setActiveTab] = useState<'material' | 'professores'>('material')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading] = useState(false)

  const filteredProducts = PRODUCTS.filter(p => 
    p.category === activeTab && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleTabChange = (tab: 'material' | 'professores') => {
    vibrate(15)
    setActiveTab(tab)
  }

  const handleProductClick = (product: Product) => {
    vibrate(20)
    setSelectedProduct(product)
  }

  if (isLoading) return <LojaSkeleton />

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 font-sans">
      
      {/* 1. Header & Seção Principal */}
      <div className="flex flex-col gap-8 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black tracking-tighter text-slate-800 italic uppercase leading-none">Loja</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Marketplace & Serviços</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Search Input */}
           <div className="relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={24} />
               <Input 
                 placeholder={`Pesquisar por ${activeTab === 'material' ? 'kits, livros...' : 'tutores, cursos...'}`}
                 className="h-16 pl-16 pr-8 bg-white border-0 rounded-[28px] text-base font-bold placeholder:text-slate-300 shadow-sm transition-all focus-visible:ring-8 focus-visible:ring-teal-500/10 italic focus:ring-0"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
           </div>

           {/* Custom Filter Select (Tabs) */}
           <div className="flex bg-slate-50/50 p-2 rounded-[32px] border border-slate-100/50 shadow-inner">
              <button 
                onClick={() => handleTabChange('material')}
                className={cn(
                  "flex-1 h-12 flex items-center justify-center gap-3 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all",
                  activeTab === 'material' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Package size={18} /> Materiais
              </button>
              <button 
                onClick={() => handleTabChange('professores')}
                className={cn(
                  "flex-1 h-12 flex items-center justify-center gap-3 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all",
                  activeTab === 'professores' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <Users size={18} /> Serviços
              </button>
           </div>
        </div>
      </div>

      {/* 2. Grid de Produtos Pro Max - Imersivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-1">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="group"
            >
              <div 
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-[56px] border border-transparent shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700 overflow-hidden flex flex-col h-full relative cursor-pointer"
              >
                {/* Visual Area */}
                <div className="h-72 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/0 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-0 group-hover:backdrop-blur-[2px]" />
                  
                  {product.popular && (
                    <div className="absolute top-8 left-8">
                      <Badge className="bg-amber-500/90 backdrop-blur-md text-white font-black text-[9px] uppercase tracking-[0.2em] border-0 px-5 py-2 rounded-full shadow-2xl">
                        Destaque
                      </Badge>
                    </div>
                  )}

                  <div className="absolute top-8 right-8 scale-0 group-hover:scale-100 transition-all duration-500 active:scale-90">
                     <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white hover:text-red-500">
                        <Heart size={20} />
                     </div>
                  </div>
                  
                  <div className="absolute bottom-8 left-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2 rounded-full shadow-2xl">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-black text-white italic">{product.rating} Avaliações</span>
                    </div>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-10 flex-1 flex flex-col justify-between gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <div className="h-1.5 w-8 bg-teal-500 rounded-full" />
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Disponibilidade Imediata</span>
                    </div>
                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight italic uppercase group-hover:text-teal-600 transition-colors duration-500">
                      {product.name}
                    </h4>
                    <p className="text-sm font-bold text-slate-400 italic leading-relaxed line-clamp-2">
                       {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Investimento</p>
                      <h5 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </h5>
                    </div>
                    <div className="w-16 h-16 rounded-[28px] bg-slate-900 text-white flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:bg-teal-500 group-hover:-translate-y-2 group-hover:rotate-6">
                      <Plus size={32} />
                    </div>
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

      {/* 4. Bottom Sheet de Detalhes - Imersivo Pro Max */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => { if(!open) setSelectedProduct(null); vibrate(10); }}>
        <SheetContent side="bottom" className="rounded-t-[56px] border-0 p-0 overflow-hidden bg-white shadow-2xl h-auto max-h-[95vh] focus:outline-none focus:ring-0">
          <div className="px-12 pt-16 pb-20 space-y-12">
            
            {/* Header do Sheet */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                     <ShoppingCart size={32} />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-3xl font-black italic tracking-tighter text-slate-800 uppercase leading-none">Checkout</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-sans">Confirmação de Reserva</p>
                  </div>
               </div>
               <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all active:scale-90"
               >
                  <X size={32} />
               </button>
            </div>

            {selectedProduct && (
              <div className="space-y-12">
                <div className="aspect-[16/10] w-full rounded-[48px] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner relative group/detail">
                   <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover group-hover/detail:scale-105 transition-transform duration-1000" />
                   <div className="absolute top-8 left-8 flex gap-3">
                      <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-0 font-black text-[9px] uppercase tracking-widest px-5 py-2 rounded-full shadow-xl">
                        {selectedProduct.category === 'material' ? 'Material Didático' : 'Serviço Educacional'}
                      </Badge>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-amber-50 rounded-full px-5 py-2 w-fit">
                         <Star size={14} className="fill-amber-500 text-amber-500" />
                         <span className="text-[11px] font-black text-amber-700 italic tracking-widest uppercase">{selectedProduct.rating} Ranking Global</span>
                      </div>
                      <h2 className="text-5xl font-black text-slate-800 tracking-tighter leading-none italic uppercase">{selectedProduct.name}</h2>
                      <p className="text-slate-500 font-bold text-lg italic leading-relaxed max-w-4xl">{selectedProduct.description}</p>
                   </div>

                   <div className="bg-slate-50 p-10 rounded-[44px] border border-slate-100/50 flex flex-col gap-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 p-10 opacity-5 pointer-events-none rotate-12">
                         <Info size={150} />
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] italic">
                         <div className="w-8 h-1.5 bg-teal-500 rounded-full" /> Procedimento de Coleta
                      </div>
                      <p className="text-base font-bold text-slate-500 italic leading-relaxed relative z-10">
                        Após a reserva digital, a retirada deste item ocorrerá na recepção da unidade no prazo de 48h úteis, mediante apresentação de QR Code.
                      </p>
                   </div>

                   <div className="flex flex-col sm:flex-row items-center justify-between gap-10 pt-10 border-t border-slate-100">
                      <div className="space-y-2 text-center sm:text-left">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic mb-2">Valor da Operação</p>
                         <h4 className="text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct?.price || 0)}
                         </h4>
                      </div>
                      <Button 
                         onClick={() => { vibrate(40); setSelectedProduct(null); }}
                         className="w-full sm:w-auto h-20 px-16 rounded-[32px] bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all border-0 hover:bg-teal-600"
                      >
                         Confirmar Reserva
                      </Button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Footer de Navegação */}
      <div className="flex justify-center pt-8">
        <Button
          variant="ghost"
          onClick={() => { vibrate(10); window.history.back(); }}
          className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-teal-600 transition-colors h-14 px-10 rounded-full bg-slate-50/50"
        >
          Voltar ao Início
        </Button>
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
