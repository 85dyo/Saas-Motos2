import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingUp, Download, Upload, FolderSync as Sync, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EstoqueService } from '../services/estoqueService';
import { Produto, MovimentacaoEstoque } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const Estoque: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'produto' | 'movimentacao'>('produto');
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [relatorio, setRelatorio] = useState<any>(null);

  const [formProduto, setFormProduto] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    categoria: '',
    marca: '',
    precoCompra: 0,
    precoVenda: 0,
    estoque: 0,
    estoqueMinimo: 0,
    unidade: 'un' as 'un' | 'kg' | 'l' | 'm',
    fornecedor: '',
    localizacao: ''
  });

  const [formMovimentacao, setFormMovimentacao] = useState({
    produtoId: '',
    tipo: 'entrada' as 'entrada' | 'saida' | 'ajuste',
    quantidade: 0,
    motivo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = produtos;

    if (searchTerm) {
      filtered = filtered.filter(produto => 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoriaFilter !== 'all') {
      filtered = filtered.filter(produto => produto.categoria === categoriaFilter);
    }

    setFilteredProdutos(filtered);
  }, [produtos, searchTerm, categoriaFilter]);

  const loadData = async () => {
    try {
      const [produtosData, movimentacoesData, relatorioData] = await Promise.all([
        EstoqueService.getProdutos(),
        EstoqueService.getMovimentacoes(),
        EstoqueService.getRelatorioEstoque()
      ]);

      setProdutos(produtosData);
      setMovimentacoes(movimentacoesData);
      setRelatorio(relatorioData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduto) {
        await EstoqueService.atualizarProduto(editingProduto.id, { ...formProduto, ativo: true });
      } else {
        await EstoqueService.criarProduto({ ...formProduto, ativo: true });
      }

      await loadData();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleSubmitMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await EstoqueService.movimentarEstoque(
        formMovimentacao.produtoId,
        formMovimentacao.tipo,
        formMovimentacao.quantidade,
        formMovimentacao.motivo,
        'user-id' // Em produção, pegar do contexto de auth
      );

      await loadData();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao movimentar estoque:', error);
      alert(error instanceof Error ? error.message : 'Erro ao movimentar estoque');
    }
  };

  const resetForm = () => {
    setFormProduto({
      codigo: '',
      nome: '',
      descricao: '',
      categoria: '',
      marca: '',
      precoCompra: 0,
      precoVenda: 0,
      estoque: 0,
      estoqueMinimo: 0,
      unidade: 'un',
      fornecedor: '',
      localizacao: ''
    });
    setFormMovimentacao({
      produtoId: '',
      tipo: 'entrada',
      quantidade: 0,
      motivo: ''
    });
    setEditingProduto(null);
  };

  const handleEditProduto = (produto: Produto) => {
    setEditingProduto(produto);
    setFormProduto({
      codigo: produto.codigo,
      nome: produto.nome,
      descricao: produto.descricao || '',
      categoria: produto.categoria,
      marca: produto.marca || '',
      precoCompra: produto.precoCompra,
      precoVenda: produto.precoVenda,
      estoque: produto.estoque,
      estoqueMinimo: produto.estoqueMinimo,
      unidade: produto.unidade,
      fornecedor: produto.fornecedor || '',
      localizacao: produto.localizacao || ''
    });
    setModalType('produto');
    setIsModalOpen(true);
  };

  const handleExportarEstoque = async () => {
    try {
      const blob = await EstoqueService.exportarEstoque();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estoque-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar estoque:', error);
    }
  };

  const handleImportarEstoque = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const sucesso = await EstoqueService.importarEstoque(file);
      if (sucesso) {
        alert('Estoque importado com sucesso!');
        await loadData();
      } else {
        alert('Erro ao importar estoque');
      }
    } catch (error) {
      console.error('Erro ao importar estoque:', error);
      alert('Erro ao importar estoque');
    }
    
    // Reset input
    event.target.value = '';
  };

  const categorias = [...new Set(produtos.map(p => p.categoria))];
  const produtosEstoqueBaixo = produtos.filter(p => p.estoque <= p.estoqueMinimo && p.ativo);

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
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-600">Gerencie produtos, movimentações e relatórios</p>
        </div>
        <div className="flex space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={handleImportarEstoque}
            className="hidden"
            id="import-file"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-file')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportarEstoque}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setModalType('movimentacao');
              setIsModalOpen(true);
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Movimentar
          </Button>
          <Button
            onClick={() => {
              setModalType('produto');
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Métricas */}
      {relatorio && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{relatorio.totalProdutos}</div>
              <div className="text-sm text-gray-600">Produtos Ativos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(relatorio.valorTotalEstoque)}
              </div>
              <div className="text-sm text-gray-600">Valor Total Estoque</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{relatorio.produtosEstoqueBaixo}</div>
              <div className="text-sm text-gray-600">Estoque Baixo</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{relatorio.movimentacoesMes}</div>
              <div className="text-sm text-gray-600">Movimentações/Mês</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de Estoque Baixo */}
      {produtosEstoqueBaixo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Produtos com Estoque Baixo ({produtosEstoqueBaixo.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {produtosEstoqueBaixo.map((produto) => (
                <div key={produto.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900">{produto.nome}</h4>
                  <p className="text-sm text-red-700">
                    Estoque: {produto.estoque} {produto.unidade} 
                    (Mín: {produto.estoqueMinimo})
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todas as Categorias</option>
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Produtos ({filteredProdutos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Produto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Categoria</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Estoque</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Preço Venda</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{produto.nome}</p>
                        <p className="text-sm text-gray-600">{produto.codigo}</p>
                        {produto.marca && (
                          <p className="text-xs text-gray-500">{produto.marca}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">{produto.categoria}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div>
                        <span className={`font-medium ${
                          produto.estoque <= produto.estoqueMinimo ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {produto.estoque} {produto.unidade}
                        </span>
                        <p className="text-xs text-gray-500">
                          Mín: {produto.estoqueMinimo}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(produto.precoVenda)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Custo: {formatCurrency(produto.precoCompra)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={produto.ativo ? 'success' : 'error'}>
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduto(produto)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProdutos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm || categoriaFilter !== 'all' 
                    ? 'Nenhum produto encontrado' 
                    : 'Nenhum produto cadastrado'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Produto */}
      <Modal
        isOpen={isModalOpen && modalType === 'produto'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingProduto ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSubmitProduto} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={formProduto.codigo}
              onChange={(e) => setFormProduto(prev => ({ ...prev, codigo: e.target.value }))}
              required
            />
            <Input
              label="Nome *"
              value={formProduto.nome}
              onChange={(e) => setFormProduto(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
            <Input
              label="Categoria *"
              value={formProduto.categoria}
              onChange={(e) => setFormProduto(prev => ({ ...prev, categoria: e.target.value }))}
              required
            />
            <Input
              label="Marca"
              value={formProduto.marca}
              onChange={(e) => setFormProduto(prev => ({ ...prev, marca: e.target.value }))}
            />
          </div>
          
          <Input
            label="Descrição"
            value={formProduto.descricao}
            onChange={(e) => setFormProduto(prev => ({ ...prev, descricao: e.target.value }))}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Preço Compra (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formProduto.precoCompra}
              onChange={(e) => setFormProduto(prev => ({ ...prev, precoCompra: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Preço Venda (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formProduto.precoVenda}
              onChange={(e) => setFormProduto(prev => ({ ...prev, precoVenda: parseFloat(e.target.value) || 0 }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <select
                value={formProduto.unidade}
                onChange={(e) => setFormProduto(prev => ({ ...prev, unidade: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="un">Unidade</option>
                <option value="kg">Quilograma</option>
                <option value="l">Litro</option>
                <option value="m">Metro</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Estoque Atual *"
              type="number"
              min="0"
              value={formProduto.estoque}
              onChange={(e) => setFormProduto(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Estoque Mínimo *"
              type="number"
              min="0"
              value={formProduto.estoqueMinimo}
              onChange={(e) => setFormProduto(prev => ({ ...prev, estoqueMinimo: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fornecedor"
              value={formProduto.fornecedor}
              onChange={(e) => setFormProduto(prev => ({ ...prev, fornecedor: e.target.value }))}
            />
            <Input
              label="Localização"
              value={formProduto.localizacao}
              onChange={(e) => setFormProduto(prev => ({ ...prev, localizacao: e.target.value }))}
              placeholder="Ex: Prateleira A1, Gaveta B2"
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
              {editingProduto ? 'Atualizar' : 'Criar'} Produto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Movimentação */}
      <Modal
        isOpen={isModalOpen && modalType === 'movimentacao'}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Movimentar Estoque"
        size="md"
      >
        <form onSubmit={handleSubmitMovimentacao} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
            <select
              value={formMovimentacao.produtoId}
              onChange={(e) => setFormMovimentacao(prev => ({ ...prev, produtoId: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione um produto</option>
              {produtos.filter(p => p.ativo).map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} - {produto.codigo} (Estoque: {produto.estoque})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={formMovimentacao.tipo}
                onChange={(e) => setFormMovimentacao(prev => ({ ...prev, tipo: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
              </select>
            </div>
            <Input
              label="Quantidade *"
              type="number"
              min="0"
              value={formMovimentacao.quantidade}
              onChange={(e) => setFormMovimentacao(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <textarea
              value={formMovimentacao.motivo}
              onChange={(e) => setFormMovimentacao(prev => ({ ...prev, motivo: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Descreva o motivo da movimentação..."
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
              Movimentar Estoque
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Estoque;