import { Cliente, Moto, HistoricoServico, AlertaManutencao } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export class PDFService {
  // Gerar PDF do histórico médico
  static async gerarHistoricoMedico(
    cliente: Cliente, 
    moto: Moto, 
    historico: HistoricoServico[], 
    alertas: AlertaManutencao[]
  ): Promise<Blob> {
    // Simulação de geração de PDF - em produção usaria jsPDF ou similar
    const htmlContent = this.gerarHTMLHistorico(cliente, moto, historico, alertas);
    
    // Converter HTML para PDF (simulado)
    const pdfBlob = new Blob([htmlContent], { type: 'application/pdf' });
    
    return pdfBlob;
  }

  private static gerarHTMLHistorico(
    cliente: Cliente, 
    moto: Moto, 
    historico: HistoricoServico[], 
    alertas: AlertaManutencao[]
  ): string {
    const totalInvestido = historico.reduce((sum, h) => sum + h.valor, 0);
    const ultimoServico = historico[0];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Histórico Médico - ${moto.modelo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .timeline { margin-top: 30px; }
          .service-item { border-left: 3px solid #3B82F6; padding-left: 15px; margin-bottom: 20px; }
          .alert { background: #FEF3C7; border: 1px solid #F59E0B; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .summary { background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Histórico Médico da Motocicleta</h1>
          <h2>${moto.modelo} - ${moto.placa}</h2>
          <p>Proprietário: ${cliente.nome}</p>
          <p>Gerado em: ${formatDate(new Date())}</p>
        </div>

        <div class="summary">
          <h3>Resumo Geral</h3>
          <div class="info-grid">
            <div>
              <strong>Total de Serviços:</strong> ${historico.length}<br>
              <strong>Investimento Total:</strong> ${formatCurrency(totalInvestido)}<br>
              <strong>Último Serviço:</strong> ${ultimoServico ? formatDate(ultimoServico.data) : 'Nenhum'}
            </div>
            <div>
              <strong>Serviços Preventivos:</strong> ${historico.filter(h => h.tipoServico === 'preventiva').length}<br>
              <strong>Serviços Corretivos:</strong> ${historico.filter(h => h.tipoServico === 'corretiva').length}<br>
              <strong>Alertas Ativos:</strong> ${alertas.length}
            </div>
          </div>
        </div>

        ${alertas.length > 0 ? `
          <div class="card">
            <h3>⚠️ Alertas Ativos</h3>
            ${alertas.map(alerta => `
              <div class="alert">
                <strong>${alerta.titulo}</strong><br>
                ${alerta.descricao}<br>
                <small>Vencimento: ${formatDate(alerta.dataVencimento)}</small>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="timeline">
          <h3>📋 Histórico de Serviços</h3>
          ${historico.map(servico => `
            <div class="service-item">
              <h4>${servico.descricao}</h4>
              <p><strong>Data:</strong> ${formatDate(servico.data)} | 
                 <strong>Quilometragem:</strong> ${servico.quilometragem.toLocaleString()}km | 
                 <strong>Valor:</strong> ${formatCurrency(servico.valor)}</p>
              <p><strong>Tipo:</strong> ${servico.tipoServico} | 
                 <strong>Mecânico:</strong> ${servico.mecanico}</p>
              
              ${servico.pecasTrocadas.length > 0 ? `
                <p><strong>Peças Trocadas:</strong></p>
                <ul>
                  ${servico.pecasTrocadas.map(peca => `
                    <li>${peca.nome} - ${formatCurrency(peca.valor)}
                      ${peca.garantia ? ` (Garantia: ${peca.garantia.meses} meses)` : ''}
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
              
              ${servico.observacoes ? `<p><strong>Observações:</strong> ${servico.observacoes}</p>` : ''}
              
              ${servico.proximaRevisao ? `
                <p><strong>Próxima Revisão:</strong> ${formatDate(servico.proximaRevisao.data)} 
                   ou ${servico.proximaRevisao.quilometragem.toLocaleString()}km</p>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>Documento gerado automaticamente pelo MotoGestor</p>
          <p>Para dúvidas, entre em contato conosco</p>
        </div>
      </body>
      </html>
    `;
  }

  // Enviar PDF por email
  static async enviarPorEmail(
    cliente: Cliente, 
    moto: Moto, 
    pdfBlob: Blob
  ): Promise<boolean> {
    try {
      // Simulação de envio por email - integraria com serviço real
      const formData = new FormData();
      formData.append('to', cliente.email || '');
      formData.append('subject', `Histórico Médico - ${moto.modelo} (${moto.placa})`);
      formData.append('body', `
        Olá ${cliente.nome},

        Segue em anexo o histórico médico completo da sua ${moto.modelo}.

        Este documento contém todos os serviços realizados, peças trocadas e recomendações para manutenções futuras.

        Atenciosamente,
        Equipe MotoGestor
      `);
      formData.append('attachment', pdfBlob, `historico-${moto.placa}.pdf`);

      // Em produção, enviaria para API de email
      console.log('PDF enviado por email para:', cliente.email);
      return true;
    } catch (error) {
      console.error('Erro ao enviar PDF por email:', error);
      return false;
    }
  }

  // Download direto do PDF
  static downloadPDF(pdfBlob: Blob, filename: string): void {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}