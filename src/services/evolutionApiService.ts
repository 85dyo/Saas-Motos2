import { EvolutionAPIConfig, WhatsAppMessage, Cliente } from '../types';

export class EvolutionApiService {
  private static config: EvolutionAPIConfig = {
    instanceName: 'motogestor-instance',
    apiKey: '',
    baseUrl: 'https://evolution-api.exemplo.com',
    webhookUrl: 'https://motogestor.exemplo.com/webhook/whatsapp',
    status: 'disconnected'
  };

  // Carregar configuração do localStorage
  static loadConfig(): void {
    const stored = localStorage.getItem('motogestor_config');
    if (stored) {
      const motogestorConfig = JSON.parse(stored);
      if (motogestorConfig.integracao) {
        this.config = {
          ...this.config,
          baseUrl: motogestorConfig.integracao.evolutionApiUrl || this.config.baseUrl,
          apiKey: motogestorConfig.integracao.evolutionApiKey || this.config.apiKey,
          instanceName: motogestorConfig.integracao.evolutionInstanceName || this.config.instanceName
        };
      }
    }
  }

  // Configuração da instância
  static async configurarInstancia(config: Partial<EvolutionAPIConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    localStorage.setItem('evolution_api_config', JSON.stringify(this.config));
  }

  static getConfig(): EvolutionAPIConfig {
    this.loadConfig();
    const stored = localStorage.getItem('evolution_api_config');
    return stored ? JSON.parse(stored) : this.config;
  }

  // Criar instância no Evolution API
  static async criarInstancia(): Promise<boolean> {
    this.loadConfig();
    try {
      const response = await fetch(`${this.config.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          instanceName: this.config.instanceName,
          webhook: this.config.webhookUrl,
          webhook_by_events: true,
          events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE'
          ]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.config.status = 'connected';
        await this.configurarInstancia(this.config);
        return true;
      }
      
      throw new Error(data.message || 'Erro ao criar instância');
    } catch (error) {
      console.error('Erro ao criar instância Evolution API:', error);
      this.config.status = 'error';
      return false;
    }
  }

  // Conectar WhatsApp (gerar QR Code)
  static async conectarWhatsApp(): Promise<{ qrcode?: string; status: string }> {
    this.loadConfig();
    try {
      const response = await fetch(`${this.config.baseUrl}/instance/connect/${this.config.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      return { status: 'error' };
    }
  }

  // Enviar mensagem de texto
  static async enviarMensagem(numero: string, mensagem: string): Promise<boolean> {
    this.loadConfig();
    
    if (!this.config.apiKey || !this.config.baseUrl) {
      console.error('Evolution API não configurada');
      return false;
    }
    
    try {
      const response = await fetch(`${this.config.baseUrl}/message/sendText/${this.config.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey
        },
        body: JSON.stringify({
          number: numero,
          text: mensagem
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  // Enviar documento/PDF
  static async enviarDocumento(numero: string, arquivo: File, caption?: string): Promise<boolean> {
    this.loadConfig();
    
    if (!this.config.apiKey || !this.config.baseUrl) {
      console.error('Evolution API não configurada');
      return false;
    }
    
    try {
      const formData = new FormData();
      formData.append('number', numero);
      formData.append('media', arquivo);
      if (caption) formData.append('caption', caption);

      const response = await fetch(`${this.config.baseUrl}/message/sendMedia/${this.config.instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': this.config.apiKey
        },
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      return false;
    }
  }

  // Processar webhook recebido
  static async processarWebhook(payload: any): Promise<void> {
    try {
      if (payload.event === 'messages.upsert') {
        const message = payload.data;
        
        if (message.key.fromMe) return; // Ignorar mensagens enviadas por nós
        
        const numero = message.key.remoteJid.replace('@s.whatsapp.net', '');
        const texto = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || '';
        
        if (texto) {
          // Processar mensagem recebida
          await this.processarMensagemRecebida(numero, texto);
        }
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
    }
  }

  // Processar mensagem recebida do cliente
  private static async processarMensagemRecebida(numero: string, mensagem: string): Promise<void> {
    // Importar serviços necessários
    const { WhatsAppService } = await import('./whatsappService');
    
    // Processar mensagem usando o serviço existente
    const resposta = await WhatsAppService.processarMensagem(numero, mensagem);
    
    if (resposta) {
      await this.enviarMensagem(numero, resposta);
    }
  }

  // Verificar status da instância
  static async verificarStatus(): Promise<string> {
    this.loadConfig();
    try {
      const response = await fetch(`${this.config.baseUrl}/instance/connectionState/${this.config.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.config.status = data.instance?.state === 'open' ? 'connected' : 'disconnected';
        return this.config.status;
      }
      
      this.config.status = 'error';
      return 'error';
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      this.config.status = 'error';
      return 'error';
    }
  }

  // Listar contatos
  static async listarContatos(): Promise<any[]> {
    this.loadConfig();
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/findContacts/${this.config.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data || [];
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao listar contatos:', error);
      return [];
    }
  }

  // Enviar histórico médico por WhatsApp
  static async enviarHistoricoManutencao(cliente: Cliente, motoId: string, pdfBlob: Blob): Promise<boolean> {
    this.loadConfig();
    
    if (!this.config.apiKey || !this.config.baseUrl) {
      throw new Error('Evolution API não configurada. Configure nas Automações.');
    }
    
    try {
      const numero = cliente.telefone.replace(/\D/g, '');
      const moto = cliente.motos.find(m => m.id === motoId);
      
      if (!moto) return false;

      // Converter blob para file
      const file = new File([pdfBlob], `historico-${moto.placa}.pdf`, { type: 'application/pdf' });
      
      // Obter informações da oficina para personalizar a mensagem
      const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
      const oficinaNome = config.oficina?.nome || 'MotoGestor';
      const oficinaTelefone = config.oficina?.telefone || '(11) 99999-9999';
      
      const caption = `🏍️ *Histórico de Manutenção - ${moto.modelo}*\n\n` +
                     `Olá ${cliente.nome}!\n\n` +
                     `Segue o histórico completo da sua ${moto.modelo} (${moto.placa}).\n\n` +
                     `📋 Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
                     `Para dúvidas, entre em contato conosco!\n` +
                     `📞 ${oficinaTelefone}\n\n` +
                     `Atenciosamente,\n${oficinaNome}`;

      return await this.enviarDocumento(numero, file, caption);
    } catch (error) {
      console.error('Erro ao enviar histórico de manutenção:', error);
      return false;
    }
  }
}