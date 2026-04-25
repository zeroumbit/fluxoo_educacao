import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { getExitTranscriptHtmlTemplate } from './historicoPdfService';
import type { HistoricoRpcResponse } from '../types';

export interface HistoricoDisciplina {
  disciplina: string;
  media_final: number;
  resultado?: string;
}

export interface HistoricoFrequencia {
  presencas: number;
  faltas: number;
  justificadas: number;
  total_aulas: number;
  percentual: number;
}

export interface HistoricoAcademico {
  disciplinas: HistoricoDisciplina[];
  frequencia: HistoricoFrequencia;
  media_geral: number;
}

export interface ExitTranscriptPayload {
  aluno: {
    id: string;
    nome_completo: string;
    codigo_transferencia: string | null;
    data_nascimento: string | null;
  };
  escola_origem: {
    tenant_id: string;
    nome_escola: string;
    cnpj: string | null;
  };
  academico: HistoricoAcademico;
  dados_saude?: {
    alergias: string[];
    necessidades_especiais: string[];
    cuidados_especificos: string | null;
  };
  emissao: {
    validation_hash: string;
    emitido_em: string;
  };
}

export interface BuildTranscriptOpts {
  includeHealthData: boolean;
}

export function generateValidationHash(alunoId: string, tenantId: string): string {
  const timestamp = Date.now().toString();
  const rawData = `${alunoId}:${tenantId}:${timestamp}`;
  return crypto.createHash('sha256').update(rawData).digest('hex');
}

export async function buildExitTranscriptPayload(
  alunoId: string,
  tenantId: string,
  opts: BuildTranscriptOpts
): Promise<ExitTranscriptPayload> {
  
  const { data: aluno, error: alunoError } = await supabase
    .from('alunos')
    .select('id, nome_completo, codigo_transferencia, data_nascimento')
    .eq('id', alunoId)
    .eq('tenant_id', tenantId)
    .single();

  if (alunoError || !aluno) {
    throw new Error(`Erro ao buscar dados do aluno: ${alunoError?.message || 'Não encontrado'}`);
  }

  const { data: escola, error: escolaError } = await (supabase as any)
    .from('escolas')
    .select('id, nome, cnpj')
    .eq('tenant_id', tenantId)
    .single() as { data: { id: string; nome: string; cnpj: string | null } | null; error: Error | null };

  if (escolaError || !escola) {
    throw new Error(`Erro ao buscar dados da escola origem: ${escolaError?.message}`);
  }

  const { data: academicoData, error: academicoError } = await (supabase as any)
    .rpc('fn_get_historico_consolidado_aluno', {
      p_aluno_id: alunoId,
      p_tenant_id: tenantId
    }) as { data: HistoricoRpcResponse[] | null; error: Error | null };

  let disciplinas: HistoricoDisciplina[] = [];
  let frequencia: HistoricoFrequencia = {
    presencas: 0,
    faltas: 0,
    justificadas: 0,
    total_aulas: 0,
    percentual: 100
  };
  let media_geral = 0;

  if (!academicoError && academicoData && academicoData.length > 0) {
    const data = academicoData[0];
    
    if (data.disciplinas) {
      disciplinas = data.disciplinas.map((d) => ({
        disciplina: d.disciplina || 'Disciplina',
        media_final: Number(d.media_final) || 0,
        resultado: d.resultado || 'cursando'
      }));
    }
    
    if (data.frequencia) {
      frequencia = {
        presencas: data.frequencia.presencas || 0,
        faltas: data.frequencia.faltas || 0,
        justificadas: data.frequencia.justificadas || 0,
        total_aulas: data.frequencia.total_aulas || 0,
        percentual: Number(data.frequencia.percentual) || 100
      };
    }
    
    media_geral = Number(data.media_geral) || 0;
  }

  if (disciplinas.length === 0) {
    disciplinas = [{
      disciplina: 'Dados não disponíveis',
      media_final: 0,
      resultado: 'sem_dados'
    }];
  }

  const validationHash = generateValidationHash(alunoId, tenantId);

  const payload: ExitTranscriptPayload = {
    aluno: {
      id: aluno.id,
      nome_completo: aluno.nome_completo,
      codigo_transferencia: aluno.codigo_transferencia,
      data_nascimento: aluno.data_nascimento
    },
    escola_origem: {
      tenant_id: tenantId,
      nome_escola: escola.nome,
      cnpj: escola.cnpj
    },
    academico: {
      disciplinas,
      frequencia,
      media_geral
    },
    emissao: {
      validation_hash: validationHash,
      emitido_em: new Date().toISOString()
    }
  };

  if (opts.includeHealthData) {
    const { data: saude } = await (supabase as any)
      .from('alertas_saude_nee')
      .select('tipo_alerta, descricao, cuidados_especificos')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId) as { data: { tipo_alerta: string; descricao: string; cuidados_especificos: string | null }[] | null };

    if (saude && saude.length > 0) {
      payload.dados_saude = {
        alergias: saude.filter((s) => s.tipo_alerta === 'alergia').map((s) => s.descricao),
        necessidades_especiais: saude.filter((s) => s.tipo_alerta === 'nee').map((s) => s.descricao),
        cuidados_especificos: saude[0].cuidados_especificos
      };
    } else {
      payload.dados_saude = {
        alergias: [],
        necessidades_especiais: [],
        cuidados_especificos: null
      };
    }
  }

  return payload;
}

