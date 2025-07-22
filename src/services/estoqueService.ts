import { Produto, MovimentacaoEstoque, IntegracaoAPI } from '../types';

export class EstoqueService {
  private static produtos: Produto[] = [
    {
      id: '1',
      codigo: 'OL001',
      nome: 'Óleo Motor 20W50',
      descricao: 'Óleo mineral para motores 4 tempos',
      categoria: 'Lubrificantes',
      marca: 'Motul',
      precoCompra: 25.00,
      precoVenda: 45.00,
      estoque: 50,
      estoqueMinimo: 10,
      unidade: 'l',
      fornecedor: 'Distribuidora ABC',
      localizacao: 'Prateleira A1',
      ativo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      codigo: 'FI001',
      nome: 'Filtro de Óleo',
      descricao: 'Filtro de óleo universal para motos',
      categoria: 'Filtros',
      marca: 'Mann',
      precoCompra: 15.00,
      precoVenda: 28.00,
      estoque: 25,
      estoqueMinimo: 5,
      unidade: 'un',
      fornecedor: 'Peças & Cia',
      localizacao: 'Gaveta B2',
      ativo: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  private static movimentacoes: MovimentacaoEstoque[] = [];

  static async getProdutos(): Promise<Produto[]> {
    const stored = localStorage.getItem('motogestor_produtos');
    return stored ? JSON.parse(stored) : this.produtos;
  }

  static async getProdutoById(id: string): Promise<Produto | null> {
    const produtos = await this.getProdutos();
    return produtos.find(p => p.id === id) || null;
  }

  static async criarProduto(produtoData: Omit<Produto, 'id' | 'createdAt' | 'updatedAt'>): Promise<Produto> {
    const produtos = await this.getProdutos();
    
    const novoProduto: Produto = {
      ...produtoData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    produtos.push(novoProduto);
    localStorage.setItem('motogestor_produtos', JSON.stringify(produtos));
    
    return novoProduto;
  }

  static async atualizarProduto(id: string, updates: Partial<Produto>): Promise<Produto> {
    const produtos = await this.getProdutos();
    const index = produtos.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error('Produto não encontrado');
    
    produtos[index] = { ...produtos[index], ...updates, updatedAt: new Date() };
    localStorage.setItem('motogestor_produtos', JSON.stringify(produtos));
    
    return produtos[index];
  }

  static async movimentarEstoque(
    produtoId: string,
    tipo: 'entrada' | 'saida' | 'ajuste',
    quantidade: number,
    motivo: string,
    funcionarioId: string,
    osId?: string
  ): Promise<MovimentacaoEstoque> {
    const produto = await this.getProdutoById(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    // Calcular novo estoque
    let novoEstoque = produto.estoque;
    switch (tipo) {
      case 'entrada':
        novoEstoque += quantidade;
        break;
      case 'saida':
        novoEstoque -= quantidade;
        break;
      case 'ajuste':
        novoEstoque = quantidade;
        break;
    }

    if (novoEstoque < 0) {
      throw new Error('Estoque insuficiente');
    }

    // Atualizar estoque do produto
    await this.atualizarProduto(produtoId, { estoque: novoEstoque });

    // Registrar movimentação
    const movimentacao: MovimentacaoEstoque = {
      id: Math.random().toString(36).substr(2, 9),
      produtoId,
      produto,
      tipo,
      quantidade,
      valor: tipo === 'entrada' ? produto.precoCompra * quantidade : produto.precoVenda * quantidade,
      motivo,
      osId,
      funcionarioId,
      createdAt: new Date()
    };

    const movimentacoes = await this.getMovimentacoes();
    movimentacoes.push(movimentacao);
    localStorage.setItem('motogestor_movimentacoes', JSON.stringify(movimentacoes));

    return movimentacao;
  }

  static async getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
    const stored = localStorage.getItem('motogestor_movimentacoes');
    return stored ? JSON.parse(stored) : this.movimentacoes;
  }

  static async getProdutosEstoqueBaixo(): Promise<Produto[]> {
    const produtos = await this.getProdutos();
    return produtos.filter(p => p.estoque <= p.estoqueMinimo && p.ativo);
  }

  static async getRelatorioEstoque(): Promise<{
    totalProdutos: number;
    valorTotalEstoque: number;
    produtosEstoqueBaixo: number;
    movimentacoesMes: number;
  }> {
    const produtos = await this.getProdutos();
    const movimentacoes = await this.getMovimentacoes();
    const produtosEstoqueBaixo = await this.getProdutosEstoqueBaixo();

    const valorTotalEstoque = produtos.reduce((total, p) => 
      total + (p.estoque * p.precoCompra), 0
    );

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const movimentacoesMes = movimentacoes.filter(m => 
      new Date(m.createdAt) >= inicioMes
    ).length;

    return {
      totalProdutos: produtos.filter(p => p.ativo).length,
      valorTotalEstoque,
      produtosEstoqueBaixo: produtosEstoqueBaixo.length,
      movimentacoesMes
    };
  }

  // Integração com APIs externas
  static async sincronizarComAPI(integracaoId: string): Promise<boolean> {
    try {
      const integracoes = JSON.parse(localStorage.getItem('motogestor_integracoes') || '[]');
      const integracao = integracoes.find((i: IntegracaoAPI) => i.id === integracaoId);
      
      if (!integracao || !integracao.ativo) {
        throw new Error('Integração não encontrada ou inativa');
      }

      // Simular sincronização com API externa
      console.log(`Sincronizando estoque com ${integracao.nome}...`);
      
      // Em produção, faria a chamada real para a API
      const response = await fetch(integracao.url, {
        headers: {
          'Authorization': `Bearer ${integracao.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Processar dados recebidos
        const dadosExternos = await response.json();
        
        // Aplicar mapeamento de campos
        // ... lógica de sincronização
        
        // Atualizar última sincronização
        integracao.ultimaSync = new Date();
        localStorage.setItem('motogestor_integracoes', JSON.stringify(integracoes));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  }

  // Importar/Exportar dados
  static async exportarEstoque(): Promise<Blob> {
    const produtos = await this.getProdutos();
    const movimentacoes = await this.getMovimentacoes();
    
    const dados = {
      produtos,
      movimentacoes,
      exportadoEm: new Date().toISOString()
    };

    const jsonString = JSON.stringify(dados, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  static async importarEstoque(arquivo: File): Promise<boolean> {
    try {
      const texto = await arquivo.text();
      const dados = JSON.parse(texto);
      
      if (dados.produtos && Array.isArray(dados.produtos)) {
        localStorage.setItem('motogestor_produtos', JSON.stringify(dados.produtos));
      }
      
      if (dados.movimentacoes && Array.isArray(dados.movimentacoes)) {
        localStorage.setItem('motogestor_movimentacoes', JSON.stringify(dados.movimentacoes));
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao importar estoque:', error);
      return false;
    }
  }
}