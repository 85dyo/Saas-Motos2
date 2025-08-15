import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, CheckCircle, Clock, UserPlus, BarChart3, Filter } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../contexts/ToastContext';
import { DataService } from '../services/dataService';
import { OrdemServico, Cliente, DashboardMetrics, TipoServico } from '../types';
import { TiposServicoService } from '../services/tiposServicoService';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  fabricantes, 
  modelosPorFabricante, 
  anosDisponiveis, 
  coresDisponiveis,
  formatarPlaca,
  validarPlaca 
} from '../utils/motorcycleData';

const OrdensServico: React.FC = () => {
  // Estados principais para gerenciamento de OS
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Estados para controle de interface
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [viewingOS, setViewingOS] = useState<OrdemServico | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Estados para serviços pré-configurados
  // IMPORTANTE: Estes estados são fundamentais para a padronização dos dados
  // que alimentam as métricas do dashboard principal (faturamento por tipo de serviço)
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  
  const { showToast } = useToast();
  const { user } = useAuth();

  // DASHBOARD INTEGRATION: Função que sincroniza os serviços selecionados
  // com a descrição e valor da OS, garantindo consistência nos dados
  // que serão utilizados para gerar métricas no dashboard principal
  const updateDescriptionAndValue = () => {
    const selectedServices = tiposServico.filter(service =>
      selectedServiceIds.includes(service.id)
    );

    if (selectedServices.length > 0) {
      // Gera descrição padronizada baseada nos serviços selecionados
      // Isso melhora a qualidade dos dados para análises no dashboard
      const newDescription = selectedServices.map(service => service.nome).join(', ');
      
      // Calcula valor total baseado nos preços base dos serviços
      // Garante precisão nas métricas de faturamento do dashboard
      const newValue = selectedServices.reduce((sum, service) => sum + (service.precoBase || 0), 0);

      setFormData(prev => ({
        ...prev,
        descricao: newDescription,
        valor: newValue
      }));
    }
  };

  // Gerencia a seleção/deseleção de serviços pré-configurados
  // Aciona automaticamente a atualização da descrição e valor da OS
  const handleServiceSelectionChange = (serviceId: string, isChecked: boolean) => {
    setSelectedServiceIds(prev =>
      isChecked ? [...prev, serviceId] : prev.filter(id => id !== serviceId)
    );
  };

  // Form state para OS
  const [formData, setFormData] = useState({
    clienteId: '',
    motoId: '',
    descricao: '',
    valor: 0,
    observacoes: ''
  });

  // Form state para novo cliente inline
  const [novoClienteData, setNovoClienteData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    motos: [{ 
      placa: '', 
      fabricante: '',
      modelo: '', 
      ano: new Date().getFullYear(), 
      cor: '' 
    }]
  });

  const [filtros, setFiltros] = useState({
    periodo: '30',
    status: 'todos',
    mecanico: 'todos'
  });

  useEffect(() => {
    loadData();
    loadDashboardData();
    
    // Carrega os tipos de serviço pré-configurados para seleção na criação de OS
    // DASHBOARD INTEGRATION: Esta funcionalidade garante que os dados de faturamento
    // por categoria de serviço no dashboard sejam consistentes e precisos
    const loadTiposServico = async () => {
      try {
        const data = await TiposServicoService.getTiposServico();
        setTiposServico(data.filter(t => t.ativo)); // Apenas serviços ativos
      } catch (error) {
        console.error('Erro ao carregar tipos de serviço:', error);
      }
    };
    
    loadTiposServico();
  }, []);
    
  // Carrega os tipos de serviço pré-configurados para seleção na criação de OS
  // DASHBOARD INTEGRATION: Monitora mudanças na seleção de serviços
  // e atualiza automaticamente descrição e valor para manter consistência
  // dos dados que alimentam as métricas do dashboard principal
  useEffect(() => {
    updateDescriptionAndValue();
  }, [selectedServiceIds, tiposServico]);

  useEffect(() => {
    let filtered = ordens;

    if (searchTerm) {
      filtered = filtered.filter(os => 
        os.numeroOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.moto.modelo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(os => os.status === statusFilter);
    }

    setFilteredOrdens(filtered);
  }, [ordens, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      const [ordensData, clientesData] = await Promise.all([
        DataService.getAllOS(),
        DataService.getAllClientes()
      ]);
      setOrdens(ordensData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const hoje = new Date();
      const diasAtras = new Date();
      diasAtras.setDate(hoje.getDate() - parseInt(filtros.periodo));

      const ordensData = await DataService.getAllOS();
      
      const novasOS = ordensData.filter(os => 
        new Date(os.createdAt) >= diasAtras
      ).length;

      const osEmAndamento = ordensData.filter(os => os.status === 'em_andamento').length;
      const osAguardandoAprovacao = ordensData.filter(os => os.status === 'aguardando_aprovacao').length;
      const osConcluidas = ordensData.filter(os => os.status === 'concluido').length;

      const faturamentoPeriodo = ordensData
        .filter(os => 
          os.status === 'concluido' && 
          os.dataConclusao &&
          new Date(os.dataConclusao) >= diasAtras
        )
        .reduce((sum, os) => sum + os.valor, 0);

      const tempoMedioConclusao = ordensData
        .filter(os => os.dataConclusao && os.dataAprovacao)
        .reduce((acc, os) => {
          const inicio = new Date(os.dataAprovacao!).getTime();
          const fim = new Date(os.dataConclusao!).getTime();
          return acc + (fim - inicio) / (1000 * 60 * 60 * 24);
        }, 0) / ordensData.filter(os => os.dataConclusao && os.dataAprovacao).length || 0;

      const osPorStatus = {
        'aguardando_aprovacao': osAguardandoAprovacao,
        'em_andamento': osEmAndamento,
        'concluido': osConcluidas,
        'cancelado': ordensData.filter(os => os.status === 'cancelado').length
      };

      setDashboardData({
        novasOS,
        osEmAndamento,
        osAguardandoAprovacao,
        faturamentoPeriodo,
        tempoMedioConclusao: Math.round(tempoMedioConclusao),
        osPorStatus,
        totalOS: ordensData.length
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      await DataService.createOS({
        ...formData,
        criadoPor: user.id
      });

      await loadData();
      await loadDashboardData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar OS:', error);
    }
  };

  const handleSubmitNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clienteData = {
        ...novoClienteData,
        motos: novoClienteData.motos.map(moto => ({
          ...moto,
          id: Math.random().toString(36).substr(2, 9)
        }))
      };

      const novoCliente = await DataService.createCliente(clienteData);
      
      // Atualizar lista de clientes
      await loadData();
      
      // Selecionar o novo cliente na OS
      setFormData(prev => ({ 
        ...prev, 
        clienteId: novoCliente.id,
        motoId: novoCliente.motos[0]?.id || ''
      }));
      
      setIsClienteModalOpen(false);
      resetNovoClienteForm();
      
      showToast({
        message: 'Cliente cadastrado com sucesso!',
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      showToast({
        message: `Erro ao cadastrar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        type: 'error'
      });
    }
  };

  const handleStatusUpdate = async (osId: string, newStatus: OrdemServico['status']) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'em_andamento' && user) {
        updates.aprovadoPor = user.id;
      }

      await DataService.updateOS(osId, updates);
      await loadData();
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      motoId: '',
      descricao: '',
      valor: 0,
      observacoes: ''
    });
    // IMPORTANTE: Limpa a seleção de serviços pré-configurados para evitar
    // dados incorretos em novas OS e manter a integridade das métricas do dashboard
    setSelectedServiceIds([]);
  };

  const resetNovoClienteForm = () => {
    setNovoClienteData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      endereco: '',
      motos: [{ 
        placa: '', 
        fabricante: '',
        modelo: '', 
        ano: new Date().getFullYear(), 
        cor: '' 
      }]
    });
  };

  const updateNovoClienteMoto = (field: string, value: string | number) => {
    if (field === 'fabricante') {
      setNovoClienteData(prev => ({
        ...prev,
        motos: [{ ...prev.motos[0], fabricante: value as string, modelo: '' }]
      }));
      return;
    }
    
    if (field === 'placa') {
      value = formatarPlaca(value as string);
    }
    
    setNovoClienteData(prev => ({
      ...prev,
      motos: [{ ...prev.motos[0], [field]: value }]
    }));
  };

  const getStatusBadge = (status: OrdemServico['status']) => {
    switch (status) {
      case 'aguardando_aprovacao':
        return <Badge variant="warning">Aguardando Aprovação</Badge>;
      case 'em_andamento':
        return <Badge variant="info">Em Andamento</Badge>;
      case 'concluido':
        return <Badge variant="success">Concluído</Badge>;
      case 'cancelado':
        return <Badge variant="error">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const selectedCliente = clientes.find(c => c.id === formData.clienteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600">Gerencie todas as ordens de serviço e analise performance</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={showDashboard ? "primary" : "outline"}
            onClick={() => setShowDashboard(!showDashboard)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova OS
          </Button>
        </div>
      </div>

      {/* Dashboard de OS */}
      {showDashboard && dashboardData && (
        <div className="space-y-6">
          {/* Filtros do Dashboard */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                <select
                  value={filtros.periodo}
                  onChange={(e) => {
                    setFiltros(prev => ({ ...prev, periodo: e.target.value }));
                    loadDashboardData();
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
                <select
                  value={filtros.status}
                  onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.novasOS}</div>
                <div className="text-sm text-gray-600">Novas OS</div>
                <div className="text-xs text-gray-500 mt-1">Últimos {filtros.periodo} dias</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{dashboardData.osEmAndamento}</div>
                <div className="text-sm text-gray-600">Em Andamento</div>
                <div className="text-xs text-gray-500 mt-1">Requer atenção</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData.faturamentoPeriodo)}
                </div>
                <div className="text-sm text-gray-600">Faturamento</div>
                <div className="text-xs text-gray-500 mt-1">Período selecionado</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{dashboardData.tempoMedioConclusao}</div>
                <div className="text-sm text-gray-600">Dias Médio</div>
                <div className="text-xs text-gray-500 mt-1">Para conclusão</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(dashboardData.osPorStatus).map(([status, quantidade]) => {
                  const total = Object.values(dashboardData.osPorStatus).reduce((a: any, b: any) => a + b, 0);
                  const porcentagem = total > 0 ? Math.round((quantidade as number / total) * 100) : 0;
                  
                  const statusLabels: { [key: string]: string } = {
                    'aguardando_aprovacao': 'Aguardando Aprovação',
                    'em_andamento': 'Em Andamento',
                    'concluido': 'Concluído',
                    'cancelado': 'Cancelado'
                  };
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm font-medium">{statusLabels[status]}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12">{porcentagem}%</span>
                        <span className="text-sm font-medium w-8">({quantidade})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros de OS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por OS, cliente ou moto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="aguardando_aprovacao">Aguardando Aprovação</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Lista de OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrdens.map((os) => (
          <Card key={os.id} variant="outlined">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{os.numeroOS}</h3>
                  <p className="text-sm text-gray-600">{formatDate(os.createdAt)}</p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingOS(os)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{os.cliente.nome}</p>
                  <p className="text-xs text-gray-600">{os.moto.modelo} • {os.moto.placa}</p>
                </div>
                
                <p className="text-sm text-gray-700">{os.descricao}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(os.valor)}
                  </span>
                  {getStatusBadge(os.status)}
                </div>
              </div>

              {user?.role === 'admin' && os.status === 'aguardando_aprovacao' && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(os.id, 'em_andamento')}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                </div>
              )}

              {os.status === 'em_andamento' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(os.id, 'concluido')}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Concluir
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrdens.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Nenhuma ordem de serviço encontrada' 
              : 'Nenhuma ordem de serviço cadastrada'}
          </p>
        </div>
      )}

      {/* Modal Nova OS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Nova Ordem de Serviço"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsClienteModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Novo Cliente
                </Button>
              </div>
              <select
                value={formData.clienteId}
                onChange={(e) => setFormData(prev => ({ ...prev, clienteId: e.target.value, motoId: '' }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moto *</label>
              <select
                value={formData.motoId}
                onChange={(e) => setFormData(prev => ({ ...prev, motoId: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!selectedCliente}
              >
                <option value="">Selecione uma moto</option>
                {selectedCliente?.motos.map((moto) => (
                  <option key={moto.id} value={moto.id}>
                    {moto.modelo} - {moto.placa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SEÇÃO DE SERVIÇOS PRÉ-CONFIGURADOS */}
          {/* DASHBOARD INTEGRATION: Esta seção padroniza a entrada de dados para OS,
              garantindo que as métricas do dashboard principal sejam consistentes:
              - Faturamento por tipo de serviço
              - Análise de produtividade por categoria
              - Relatórios de serviços mais frequentes
              - Tempo médio por tipo de serviço */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Serviços Pré-configurados
              </label>
              <span className="text-xs text-gray-500">
                {selectedServiceIds.length} selecionado(s)
              </span>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
              {tiposServico.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tiposServico.map((service) => (
                    <div key={service.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={selectedServiceIds.includes(service.id)}
                        onChange={(e) => handleServiceSelectionChange(service.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={`service-${service.id}`} 
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {service.nome}
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          {service.categoria} • {formatCurrency(service.precoBase || 0)}
                          {service.tempoEstimado && ` • ${service.tempoEstimado}h`}
                        </p>
                        {service.descricao && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {service.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Nenhum serviço pré-configurado disponível
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure tipos de serviço em Configurações → Campos Customizados
                  </p>
                </div>
              )}
            </div>
            
            {/* Resumo dos serviços selecionados */}
            {selectedServiceIds.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Resumo dos Serviços Selecionados:
                </h4>
                <div className="space-y-1">
                  {tiposServico
                    .filter(s => selectedServiceIds.includes(s.id))
                    .map(service => (
                      <div key={service.id} className="flex justify-between text-sm">
                        <span className="text-blue-800">{service.nome}</span>
                        <span className="font-medium text-blue-900">
                          {formatCurrency(service.precoBase || 0)}
                        </span>
                      </div>
                    ))}
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-blue-900">Total Estimado:</span>
                      <span className="text-blue-900">
                        {formatCurrency(
                          tiposServico
                            .filter(s => selectedServiceIds.includes(s.id))
                            .reduce((sum, s) => sum + (s.precoBase || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <Input
              label="Descrição do Serviço *"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o serviço a ser realizado..."
              helper={selectedServiceIds.length > 0 ? "Descrição gerada automaticamente. Você pode editá-la se necessário." : undefined}
              required
            />
          </div>

          <div>
            <Input
              label="Valor (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              helper={selectedServiceIds.length > 0 ? "Valor calculado automaticamente. Ajuste se necessário." : undefined}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Criar OS
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Cliente Inline */}
      <Modal
        isOpen={isClienteModalOpen}
        onClose={() => {
          setIsClienteModalOpen(false);
          resetNovoClienteForm();
        }}
        title="Cadastrar Novo Cliente"
        size="lg"
      >
        <form onSubmit={handleSubmitNovoCliente} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={novoClienteData.nome}
              onChange={(e) => setNovoClienteData(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
            <Input
              label="Telefone *"
              value={novoClienteData.telefone}
              onChange={(e) => setNovoClienteData(prev => ({ ...prev, telefone: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={novoClienteData.email}
              onChange={(e) => setNovoClienteData(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label="CPF"
              value={novoClienteData.cpf}
              onChange={(e) => setNovoClienteData(prev => ({ ...prev, cpf: e.target.value }))}
            />
          </div>
          
          <Input
            label="Endereço"
            value={novoClienteData.endereco}
            onChange={(e) => setNovoClienteData(prev => ({ ...prev, endereco: e.target.value }))}
          />

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Dados da Motocicleta</h4>
            <div className="p-3 border border-gray-200 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Placa *"
                  value={novoClienteData.motos[0].placa}
                  onChange={(e) => updateNovoClienteMoto('placa', e.target.value)}
                  placeholder="ABC-1234 ou BRA2E19"
                  error={novoClienteData.motos[0].placa && !validarPlaca(novoClienteData.motos[0].placa) ? 'Formato inválido' : undefined}
                  helper="Formatos aceitos: ABC-1234 (antigo) ou BRA2E19 (Mercosul)"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
                  <select
                    value={novoClienteData.motos[0].ano}
                    onChange={(e) => updateNovoClienteMoto('ano', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {anosDisponiveis().map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante *</label>
                  <select
                    value={novoClienteData.motos[0].fabricante}
                    onChange={(e) => updateNovoClienteMoto('fabricante', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione</option>
                    {fabricantes.map(fab => (
                      <option key={fab} value={fab}>{fab}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                  <select
                    value={novoClienteData.motos[0].modelo}
                    onChange={(e) => updateNovoClienteMoto('modelo', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!novoClienteData.motos[0].fabricante}
                  >
                    <option value="">Selecione o modelo</option>
                    {novoClienteData.motos[0].fabricante && modelosPorFabricante[novoClienteData.motos[0].fabricante]?.map(modelo => (
                      <option key={modelo} value={modelo}>{modelo}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <select
                  value={novoClienteData.motos[0].cor}
                  onChange={(e) => updateNovoClienteMoto('cor', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione a cor</option>
                  {coresDisponiveis.map(cor => (
                    <option key={cor} value={cor}>{cor}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsClienteModalOpen(false);
                resetNovoClienteForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Cadastrar Cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualizar OS */}
      <Modal
        isOpen={!!viewingOS}
        onClose={() => setViewingOS(null)}
        title={`Ordem de Serviço - ${viewingOS?.numeroOS}`}
        size="lg"
      >
        {viewingOS && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                <p className="text-gray-700">{viewingOS.cliente.nome}</p>
                <p className="text-sm text-gray-500">{viewingOS.cliente.telefone}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Moto</h4>
                <p className="text-gray-700">{viewingOS.moto.modelo}</p>
                <p className="text-sm text-gray-500">{viewingOS.moto.placa} • {viewingOS.moto.ano}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Descrição do Serviço</h4>
              <p className="text-gray-700">{viewingOS.descricao}</p>
            </div>

            {viewingOS.observacoes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                <p className="text-gray-700">{viewingOS.observacoes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Valor</h4>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(viewingOS.valor)}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                {getStatusBadge(viewingOS.status)}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Histórico</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Criada:</span> {formatDate(viewingOS.createdAt)}</p>
                {viewingOS.dataAprovacao && (
                  <p><span className="font-medium">Aprovada:</span> {formatDate(viewingOS.dataAprovacao)}</p>
                )}
                {viewingOS.dataConclusao && (
                  <p><span className="font-medium">Concluída:</span> {formatDate(viewingOS.dataConclusao)}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdensServico;