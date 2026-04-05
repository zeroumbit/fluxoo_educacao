import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RadarAluno } from './dashboard.service';
import { useAuth } from '@/modules/auth/AuthContext';
import { alertasService } from './alertas.service';

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
  mudarStatusAlerta: (alerta: AlertaActionProps, novoStatus: AlertaStatus, observacao?: string) => void;
  isLoading: boolean;
  isLoadingHistorico: boolean;
}

const AlertasContext = createContext<AlertasContextType | undefined>(undefined);

export function AlertasProvider({ children, radarData = [] }: { children: React.ReactNode, radarData?: RadarAluno[] }) {
  const { authUser } = useAuth();
  const qc = useQueryClient();
  const migrationDone = useRef(false);

  // Busca status do banco
  const { data: alertasDB = {}, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['alertas_status', authUser?.tenantId],
    queryFn: () => alertasService.getAlertasStatus(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Busca histórico do banco
  const { data: historicoDB = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['alertas_historico', authUser?.tenantId],
    queryFn: () => alertasService.getHistorico(authUser!.tenantId),
    enabled: !!authUser?.tenantId,
    staleTime: 1000 * 60 * 5,
  });

  // Mutação para atualizar alerta
  const mutation = useMutation({
    mutationFn: ({ alerta, novoStatus, observacao }: {
      alerta: AlertaActionProps;
      novoStatus: AlertaStatus;
      observacao?: string;
    }) => alertasService.updateAlertaStatus(
      authUser!.tenantId,
      authUser!.user.id,
      authUser!.nome || 'Operador',
      { aluno_id: alerta.aluno_id, novo_status: novoStatus, observacao }
    ),
    onSuccess: () => {
      // Invalida queries para refrescar dados
      qc.invalidateQueries({ queryKey: ['alertas_status', authUser?.tenantId] });
      qc.invalidateQueries({ queryKey: ['alertas_historico', authUser?.tenantId] });
      // Invalida dashboard (pode afetar métricas de alertas)
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Migração localStorage → DB (executar uma vez)
  useEffect(() => {
    if (!authUser?.tenantId || migrationDone.current) return;
    migrationDone.current = true;

    const statusKey = `fluxoo_alertas_status_${authUser.tenantId}`;
    const histKey = `fluxoo_alertas_historico_${authUser.tenantId}`;

    const savedStatus = localStorage.getItem(statusKey);
    const savedHist = localStorage.getItem(histKey);

    if (savedStatus || savedHist) {
      alertasService.migrarLocalStorageParaDB(
        authUser.tenantId,
        savedStatus ? JSON.parse(savedStatus) : {},
        savedHist ? JSON.parse(savedHist) : [],
        authUser.user.id,
        authUser.nome || 'Operador'
      ).then(() => {
        // Limpa localStorage após migração
        localStorage.removeItem(statusKey);
        localStorage.removeItem(histKey);
      }).catch(console.error);
    }
  }, [authUser?.tenantId, authUser?.user.id, authUser?.nome]);

  const mudarStatusAlerta = useCallback((
    alerta: AlertaActionProps,
    novoStatus: AlertaStatus,
    observacao?: string
  ) => {
    mutation.mutate({ alerta, novoStatus, observacao });
  }, [mutation]);

  // Converte histórico DB para formato da UI
  const historicoAcoes: AlertaHistorico[] = useMemo(() => {
    return (historicoDB as any[]).map((item: any) => ({
      id: item.id,
      alertaId: item.alerta_id,
      alertaTitulo: 'Alerta de Evasão',
      alunoNome: item.aluno_nome,
      acao: item.status_novo as AlertaStatus,
      data: item.data_acao,
      usuario: item.usuario_nome || 'Operador',
    }));
  }, [historicoDB]);

  const alertas = useMemo(() => {
    return radarData.map(aluno => {
      const statusRaw = (alertasDB as Record<string, string>)[aluno.aluno_id] || 'ativo';
      const status = (statusRaw === 'ativo' || statusRaw === 'tratado' || statusRaw === 'arquivado')
        ? statusRaw as AlertaStatus
        : 'ativo';

      // Lógica de Gravidade
      let gravidade: AlertaGravidade = 'baixa';
      if (aluno.cobrancas_atrasadas >= 2 && aluno.faltas_consecutivas >= 7) {
        gravidade = 'alta';
      } else if (aluno.cobrancas_atrasadas >= 1 && aluno.faltas_consecutivas >= 3) {
        gravidade = 'media';
      }

      return {
        ...aluno,
        status,
        gravidade,
      } as RadarAlunoComStatus;
    });
  }, [radarData, alertasDB]);

  return (
    <AlertasContext.Provider value={{
      alertas,
      historicoAcoes,
      mudarStatusAlerta,
      isLoading: isLoadingStatus,
      isLoadingHistorico,
    }}>
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
