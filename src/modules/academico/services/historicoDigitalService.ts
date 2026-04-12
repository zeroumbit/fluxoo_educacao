import crypto from 'crypto';
import { supabase } from '@/lib/supabase'; // Ajuste o path conforme sua configuração
import { renderExitTranscriptPdf } from './historicoPdfService';

// ============================================================================
// 1. Geração de Hash Seguro (SHA-256)
// ============================================================================
export function generateValidationHash(alunoId: string, tenantId: string): string {
  const timestamp = Date.now().toString();
  const rawData = `${alunoId}:${tenantId}:${timestamp}`;
  return crypto.createHash('sha256').update(rawData).digest('hex');
}

// ============================================================================
// 2. Tipagem do Payload (Snapshot)
// ============================================================================
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
  academico: {
    media_geral_disciplinas: Array<{
      disciplina: string;
      media_final: number;
    }>;
    frequencia_total_percentual: number;
  };
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

// ============================================================================
// 3. Serviço de Agregação de Dados (Payload Builder)
// ============================================================================
export async function buildExitTranscriptPayload(
  alunoId: string,
  tenantId: string,
  opts: BuildTranscriptOpts
): Promise<ExitTranscriptPayload> {
  
  // 3.1. Fetch Dados do Aluno (incluindo código de transferência)
  const { data: aluno, error: alunoError } = await supabase
    .from('alunos')
    .select('id, nome_completo, codigo_transferencia, data_nascimento')
    .eq('id', alunoId)
    .eq('tenant_id', tenantId) // Garantindo isolamento cross-tenant
    .single();

  if (alunoError || !aluno) {
    throw new Error(`Erro ao buscar dados do aluno: ${alunoError?.message || 'Não encontrado'}`);
  }

  // 3.2. Fetch Dados da Escola
  const { data: escola, error: escolaError } = await (supabase as any)
    .from('escolas')
    .select('id, nome, cnpj')
    .eq('tenant_id', tenantId)
    .single();

  if (escolaError || !escola) {
    throw new Error(`Erro ao buscar dados da escola origem: ${escolaError?.message}`);
  }

  // 3.3. Fetch Acadêmico: Médias Finais e Frequência (Mockado para exemplo, adapte para as schemas reais de notas)
  // Requereria JOIN ou RPC complexo. Aqui representamos a abstração.
  const academicoMock = {
    media_geral_disciplinas: [
      { disciplina: 'Matemática', media_final: 8.5 },
      { disciplina: 'Português', media_final: 9.0 }
    ],
    frequencia_total_percentual: 95.5
  };

  // 3.4. Geração do SHA-256 para rastreabilidade
  const validationHash = generateValidationHash(alunoId, tenantId);

  // 3.5. Construção Inicial do Payload 
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
    academico: academicoMock,
    emissao: {
      validation_hash: validationHash,
      emitido_em: new Date().toISOString()
    }
  };

  // 3.6. Tratamento LGPD: Incluir dados sensíveis de saúde APENAS se explicitamente solicitado
  if (opts.includeHealthData) {
    const { data: saude } = await (supabase as any)
      .from('alertas_saude_nee')
      .select('tipo_alerta, descricao, cuidados_especificos')
      .eq('aluno_id', alunoId)
      .eq('tenant_id', tenantId);

    if (saude && saude.length > 0) {
      payload.dados_saude = {
        alergias: saude.filter((s: any) => s.tipo_alerta === 'alergia').map((s: any) => s.descricao),
        necessidades_especiais: saude.filter((s: any) => s.tipo_alerta === 'nee').map((s: any) => s.descricao),
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

// ============================================================================
// 4. Fluxo de Emissão Final (Transaction/Orchestrator)
// ============================================================================
export async function emitirHistoricoOficial(alunoId: string, tenantId: string, transferenciaId: string | null) {
  // 4.1. Construir e gerar payload JSON com os dados consolidados
  const payload = await buildExitTranscriptPayload(alunoId, tenantId, { includeHealthData: false });
  const validationHash = payload.emissao.validation_hash;

  // 4.2. Renderizar PDF
  const pdfBuffer = await renderExitTranscriptPdf(payload);

  // 4.3. Montar Storage Path seguro
  const filename = `${alunoId}-${validationHash}.pdf`;
  const storagePath = `${tenantId}/${filename}`;

  // 4.4. Upload para o Supabase Storage (Bucket: historicos_oficiais)
  const { error: uploadError } = await supabase.storage
    .from('historicos_oficiais')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false // Documentos emitidos são imutáveis; upsert false garante isso e evita sobrescritas
    });

  if (uploadError) {
    throw new Error(`Falha no upload do documento de histórico: ${uploadError.message}`);
  }

  // 4.5. Buscar a URL Pùblica ou Assinada para o banco
  const { data: { publicUrl } } = supabase.storage
    .from('historicos_oficiais')
    .getPublicUrl(storagePath);

  // 4.6. Salvar na Tabela de Auditoria IMUTÁVEL (historicos_digitais_emitidos)
  const { data: historicoRecord, error: insertError } = await (supabase as any)
    .from('historicos_digitais_emitidos')
    .insert({
      tenant_id: tenantId,
      aluno_id: alunoId,
      transferencia_id: transferenciaId,
      validation_hash: validationHash,
      payload_snapshot: payload,
      storage_path: publicUrl,
      status: 'final_emitido',
      emitido_por: (await supabase.auth.getUser()).data.user?.id
    })
    .select('id, validation_hash, storage_path')
    .single();

  if (insertError) {
    // Atenção: Em um fluxo resiliente corporativo ideal, faríamos um rollback (delete)
    // silencioso no Storage aqui caso a inserção no DB falhasse, mas para o escopo, logamos:
    console.error(`Erro ao gravar metadados de emissão do Histórico: `, insertError);
    throw new Error('Falha ao registrar a emissão do histórico.');
  }

  // 4.7. Retornar os dados de sucesso para o frontend baixar o arquivo e mostrar o selo de validação
  const record = historicoRecord as any;
  return {
    sucesso: true,
    historico_id: record.id,
    validation_hash: record.validation_hash,
    pdf_url: record.storage_path
  };
}
