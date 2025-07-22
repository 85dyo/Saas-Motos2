import { WhatsAppMessage, Cliente, Moto } from '../types';
import { HistoricoService } from './historicoService';
import { DataService } from './dataService';

export class WhatsAppService {
  private static messages: WhatsAppMessage[] = [];
  
  // Simulação de webhook do WhatsApp
  static async processarMensagem(from: string, message: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mensagem = message.toLowerCase().trim();
    
    // Identificar cliente pelo telefone
    const clientes = await DataService.getAllClientes();
    const cliente = clientes.find(c => 
      c.telefone.replace(/\D/g, '') === from.replace(/\D/g, '')
    );
    
    if (!cliente) {
      return `Olá! Não encontrei seu cadastro em nosso sistema. Entre em contato conosco pelo telefone (11) 99999-9999 para se cadastrar.`;
    }
    
    // Processar comandos
    if (mensagem.includes('historico') || mensagem.includes('histórico')) {
      return await this.enviarHistoricoMoto(cliente);
    }
    
    if (mensagem.includes('agendamento') || mensagem.includes('agendar')) {
      return await this.processarAgendamento(cliente, mensagem);
    }
    
    if (mensagem.includes('status') || mensagem.includes('os')) {
      return await this.consultarStatusOS(cliente);
    }
    
    if (mensagem.includes('ajuda') || mensagem.includes('help') || mensagem === 'oi' || mensagem === 'olá') {
      return this.enviarMenuPrincipal(cliente.nome);
    }
    
    // Resposta padrão
    return this.enviarMenuPrincipal(cliente.nome);
  }
  
  private static enviarMenuPrincipal(nomeCliente: string): string {
    return `Olá ${nomeCliente}! 👋

Como posso ajudá-lo hoje?

📋 *Histórico* - Ver histórico completo das suas motos
📅 *Agendamento* - Agendar um serviço
📊 *Status* - Consultar status das suas OS
❓ *Ajuda* - Ver este menu novamente

Digite uma das opções acima ou descreva o que precisa.`;
  }
  
  private static async enviarHistoricoMoto(cliente: Cliente): Promise<string> {
    if (cliente.motos.length === 0) {
      return `Você não possui motos cadastradas em nosso sistema.`;
    }
    
    if (cliente.motos.length === 1) {
      const moto = cliente.motos[0];
      const relatorio = await HistoricoService.gerarRelatorioMedico(moto.id);
      
      return this.formatarHistoricoCompleto(moto, relatorio);
    }
    
    // Múltiplas motos - listar para escolha
    let resposta = `Você possui ${cliente.motos.length} motos cadastradas:\n\n`;
    
    cliente.motos.forEach((moto, index) => {
      resposta += `${index + 1}. ${moto.modelo} - ${moto.placa}\n`;
    });
    
    resposta += `\nResponda com o número da moto para ver o histórico completo.`;
    
    return resposta;
  }
  
  private static formatarHistoricoCompleto(moto: Moto, relatorio: any): string {
    let resposta = `🏍️ *${moto.modelo} - ${moto.placa}*\n\n`;
    
    resposta += `📋 *Resumo Médico:*\n${relatorio.resumo}\n\n`;
    
    if (relatorio.historico.length > 0) {
      resposta += `🔧 *Últimos Serviços:*\n`;
      relatorio.historico.slice(0, 5).forEach(servico => {
        const data = new Date(servico.data).toLocaleDateString('pt-BR');
        resposta += `• ${data} - ${servico.descricao} (R$ ${servico.valor.toFixed(2)})\n`;
      });
      resposta += `\n`;
    }
    
    if (relatorio.proximasManutencoes.length > 0) {
      resposta += `⚠️ *Próximas Manutenções:*\n`;
      relatorio.proximasManutencoes.forEach(manutencao => {
        const data = new Date(manutencao.data).toLocaleDateString('pt-BR');
        const emoji = manutencao.prioridade === 'critica' ? '🔴' : 
                     manutencao.prioridade === 'alta' ? '🟡' : '🟢';
        resposta += `${emoji} ${manutencao.tipo} - ${data}\n`;
      });
      resposta += `\n`;
    }
    
    if (relatorio.analise.recomendacoes.length > 0) {
      resposta += `💡 *Recomendações:*\n`;
      relatorio.analise.recomendacoes.forEach(rec => {
        resposta += `• ${rec}\n`;
      });
      resposta += `\n`;
    }
    
    resposta += `📞 Para agendar um serviço, digite "agendamento" ou ligue (11) 99999-9999`;
    
    return resposta;
  }
  
