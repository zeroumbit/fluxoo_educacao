import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { RadarAluno } from './dashboard.service';
import { useAuth } from '@/modules/auth/AuthContext';

export type AlertaStatus = 'ativo' | 'tratado' | 'arquivado';
export type AlertaGravidade = 'alta' | 'media' | 'baixa';

export interface AlertaHistorico {
  id: string;
  alertaId: string;
  alertaTitulo: string;
  alunoNome: string;
  acao: AlertaStatus;
  data: string;
  usuario: string;
}

export interface AlertaActionProps {
  aluno_id: string;
  nome_completo: string;
  motivo_principal?: string;
}

export interface RadarAlunoComStatus extends RadarAluno {
  status: AlertaStatus;
  gravidade: AlertaGravidade;
}

interface AlertasContextType {
  alertas: (RadarAluno & { status: AlertaStatus; gravidade: AlertaGravidade })[];
  historicoAcoes: AlertaHistorico[];
  mudarStatusAlerta: (alerta: AlertaActionProps, novoStatus: AlertaStatus) => void;
  isLoading: boolean;
}

const AlertasContext = createContext<AlertasContextType | undefined>(undefined);

export function AlertasProvider({ children, radarData = [] }: { children: React.ReactNode, radarData?: RadarAluno[] }) {
  const { authUser } = useAuth();
  
  // Estado de Status (Persistido no LocalStorage do Tenant)
  const [alertasLocal, setAlertasLocal] = useState<Record<string, AlertaStatus>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem(`fluxoo_alertas_status_${authUser?.tenantId}`);
    return saved ? JSON.parse(saved) : {};
  });
  
  // Estado de Histórico (Persistido no LocalStorage do Tenant)
  const [historicoAcoes, setHistoricoAcoes] = useState<AlertaHistorico[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(`fluxoo_alertas_historico_${authUser?.tenantId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Efeito para persistência
  useEffect(() => {
    if (authUser?.tenantId) {
      localStorage.setItem(`fluxoo_alertas_status_${authUser.tenantId}`, JSON.stringify(alertasLocal));
    }
  }, [alertasLocal, authUser?.tenantId]);

  useEffect(() => {
    if (authUser?.tenantId) {
      localStorage.setItem(`fluxoo_alertas_historico_${authUser.tenantId}`, JSON.stringify(historicoAcoes));
    }
  }, [historicoAcoes, authUser?.tenantId]);

  const registrarAcao = (alerta: AlertaActionProps, acao: AlertaStatus) => {
    const novoRegisto: AlertaHistorico = {
      id: `hist_${Date.now()}`,
      alertaId: alerta.aluno_id,
      alertaTitulo: alerta.motivo_principal || 'Alerta de Evasão',
      alunoNome: alerta.nome_completo,
      acao,
      data: new Date().toISOString(),
      usuario: authUser?.nome || 'Operador'
    };
    setHistoricoAcoes(prev => [novoRegisto, ...prev]);
  };

  const mudarStatusAlerta = (alerta: AlertaActionProps, novoStatus: AlertaStatus) => {
    setAlertasLocal(prev => ({ ...prev, [alerta.aluno_id]: novoStatus }));
    registrarAcao(alerta, novoStatus);
  };

  const alertas = useMemo(() => {
    return radarData.map(aluno => {
      const status = alertasLocal[aluno.aluno_id] || 'ativo';
      
      // Lógica de Gravidade (Mantendo a regra de negócio da escola)
      let gravidade: AlertaGravidade = 'baixa'; // ATENÇÃO
      if (aluno.cobrancas_atrasadas >= 2 && aluno.faltas_consecutivas >= 7) {
        gravidade = 'alta'; // CRÍTICO
      } else if (aluno.cobrancas_atrasadas >= 1 && aluno.faltas_consecutivas >= 3) {
        gravidade = 'media'; // ALERTA
      }

      return {
        ...aluno,
        status,
        gravidade
      };
    });
  }, [radarData, alertasLocal]);

  return (
    <AlertasContext.Provider value={{ alertas, historicoAcoes, mudarStatusAlerta, isLoading: false }}>
      {children}
    </AlertasContext.Provider>
  );
}

export function useAlertas() {
  const context = useContext(AlertasContext);
  if (context === undefined) {
    throw new Error('useAlertas must be used within an AlertasProvider');
  }
  return context;
}
