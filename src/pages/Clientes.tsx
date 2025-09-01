import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Users, UserCheck, UserX, Edit, Trash2, Eye } from 'lucide-react';
import { Cliente, Moto } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { useToast } from '../contexts/ToastContext';
import { DataService } from '../services/dataService';
import { formatPhone, formatCPF } from '../utils/formatters';
import { validarPlaca } from '../utils/motorcycleData';

type TipoFiltro = 'todos' | 'ativo' | 'inativo' | 'vip';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    tipoCliente: 'ativo' as const,
    motos: [{ modelo: '', placa: '', ano: new Date().getFullYear(), cor: '' }]
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await DataService.getClientes();
      setClientes(data);
    } catch (error) {
      showToast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes baseado no termo de busca
  const filteredBySearch = useMemo(() => {
    if (!searchTerm) return clientes;
    
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf?.includes(searchTerm) ||
      cliente.motos.some(moto => 
        moto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moto.placa.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [clientes, searchTerm]);

  // Aplicar filtro de tipo aos clientes já filtrados pela busca
  const filteredClientes = useMemo(() => {
    if (tipoFiltro === 'todos') return filteredBySearch;
    return filteredBySearch.filter(cliente => cliente.tipoCliente === tipoFiltro);
  }, [filteredBySearch, tipoFiltro]);

  // Calcular contagens baseadas na lista filtrada pela busca
  const tiposCliente = useMemo(() => {
    const counts = {
      todos: filteredBySearch.length,
      ativo: 0,
      inativo: 0,
      vip: 0
    };

    filteredBySearch.forEach(cliente => {
      counts[cliente.tipoCliente]++;
    });

    return counts;
  }, [filteredBySearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar placas
      for (const moto of formData.motos) {
        if (moto.placa && !validarPlaca(moto.placa)) {
          showToast('Placa inválida. Use o formato ABC-1234 ou ABC1D23 (Mercosul)', 'error');
          return;
        }
      }

      const clienteData = {
        ...formData,
        motos: formData.motos.filter(moto => moto.modelo && moto.placa)
      };

      if (editingCliente) {
        await DataService.updateCliente(editingCliente.id, clienteData);
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        await DataService.createCliente(clienteData);
        showToast('Cliente criado com sucesso!', 'success');
      }

      setShowModal(false);
      resetForm();
      loadClientes();
    } catch (error) {
      showToast('Erro ao salvar cliente', 'error');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone,
      cpf: cliente.cpf || '',
      endereco: cliente.endereco,
      tipoCliente: cliente.tipoCliente,
      motos: cliente.motos.length > 0 ? cliente.motos : [{ modelo: '', placa: '', ano: new Date().getFullYear(), cor: '' }]
    });
    setShowModal(true);
  };

  const handleView = (cliente: Cliente) => {
    setViewingCliente(cliente);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await DataService.deleteCliente(id);
        showToast('Cliente excluído com sucesso!', 'success');
        loadClientes();
      } catch (error) {
        showToast('Erro ao excluir cliente', 'error');
      }
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
      motos: [{ modelo: '', placa: '', ano: new Date().getFullYear(), cor: '' }]
    });
    setEditingCliente(null);
  };

  const addMoto = () => {
    setFormData(prev => ({
      ...prev,
      motos: [...prev.motos, { modelo: '', placa: '', ano: new Date().getFullYear(), cor: '' }]
    }));
  };

  const removeMoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      motos: prev.motos.filter((_, i) => i !== index)
    }));
  };

  const updateMoto = (index: number, field: keyof Moto, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      motos: prev.motos.map((moto, i) => 
        i === index ? { ...moto, [field]: value } : moto
      )
    }));
  };

  const getBadgeVariant = (tipoCliente: string) => {
    switch (tipoCliente || 'ativo') {
      case 'ativo': return 'success';
      case 'inativo': return 'error';
      case 'vip': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, telefone, email, CPF ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={tipoFiltro === 'todos' ? 'primary' : 'outline'}
              onClick={() => setTipoFiltro('todos')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Todos ({tiposCliente.todos})
            </Button>
            <Button
              variant={tipoFiltro === 'ativo' ? 'primary' : 'outline'}
              onClick={() => setTipoFiltro('ativo')}
              className="flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Ativos ({tiposCliente.ativo})
            </Button>
            <Button
              variant={tipoFiltro === 'inativo' ? 'primary' : 'outline'}
              onClick={() => setTipoFiltro('inativo')}
              className="flex items-center gap-2"
            >
              <UserX className="w-4 h-4" />
              Inativos ({tiposCliente.inativo})
            </Button>
            <Button
              variant={tipoFiltro === 'vip' ? 'primary' : 'outline'}
              onClick={() => setTipoFiltro('vip')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              VIP ({tiposCliente.vip})
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {filteredClientes.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || tipoFiltro !== 'todos' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || tipoFiltro !== 'todos' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando seu primeiro cliente'
              }
            </p>
            {!searchTerm && tipoFiltro === 'todos' && (
              <Button onClick={() => setShowModal(true)}>
                Cadastrar Cliente
              </Button>
            )}
          </Card>
        ) : (
          filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{cliente.nome}</h3>
                    <Badge variant={getBadgeVariant(cliente.tipoCliente)}>
                      {(cliente.tipoCliente || 'ativo').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Telefone:</strong> {formatPhone(cliente.telefone)}</p>
                      {cliente.email && <p><strong>Email:</strong> {cliente.email}</p>}
                      {cliente.cpf && <p><strong>CPF:</strong> {formatCPF(cliente.cpf)}</p>}
                    </div>
                    <div>
                      <p><strong>Endereço:</strong> {cliente.endereco}</p>
                      <p><strong>Motos:</strong> {cliente.motos.length}</p>
                    </div>
                  </div>

                  {cliente.motos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Motocicletas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {cliente.motos.map((moto, index) => (
                          <Badge key={index} color="blue">
                            {moto.modelo} - {moto.placa}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(cliente)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cliente.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
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
              label="Telefone *"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
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
              placeholder="000.000.000-00"
            />
          </div>

          <Input
            label="Endereço *"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
            required
          />

          <Select
            label="Tipo de Cliente *"
            value={formData.tipoCliente}
            onChange={(value) => setFormData(prev => ({ ...prev, tipoCliente: value as any }))}
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
              { value: 'vip', label: 'VIP' }
            ]}
          />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Motocicletas</h3>
              <Button type="button" onClick={addMoto} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Moto
              </Button>
            </div>

            {formData.motos.map((moto, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Moto {index + 1}</h4>
                  {formData.motos.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeMoto(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Modelo"
                    value={moto.modelo}
                    onChange={(e) => updateMoto(index, 'modelo', e.target.value)}
                    placeholder="Ex: Honda CG 160"
                  />
                  <Input
                    label="Placa"
                    value={moto.placa}
                    onChange={(e) => updateMoto(index, 'placa', e.target.value.toUpperCase())}
                    placeholder="ABC1234 ou ABC1D23"
                  />
                  <Input
                    label="Ano"
                    type="number"
                    value={moto.ano}
                    onChange={(e) => updateMoto(index, 'ano', parseInt(e.target.value))}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                  <Input
                    label="Cor"
                    value={moto.cor}
                    onChange={(e) => updateMoto(index, 'cor', e.target.value)}
                    placeholder="Ex: Vermelha"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
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

      {/* Modal de Visualização */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalhes do Cliente"
      >
        {viewingCliente && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold">{viewingCliente.nome}</h3>
              <Badge variant={getBadgeVariant(viewingCliente.tipoCliente)}>
                {(viewingCliente.tipoCliente || 'ativo').toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Informações Pessoais</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Telefone:</strong> {formatPhone(viewingCliente.telefone)}</p>
                  {viewingCliente.email && <p><strong>Email:</strong> {viewingCliente.email}</p>}
                  {viewingCliente.cpf && <p><strong>CPF:</strong> {formatCPF(viewingCliente.cpf)}</p>}
                  <p><strong>Endereço:</strong> {viewingCliente.endereco}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Motocicletas ({viewingCliente.motos.length})</h4>
                <div className="space-y-3">
                  {viewingCliente.motos.map((moto, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{moto.modelo}</div>
                      <div className="text-sm text-gray-600">
                        <p>Placa: {moto.placa}</p>
                        <p>Ano: {moto.ano}</p>
                        <p>Cor: {moto.cor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowViewModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}