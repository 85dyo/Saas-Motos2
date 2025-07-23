import { Cliente, Moto, HistoricoServico, AlertaManutencao } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OficinaInfo {
  nome: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logo?: string;
}

export class PDFService {
  // Gerar PDF do histórico médico
  static async gerarHistoricoManutencao(
    cliente: Cliente, 
    moto: Moto, 
    historico: HistoricoServico[], 
    alertas: AlertaManutencao[],
    oficinaInfo?: OficinaInfo,
    documentTitle: string = 'Histórico de Manutenção da Motocicleta'
  ): Promise<Blob> {
    const htmlContent = this.gerarHTMLManutencao(cliente, moto, historico, alertas, oficinaInfo, documentTitle);
    
    // Criar elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    document.body.appendChild(tempDiv);
    
    try {
      // Converter HTML para canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } finally {
      // Remover elemento temporário
      document.body.removeChild(tempDiv);
    }
  }

  private static gerarHTMLManutencao(
    cliente: Cliente, 
    moto: Moto, 
    historico: HistoricoServico[], 
    alertas: AlertaManutencao[],
    oficinaInfo?: OficinaInfo,
    documentTitle: string = 'Histórico de Manutenção da Motocicleta'
  ): string {
    const totalInvestido = historico.reduce((sum, h) => sum + h.valor, 0);
    const ultimoServico = historico[0];
    const servicosPreventivos = historico.filter(h => h.tipoServico === 'preventiva').length;
    const servicosCorretivos = historico.filter(h => h.tipoServico === 'corretiva').length;
    
    // Usar informações da oficina ou valores padrão
    const oficina = oficinaInfo || {
      nome: 'MotoGestor',
      endereco: 'Sistema de Gestão para Oficinas',
      telefone: '(11) 99999-9999',
      email: 'contato@motogestor.com'
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle} - ${moto.modelo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #fff;
            padding: 20px;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #3B82F6; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .logo { 
            max-width: 150px; 
            max-height: 80px; 
            margin-bottom: 15px; 
          }
          .oficina-info { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            text-align: center; 
            font-size: 14px; 
            color: #64748b; 
          }
          .document-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin: 15px 0;
          }
          .moto-info {
            font-size: 18px;
            color: #475569;
            margin-bottom: 10px;
          }
          .cliente-info {
            font-size: 16px;
            color: #64748b;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin: 30px 0; 
          }
          .stat-card { 
            text-align: center; 
            padding: 20px; 
            background: #f1f5f9; 
            border-radius: 12px; 
            border: 1px solid #e2e8f0;
          }
          .stat-number { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .stat-label { 
            font-size: 12px; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
          }
          .section { 
            margin: 30px 0; 
            padding: 20px; 
            background: #fff; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e293b; 
            margin-bottom: 15px; 
            display: flex; 
            align-items: center; 
          }
          .section-icon { 
            margin-right: 10px; 
            font-size: 20px; 
          }
          .timeline { 
            position: relative; 
          }
          .service-item { 
            border-left: 4px solid #3B82F6; 
            padding-left: 20px; 
            margin-bottom: 25px; 
            position: relative;
            background: #f8fafc;
            padding: 15px 15px 15px 25px;
            border-radius: 0 8px 8px 0;
          }
          .service-item::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 15px;
            width: 12px;
            height: 12px;
            background: #3B82F6;
            border-radius: 50%;
          }
          .service-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .service-title {
            font-weight: bold;
            color: #1e293b;
            font-size: 16px;
          }
          .service-meta {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .service-value {
            font-weight: bold;
            color: #059669;
            font-size: 16px;
          }
          .service-type {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .type-preventiva { background: #dcfce7; color: #166534; }
          .type-corretiva { background: #fef3c7; color: #92400e; }
          .type-revisao { background: #dbeafe; color: #1e40af; }
          .type-emergencia { background: #fee2e2; color: #991b1b; }
          .pecas-list { 
            margin: 10px 0; 
            padding: 10px; 
            background: #f1f5f9; 
            border-radius: 6px; 
          }
          .peca-item { 
            display: inline-block; 
            background: #e2e8f0; 
            padding: 4px 8px; 
            margin: 2px; 
            border-radius: 4px; 
            font-size: 12px; 
          }
          .alert-item { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0; 
          }
          .alert-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 5px;
          }
          .alert-description {
            color: #a16207;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .alert-date {
            font-size: 12px;
            color: #a16207;
          }
          .no-data {
            text-align: center;
            color: #6b7280;
            padding: 40px;
            font-style: italic;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .next-revision {
            background: #dbeafe;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            border-left: 4px solid #3b82f6;
          }
          .next-revision-text {
            color: #1e40af;
            font-size: 14px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${oficina.logo ? `<img src="${oficina.logo}" alt="Logo" class="logo">` : ''}
          <h1>${oficina.nome}</h1>
          <div class="oficina-info">
            ${oficina.endereco ? `<div>${oficina.endereco}</div>` : ''}
            <div>
              ${oficina.telefone ? `Tel: ${oficina.telefone}` : ''}
              ${oficina.telefone && oficina.email ? ' | ' : ''}
              ${oficina.email ? `Email: ${oficina.email}` : ''}
            </div>
          </div>
          
          <div class="document-title">${documentTitle}</div>
          <div class="moto-info">${moto.modelo} - ${moto.placa}</div>
          <div class="cliente-info">
            Proprietário: ${cliente.nome} | Tel: ${cliente.telefone}
            ${cliente.email ? ` | Email: ${cliente.email}` : ''}
          </div>
          <div style="margin-top: 10px; font-size: 14px; color: #64748b;">
            Gerado em: ${formatDate(new Date())}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${historico.length}</div>
            <div class="stat-label">Total de Serviços</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${formatCurrency(totalInvestido)}</div>
            <div class="stat-label">Investimento Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${servicosPreventivos}</div>
            <div class="stat-label">Preventivos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${servicosCorretivos}</div>
            <div class="stat-label">Corretivos</div>
          </div>
        </div>

        ${alertas.length > 0 ? `
          <div class="section">
            <div class="section-title">
              <span class="section-icon">⚠️</span>
              Alertas Ativos (${alertas.length})
            </div>
            ${alertas.map(alerta => `
              <div class="alert-item">
                <div class="alert-title">${alerta.titulo}</div>
                <div class="alert-description">${alerta.descricao}</div>
                <div class="alert-date">Vencimento: ${formatDate(alerta.dataVencimento)}</div>
                ${alerta.quilometragemVencimento ? `<br><small><strong>Quilometragem:</strong> ${alerta.quilometragemVencimento.toLocaleString()}km</small>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">
            <span class="section-icon">📋</span>
            Histórico de Manutenção e Serviços
          </div>
          <div class="timeline">
          ${historico.length > 0 ? historico.map((servico, index) => `
            <div class="service-item">
              <div class="service-header">
                <div>
                  <div class="service-title">#${historico.length - index} - ${servico.descricao}</div>
                  <div class="service-meta">
                    ${formatDate(servico.data)} • ${servico.quilometragem.toLocaleString()}km • Mecânico: ${servico.mecanico}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div class="service-value">${formatCurrency(servico.valor)}</div>
                  <div class="service-type type-${servico.tipoServico}">${servico.tipoServico}</div>
                </div>
              </div>
              
              ${servico.pecasTrocadas.length > 0 ? `
                <div class="pecas-list">
                  <strong style="font-size: 14px; color: #374151;">Peças Trocadas:</strong><br>
                  ${servico.pecasTrocadas.map(peca => `
                    <span class="peca-item">
                      ${peca.nome} - ${formatCurrency(peca.valor)}
                      ${peca.garantia ? ` (Garantia: ${peca.garantia.meses}m)` : ''}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
              
              ${servico.observacoes ? `<p><strong>Observações:</strong> ${servico.observacoes}</p>` : ''}
              
              ${servico.proximaRevisao ? `
                <div class="next-revision">
                  <div class="next-revision-text">
                    🔧 Próxima Revisão: ${formatDate(servico.proximaRevisao.data)} 
                  ou ${servico.proximaRevisao.quilometragem.toLocaleString()}km
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('') : '<div class="no-data">Nenhum serviço registrado para esta motocicleta.</div>'}
          </div>
        </div>

        <div class="footer">
          <p><strong>Documento gerado automaticamente pelo ${oficina.nome}</strong></p>
          <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
          <p>Para dúvidas ou agendamentos, entre em contato conosco</p>
          ${oficina.telefone ? `<p>📞 ${oficina.telefone}` : ''}
          ${oficina.email ? ` | 📧 ${oficina.email}</p>` : '</p>'}
        </div>
      </body>
      </html>
    `;
  }

  // Enviar PDF por email
  static async enviarPorEmail(
    cliente: Cliente, 
    moto: Moto, 
    pdfBlob: Blob,
    oficinaInfo?: OficinaInfo
  ): Promise<boolean> {
    try {
      const oficina = oficinaInfo || { nome: 'MotoGestor' };
      
      // Simulação de envio por email - integraria com serviço real
      const formData = new FormData();
      formData.append('to', cliente.email || '');
      formData.append('subject', `Histórico de Manutenção - ${moto.modelo} (${moto.placa})`);
      formData.append('body', `
        Olá ${cliente.nome},

        Segue em anexo o histórico de manutenção completo da sua ${moto.modelo} (${moto.placa}).

        Este documento contém todos os serviços realizados, peças trocadas e recomendações para manutenções futuras.

        Qualquer dúvida, estamos à disposição!

        Atenciosamente,
        Equipe ${oficina.nome}
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