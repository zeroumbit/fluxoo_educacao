import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Users,
  DollarSign,
  CalendarCheck,
  Pencil,
  TrendingUp
} from 'lucide-react'
import type { Turma } from '../types'
import { cn } from '@/lib/utils'

interface TabDadosGeraisProps {
  turma: Turma;
}

export function TabDadosGerais({ turma }: TabDadosGeraisProps) {
  const isAtiva = turma.status === 'ativa'

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Informações Principais */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Informações da Turma</h3>
              <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold text-xs gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome da Turma</p>
                <p className="text-base font-bold text-slate-800">{turma.nome}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Turno</p>
                <Badge className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider w-fit">
                  {turma.turno}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Horário</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-base font-bold text-slate-800">{turma.horario_inicio} - {turma.horario_fim}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacidade</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <p className="text-base font-bold text-slate-800">{turma.capacidade} alunos</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor da Mensalidade</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <p className="text-xl font-bold text-slate-900">
                    {turma.valor_mensalidade 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(turma.valor_mensalidade)
                      : '—'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
                <Badge className={isAtiva ? 'bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider w-fit' : 'bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider w-fit'}>
                  {turma.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Grade */}
        <Card className="rounded-xl border border-slate-200 bg-slate-900 text-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight">Resumo da Grade</h3>
                <p className="text-slate-400 text-sm font-medium">Distribuição de aulas na semana</p>
              </div>
              <CalendarCheck className="h-10 w-10 text-teal-400 opacity-50" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Disciplinas</p>
                <p className="text-2xl font-black">8</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Professores</p>
                <p className="text-2xl font-black">5</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Aulas/Semana</p>
                <p className="text-2xl font-black">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações e Informações Complementares */}
      <div className="space-y-6">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Button className="w-full h-12 rounded-xl font-bold text-xs gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm justify-start">
                <CalendarCheck className="h-4 w-4" />
                Lançar Frequência
              </Button>
              <Button className="w-full h-12 rounded-xl font-bold text-xs gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm justify-start">
                <TrendingUp className="h-4 w-4" />
                Relatório de Desempenho
              </Button>
              <Button className="w-full h-12 rounded-xl font-bold text-xs gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm justify-start">
                <Users className="h-4 w-4" />
                Gerenciar Alunos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Localização</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Prédio Principal</p>
                  <p className="text-xs text-slate-400">Sala 08 · 2º Andar</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
