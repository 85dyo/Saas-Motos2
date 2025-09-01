import { ConfiguracaoAutomacao, OrdemServico, Cliente, AlertaManutencao } from '../types';

export class N8nService {
  private static baseUrl = 'https://n8n.exemplo.com';
  private static webhookToken = 'motogestor_webhook_token';

  // Configurar URL base do N8N
  static configurarUrl(url: string, token?: string): void {
    this.baseUrl = url;
    if (token) this.webhookToken = token;
    localStorage.setItem('n8n_config', JSON.stringify({ baseUrl: url, token }));
  }

  // Enviar evento para N8N
  static async enviarEvento(evento: string, dados: any): Promise<boolean> {
    try {
      // Se for URL de exemplo/demo, simular sucesso
      if (this.baseUrl.includes('exemplo.com') || this.baseUrl.includes('localhost')) {
        console.log('Demo mode: Simulando envio de evento N8N:', { evento, dados });
        return true;
      }

      const payload = {
        evento,
        timestamp: new Date().toISOString(),
        source: 'motogestor',
        data: dados,
        metadata: {
          version: '1.0.0',
          environment: 'production'
        }
      };

      const response = await fetch(`${this.baseUrl}/webhook/motogestor-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookToken}`
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar evento para N8N:', error);
      return false;
    }
  }

  // Workflows específicos
  static async criarWorkflowOS(os: OrdemServico): Promise<void> {
    await this.enviarEvento('os_criada', {
      os: {
        id: os.id,
        numeroOS: os.numeroOS,
        cliente: {
          nome: os.cliente.nome,
          telefone: os.cliente.telefone,
          email: os.cliente.email
        },
        moto: {
          modelo: os.moto.modelo,
          placa: os.moto.placa
        },
        valor: os.valor,
        descricao: os.descricao,
        status: os.status
      }
    });
  }

  static async concluirWorkflowOS(os: OrdemServico): Promise<void> {
    await this.enviarEvento('os_concluida', {
      os: {
        id: os.id,
        numeroOS: os.numeroOS,
        cliente: {
          nome: os.cliente.nome,
          telefone: os.cliente.telefone,
          email: os.cliente.email
        },
        valor: os.valor,
        dataConclusao: os.dataConclusao
      }
    });
  }

  static async alertaManutencao(alerta: AlertaManutencao, cliente: Cliente): Promise<void> {
    await this.enviarEvento('alerta_manutencao', {
      alerta: {
        tipo: alerta.tipo,
        prioridade: alerta.prioridade,
        titulo: alerta.titulo,
        descricao: alerta.descricao,
        dataVencimento: alerta.dataVencimento
      },
      cliente: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email
      }
    });
  }

  // Sincronizar configurações com N8N
  static async sincronizarConfiguracoes(): Promise<boolean> {
    try {
      const configuracoes = {
        oficina: JSON.parse(localStorage.getItem('motogestor_config') || '{}'),
        automacoes: JSON.parse(localStorage.getItem('motogestor_automacoes') || '[]'),
        templates: JSON.parse(localStorage.getItem('motogestor_templates') || '[]')
      };

      return await this.enviarEvento('sync_configuracoes', configuracoes);
    } catch (error) {
      console.error('Erro ao sincronizar configurações:', error);
      return false;
    }
  }

  // Executar workflow personalizado
  static async executarWorkflow(workflowId: string, dados: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookToken}`
        },
        body: JSON.stringify(dados)
      });

      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('Erro ao executar workflow');
    } catch (error) {
      console.error('Erro ao executar workflow N8N:', error);
      return null;
    }
  }

  // Gerar relatório via N8N
  static async gerarRelatorio(tipo: string, parametros: any): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/gerar-relatorio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookToken}`
        },
        body: JSON.stringify({
          tipo,
          parametros,
          formato: 'pdf'
        })
      });

      if (response.ok) {
        return await response.blob();
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao gerar relatório via N8N:', error);
      return null;
    }
  }

  // Integração com IA para templates
  static async gerarTemplateIA(contexto: string, variaveis: string[]): Promise<string | null> {
    try {
      const response = await this.executarWorkflow('gerar-template-ia', {
        contexto,
        variaveis,
        idioma: 'pt-BR',
        tom: 'profissional'
      });

      return response?.template || null;
    } catch (error) {
      console.error('Erro ao gerar template com IA:', error);
      return null;
    }
  }
}