// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'funcionario';
  phone?: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Client types
export interface Moto {
  id: string;
  placa: string;
  fabricante: string;
  modelo: string;
  ano: number;
  cor?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  cpf?: string;
  endereco?: string;
  tipoCliente?: 'ativo' | 'inativo' | 'vip' | 'potencial' | 'leal' | 'problema';
  observacoes?: string;
  motos: Moto[];
  createdAt: Date;
  updatedAt: Date;
}

// OS (Ordem de Serviço) types
export interface OrdemServico {
  id: string;
  numeroOS: string;
  clienteId: string;
  cliente: Cliente;
  motoId: string;
  moto: Moto;
  descricao: string;
  valor: number;
  status: 'aguardando_aprovacao' | 'em_andamento' | 'concluido' | 'cancelado';
  criadoPor: string;
  aprovadoPor?: string;
  fotos?: string[];
  anexos?: string[];
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  dataAprovacao?: Date;
  dataConclusao?: Date;
}

// Dashboard types
export interface DashboardMetrics {
  osEmAndamento: number;
  faturamentoMes: number;
  novosClientes: number;
  osRecentes: OrdemServico[];
  topClientes: {
    cliente: Cliente;
    totalServicos: number;
    totalGasto: number;
  }[];
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

// Histórico Médico da Moto
export interface HistoricoServico {
  id: string;
  osId: string;
  motoId: string;
  data: Date;
  quilometragem: number;
  tipoServico: 'preventiva' | 'corretiva' | 'revisao' | 'emergencia';
  descricao: string;
  pecasTrocadas: PecaTrocada[];
  valor: number;
  mecanico: string;
  proximaRevisao?: {
    data: Date;
    quilometragem: number;
    tipo: string;
  };
  observacoes?: string;
  fotos?: string[];
}

export interface PecaTrocada {
  id: string;
  nome: string;
  codigo?: string;
  marca?: string;
  valor: number;
  garantia?: {
    meses: number;
    quilometragem: number;
  };
}

// Alertas e Notificações Inteligentes
export interface AlertaManutencao {
  id: string;
  motoId: string;
  clienteId: string;
  tipo: 'quilometragem' | 'tempo' | 'peca_garantia' | 'revisao_obrigatoria';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  dataVencimento: Date;
  quilometragemVencimento?: number;
  status: 'ativo' | 'agendado' | 'concluido' | 'ignorado';
  createdAt: Date;
  agendamento?: {
    data: Date;
    horario: string;
    observacoes?: string;
  };
}

// Configurações de Automação
export interface ConfiguracaoAutomacao {
  id: string;
  nome: string;
  tipo: 'whatsapp' | 'email' | 'sms' | 'webhook';
  ativo: boolean;
  trigger: {
    evento: 'os_criada' | 'os_concluida' | 'os_atualizada' | 'alerta_manutencao' | 'cliente_cadastrado' | 'cliente_atualizado';
    condicoes?: any;
  };
  acao: {
    template: string;
    destinatario: string;
    parametros?: any;
  };
  configuracao: {
    n8nWebhookUrl?: string;
    whatsappToken?: string;
    emailTemplate?: string;
  };
}

// Analytics e Relatórios Inteligentes
export interface AnalyticsData {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  faturamento: {
    total: number;
    crescimento: number;
    porServico: { [key: string]: number };
    porMes: { mes: string; valor: number }[];
  };
  produtividade: {
    osRealizadas: number;
    tempoMedio: number;
    eficiencia: number;
    porMecanico: { nome: string; os: number; valor: number }[];
  };
  clientes: {
    novos: number;
    retencao: number;
    ticketMedio: number;
    topClientes: { cliente: Cliente; valor: number; frequencia: number }[];
  };
  previsoes: {
    faturamentoProximoMes: number;
    osAgendadas: number;
    alertasVencimento: number;
  };
}

// WhatsApp Bot
export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  type: 'text' | 'image' | 'document' | 'audio';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  clienteId?: string;
  context?: 'historico_moto' | 'agendamento' | 'status_os' | 'suporte';
}

// Configurações do Sistema
export interface ConfiguracoesSistema {
  oficina: {
    nome: string;
    endereco: string;
    telefone: string;
    email: string;
    cnpj?: string;
    logo?: string;
  };
  notificacoes: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
    push: boolean;
  };
  automacoes: {
    alertasManutencao: boolean;
    lembreteRevisao: boolean;
    notificacaoOS: boolean;
    backupAutomatico: boolean;
  };
  integracao: {
    n8nWebhookUrl?: string;
    n8nToken?: string;
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    evolutionInstanceName?: string;
    whatsappApiKey?: string;
    emailProvider?: 'sendgrid' | 'mailgun' | 'ses';
    smsProvider?: 'twilio' | 'zenvia';
    analiseIA?: boolean;
    alertasPreditivos?: boolean;
    aiProvider?: 'openai' | 'anthropic' | 'google' | 'grok' | 'llama' | 'none';
    aiApiKey?: string;
    aiModel?: string;
  };
}

