import React, { useState } from 'react'
import { 
  ShoppingCart, 
  Search, 
  BookOpen, 
  UserPlus, 
  ArrowRight, 
  Tag, 
  Star,
  Package,
  Filter,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
  // Material Escolar
  {
    id: 'm1',
    name: 'Kit Escolar Fundamental I',
    description: 'Conjunto completo contendo cadernos, lápis de cor, estojo e mochila temática.',
    price: 189.90,
    category: 'material',
    image: 'https://images.unsplash.com/photo-1572948852275-231cb30026e1?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    popular: true
  },
  {
    id: 'm2',
    name: 'Dicionário Escolar Ilustrado',
    description: 'Nova ortografia com ilustrações facilitadoras para o aprendizado infantil.',
    price: 45.00,
    category: 'material',
    image: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f37?q=80&w=800&auto=format&fit=crop',
    rating: 4.5
  },
  // Professores (Serviços/Cursos)
  {
    id: 'p1',
    name: 'Reforço de Matemática (Mensal)',
    description: 'Acompanhamento personalizado para alunos com dificuldades em lógica e álgebra.',
    price: 250.00,
    category: 'professores',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    rating: 5.0,
    popular: true
  },
  {
    id: 'p2',
    name: 'Curso de Inglês Preparatório',
    description: 'Aulas extras focadas em conversação e preparação para exames internacionais.',
    price: 320.00,
    category: 'professores',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    rating: 4.9
  }
]

export function PortalLojaPage() {
  const [activeTab, setActiveTab] = useState<'material' | 'professores'>('material')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filteredProducts = PRODUCTS.filter(p => 
    p.category === activeTab && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* 1. Hero Section - Marketplace Style */}
      <div className="bg-white p-10 md:p-16 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -mr-24 -mt-24 pointer-events-none rotate-12">
          <ShoppingCart size={400} />
        </div>

        <div className="max-w-3xl space-y-8 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-50 text-teal-600 border-teal-100 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
              Marketplace FluxooEdu
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-tight italic">
              A Loja da <span className="text-teal-500 underline decoration-8 decoration-teal-100">Escola</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg md:text-xl">Materiais oficiais, cursos extras e serviços pedagógicos em um só lugar.</p>
          </div>

          <div className="relative group max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-teal-500 transition-colors" size={24} />
            <Input 
              placeholder={`Pesquisar em ${activeTab === 'material' ? 'materiais' : 'professores'}...`}
              className="h-16 pl-16 pr-8 bg-slate-50 border-none rounded-[28px] text-lg font-bold placeholder:text-slate-300 shadow-inner group-focus-within:bg-white transition-all ring-0 focus-visible:ring-4 focus-visible:ring-teal-500/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Menu de Categorias Principal */}
      <div className="flex bg-white/50 p-2 rounded-[32px] border border-slate-100 w-fit backdrop-blur-md">
        <button
          onClick={() => setActiveTab('material')}
          className={cn(
            "py-4 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
            activeTab === 'material' 
            ? 'bg-slate-900 text-white shadow-2xl scale-105' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-white'
          )}
        >
          <Package size={20} /> Material Escolar
        </button>
        <button
          onClick={() => setActiveTab('professores')}
          className={cn(
            "py-4 px-8 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
            activeTab === 'professores' 
            ? 'bg-slate-900 text-white shadow-2xl scale-105' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-white'
          )}
        >
          <Users size={20} /> Professores & Serviços
        </button>
      </div>

      {/* 3. Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div 
            key={product.id}
            className="bg-white rounded-[48px] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col"
          >
            {/* Imagem do Produto */}
            <div 
              className="h-64 relative overflow-hidden p-4 cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="w-full h-full rounded-[36px] overflow-hidden bg-slate-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
              {product.popular && (
                <Badge className="absolute top-8 left-8 bg-amber-500 text-white font-black text-[9px] uppercase border-none px-3 py-1 shadow-lg shadow-amber-500/30">
                  Mais procurado
                </Badge>
              )}
              <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-md p-2 rounded-2xl flex items-center gap-1 shadow-sm">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-black text-slate-800">{product.rating}</span>
              </div>
            </div>

            {/* Info do Produto */}
            <div className="p-10 pt-4 flex-1 flex flex-col space-y-4">
              <div 
                className="space-y-1 cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-teal-600 transition-colors">
                  {product.name}
                </h4>
                <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Valor</p>
                  <h5 className="text-2xl font-black text-slate-800 tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </h5>
                </div>
                <button className="w-14 h-14 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center shadow-xl shadow-teal-500/20 active:scale-90 transition-all">
                  <PlusIcon size={24} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-100">
              <Search className="text-slate-200" size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase">Nada encontrado</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto">Tente buscar por outros termos ou explore a outra categoria.</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Banner de Segurança/Marketplace */}
      <div className="bg-slate-900 p-12 rounded-[56px] text-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-12 opacity-5 -mr-12 -mt-12 group-hover:rotate-12 transition-transform duration-700">
          <BookOpen size={200} />
        </div>
        <div className="w-20 h-20 bg-teal-500 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-teal-500/40">
          <Tag size={40} />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-3xl font-black tracking-tighter italic">Compra Garantida Escola</h3>
          <p className="text-slate-400 font-medium text-sm max-w-2xl">
            Todos os itens da loja são validados pela coordenação pedagógica. O pagamento é processado via FluxooEdu e a entrega/serviço é garantida pela instituição.
          </p>
        </div>
        <button className="whitespace-nowrap bg-white text-slate-900 px-10 py-5 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-teal-50 transition-all ml-auto active:scale-95">
          Ver Meus Pedidos
        </button>
      </div>

      {/* Modal Lateral (Detail Drawer) */}
      {selectedProduct && <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  )
}

function ProductDetailDrawer({ product, onClose }: { product: Product, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Painel */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <ShoppingCart size={20} />
             </div>
             <div>
                <h3 className="font-black text-slate-800 tracking-tighter uppercase text-xs">Detalhes do Item</h3>
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Código: {product.id.toUpperCase()}</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm active:scale-90">
             <XIcon size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
           {/* Banner/Imagem */}
           <div className="aspect-square w-full rounded-[48px] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
           </div>

           {/* Informações */}
           <div className="space-y-8">
              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase px-3 py-1 rounded-full flex items-center gap-1">
                       <Star size={10} className="fill-amber-500 text-amber-500" /> {product.rating} Avaliação dos Pais
                    </Badge>
                    {product.popular && (
                      <Badge className="bg-teal-50 text-teal-600 border-none font-black text-[9px] uppercase px-3 py-1 rounded-full">Destaque</Badge>
                    )}
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight italic">{product.name}</h2>
                 <p className="text-slate-400 font-bold text-lg leading-relaxed">{product.description}</p>
              </div>

              {/* Grid de Atributos */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria</span>
                    <span className="font-black text-slate-800 uppercase text-xs">{product.category === 'material' ? 'Material Escolar' : 'Professores'}</span>
                 </div>
                 <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disponibilidade</span>
                    <span className="font-black text-emerald-500 uppercase text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Em estoque</span>
                 </div>
              </div>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white space-y-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Investimento</p>
                    <h4 className="text-5xl font-black tracking-tighter">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </h4>
                 </div>
                 <Button className="w-full bg-teal-500 hover:bg-teal-400 py-8 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-3">
                    <PlusIcon size={20} /> Adicionar ao Carrinho
                 </Button>
              </div>
           </div>
        </div>
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
