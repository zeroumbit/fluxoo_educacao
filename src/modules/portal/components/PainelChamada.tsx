import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CarFront, Clock, UserCheck, Loader2 } from "lucide-react";

export function PainelChamada({ fila, isLoading }: { fila: any[], isLoading: boolean }) {

  if (isLoading) {
    return <div className="flex h-48 animate-pulse bg-zinc-100 rounded-xl items-center justify-center"><Loader2 className="animate-spin text-muted-foreground w-8 h-8" /></div>;
  }

  const aguardando = fila?.filter((f: any) => f.status === "aguardando") || [];

  return (
    <Card className="border-0 shadow-lg bg-zinc-900 text-white overflow-hidden">
      <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CarFront className="h-6 w-6 text-blue-500" />
          Fila de Saída (Portaria)
        </h2>
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Clock className="h-4 w-4" />
          {format(new Date(), "HH:mm", { locale: ptBR })}
        </div>
      </div>
      <CardContent className="p-0 max-h-[600px] overflow-y-auto">
        {aguardando.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {aguardando.map((registro: any) => (
              <div
                key={registro.id}
                className="p-6 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
              >
                <div>
                  <h3 className="text-2xl font-black text-white mb-1">
                    {registro.alunos ? registro.alunos.nome_completo : 'Aluno'}
                  </h3>
                  <p className="text-zinc-400 flex items-center gap-2 font-medium">
                    <UserCheck className="h-4 w-4" />
                    Resp: {registro.responsaveis ? registro.responsaveis.nome_completo : 'Responsável'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-500">
                    {format(new Date(registro.created_at), "HH:mm")}
                  </div>
                  <p className="text-sm text-zinc-500">Chegada anunciada</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-500">
            <CarFront className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">Nenhum responsável na fila no momento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
