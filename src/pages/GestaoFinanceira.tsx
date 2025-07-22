import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp,
  Calculator,
  FileText,
  Download,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Funcionario, PagamentoFuncionario } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const GestaoFinanceira: React.FC = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([
    {
      id: '1',
      nome: 'Carlos Mendes',
      email: 'carlos@oficinamotogestor.com',
      telefone: '(11) 99999-1111',
      cargo: 'mecanico',
      salarioBase: 2500.00,
      comissaoServico: 10,
      comissaoProduto: 5,
      valorHoraTecnica: 25.00,
      ativo: true,
      dataAdmissao: new Date('2023-01-15')
    },
    {
      id: '2',
      nome: 'Ana Silva',
      email: 'ana@oficinamotogestor.com',
      telefone: '(11) 99999-2222',
      cargo: 'vendedor',
      salarioBase: 2000.00,
      comissaoServico: 5,
      comissaoProduto: 15,
      valorHoraTecnica: 20.00,
      ativo: true,
      dataAdmissao: new Date('2023-03-01')
    }
  ]);

  const [pagamentos, setPagamentos] = useState<PagamentoFuncionario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'funcionario' | 'pagamento'>('funcionario');
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formFuncionario, setFormFuncionario] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: 'mecanico' as 'mecanico' | 'gerente' | 'vendedor',
    salarioBase: 0,
    comissaoServico: 0,
    comissaoProduto: 0,
    valorHoraTecnica: 0
  });

  const [formPagamento, setFormPagamento] = useState({
    funcionarioId: '',
    horasTrabalhadas: 0,
    valorServicos: 0,
    valorProdutos: 0,
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Carregar dados do localStorage
    const storedFuncionarios = localStorage.getItem('motogestor_funcionarios');
    const storedPagamentos = localStorage.getItem('motogestor_pagamentos');

    if (storedFuncionarios) {
      setFuncionarios(JSON.parse(storedFuncionarios));
    }

    if (storedPagamentos) {
      setPagamentos(JSON.parse(storedPagamentos));
    }
  };

  const saveFuncionarios = (novosFuncionarios: Funcionario[]) => {
    setFuncionarios(novosFuncionarios);
    localStorage.setItem('motogestor_funcionarios', JSON.stringify(novosFuncionarios));
  };

  const savePagamentos = (novosPagamentos: PagamentoFuncionario[]) => {
    setPagamentos(novosPagamentos);
    localStorage.setItem('motogestor_pagamentos', JSON.stringify(novosPagamentos));
  };

  const handleSubmitFuncionario = (e: React.FormEvent) => {
    e.preventDefault();
    
    const novoFuncionario: Funcionario = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      ...formFuncionario,
      ativo: true,
      dataAdmissao: editingItem?.dataAdmissao || new Date()
    };

    let novosFuncionarios;
    if (editingItem) {
      novosFuncionarios = funcionarios.map(f => f.id === editingItem.id ? novoFuncionario : f);
    } else {
      novosFuncionarios = [...funcionarios, novoFuncionario];
    }

    saveFuncionarios(novosFuncionarios);
    resetForm();
    setIsModalOpen(false);
  };

  const handleSubmitPagamento = (e: React.FormEvent) => {
    e.preventDefault();
    
    const funcionario = funcionarios.find(f => f.id === formPagamento.funcionarioId);
    if (!funcionario) return;

    const comissaoServicos = (formPagamento.valorServicos * funcionario.comissaoServico) / 100;
    const comissaoProdutos = (formPagamento.valorProdutos * funcionario.comissaoProduto) / 100;
    const valorHoras = formPagamento.horasTrabalhadas * funcionario.valorHoraTecnica;
    const totalPagar = funcionario.salarioBase + comissaoServicos + comissaoProdutos + valorHoras;

    const novoPagamento: PagamentoFuncionario = {
      id: Math.random().toString(36).substr(2, 9),
      funcionarioId: funcionario.id,
      funcionario,
      periodo: {
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      },
      horasTrabalhadas: formPagamento.horasTrabalhadas,
      valorServicos: formPagamento.valorServicos,
      valorProdutos: formPagamento.valorProdutos,
      comissaoServicos,
      comissaoProdutos,
      salarioBase: funcionario.salarioBase,
      totalPagar,
      status: 'pendente',
      observacoes: formPagamento.observacoes
    };

    const novosPagamentos = [...pagamentos, novoPagamento];
    savePagamentos(novosPagamentos);
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setFormFuncionario({
      nome: '',
      email: '',
      telefone: '',
      cargo: 'mecanico',
      salarioBase: 0,
      comissaoServico: 0,
      comissaoProduto: 0,
      valorHoraTecnica: 0
    });
    setFormPagamento({
      funcionarioId: '',
      horasTrabalhadas: 0,
      valorServicos: 0,
      valorProdutos: 0,
      observacoes: ''
    });
    setEditingItem(null);
  };

  const handleEditFuncionario = (funcionario: Funcionario) => {
    setEditingItem(funcionario);
    setFormFuncionario({
      nome: funcionario.nome,
      email: funcionario.email,
      telefone: funcionario.telefone,
      cargo: funcionario.cargo,
      salarioBase: funcionario.salarioBase,
      comissaoServico: funcionario.comissaoServico,
      comissaoProduto: funcionario.comissaoProduto,
      valorHoraTecnica: funcionario.valorHoraTecnica
    });
    setModalType('funcionario');
    setIsModalOpen(true);
  };

  const handleMarcarPago = (pagamentoId: string) => {
    const novosPagamentos = pagamentos.map(p => 
      p.id === pagamentoId 
        ? { ...p, status: 'pago' as const, dataPagamento: new Date() }
        : p
    );
    savePagamentos(novosPagamentos);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="warning">Pendente</Badge>;
      case 'pago':
        return <Badge variant="success">Pago</Badge>;
      case 'cancelado':
        return <Badge variant="error">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCargoBadge = (cargo: string) => {
    switch (cargo) {
      case 'mecanico':
        return <Badge variant="info">Mecânico</Badge>;
      case 'gerente':
        return <Badge variant="success">Gerente</Badge>;
      case 'vendedor':
        return <Badge variant="default">Vendedor</Badge>;
      default:
        return <Badge>{cargo}</Badge>;
    }
  };

  // Calcular métricas
  const totalFolhaPendente = pagamentos
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + p.totalPagar, 0);

  const totalPagoMes = pagamentos
    .filter(p => p.status === 'pago' && p.dataPagamento && 
      new Date(p.dataPagamento).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.totalPagar, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600">Controle de funcionários, pagamentos e comissões</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setModalType('pagamento');
              setIsModalOpen(true);
            }}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Pagamento
          </Button>
          <Button
            onClick={() => {
              setModalType('funcionario');
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{funcionarios.filter(f => f.ativo).length}</div>
            <div className="text-sm text-gray-600">Funcionários Ativos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalFolhaPendente)}
            </div>
            <div className="text-sm text-gray-600">Folha Pendente</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPagoMes)}
            </div>
            <div className="text-sm text-gray-600">Pago Este Mês</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {pagamentos.filter(p => p.status === 'pendente').length}
            </div>
            <div className="text-sm text-gray-600">Pagamentos Pendentes</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funcionarios.map((funcionario) => (
              <div key={funcionario.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{funcionario.nome}</h3>
                      {getCargoBadge(funcionario.cargo)}
                      <Badge variant={funcionario.ativo ? 'success' : 'error'}>
                        {funcionario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Salário Base:</span><br />
                        {formatCurrency(funcionario.salarioBase)}
                      </div>
                      <div>
                        <span className="font-medium">Comissão Serviço:</span><br />
                        {funcionario.comissaoServico}%
                      </div>
                      <div>
                        <span className="font-medium">Comissão Produto:</span><br />
                        {funcionario.comissaoProduto}%
                      </div>
                      <div>
                        <span className="font-medium">Hora Técnica:</span><br />
                        {formatCurrency(funcionario.valorHoraTecnica)}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFuncionario(funcionario)}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pagamentos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum pagamento registrado
              </p>
            ) : (
              pagamentos.map((pagamento) => (
                <div key={pagamento.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pagamento.funcionario.nome}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(pagamento.periodo.inicio)} - {formatDate(pagamento.periodo.fim)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(pagamento.status)}
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(pagamento.totalPagar)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Salário Base:</span><br />
                      {formatCurrency(pagamento.salarioBase)}
                    </div>
                    <div>
                      <span className="font-medium">Horas ({pagamento.horasTrabalhadas}h):</span><br />
                      {formatCurrency(pagamento.horasTrabalhadas * pagamento.funcionario.valorHoraTecnica)}
                    </div>
                    <div>
                      <span className="font-medium">Comissão Serviços:</span><br />
                      {formatCurrency(pagamento.comissaoServicos)}
                    </div>
                    <div>
                      <span className="font-medium">Comissão Produtos:</span><br />
                      {formatCurrency(pagamento.comissaoProdutos)}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span><br />
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(pagamento.totalPagar)}
                      </span>
                    </div>
                  </div>
                  
                  {pagamento.status === 'pendente' && (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleMarcarPago(pagamento.id)}
                      >
                        Marcar como Pago
                      </Button>
                    </div>
                  )}
                  
                  {pagamento.dataPagamento && (
                    <p className="text-xs text-gray-500 mt-2">
                      Pago em: {formatDate(pagamento.dataPagamento)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Funcionário */}
      <Modal
        isOpen={isModalOpen && modalType === 'funcionario'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingItem ? 'Editar Funcionário' : 'Novo Funcionário'}
        size="lg"
      >
        <form onSubmit={handleSubmitFuncionario} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={formFuncionario.nome}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
            <Input
              label="Email *"
              type="email"
              value={formFuncionario.email}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              label="Telefone *"
              value={formFuncionario.telefone}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, telefone: e.target.value }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
              <select
                value={formFuncionario.cargo}
                onChange={(e) => setFormFuncionario(prev => ({ ...prev, cargo: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="mecanico">Mecânico</option>
                <option value="gerente">Gerente</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Salário Base (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formFuncionario.salarioBase}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, salarioBase: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Valor Hora Técnica (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formFuncionario.valorHoraTecnica}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, valorHoraTecnica: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Comissão Serviços (%) *"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formFuncionario.comissaoServico}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, comissaoServico: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Comissão Produtos (%) *"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formFuncionario.comissaoProduto}
              onChange={(e) => setFormFuncionario(prev => ({ ...prev, comissaoProduto: parseFloat(e.target.value) || 0 }))}
              required
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
              {editingItem ? 'Atualizar' : 'Criar'} Funcionário
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Pagamento */}
      <Modal
        isOpen={isModalOpen && modalType === 'pagamento'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Calcular Pagamento"
        size="lg"
      >
        <form onSubmit={handleSubmitPagamento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário *</label>
            <select
              value={formPagamento.funcionarioId}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, funcionarioId: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione um funcionário</option>
              {funcionarios.filter(f => f.ativo).map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome} - {funcionario.cargo}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Horas Trabalhadas *"
              type="number"
              step="0.5"
              min="0"
              value={formPagamento.horasTrabalhadas}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, horasTrabalhadas: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Valor Total Serviços (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formPagamento.valorServicos}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, valorServicos: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Valor Total Produtos (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formPagamento.valorProdutos}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, valorProdutos: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formPagamento.observacoes}
              onChange={(e) => setFormPagamento(prev => ({ ...prev, observacoes: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Observações sobre o pagamento..."
            />
          </div>

          {/* Preview do Cálculo */}
          {formPagamento.funcionarioId && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Preview do Cálculo</h4>
              {(() => {
                const funcionario = funcionarios.find(f => f.id === formPagamento.funcionarioId);
                if (!funcionario) return null;
                
                const comissaoServicos = (formPagamento.valorServicos * funcionario.comissaoServico) / 100;
                const comissaoProdutos = (formPagamento.valorProdutos * funcionario.comissaoProduto) / 100;
                const valorHoras = formPagamento.horasTrabalhadas * funcionario.valorHoraTecnica;
                const total = funcionario.salarioBase + comissaoServicos + comissaoProdutos + valorHoras;
                
                return (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Salário Base: {formatCurrency(funcionario.salarioBase)}</div>
                    <div>Horas Técnicas: {formatCurrency(valorHoras)}</div>
                    <div>Comissão Serviços: {formatCurrency(comissaoServicos)}</div>
                    <div>Comissão Produtos: {formatCurrency(comissaoProdutos)}</div>
                    <div className="col-span-2 pt-2 border-t border-blue-200">
                      <strong>Total a Pagar: {formatCurrency(total)}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

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
              Registrar Pagamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GestaoFinanceira;