import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Pencil,
  Clock,
  Users,
  DollarSign,
  CalendarCheck,
  MapPin,
  CircleCheck
} from 'lucide-react'
import type { Turma } from '../types'
import { cn } from '@/lib/utils'

interface TabDadosGeraisProps {
  turma: Turma;
}

export function TabDadosGerais({ turma }: TabDadosGeraisProps) {
  const isAtiva = turma.status === 'ativa'

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      {/* Coluna Esquerda: Informações Principais */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500" />
          <CardContent className="p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6 uppercase tracking-widest text-xs text-slate-400">Informações Básicas</h3>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nome da Turma</p>
                  <p className="text-lg font-bold text-slate-800">{turma.nome}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Turno e Horário</p>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" />
                    <p className="text-lg font-bold text-slate-800 capitalize">
                      {turma.turno} · {turma.horario_inicio} - {turma.horario_fim}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Capacidade</p>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <p className="text-lg font-bold text-slate-800">{turma.capacidade} alunos</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Valor da Mensalidade</p>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-500" />
                    <p className="text-2xl font-black text-slate-900">R$ {turma.valor_mensalidade.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Acadêmico</p>
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest",
                    isAtiva ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>
                    <div className={cn("h-2 w-2 rounded-full", isAtiva ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                    {isAtiva ? 'Turma Ativa' : 'Turma Inativa'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Grade */}
        <Card className="border-0 shadow-lg shadow-slate-100 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
           <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-xl font-black tracking-tight">Resumo da Grade</h3>
                   <p className="text-slate-400 text-sm font-medium">Situação da distribuição acadêmica</p>
                </div>
                <CalendarCheck className="h-10 w-10 text-teal-400 opacity-50" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Disciplinas</p>
                    <p className="text-2xl font-black">8 <span className="text-xs text-slate-500">ativas</span></p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Professores</p>
                    <p className="text-2xl font-black">5 <span className="text-xs text-slate-500">vinculados</span></p>
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                       <CircleCheck size={16} />
                       <span className="text-xs font-bold uppercase tracking-widest">Grade Completa</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Sem pendências de horário</p>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Coluna Direita: Ações Rápidas */}
      <div className="lg:col-span-4 space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Ações Rápidas</h3>
        <div className="grid gap-3">
          <Button className="h-16 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-0 shadow-sm justify-start gap-4 px-6 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck size={20} />
            </div>
            <span className="font-bold">Lançar Frequência</span>
          </Button>
          
          <Button className="h-16 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-0 shadow-sm justify-start gap-4 px-6 group">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare size={20} />
            </div>
            <span className="font-bold">Enviar Comunicado</span>
          </Button>

          <Button className="h-16 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-0 shadow-sm justify-start gap-4 px-6 group">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={20} />
            </div>
            <span className="font-bold">Relatório de Desempenho</span>
          </Button>

          <Button className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 shadow-sm justify-start gap-4 px-6 group mt-4">
            <div className="h-10 w-10 rounded-xl bg-white text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Pencil size={20} />
            </div>
            <span className="font-bold">Editar Turma</span>
          </Button>
        </div>

        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 group cursor-pointer hover:bg-indigo-100 transition-colors">
           <div className="flex items-center gap-3 mb-4">
              <MapPin className="text-indigo-600" />
              <h4 className="font-black text-slate-800 tracking-tight uppercase tracking-widest text-[10px]">Localização</h4>
           </div>
           <p className="text-sm font-bold text-slate-700">Prédio Principal · Sala 08</p>
           <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">2º Andar - Bloco Acadêmico</p>
        </div>
      </div>
    </div>
  )
}