  private static async processarAgendamento(cliente: Cliente, mensagem: string): Promise<string> {
    // Lógica simples de agendamento
    return `📅 *Agendamento de Serviço*

Para agendar um serviço, preciso de algumas informações:

🏍️ Qual moto? (se tiver mais de uma)
🔧 Que tipo de serviço?
📅 Qual sua preferência de data?

Você pode nos ligar diretamente no (11) 99999-9999 ou responder aqui mesmo!

*Horários disponíveis:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h`;
  }
  
  private static async consultarStatusOS(cliente: Cliente): Promise<string> {
    const todasOS = await DataService.getAllOS();
    const osCliente = todasOS.filter(os => os.clienteId === cliente.id);
    
    if (osCliente.length === 0) {
      return `Você não possui ordens de serviço em nosso sistema.`;
    }
    
    const osAbertas = osCliente.filter(os => 
      os.status === 'aguardando_aprovacao' || os.status === 'em_andamento'
    );
    
    if (osAbertas.length === 0) {
      return `Você não possui ordens de serviço em andamento no momento.`;
    }
    
    let resposta = `📊 *Status das suas OS:*\n\n`;
    
    osAbertas.forEach(os => {
      const statusEmoji = os.status === 'aguardando_aprovacao' ? '⏳' : '🔧';
      const statusTexto = os.status === 'aguardando_aprovacao' ? 'Aguardando Aprovação' : 'Em Andamento';
      
      resposta += `${statusEmoji} *${os.numeroOS}*\n`;
      resposta += `Moto: ${os.moto.modelo} - ${os.moto.placa}\n`;
      resposta += `Serviço: ${os.descricao}\n`;
      resposta += `Status: ${statusTexto}\n`;
      resposta += `Valor: R$ ${os.valor.toFixed(2)}\n\n`;
    });
    
    resposta += `Para mais detalhes, entre em contato conosco!`;
    
    return resposta;
  }
  
  // Envio de notificações automáticas
  static async enviarNotificacaoOS(clienteId: string, osId: string, tipo: 'criada' | 'aprovada' | 'concluida'): Promise<void> {
    const cliente = await DataService.getClienteById(clienteId);
    const os = await DataService.getOSById(osId);
    
    if (!cliente || !os) return;
    
    let mensagem = '';
    
    switch (tipo) {
      case 'criada':
        mensagem = `🔧 *Nova OS Criada*\n\nOlá ${cliente.nome}!\n\nCriamos uma nova ordem de serviço para sua ${os.moto.modelo}:\n\n*${os.numeroOS}*\nServiço: ${os.descricao}\nValor: R$ ${os.valor.toFixed(2)}\n\nAguardando sua aprovação. Entre em contato para confirmar!`;
        break;
      case 'aprovada':
        mensagem = `✅ *OS Aprovada*\n\nSua ordem de serviço ${os.numeroOS} foi aprovada e já está em andamento!\n\nVamos cuidar da sua ${os.moto.modelo} com todo carinho. Em breve entraremos em contato com atualizações.`;
        break;
      case 'concluida':
        mensagem = `🎉 *Serviço Concluído*\n\nSua ${os.moto.modelo} está pronta!\n\n*${os.numeroOS}* - ${os.descricao}\nValor: R$ ${os.valor.toFixed(2)}\n\nVenha buscar quando puder. Horário: Segunda a Sexta 8h-18h, Sábado 8h-12h.`;
        break;
    }
    
    // Aqui seria feita a integração real com WhatsApp API
    console.log(`Enviando WhatsApp para ${cliente.telefone}: ${mensagem}`);
  }
  
  // Alertas automáticos de manutenção
  static async enviarAlertaManutencao(clienteId: string, motoId: string, alerta: any): Promise<void> {
    const cliente = await DataService.getClienteById(clienteId);
    const moto = cliente?.motos.find(m => m.id === motoId);
    
    if (!cliente || !moto) return;
    
    const prioridadeEmoji = alerta.prioridade === 'critica' ? '🔴' : 
                           alerta.prioridade === 'alta' ? '🟡' : '🟢';
    
    const mensagem = `${prioridadeEmoji} *Alerta de Manutenção*\n\nOlá ${cliente.nome}!\n\nSua ${moto.modelo} (${moto.placa}) precisa de atenção:\n\n*${alerta.titulo}*\n${alerta.descricao}\n\nRecomendamos agendar um serviço. Entre em contato conosco!`;
    
    console.log(`Enviando alerta WhatsApp para ${cliente.telefone}: ${mensagem}`);
  }
}