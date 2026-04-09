import { useState, useEffect } from 'react';
import type { DailyInsight } from '../components/SmartAssistant';
import { useNavigate } from 'react-router-dom';

/**
 * Hook mockado para fornecer os insights ao Smart Assistant.
 * Em produção, este hook consultaria o backend (ex: Supabase RPC ou Edge Function)
 * para calcular as anomalias e pendências.
 */
export function useDailyInsights() {
  const [insights, setInsights] = useState<DailyInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simula uma chamada API
    const fetchInsights = async () => {
      setIsLoading(true);
      
      try {
        // Simulação de delay de rede
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock de dados baseados nos 3 pilares exigidos pela Regra de Inteligência
        const mockInsights: DailyInsight[] = [
          {
            id: 'ins-1',
            type: 'urgent',
            title: 'Diário pendente de preenchimento',
            description: 'O diário de classe do "8º Ano B" referente a ontem (Quinta-feira) ainda não foi preenchido. Isso impede o fechamento do sistema.',
            actionLabel: 'Preencher Diário',
            actionCallback: () => navigate('/professores/frequencia'), 
          },
          {
            id: 'ins-2',
            type: 'anomaly',
            title: 'Alerta de Evasão (Anomalia)',
            description: 'João e Maria faltaram às suas últimas 3 aulas seguidas de Matemática. Recomenda-se acompanhamento.',
            actionLabel: 'Ver Detalhes do Aluno',
            actionCallback: () => alert('Redirecionando para detalhes da anomalia...'),
          },
          {
            id: 'ins-3',
            type: 'update',
            title: 'Novo Laudo Médico Anexado',
            description: 'Pedro (7º Ano) agora possui plano de ensino adaptado (TDAH). Cadastrado hoje pela coordenação.',
            actionLabel: 'Visualizar Laudo',
            actionCallback: () => alert('Abrindo laudo escolar...'),
          },
          {
            id: 'ins-4',
            type: 'positive',
            title: 'Aniversariantes do Dia',
            description: 'Hoje é aniversário da Sofia (6º Ano). Ela estará na sua aula do 3º tempo hoje!',
          }
        ];

        setInsights(mockInsights);
      } catch (error) {
        console.error('Erro ao carregar insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [navigate]);

  return { insights, isLoading };
}
