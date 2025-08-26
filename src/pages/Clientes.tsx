import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Phone, 
  Mail,
  MessageCircle,
  Filter,
  Users,
  Star,
  UserX,
  UserCheck,
  Crown,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../contexts/ToastContext';
import { DataService } from '../services/dataService';
import { Cliente, Moto } from '../types';
import { formatDate, formatPhone } from '../utils/formatters';
import { 
  fabricantes, 
  modelosPorFabricante, 
  anosDisponiveis, 
  coresDisponiveis,
  formatarPlaca,
  validarPlaca 
} from '../utils/motorcycleData';

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    tipoCliente: 'ativo' as 'ativo' | 'inativo' | 'vip' | 'potencial' | 'leal' | 'problema',
    observacoes: '',
    motos: [{ 
      placa: '', 
      fabricante: '',
      modelo: '', 
      ano: new Date().getFullYear(), 
      cor: '' 
    }]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = clientes;

    if (searchTerm) {
      filtered = filtered.filter(cliente => 
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefone.includes(searchTerm) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cpf?.includes(searchTerm) ||
        cliente.motos.some(moto => 
          moto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moto.placa.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(cliente => cliente.tipoCliente === tipoFilter);
    }

    setFilteredClientes(filtered);
  }, [clientes, searchTerm, tipoFilter]);

  // Calcular contagens dos tipos de cliente baseado na lista filtrada
  const tiposCliente = React.useMemo(() => {
    // Primeiro aplicar apenas o filtro de busca para calcular as contagens corretas
    let clientesParaContagem = clientes;
    
    if (searchTerm) {
      clientesParaContagem = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefone.includes(searchTerm) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cpf?.includes(searchTerm) ||
        cliente.motos.some(moto => 
          moto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moto.placa.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return [
      { value: 'todos', label: 'Todos os Clientes', count: clientesParaContagem.length },
      { value: 'ativo', label: 'Ativos', count: clientesParaContagem.filter(c => c.tipoCliente === 'ativo' || !c.tipoCliente).length },
      { value: 'vip', label: 'VIP', count: clientesParaContagem.filter(c => c.tipoCliente === 'vip').length },
      { value: 'leal', label: 'Leais', count: clientesParaContagem.filter(c => c.tipoCliente === 'leal').length },
      { value: 'potencial', label: 'Potenciais', count: clientesParaContagem.filter(c => c.tipoCliente === 'potencial').length },
      { value: 'inativo', label: 'Inativos', count: clientesParaContagem.filter(c => c.tipoCliente === 'inativo').length },
      { value: 'problema', label: 'Problemas', count: clientesParaContagem.filter(c => c.tipoCliente === 'problema').length }
    ];
  }, [clientes, searchTerm]);

  const loadData = async () => {
    try {
      const clientesData = await DataService.getAllClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      showToast({
        message: 'Erro ao carregar clientes',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
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
        showToast({
          message: 'Cliente atualizado com sucesso!',
          type: 'success'
        });
      } else {
        await DataService.createCliente(clienteData);
        showToast({
          message: 'Cliente cadastrado com sucesso!',
          type: 'success'
        });
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      showToast({
        message: `Erro ao ${editingCliente ? 'atualizar' : 'cadastrar'} cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      endereco: '',
      tipoCliente: 'ativo',
      observacoes: '',
      motos: [{ 
        placa: '', 
        fabricante: '',
        modelo: '', 
        ano: new Date().getFullYear(), 
        cor: '' 
      }]
    });
    setEditingCliente(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone,
      cpf: cliente.cpf || '',
      endereco: cliente.endereco || '',
      tipoCliente: cliente.tipoCliente || 'ativo',
      observacoes: cliente.observacoes || '',
      motos: cliente.motos.map(moto => ({
        placa: moto.placa,
        fabricante: moto.fabricante,
        modelo: moto.modelo,
        ano: moto.ano,
        cor: moto.cor || ''
      }))
    });
    setIsModalOpen(true);
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
    if (formData.motos.length > 1) {
      setFormData(prev => ({
        ...prev,
        motos: prev.motos.filter((_, i) => i !== index)
      }));
    }
  };

  const getTipoClienteBadge = (tipo?: string) => {
    switch (tipo) {
      case 'vip':
        return <Badge variant="success"><Crown className="h-3 w-3 mr-1" />VIP</Badge>;
      case 'leal':
        return <Badge variant="info"><Star className="h-3 w-3 mr-1" />Leal</Badge>;
      case 'potencial':
        return <Badge variant="warning">Potencial</Badge>;
      case 'problema':
        return <Badge variant="error"><AlertCircle className="h-3 w-3 mr-1" />Problema</Badge>;
      case 'inativo':
        return <Badge variant="default"><UserX className="h-3 w-3 mr-1" />Inativo</Badge>;
      default:
        return <Badge variant="success"><UserCheck className="h-3 w-3 mr-1" />Ativo</Badge>;
    }
  };

  const tiposCliente = [
    { value: 'todos', label: 'Todos os Clientes', count: filteredClientes.length },
    { value: 'ativo', label: 'Ativos', count: filteredClientes.filter(c => c.tipoCliente === 'ativo' || !c.tipoCliente).length },
    { value: 'vip', label: 'VIP', count: filteredClientes.filter(c => c.tipoCliente === 'vip').length },
    { value: 'leal', label: 'Leais', count: filteredClientes.filter(c => c.tipoCliente === 'leal').length },
    { value: 'potencial', label: 'Potenciais', count: filteredClientes.filter(c => c.tipoCliente === 'potencial').length },
    { value: 'inativo', label: 'Inativos', count: filteredClientes.filter(c => c.tipoCliente === 'inativo').length },
    { value: 'problema', label: 'Problemas', count: filteredClientes.filter(c => c.tipoCliente === 'problema').length }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e suas motocicletas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filtros por Tipo */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {tiposCliente.map((tipo) => (
              <button
                key={tipo.value}
                onClick={() => setTipoFilter(tipo.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipoFilter === tipo.value
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                {tipo.label} ({tipo.count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, telefone, email, CPF ou moto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id} variant="outlined">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{cliente.nome}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    {getTipoClienteBadge(cliente.tipoCliente)}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingCliente(cliente)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {formatPhone(cliente.telefone)}
                </div>
                {cliente.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {cliente.email}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Motocicletas ({cliente.motos.length})
                </h4>
                <div className="space-y-2">
                  {cliente.motos.slice(0, 2).map((moto) => (
                    <div key={moto.id} className="text-sm text-gray-600">
                      <span className="font-medium">{moto.modelo}</span>
                      <span className="mx-2">•</span>
                      <span>{moto.placa}</span>
                      <span className="mx-2">•</span>
                      <span>{moto.ano}</span>
                    </div>
                  ))}
                  {cliente.motos.length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{cliente.motos.length - 2} moto(s) adicional(is)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">
                  Cliente desde {formatDate(cliente.createdAt)}
                </span>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClientes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || tipoFilter !== 'todos' 
              ? 'Nenhum cliente encontrado' 
              : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || tipoFilter !== 'todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece cadastrando seu primeiro cliente'}
          </p>
          {!searchTerm && tipoFilter === 'todos' && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Cliente
            </Button>
          )}
        </div>
      )}

      {/* Modal Novo/Editar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome *"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
              <Input
                label="Telefone *"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label="CPF"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Endereço"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                <select
                  value={formData.tipoCliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipoCliente: e.target.value as any }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ativo">Ativo</option>
                  <option value="vip">VIP</option>
                  <option value="leal">Leal</option>
                  <option value="potencial">Potencial</option>
                  <option value="inativo">Inativo</option>
                  <option value="problema">Problema</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Observações internas sobre o cliente..."
              />
            </div>
          </div>

          {/* Motocicletas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Motocicletas</h3>
              <Button type="button" variant="outline" onClick={addMoto}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Moto
              </Button>
            </div>
            
            {formData.motos.map((moto, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Moto {index + 1}</h4>
                  {formData.motos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMoto(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remover
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Placa *"
                    value={moto.placa}
                    onChange={(e) => updateMoto(index, 'placa', e.target.value)}
                    placeholder="ABC-1234 ou ABC1D23"
                    error={moto.placa && !validarPlaca(moto.placa) ? 'Formato inválido' : undefined}
                    helper="Formatos: ABC-1234 (antigo) ou BRA2E19 (Mercosul)"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
                    <select
                      value={moto.ano}
                      onChange={(e) => updateMoto(index, 'ano', parseInt(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {anosDisponiveis().map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante *</label>
                    <select
                      value={moto.fabricante}
                      onChange={(e) => updateMoto(index, 'fabricante', e.target.value)}
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
                      value={moto.modelo}
                      onChange={(e) => updateMoto(index, 'modelo', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!moto.fabricante}
                    >
                      <option value="">Selecione o modelo</option>
                      {moto.fabricante && modelosPorFabricante[moto.fabricante]?.map(modelo => (
                        <option key={modelo} value={modelo}>{modelo}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <select
                    value={moto.cor}
                    onChange={(e) => updateMoto(index, 'cor', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione a cor</option>
                    {coresDisponiveis.map(cor => (
                      <option key={cor} value={cor}>{cor}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
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
              {editingCliente ? 'Atualizar' : 'Cadastrar'} Cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualizar Cliente */}
      <Modal
        isOpen={!!viewingCliente}
        onClose={() => setViewingCliente(null)}
        title={`Cliente - ${viewingCliente?.nome}`}
        size="lg"
      >
        {viewingCliente && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informações Pessoais</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {viewingCliente.nome}</p>
                  <p><strong>Telefone:</strong> {formatPhone(viewingCliente.telefone)}</p>
                  {viewingCliente.email && <p><strong>Email:</strong> {viewingCliente.email}</p>}
                  {viewingCliente.cpf && <p><strong>CPF:</strong> {viewingCliente.cpf}</p>}
                  {viewingCliente.endereco && <p><strong>Endereço:</strong> {viewingCliente.endereco}</p>}
                  <div className="flex items-center">
                    <strong className="mr-2">Tipo:</strong>
                    {getTipoClienteBadge(viewingCliente.tipoCliente)}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Histórico</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Cliente desde:</strong> {formatDate(viewingCliente.createdAt)}</p>
                  <p><strong>Última atualização:</strong> {formatDate(viewingCliente.updatedAt)}</p>
                  <p><strong>Total de motos:</strong> {viewingCliente.motos.length}</p>
                </div>
              </div>
            </div>

            {viewingCliente.observacoes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {viewingCliente.observacoes}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Motocicletas ({viewingCliente.motos.length})</h4>
              <div className="space-y-3">
                {viewingCliente.motos.map((moto) => (
                  <div key={moto.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{moto.modelo}</p>
                        <p className="text-sm text-gray-600">
                          {moto.placa} • {moto.fabricante} • {moto.ano}
                          {moto.cor && ` • ${moto.cor}`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navegar para histórico da moto
                          window.location.href = `/historico/${viewingCliente.id}/${moto.id}`;
                        }}
                      >
                        Ver Histórico
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Clientes;