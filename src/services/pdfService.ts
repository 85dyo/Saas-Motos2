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
  static async gerarHistoricoMedico(
    cliente: Cliente, 
    moto: Moto, 
    historico: HistoricoServico[], 
    alertas: AlertaManutencao[],
    oficinaInfo?: OficinaInfo
  ): Promise<Blob> {
    const htmlContent = this.gerarHTMLHistorico(cliente, moto, historico, alertas, oficinaInfo);
    
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

  private static gerarHTMLHistorico(
    cliente: Cliente, 
    moto: Moto, 
    historico: HistoricoServico[], 
    alertas: AlertaManutencao[],
    oficinaInfo?: OficinaInfo
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
          .logo {
            max-width: 150px;
            max-height: 80px;
            margin-bottom: 15px;
          }
          .oficina-info {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
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
            margin-bottom: 20px;
            text-align: center;
            font-size: 14px;
          <p><strong>Telefone:</strong> ${cliente.telefone}</p>
          ${cliente.email ? `<p><strong>Email:</strong> ${cliente.email}</p>` : ''}
            color: #64748b;
          }

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

        <div class="summary">
          <h3>Resumo Geral</h3>
          <div class="info-grid">
            <div>
              <strong>Total de Serviços:</strong> ${historico.length}<br>
              <strong>Investimento Total:</strong> ${formatCurrency(totalInvestido)}<br>
              <strong>Último Serviço:</strong> ${ultimoServico ? formatDate(ultimoServico.data) : 'Nenhum'}
              ${ultimoServico ? `<br><strong>Quilometragem Atual:</strong> ${ultimoServico.quilometragem.toLocaleString()}km` : ''}
            </div>
            <div>
              <strong>Serviços Preventivos:</strong> ${servicosPreventivos}<br>
              <strong>Serviços Corretivos:</strong> ${servicosCorretivos}<br>
              <strong>Alertas Ativos:</strong> ${alertas.length}
              ${ultimoServico ? `<br><strong>Dias desde último serviço:</strong> ${Math.floor((new Date().getTime() - new Date(ultimoServico.data).getTime()) / (1000 * 60 * 60 * 24))}` : ''}
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
                <small><strong>Vencimento:</strong> ${formatDate(alerta.dataVencimento)}</small>
                ${alerta.quilometragemVencimento ? `<br><small><strong>Quilometragem:</strong> ${alerta.quilometragemVencimento.toLocaleString()}km</small>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="timeline">
          <h3>📋 Histórico de Serviços</h3>
          ${historico.length > 0 ? historico.map((servico, index) => `
            <div class="service-item">
              <h4>#${historico.length - index} - ${servico.descricao}</h4>
              <p><strong>Data:</strong> ${formatDate(servico.data)} | 
                 <strong>Quilometragem:</strong> ${servico.quilometragem.toLocaleString()}km | 
                 <strong>Valor:</strong> ${formatCurrency(servico.valor)} |
                 <strong>Tipo:</strong> <span style="text-transform: capitalize;">${servico.tipoServico}</span></p>
              <p><strong>Tipo:</strong> ${servico.tipoServico} | 
                 <strong>Mecânico:</strong> ${servico.mecanico}</p>
              
              ${servico.pecasTrocadas.length > 0 ? `
                <div class="pecas-list">
                  <strong>Peças Trocadas:</strong><br>
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
                <div style="background: #dbeafe; padding: 10px; border-radius: 6px; margin-top: 10px;">
                  <strong>🔧 Próxima Revisão:</strong> ${formatDate(servico.proximaRevisao.data)} 
                  ou ${servico.proximaRevisao.quilometragem.toLocaleString()}km
                </div>
              ` : ''}
            </div>
          `).join('') : '<p style="text-align: center; color: #6b7280; padding: 40px;">Nenhum serviço registrado para esta motocicleta.</p>'}
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
      formData.append('subject', `Histórico Médico - ${moto.modelo} (${moto.placa})`);
      formData.append('body', `
        Olá ${cliente.nome},

        Segue em anexo o histórico médico completo da sua ${moto.modelo} (${moto.placa}).

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