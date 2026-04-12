import puppeteer from 'puppeteer';
import type { ExitTranscriptPayload } from './historicoDigitalService';

export function getExitTranscriptHtmlTemplate(payload: ExitTranscriptPayload): string {
  // CSS Crítico para PDF e estrutura exigida
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Histórico Escolar Digital</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 40px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          color: #1e3a8a;
          font-size: 24px;
        }
        .header h2 {
          margin: 5px 0 0;
          font-size: 16px;
          font-weight: normal;
          color: #475569;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-top: 30px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 5px;
        }
        .info-grid {
          display: flex;
          flex-wrap: wrap;
          margin-top: 15px;
        }
        .info-item {
          width: 50%;
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 16px;
          color: #0f172a;
        }
        
        /* 
         * REGRAS CSS CRÍTICAS PARA IMPRESSÃO/PDF 
         */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        thead {
          display: table-header-group; /* Repete cabeçalho em quebras de página */
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #334155;
        }
        tr {
          page-break-inside: avoid; /* Não corta linha no meio */
        }
        
        .signature-block {
          margin-top: 50px;
          text-align: center;
          page-break-inside: avoid; /* Mantém bloco de assinatura junto */
        }
        .signature-line {
          width: 300px;
          border-top: 1px solid #333;
          margin: 0 auto 10px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          page-break-inside: avoid;
        }
        .hash-code {
          font-family: monospace;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          color: #0f172a;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${payload.escola_origem.nome_escola}</h1>
        <h2>Histórico Escolar Oficial - Guia de Transferência</h2>
        <p style="font-size: 12px; color: #64748b;">CNPJ: ${payload.escola_origem.cnpj || 'Não informado'}</p>
      </div>

      <div class="section-title">Dados do Aluno</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Nome Completo</div>
          <div class="info-value">${payload.aluno.nome_completo}</div>
        </div>
        <div class="info-item">
          <div class="info-label">ID Escolar (Short ID)</div>
          <div class="info-value"><span style="font-family: monospace; font-weight: bold;">${payload.aluno.codigo_transferencia}</span></div>
        </div>
      </div>

      <div class="section-title">Desempenho Acadêmico</div>
      <table>
        <thead>
          <tr>
            <th>Disciplina</th>
            <th style="text-align: center; width: 100px;">Média Final</th>
          </tr>
        </thead>
        <tbody>
          ${payload.academico.media_geral_disciplinas.map(disc => `
            <tr>
              <td>${disc.disciplina}</td>
              <td style="text-align: center; font-weight: bold;">${disc.media_final.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px;">
        <span class="info-label">Frequência Global Registrada:</span> 
        <span style="font-weight: bold; font-size: 16px;">${payload.academico.frequencia_total_percentual}%</span>
      </div>

      ${payload.dados_saude ? `
      <div class="section-title" style="color: #b91c1c; border-color: #fca5a5;">Observações de Saúde e NEE</div>
      <div style="margin-top: 15px; padding: 15px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
        <div style="margin-bottom: 10px;"><strong>Alergias:</strong> ${payload.dados_saude.alergias.length > 0 ? payload.dados_saude.alergias.join(', ') : 'Nenhuma relatada'}</div>
        <div style="margin-bottom: 10px;"><strong>Necessidades Especiais:</strong> ${payload.dados_saude.necessidades_especiais.length > 0 ? payload.dados_saude.necessidades_especiais.join(', ') : 'Nenhuma relatada'}</div>
        <div><strong>Cuidados Específicos:</strong> ${payload.dados_saude.cuidados_especificos || 'Nenhum cuidado específico aplicável'}</div>
      </div>
      ` : ''}

      <div class="signature-block">
        <div class="signature-line"></div>
        <div style="font-weight: bold;">Diretoria Escolar</div>
        <div style="font-size: 12px; color: #64748b;">Assinatura Digital / Carimbo Institucional</div>
      </div>

      <div class="footer">
        <div>Para verificar a autenticidade e imutabilidade deste documento, acesse:</div>
        <div style="margin: 10px 0;">
          <a href="https://app.fluxoo.edu/v/${payload.emissao.validation_hash}" style="color: #2563eb; text-decoration: none;">
            https://app.fluxoo.edu/v/<span class="hash-code">${payload.emissao.validation_hash.substring(0, 12)}...</span>
          </a>
        </div>
        <div>
          <!-- Placeholder QR Code -->
          <div style="width: 100px; height: 100px; border: 1px solid #ccc; margin: 10px auto; display: flex; align-items: center; justify-content: center; background: #fff;">
            <span style="font-size: 10px; color: #999;">[ QR CODE ]</span>
          </div>
        </div>
        <div style="margin-top: 15px;">Emitido em: ${new Date(payload.emissao.emitido_em).toLocaleString('pt-BR')}</div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// Serviço de Renderização via Puppeteer
// ============================================================================
export async function renderExitTranscriptPdf(payload: ExitTranscriptPayload): Promise<Buffer> {
  const htmlContent = getExitTranscriptHtmlTemplate(payload);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Crítico para ambientes serverless/docker
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Gerar Buffer do PDF formato A4
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });
    
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}
