import { Cliente, OrdemServico, Moto, DashboardMetrics } from '../types';

// Mock data generators
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateOSNumber = () => `OS${Date.now().toString().slice(-6)}`;

// Initial mock data
const initialClientes: Cliente[] = [
  {
    id: '1',
    nome: 'Carlos Pereira',
    email: 'carlos@email.com',
    telefone: '(11) 99111-2233',
    cpf: '123.456.789-00',
    endereco: 'Rua das Flores, 123',
    tipoCliente: 'vip',
    observacoes: 'Cliente muito pontual e sempre faz manutenção preventiva',
    motos: [
      { id: '1', placa: 'ABC-1234', fabricante: 'Honda', modelo: 'CB 600F Hornet', ano: 2019, cor: 'Azul' },
      { id: '2', placa: 'DEF-5678', fabricante: 'Yamaha', modelo: 'XJ6', ano: 2020, cor: 'Preta' }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    nome: 'Ana Costa',
    email: 'ana@email.com',
    telefone: '(11) 98222-3344',
    endereco: 'Av. Principal, 456',
    tipoCliente: 'ativo',
    motos: [
      { id: '3', placa: 'GHI-9012', fabricante: 'Kawasaki', modelo: 'Ninja 300', ano: 2021, cor: 'Verde' }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

const initialOS: OrdemServico[] = [
  {
    id: '1',
    numeroOS: 'OS001234',
    clienteId: '1',
    cliente: initialClientes[0],
    motoId: '1',
    moto: initialClientes[0].motos[0],
    descricao: 'Troca de óleo e filtros',
    valor: 150.00,
    status: 'em_andamento',
    criadoPor: '2',
    aprovadoPor: '1',
    observacoes: 'Cliente preferencial',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    dataAprovacao: new Date('2024-01-25')
  },
  {
    id: '2',
    numeroOS: 'OS001235',
    clienteId: '2',
    cliente: initialClientes[1],
    motoId: '3',
    moto: initialClientes[1].motos[0],
    descricao: 'Revisão geral e ajuste de freios',
    valor: 280.00,
    status: 'aguardando_aprovacao',
    criadoPor: '2',
    createdAt: new Date('2024-01-26'),
    updatedAt: new Date('2024-01-26')
  }
];

export class DataService {
  private static getClientes(): Cliente[] {
    const stored = localStorage.getItem('motogestor_clientes');
    return stored ? JSON.parse(stored) : initialClientes;
  }

  private static saveClientes(clientes: Cliente[]): void {
    localStorage.setItem('motogestor_clientes', JSON.stringify(clientes));
  }

  private static getOS(): OrdemServico[] {
    const stored = localStorage.getItem('motogestor_os');
    return stored ? JSON.parse(stored) : initialOS;
  }

  private static saveOS(ordens: OrdemServico[]): void {
    localStorage.setItem('motogestor_os', JSON.stringify(ordens));
  }

  // Cliente methods
  static async getAllClientes(): Promise<Cliente[]> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    return this.getClientes();
  }

  static async getClienteById(id: string): Promise<Cliente | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const clientes = this.getClientes();
    return clientes.find(c => c.id === id) || null;
  }

  static async createCliente(clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const clientes = this.getClientes();
    
    // Verificar duplicidade por CPF, telefone ou email
    const duplicateErrors: string[] = [];
    
    if (clienteData.cpf) {
      const cpfExists = clientes.find(c => c.cpf === clienteData.cpf);
      if (cpfExists) {
        duplicateErrors.push(`CPF ${clienteData.cpf} já está cadastrado para o cliente ${cpfExists.nome}`);
      }
    }
    
    if (clienteData.telefone) {
      const phoneExists = clientes.find(c => c.telefone === clienteData.telefone);
      if (phoneExists) {
        duplicateErrors.push(`Telefone ${clienteData.telefone} já está cadastrado para o cliente ${phoneExists.nome}`);
      }
    }
    
    if (clienteData.email) {
      const emailExists = clientes.find(c => c.email === clienteData.email);
      if (emailExists) {
        duplicateErrors.push(`Email ${clienteData.email} já está cadastrado para o cliente ${emailExists.nome}`);
      }
    }
    
    if (duplicateErrors.length > 0) {
      throw new Error(duplicateErrors.join('. '));
    }
    
    const newCliente: Cliente = {
      ...clienteData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    clientes.push(newCliente);
    this.saveClientes(clientes);
    
    // Trigger automation for client creation
    try {
      const { AutomacaoService } = await import('./automacaoService');
      await AutomacaoService.executarAutomacao('cliente_cadastrado', { cliente: newCliente });
    } catch (error) {
      console.error('Erro ao executar automação cliente_cadastrado:', error);
    }
    
    return newCliente;
  }

  static async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    
    clientes[index] = { ...clientes[index], ...updates, updatedAt: new Date() };
    this.saveClientes(clientes);
    
    // Trigger automation for client update
    try {
      const { AutomacaoService } = await import('./automacaoService');
      await AutomacaoService.executarAutomacao('cliente_atualizado', { cliente: clientes[index] });
    } catch (error) {
      console.error('Erro ao executar automação cliente_atualizado:', error);
    }
    
    return clientes[index];
  }

  static async deleteCliente(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const clientes = this.getClientes();
    const filtered = clientes.filter(c => c.id !== id);
    this.saveClientes(filtered);
  }

  // OS methods
  static async getAllOS(): Promise<OrdemServico[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.getOS();
  }

  static async getOSById(id: string): Promise<OrdemServico | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const ordens = this.getOS();
    return ordens.find(os => os.id === id) || null;
  }

  static async createOS(osData: {
    clienteId: string;
    motoId: string;
    descricao: string;
    valor: number;
    criadoPor: string;
    observacoes?: string;
  }): Promise<OrdemServico> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cliente = await this.getClienteById(osData.clienteId);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    const moto = cliente.motos.find(m => m.id === osData.motoId);
    if (!moto) throw new Error('Moto não encontrada');

    const ordens = this.getOS();
    
    // DASHBOARD INTEGRATION: Criação de nova OS com dados padronizados
    // Os dados aqui criados alimentam diretamente as métricas do dashboard:
    // - Contadores de OS por status
    // - Faturamento por período
    // - Análise de produtividade
    const newOS: OrdemServico = {
      id: generateId(),
      numeroOS: generateOSNumber(),
      clienteId: osData.clienteId,
      cliente,
      motoId: osData.motoId,
      moto,
      descricao: osData.descricao,
      valor: osData.valor,
      status: 'aguardando_aprovacao',
      criadoPor: osData.criadoPor,
      observacoes: osData.observacoes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ordens.push(newOS);
    this.saveOS(ordens);
    return newOS;
  }

  static async updateOS(id: string, updates: Partial<OrdemServico>): Promise<OrdemServico> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const ordens = this.getOS();
    const index = ordens.findIndex(os => os.id === id);
    if (index === -1) throw new Error('Ordem de serviço não encontrada');
    
    const osOriginal = ordens[index];
    const updatedOS = { 
      ...ordens[index], 
      ...updates, 
      updatedAt: new Date() 
    };

    // Handle status changes with proper date tracking
    if (updates.status === 'concluido' && ordens[index].status === 'em_andamento') {
      // Integrar com histórico de manutenção quando OS for concluída
      await this.adicionarAoHistoricoManutencao(updatedOS);
      
      // Integrar com estoque - baixa automática de peças utilizadas
      await this.processarBaixaEstoque(updatedOS);
    }

    ordens[index] = updatedOS;
    this.saveOS(ordens);
    
    // Trigger automation for OS update
    try {
      const { AutomacaoService } = await import('./automacaoService');
      await AutomacaoService.executarAutomacao('os_atualizada', { 
        os: updatedOS,
        osOriginal,
        mudancas: updates
      });
    } catch (error) {
      console.error('Erro ao executar automação os_atualizada:', error);
    }
    
    return updatedOS;
  }

  // Adicionar serviço concluído ao histórico de manutenção
  private static async adicionarAoHistoricoManutencao(os: OrdemServico): Promise<void> {
    try {
      const { HistoricoService } = await import('./historicoService');
      
      // Simular dados que não estão na OS mas são necessários para o histórico
      const quilometragemAtual = Math.floor(Math.random() * 50000) + 10000; // Simulado
      const mecanicoResponsavel = 'Mecânico da Oficina'; // Em produção, viria do usuário logado
      
      // Determinar tipo de serviço baseado na descrição
      const descricaoLower = os.descricao.toLowerCase();
      let tipoServico: 'preventiva' | 'corretiva' | 'revisao' | 'emergencia' = 'corretiva';
      
      if (descricaoLower.includes('revisão') || descricaoLower.includes('revisao')) {
        tipoServico = 'revisao';
      } else if (descricaoLower.includes('troca') || descricaoLower.includes('óleo') || 
                 descricaoLower.includes('oleo') || descricaoLower.includes('filtro') ||
                 descricaoLower.includes('preventiv')) {
        tipoServico = 'preventiva';
      } else if (descricaoLower.includes('emergência') || descricaoLower.includes('emergencia') ||
                 descricaoLower.includes('socorro')) {
        tipoServico = 'emergencia';
      }
      
      // Simular peças trocadas baseado na descrição
      const pecasTrocadas = this.extrairPecasDaDescricao(os.descricao, os.valor);
      
      // Calcular próxima revisão baseada no tipo de serviço
      const proximaRevisao = this.calcularProximaRevisao(tipoServico, quilometragemAtual);
      
      const historicoData = {
        osId: os.id,
        motoId: os.motoId,
        data: os.dataConclusao || new Date(),
        quilometragem: quilometragemAtual,
        tipoServico,
        descricao: os.descricao,
        pecasTrocadas,
        valor: os.valor,
        mecanico: mecanicoResponsavel,
        proximaRevisao,
        observacoes: os.observacoes,
        fotos: os.fotos || []
      };
      
      await HistoricoService.adicionarHistorico(historicoData);
    } catch (error) {
      console.error('Erro ao adicionar ao histórico de manutenção:', error);
    }
  }
  
  // Extrair peças da descrição do serviço
  private static extrairPecasDaDescricao(descricao: string, valorTotal: number): any[] {
    const pecas: any[] = [];
    const descricaoLower = descricao.toLowerCase();
    
    // Mapear palavras-chave para peças comuns
    const mapeamentoPecas = [
      { palavras: ['óleo', 'oleo'], nome: 'Óleo do Motor', valor: 45.00 },
      { palavras: ['filtro óleo', 'filtro oleo'], nome: 'Filtro de Óleo', valor: 25.00 },
      { palavras: ['filtro ar'], nome: 'Filtro de Ar', valor: 35.00 },
      { palavras: ['vela', 'velas'], nome: 'Velas de Ignição', valor: 60.00 },
      { palavras: ['pastilha', 'pastilhas', 'freio'], nome: 'Pastilhas de Freio', valor: 80.00 },
      { palavras: ['corrente'], nome: 'Corrente de Transmissão', valor: 120.00 },
      { palavras: ['pneu'], nome: 'Pneu', valor: 200.00 }
    ];
    
    mapeamentoPecas.forEach((item, index) => {
      const encontrou = item.palavras.some(palavra => descricaoLower.includes(palavra));
      if (encontrou) {
        pecas.push({
          id: `peca_${index}_${Date.now()}`,
          nome: item.nome,
          codigo: `PC${String(index + 1).padStart(3, '0')}`,
          marca: 'Original',
          valor: item.valor,
          garantia: {
            meses: item.nome.includes('Óleo') ? 6 : 12,
            quilometragem: item.nome.includes('Óleo') ? 3000 : 10000
          }
        });
      }
    });
    
    // Se não encontrou peças específicas, criar uma genérica
    if (pecas.length === 0) {
      pecas.push({
        id: `peca_generica_${Date.now()}`,
        nome: 'Serviços e Peças Diversas',
        codigo: 'SRV001',
        marca: 'Diversos',
        valor: valorTotal * 0.6, // Assumir que 60% do valor são peças
        garantia: {
          meses: 6,
          quilometragem: 5000
        }
      });
    }
    
    return pecas;
  }
  
  // Calcular próxima revisão baseada no tipo de serviço
  private static calcularProximaRevisao(tipoServico: string, quilometragemAtual: number): any {
    const intervalos = {
      'preventiva': { km: 3000, meses: 6 },
      'revisao': { km: 6000, meses: 12 },
      'corretiva': { km: 5000, meses: 8 },
      'emergencia': { km: 1000, meses: 3 }
    };
    
    const intervalo = intervalos[tipoServico as keyof typeof intervalos] || intervalos.corretiva;
    
    const proximaData = new Date();
    proximaData.setMonth(proximaData.getMonth() + intervalo.meses);
    
    return {
      data: proximaData,
      quilometragem: quilometragemAtual + intervalo.km,
      tipo: `Próxima ${tipoServico === 'preventiva' ? 'Manutenção Preventiva' : 'Revisão'}`
    };
  }
  // Dashboard methods
  // DASHBOARD CORE: Função principal que calcula todas as métricas exibidas
  // no dashboard principal. Integra dados de OS, clientes e faturamento
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const ordens = this.getOS();
    const clientes = this.getClientes();
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // MÉTRICA: Contagem de OS em andamento para o card principal do dashboard
    const osEmAndamento = ordens.filter(os => os.status === 'em_andamento').length;
    
    // MÉTRICA: Faturamento do mês atual baseado em OS concluídas
    // Considera apenas OS com status 'concluido' e dataConclusao no mês atual
    const faturamentoMes = ordens
      .filter(os => 
        os.status === 'concluido' && 
        os.dataConclusao &&
        new Date(os.dataConclusao).getMonth() === currentMonth &&
        new Date(os.dataConclusao).getFullYear() === currentYear
      )
      .reduce((total, os) => total + os.valor, 0);
    
    // MÉTRICA: Novos clientes cadastrados no mês atual
    const novosClientes = clientes.filter(c => 
      new Date(c.createdAt).getMonth() === currentMonth &&
      new Date(c.createdAt).getFullYear() === currentYear
    ).length;
    
    // MÉTRICA: Lista das 5 OS mais recentes para exibição no dashboard
    const osRecentes = ordens
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    // MÉTRICA: Top 5 clientes por número de serviços e valor gasto
    // Usado para identificar clientes mais valiosos
    const clienteStats = clientes.map(cliente => {
      const clienteOS = ordens.filter(os => os.clienteId === cliente.id);
      return {
        cliente,
        totalServicos: clienteOS.length,
        totalGasto: clienteOS.reduce((total, os) => total + os.valor, 0)
      };
    })
    .sort((a, b) => b.totalServicos - a.totalServicos)
    .slice(0, 5);
    
    return {
      osEmAndamento,
      faturamentoMes,
      novosClientes,
      osRecentes,
      topClientes: clienteStats
    };
  }
  
  // Processar baixa automática no estoque quando OS for concluída
  private static async processarBaixaEstoque(os: OrdemServico): Promise<void> {
    try {
      // Importar serviço de estoque dinamicamente para evitar dependência circular
      const { EstoqueService } = await import('./estoqueService');
      const { TiposServicoService } = await import('./tiposServicoService');
      
      // Verificar se a OS foi criada com serviços pré-configurados
      // Para isso, tentamos identificar os tipos de serviço pela descrição
      const tiposServico = await TiposServicoService.getTiposServico();
      const servicosUtilizados = tiposServico.filter(tipo => 
        os.descricao.toLowerCase().includes(tipo.nome.toLowerCase())
      );
      
      // Processar baixa das peças necessárias para cada serviço
      for (const servico of servicosUtilizados) {
        if (servico.pecasNecessarias) {
          for (const pecaNecessaria of servico.pecasNecessarias) {
            try {
              await EstoqueService.movimentarEstoque(
                pecaNecessaria.pecaId,
                'saida',
                pecaNecessaria.quantidade,
                `Utilizada na OS ${os.numeroOS} - ${servico.nome}`,
                os.aprovadoPor || os.criadoPor,
                os.id
              );
            } catch (estoqueError) {
              console.warn(`Não foi possível dar baixa na peça ${pecaNecessaria.pecaId}:`, estoqueError);
              // Continua o processo mesmo se uma peça não estiver disponível no estoque
            }
          }
        }
      }
      
      console.log(`Baixa automática de estoque processada para OS ${os.numeroOS}`);
    } catch (error) {
      console.error('Erro ao processar baixa automática no estoque:', error);
    }
  }
}