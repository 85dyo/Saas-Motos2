import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { DataService } from '../services/dataService';
import { OrdemServico, Cliente } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

const OrdensServico: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOS, setViewingOS] = useState<OrdemServico | null>(null);
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    clienteId: '',
    motoId: '',
    descricao: '',
    valor: 0,
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      await DataService.createOS({
        ...formData,
        criadoPor: user.id
      });

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar OS:', error);
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
          <p className="text-gray-600">Gerencie todas as ordens de serviço</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>

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

      {/* Create OS Modal */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
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

          <div>
            <Input
              label="Descrição do Serviço *"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descreva o serviço a ser realizado..."
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

      {/* View OS Modal */}
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