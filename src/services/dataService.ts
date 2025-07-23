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
    return newCliente;
  }

  static async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    
    clientes[index] = { ...clientes[index], ...updates, updatedAt: new Date() };
    this.saveClientes(clientes);
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
    
    const updatedOS = { 
      ...ordens[index], 
      ...updates, 
      updatedAt: new Date() 
    };

    // Handle status changes
    if (updates.status === 'em_andamento' && ordens[index].status === 'aguardando_aprovacao') {
      updatedOS.dataAprovacao = new Date();
    }
    if (updates.status === 'concluido' && ordens[index].status === 'em_andamento') {
      updatedOS.dataConclusao = new Date();
    }

    ordens[index] = updatedOS;
    this.saveOS(ordens);
    return updatedOS;
  }

  // Dashboard methods
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const ordens = this.getOS();
    const clientes = this.getClientes();
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const osEmAndamento = ordens.filter(os => os.status === 'em_andamento').length;
    
    const faturamentoMes = ordens
      .filter(os => 
        os.status === 'concluido' && 
        os.dataConclusao &&
        new Date(os.dataConclusao).getMonth() === currentMonth &&
        new Date(os.dataConclusao).getFullYear() === currentYear
      )
      .reduce((total, os) => total + os.valor, 0);
    
    const novosClientes = clientes.filter(c => 
      new Date(c.createdAt).getMonth() === currentMonth &&
      new Date(c.createdAt).getFullYear() === currentYear
    ).length;
    
    const osRecentes = ordens
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    // Top clientes calculation
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
}