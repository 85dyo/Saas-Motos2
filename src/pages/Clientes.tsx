import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DataService } from '../services/dataService';
import { Cliente, Moto } from '../types';
import { formatPhone } from '../utils/formatters';
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
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
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
    // Se mudou o fabricante, limpar o modelo
    if (field === 'fabricante') {
      setFormData(prev => ({
        ...prev,
        motos: prev.motos.map((moto, i) => 
          i === index ? { ...moto, fabricante: value as string, modelo: '' } : moto
        )
      }));
      return;
    }
    
    // Formatação especial para placa
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e suas motos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

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
                  {cliente.motos.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/historico/${cliente.id}/${cliente.motos[0].id}`)}
                      title="Ver histórico médico"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  )}
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
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Motos ({cliente.motos.length})</h4>
                <div className="space-y-2">
                  {cliente.motos.map((moto) => (
                    <div 
                      key={moto.id} 
                      className="p-2 bg-gray-50 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => navigate(`/historico/${cliente.id}/${moto.id}`)}
                    >
                      <p className="font-medium">{moto.fabricante} {moto.modelo}</p>
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
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      )}

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