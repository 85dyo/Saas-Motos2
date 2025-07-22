import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Download, MessageCircle, Calendar, TrendingUp, Users, Clock, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { DataService } from '../services/dataService';
import { PDFService } from '../services/pdfService';
import { EvolutionApiService } from '../services/evolutionApiService';
import { HistoricoService } from '../services/historicoService';
import { Cliente, Moto } from '../types';
import { formatPhone, formatDate, formatCurrency } from '../utils/formatters';
import { 
  fabricantes, 
  modelosPorFabricante, 
  anosDisponiveis, 
  coresDisponiveis,
  formatarPlaca,
  validarPlaca,
  getTipoPlaca
} from '../utils/motorcycleData';

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);

  // Dashboard states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [filtros, setFiltros] = useState({
    periodo: '30', // dias
    tipoServico: 'todos',
    statusCliente: 'todos'
  });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    motos: [] as Omit<Moto, 'id'>[]
  });

  useEffect(() => {
    loadClientes();
    loadDashboardData();
  }, []);

  useEffect(() => {
    const filtered = clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm)
    );
    setFilteredClientes(filtered);
  }, [clientes, searchTerm]);

  const loadClientes = async () => {
    try {
      const data = await DataService.getAllClientes();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Simular dados do dashboard
      const hoje = new Date();
      const diasAtras = new Date();
      diasAtras.setDate(hoje.getDate() - parseInt(filtros.periodo));

      const clientesData = await DataService.getAllClientes();
      const ordensData = await DataService.getAllOS();

      const novosClientes = clientesData.filter(c => 
        new Date(c.createdAt) >= diasAtras
      ).length;

      const clientesComRetorno = clientesData.filter(c => {
        const osCliente = ordensData.filter(os => os.clienteId === c.id);
        return osCliente.length > 1;
      });

      const tempoMedioRetorno = clientesComRetorno.length > 0 
        ? Math.round(clientesComRetorno.reduce((acc, cliente) => {
            const osCliente = ordensData
              .filter(os => os.clienteId === cliente.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            if (osCliente.length >= 2) {
              const diff = new Date(osCliente[0].createdAt).getTime() - new Date(osCliente[1].createdAt).getTime();
              return acc + (diff / (1000 * 60 * 60 * 24));
            }
            return acc;
          }, 0) / clientesComRetorno.length)
        : 0;

      const ticketMedio = ordensData.length > 0 
        ? ordensData.reduce((sum, os) => sum + os.valor, 0) / ordensData.length
        : 0;

      const clientesPorTipoServico = ordensData.reduce((acc, os) => {
        const tipo = os.descricao.toLowerCase().includes('óleo') ? 'Manutenção' :
                    os.descricao.toLowerCase().includes('freio') ? 'Freios' :
                    os.descricao.toLowerCase().includes('revisão') ? 'Revisão' : 'Outros';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      setDashboardData({
        novosClientes,
        totalClientes: clientesData.length,
        taxaRetorno: Math.round((clientesComRetorno.length / clientesData.length) * 100),
        tempoMedioRetorno,
        ticketMedio,
        clientesPorTipoServico,
        crescimentoMensal: Math.round(Math.random() * 20 + 5) // Simulado
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clienteData = {
        ...formData,
        motos: formData.motos.map(moto => ({
          ...moto,
          id: Math.random().toString(36).substr(2, 9)
        }))
      };

      if (editingCliente) {
        await DataService.updateCliente(editingCliente.id, clienteData);
      } else {
        await DataService.createCliente(clienteData);
      }

      await loadClientes();
      await loadDashboardData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone,
      cpf: cliente.cpf || '',
      endereco: cliente.endereco || '',
      motos: cliente.motos.map(({ id, ...moto }) => moto)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await DataService.deleteCliente(id);
        await loadClientes();
        await loadDashboardData();
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
      }
    }
  };

  const handleDownloadHistorico = async (cliente: Cliente, moto: Moto) => {
    try {
      const historico = await HistoricoService.getHistoricoMoto(moto.id);
      const alertas = await HistoricoService.getAlertasAtivos();
      const alertasMoto = alertas.filter(a => a.motoId === moto.id);
      
      const pdfBlob = await PDFService.gerarHistoricoMedico(cliente, moto, historico, alertasMoto);
      PDFService.downloadPDF(pdfBlob, `historico-${cliente.nome}-${moto.placa}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF do histórico');
    }
  };

  const handleEnviarWhatsApp = async (cliente: Cliente, moto: Moto) => {
    try {
      const historico = await HistoricoService.getHistoricoMoto(moto.id);
      const alertas = await HistoricoService.getAlertasAtivos();
      const alertasMoto = alertas.filter(a => a.motoId === moto.id);
      
      const pdfBlob = await PDFService.gerarHistoricoMedico(cliente, moto, historico, alertasMoto);
      const sucesso = await EvolutionApiService.enviarHistoricoMedico(cliente, moto.id, pdfBlob);
      
      if (sucesso) {
        alert('Histórico enviado via WhatsApp com sucesso!');
      } else {
        alert('Erro ao enviar WhatsApp. Verifique as configurações da Evolution API.');
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      alert('Erro ao enviar WhatsApp');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      endereco: '',
      motos: []
    });
    setEditingCliente(null);
  };

  const addMoto = () => {
    setFormData(prev => ({
      ...prev,
      motos: [...prev.motos, { 
        placa: '', 
        fabricante: '',
        modelo: '', 
        ano: new Date().getFullYear(), 
        cor: '' 
      }]
    }));
  };

  const removeMoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      motos: prev.motos.filter((_, i) => i !== index)
    }));
  };

  const updateMoto = (index: number, field: string, value: string | number) => {
    if (field === 'fabricante') {
      setFormData(prev => ({
        ...prev,
        motos: prev.motos.map((moto, i) => 
          i === index ? { ...moto, fabricante: value as string, modelo: '' } : moto
        )
      }));
      return;
    }
    
    if (field === 'placa') {
      value = formatarPlaca(value as string);
    }
    
    setFormData(prev => ({
      ...prev,
      motos: prev.motos.map((moto, i) => 
        i === index ? { ...moto, [field]: value } : moto
      )
    }));
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e analise métricas importantes</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant={showDashboard ? "primary" : "outline"}
            onClick={() => setShowDashboard(!showDashboard)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Dashboard de Clientes */}
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
                <Select
                  value={filtros.periodo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, periodo: e.target.value }))}
                  options={[
                    { value: '7', label: 'Últimos 7 dias' },
                    { value: '30', label: 'Últimos 30 dias' },
                    { value: '90', label: 'Últimos 90 dias' },
                    { value: '365', label: 'Último ano' }
                  ]}
                  className="w-40"
                />
                <Select
                  value={filtros.tipoServico}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipoServico: e.target.value }))}
                  options={[
                    { value: 'todos', label: 'Todos os Serviços' },
                    { value: 'manutencao', label: 'Manutenção' },
                    { value: 'revisao', label: 'Revisão' },
                    { value: 'reparo', label: 'Reparo' }
                  ]}
                  className="w-40"
                />
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.novosClientes}</div>
                <div className="text-sm text-gray-600">Novos Clientes</div>
                <div className="text-xs text-green-600 mt-1">
                  +{dashboardData.crescimentoMensal}% vs mês anterior
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardData.taxaRetorno}%</div>
                <div className="text-sm text-gray-600">Taxa de Retorno</div>
                <div className="text-xs text-gray-500 mt-1">
                  {dashboardData.totalClientes} clientes totais
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{dashboardData.tempoMedioRetorno}</div>
                <div className="text-sm text-gray-600">Dias Médio Retorno</div>
                <div className="text-xs text-gray-500 mt-1">
                  Entre visitas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(dashboardData.ticketMedio)}
                </div>
                <div className="text-sm text-gray-600">Ticket Médio</div>
                <div className="text-xs text-gray-500 mt-1">
                  Por serviço
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Serviços por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(dashboardData.clientesPorTipoServico).map(([tipo, quantidade]) => {
                  const total = Object.values(dashboardData.clientesPorTipoServico).reduce((a: any, b: any) => a + b, 0);
                  const porcentagem = Math.round((quantidade as number / total) * 100);
                  
                  return (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm font-medium">{tipo}</span>
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

      {/* Lista de Clientes */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id} variant="outlined">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{cliente.nome}</h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {cliente.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {cliente.email}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {formatPhone(cliente.telefone)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cliente desde {formatDate(cliente.createdAt)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Motos ({cliente.motos.length})</h4>
                <div className="space-y-2">
                  {cliente.motos.map((moto) => (
                    <div 
                      key={moto.id} 
                      className="p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{moto.fabricante} {moto.modelo}</p>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadHistorico(cliente, moto)}
                            title="Baixar PDF do histórico"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnviarWhatsApp(cliente, moto)}
                            title="Enviar histórico via WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600">{moto.placa} • {moto.ano} • {moto.cor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClientes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      )}

      {/* Modal de Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label="Telefone *"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              required
            />
            <Input
              label="CPF"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
            />
          </div>
          
          <Input
            label="Endereço"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Motos</label>
              <Button type="button" variant="outline" size="sm" onClick={addMoto}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Moto
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.motos.map((moto, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Placa *"
                      value={moto.placa}
                      onChange={(e) => updateMoto(index, 'placa', e.target.value)}
                      placeholder="ABC-1234 ou ABC1D23"
                      helper={moto.placa ? `Formato: ${getTipoPlaca(moto.placa) === 'antiga' ? 'Antigo' : getTipoPlaca(moto.placa) === 'mercosul' ? 'Mercosul' : 'Inválido'}` : 'Digite a placa da motocicleta'}
                      error={moto.placa && !validarPlaca(moto.placa) ? 'Formato de placa inválido' : undefined}
                      required
                    />
                    <Select
                      label="Ano *"
                      value={moto.ano}
                      onChange={(e) => updateMoto(index, 'ano', parseInt(e.target.value))}
                      options={anosDisponiveis().map(ano => ({ value: ano, label: ano.toString() }))}
                      placeholder="Selecione o ano"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      label="Fabricante *"
                      value={moto.fabricante || ''}
                      onChange={(e) => updateMoto(index, 'fabricante', e.target.value)}
                      options={fabricantes.map(fab => ({ value: fab, label: fab }))}
                      placeholder="Selecione o fabricante"
                      required
                    />
                    <Select
                      label="Modelo *"
                      value={moto.modelo}
                      onChange={(e) => updateMoto(index, 'modelo', e.target.value)}
                      options={moto.fabricante && modelosPorFabricante[moto.fabricante] 
                        ? modelosPorFabricante[moto.fabricante].map(modelo => ({ value: modelo, label: modelo }))
                        : [{ value: '', label: 'Selecione primeiro o fabricante' }]
                      }
                      placeholder="Selecione o modelo"
                      disabled={!moto.fabricante}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Select
                      label="Cor"
                      value={moto.cor}
                      onChange={(e) => updateMoto(index, 'cor', e.target.value)}
                      options={coresDisponiveis.map(cor => ({ value: cor, label: cor }))}
                      placeholder="Selecione a cor"
                      className="flex-1 mr-3"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMoto(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
              {editingCliente ? 'Atualizar' : 'Criar'} Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clientes;