// Novas interfaces para funcionalidades avançadas

// Evolution API Integration
export interface EvolutionAPIConfig {
  instanceName: string;
  apiKey: string;
  baseUrl: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected' | 'error';
}

// Sistema de Temas
export interface TemaPersonalizado {
  id: string;
  nome: string;
  logo?: string;
  cores: {
    primaria: string;
    secundaria: string;
    sucesso: string;
    aviso: string;
    erro: string;
    fundo: string;
    texto: string;
    fundoSecundario: string;
    bordas: string;
  };
  modo: 'light' | 'dark';
  ativo: boolean;
  createdAt: Date;
}

// Templates de Mensagens IA
export interface TemplateIA {
  id: string;
  nome: string;
  tipo: 'whatsapp' | 'email' | 'sms';
  contexto: 'os_criada' | 'os_concluida' | 'alerta_manutencao' | 'historico_solicitado';
  template: string;
  variaveis: string[];
  geradoPorIA: boolean;
  ativo: boolean;
  createdAt: Date;
}

// Portal do Cliente
export interface ClientePortal {
  id: string;
  clienteId: string;
  email: string;
  senha: string;
  ativo: boolean;
  ultimoAcesso?: Date;
  configuracoes: {
    notificacoes: boolean;
    historicoPublico: boolean;
  };
}

// Gestão de Pagamentos e Comissões
export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: 'mecanico' | 'gerente' | 'vendedor';
  salarioBase: number;
  comissaoServico: number; // %
  comissaoProduto: number; // %
  valorHoraTecnica: number;
  ativo: boolean;
  dataAdmissao: Date;
}

export interface PagamentoFuncionario {
  id: string;
  funcionarioId: string;
  funcionario: Funcionario;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  horasTrabalhadas: number;
  valorServicos: number;
  valorProdutos: number;
  comissaoServicos: number;
  comissaoProdutos: number;
  salarioBase: number;
  totalPagar: number;
  status: 'pendente' | 'pago' | 'cancelado';
  dataPagamento?: Date;
  observacoes?: string;
}

// Controle de Estoque
export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: string;
  marca?: string;
  precoCompra: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
  unidade: 'un' | 'kg' | 'l' | 'm';
  fornecedor?: string;
  localizacao?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  produto: Produto;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  valor: number;
  motivo: string;
  osId?: string;
  funcionarioId: string;
  createdAt: Date;
}

// Integração API Externa
export interface IntegracaoAPI {
  id: string;
  nome: string;
  tipo: 'estoque' | 'financeiro' | 'crm';
  url: string;
  apiKey: string;
  ativo: boolean;
  ultimaSync?: Date;
  configuracao: {
    mapeamentoCampos: { [key: string]: string };
    frequenciaSync: 'manual' | 'diaria' | 'semanal';
  };
}

// Relatórios Avançados
export interface RelatorioAvancado {
  id: string;
  nome: string;
  tipo: 'financeiro' | 'produtividade' | 'estoque' | 'clientes';
  parametros: any;
  agendamento?: {
    frequencia: 'diario' | 'semanal' | 'mensal';
    destinatarios: string[];
  };
  ultimaExecucao?: Date;
  ativo: boolean;
}

// Configuração de Campos Customizados
export interface CampoCustomizado {
  id: string;
  nome: string;
  tipo: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  obrigatorio: boolean;
  visivel: boolean;
  ordem: number;
  opcoes?: string[];
  validacao?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ConfiguracaoSecao {
  id: string;
  nome: string;
  campos: CampoCustomizado[];
}

// Catálogo de Peças baseado nas referências Honda/Yamaha
export interface CatalogoPeca {
  id: string;
  codigo: string;
  nome: string;
  categoria: 'motor' | 'transmissao' | 'freios' | 'suspensao' | 'eletrica' | 'carroceria' | 'filtros' | 'lubrificantes';
  subcategoria: string;
  fabricante: string;
  modelosCompativeis: string[];
  anosCompativeis: number[];
  especificacoes: {
    [key: string]: string;
  };
  precoSugerido?: number;
  fornecedores: {
    nome: string;
    preco: number;
    prazoEntrega: number;
    disponibilidade: 'disponivel' | 'sob_encomenda' | 'indisponivel';
  }[];
  imagem?: string;
  manual?: string; // URL do manual/especificação
}

// Tipos de Serviço Pré-definidos
export interface TipoServico {
  id: string;
  nome: string;
  categoria: 'preventiva' | 'corretiva' | 'revisao' | 'emergencia' | 'customizada';
  descricao: string;
  tempoEstimado: number; // em horas
  precoBase?: number;
  pecasNecessarias?: {
    pecaId: string;
    quantidade: number;
    obrigatoria: boolean;
  }[];
  intervalos?: {
    quilometragem?: number;
    tempo?: number; // em meses
  };
  fabricantesEspecificos?: string[];
  ativo: boolean;
}