export interface EmitirHistoricoResult {
  sucesso: boolean;
  historico_id: string;
  validation_hash: string;
  pdf_url: string;
  message?: string;
}

export async function emitirHistoricoOficial(
  alunoId: string, 
  tenantId: string, 
  transferenciaId: string | null,
  incluirDadosSaude: boolean = false,
  userId?: string
): Promise<EmitirHistoricoResult> {
  try {
    const payload = await buildExitTranscriptPayload(alunoId, tenantId, { 
      includeHealthData: incluirDadosSaude 
    });
    const validationHash = payload.emissao.validation_hash;

    const htmlContent = getExitTranscriptHtmlTemplate(payload);
    
    const { data: historicoRecord, error: insertError } = await (supabase as any)
      .from('historicos_digitais_emitidos')
      .insert({
        tenant_id: tenantId,
        aluno_id: alunoId,
        transferencia_id: transferenciaId,
        validation_hash: validationHash,
        payload_snapshot: payload,
        storage_path: null,
        status: 'final_emitido',
        criado_por: userId || null
      })
      .select('id, validation_hash')
      .single();

    if (insertError) {
      console.error('Erro ao gravar metadados:', insertError);
      throw new Error('Falha ao registrar a emissão do histórico.');
    }

    return {
      sucesso: true,
      historico_id: historicoRecord.id,
      validation_hash: validationHash,
      pdf_url: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
      message: 'Histórico emitido! Use o botão para imprimir/salvar.'
    };
  } catch (error: unknown) {
    console.error('Erro ao emitir histórico:', error);
    const err = error as Error;
    return {
      sucesso: false,
      historico_id: '',
      validation_hash: '',
      pdf_url: '',
      message: err.message || 'Erro desconhecido ao emitir histórico'
    };
  }
}

export async function listarHistoricosAluno(alunoId: string, tenantId: string) {
  const { data, error } = await (supabase as any)
    .rpc('fn_listar_historicos_aluno', {
      p_aluno_id: alunoId,
      p_tenant_id: tenantId
    }) as { data: Record<string, unknown>[] | null; error: Error | null };

  if (error) {
    console.error('Erro ao listar históricos:', error);
    return [];
  }

  return data || [];
}

export async function buscarHistoricoPorHash(hash: string, tenantId: string) {
  const { data, error } = await (supabase as any)
    .from('historicos_digitais_emitidos')
    .select('*')
    .eq('validation_hash', hash)
    .eq('tenant_id', tenantId)
    .single() as { data: Record<string, unknown> | null; error: Error | null };

  if (error) {
    console.error('Erro ao buscar histórico:', error);
    return null;
  }

  return data;
}