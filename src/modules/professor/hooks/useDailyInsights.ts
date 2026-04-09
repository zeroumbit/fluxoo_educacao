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
            id: 'ins-bncc',
            type: 'bncc',
            title: 'Previsão BNCC: Próxima Aula',
            description: 'Com base no seu planejamento, o conteúdo previsto para amanhã é "Frações". Deseja injetar o código EF05MA07 no diário?',
            actionLabel: 'Preencher Diário',
            suggestedBNCCCode: 'EF05MA07',
          },
          {
            id: 'ins-praise',
            type: 'pos-reinforcement',
            title: 'Evolução Significativa',
            description: 'O aluno Carlos Eduardo subiu a média de 6.0 para 9.5 em Matemática nas últimas duas semanas! 🚀',
            actionLabel: 'Enviar Elogio à Família',
            messageTemplate: 'elogio',
            alunoId: 'aluno-carlos',
            alunoNome: 'Carlos Eduardo',
          },
          {
            id: 'ins-alert',
            type: 'pedagogic-alert',
            title: 'Risco Pedagógico Detectado',
            description: 'A aluna Ana Beatriz teve uma queda de 45% no rendimento nas atividades de Álgebra.',
            actionLabel: 'Notificar Pais',
            secondaryActionLabel: 'Ver Histórico do Aluno',
            messageTemplate: 'alerta',
            alunoId: 'aluno-ana',
            alunoNome: 'Ana Beatriz',
            secondaryActionCallback: () => navigate('/alunos/aluno-ana'),
          },
          {
            id: 'ins-1',
            type: 'urgent',
            title: 'Diário pendente de preenchimento',
            description: 'O diário de classe do "8º Ano B" referente a ontem (Quinta-feira) ainda não foi preenchido.',
            actionLabel: 'Preencher Diário',
            actionCallback: () => navigate('/professores/frequencia'), 
          },
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
