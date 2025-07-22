import { ConfiguracaoAutomacao, OrdemServico, Cliente } from '../types';
import { WhatsAppService } from './whatsappService';

export class AutomacaoService {
  private static configuracoes: ConfiguracaoAutomacao[] = [
    {
      id: '1',
      nome: 'Notificação WhatsApp - OS Criada',
      tipo: 'whatsapp',
      ativo: true,
      trigger: {
        evento: 'os_criada'
      },
      acao: {
        template: 'os_criada_whatsapp',
        destinatario: 'cliente',
        parametros: {}
      },
      configuracao: {
        whatsappToken: 'demo_token'
      }
    },
    {
      id: '2',
      nome: 'Webhook n8n - OS Concluída',
      tipo: 'webhook',
      ativo: true,
      trigger: {
        evento: 'os_concluida'
      },
      acao: {
        template: 'webhook_os_concluida',
        destinatario: 'n8n',
        parametros: {}
      },
      configuracao: {
        n8nWebhookUrl: 'https://n8n.exemplo.com/webhook/os-concluida'
      }
    }
  ];

  static async executarAutomacao(evento: string, dados: any): Promise<void> {
    const automacoesAtivas = this.configuracoes.filter(
      config => config.ativo && config.trigger.evento === evento
    );

    for (const automacao of automacoesAtivas) {
      try {
        await this.executarAcao(automacao, dados);
      } catch (error) {
        console.error(`Erro na automação ${automacao.nome}:`, error);
      }
    }
  }

  private static async executarAcao(automacao: ConfiguracaoAutomacao, dados: any): Promise<void> {
    switch (automacao.tipo) {
      case 'whatsapp':
        await this.enviarWhatsApp(automacao, dados);
        break;
      case 'webhook':
        await this.chamarWebhook(automacao, dados);
        break;
      case 'email':
        await this.enviarEmail(automacao, dados);
        break;
    }
  }

  private static async enviarWhatsApp(automacao: ConfiguracaoAutomacao, dados: any): Promise<void> {
    if (dados.os && dados.cliente) {
      const os: OrdemServico = dados.os;
      const cliente: Cliente = dados.cliente;
      
      switch (automacao.trigger.evento) {
        case 'os_criada':
          await WhatsAppService.enviarNotificacaoOS(cliente.id, os.id, 'criada');
          break;
        case 'os_concluida':
          await WhatsAppService.enviarNotificacaoOS(cliente.id, os.id, 'concluida');
          break;
      }
    }
  }

  private static async chamarWebhook(automacao: ConfiguracaoAutomacao, dados: any): Promise<void> {
    if (!automacao.configuracao.n8nWebhookUrl) return;

    const payload = {
      evento: automacao.trigger.evento,
      timestamp: new Date().toISOString(),
      dados: dados,
      automacao: {
        id: automacao.id,
        nome: automacao.nome
      }
    };

    // Simulação da chamada webhook
    console.log(`Chamando webhook n8n: ${automacao.configuracao.n8nWebhookUrl}`, payload);
    
    // Em produção, seria algo como:
    // await fetch(automacao.configuracao.n8nWebhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
  }

  private static async enviarEmail(automacao: ConfiguracaoAutomacao, dados: any): Promise<void> {
    // Implementação de envio de email
    console.log(`Enviando email via automação: ${automacao.nome}`, dados);
  }

  // Configuração de automações
  static async getConfiguracoes(): Promise<ConfiguracaoAutomacao[]> {
    return this.configuracoes;
  }

  static async atualizarConfiguracao(id: string, updates: Partial<ConfiguracaoAutomacao>): Promise<void> {
    const index = this.configuracoes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.configuracoes[index] = { ...this.configuracoes[index], ...updates };
    }
  }

  static async criarConfiguracao(config: Omit<ConfiguracaoAutomacao, 'id'>): Promise<ConfiguracaoAutomacao> {
    const novaConfig: ConfiguracaoAutomacao = {
      ...config,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.configuracoes.push(novaConfig);
    return novaConfig;
  }

  // Integração com n8n
  static async sincronizarComN8n(): Promise<void> {
    // Enviar configurações atuais para n8n
    const payload = {
      oficina: 'MotoGestor Demo',
      configuracoes: this.configuracoes,
      timestamp: new Date().toISOString()
    };

    console.log('Sincronizando com n8n:', payload);
    
    // Em produção:
    // await fetch('https://n8n.exemplo.com/webhook/sync-motogestor', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
  }

  // Análise de performance das automações
  static async getAnalyticsAutomacao(): Promise<{
    totalExecucoes: number;
    sucessos: number;
    falhas: number;
    porTipo: { [key: string]: number };
    ultimasExecucoes: any[];
  }> {
    // Dados simulados - em produção viria do banco
    return {
      totalExecucoes: 156,
      sucessos: 148,
      falhas: 8,
      porTipo: {
        'whatsapp': 89,
        'webhook': 45,
        'email': 22
      },
      ultimasExecucoes: [
        { evento: 'os_concluida', timestamp: new Date(), status: 'sucesso' },
        { evento: 'os_criada', timestamp: new Date(), status: 'sucesso' },
        { evento: 'alerta_manutencao', timestamp: new Date(), status: 'falha' }
      ]
    };
  }
}