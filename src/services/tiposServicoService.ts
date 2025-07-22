import { TipoServico } from '../types';

export class TiposServicoService {
  private static tiposServico: TipoServico[] = [
    // SERVIÇOS PREVENTIVOS
    {
      id: 'troca-oleo-filtro',
      nome: 'Troca de Óleo e Filtro',
      categoria: 'preventiva',
      descricao: 'Troca completa do óleo do motor e filtro de óleo',
      tempoEstimado: 0.5,
      precoBase: 80.00,
      pecasNecessarias: [
        { pecaId: 'honda-oleo-10w30', quantidade: 3, obrigatoria: true },
        { pecaId: 'honda-filtro-oleo-cb600', quantidade: 1, obrigatoria: true }
      ],
      intervalos: {
        quilometragem: 3000,
        tempo: 6
      },
      ativo: true
    },
    {
      id: 'revisao-geral',
      nome: 'Revisão Geral',
      categoria: 'revisao',
      descricao: 'Revisão completa incluindo óleo, filtros, velas, corrente e freios',
      tempoEstimado: 3.0,
      precoBase: 250.00,
      pecasNecessarias: [
        { pecaId: 'honda-oleo-10w30', quantidade: 3, obrigatoria: true },
        { pecaId: 'honda-filtro-oleo-cb600', quantidade: 1, obrigatoria: true },
        { pecaId: 'yamaha-filtro-ar-xj6', quantidade: 1, obrigatoria: false },
        { pecaId: 'universal-vela-ngk-cr8e', quantidade: 4, obrigatoria: false }
      ],
      intervalos: {
        quilometragem: 6000,
        tempo: 12
      },
      ativo: true
    },
    {
      id: 'manutencao-freios',
      nome: 'Manutenção de Freios',
      categoria: 'preventiva',
      descricao: 'Troca de pastilhas, verificação de discos e fluido de freio',
      tempoEstimado: 1.5,
      precoBase: 150.00,
      pecasNecessarias: [
        { pecaId: 'honda-pastilha-freio-cb600', quantidade: 1, obrigatoria: true }
      ],
      intervalos: {
        quilometragem: 15000,
        tempo: 18
      },
      ativo: true
    },
    {
      id: 'troca-corrente-relacao',
      nome: 'Troca de Corrente e Relação',
      categoria: 'preventiva',
      descricao: 'Substituição completa do kit de transmissão (corrente, pinhão e coroa)',
      tempoEstimado: 2.0,
      precoBase: 200.00,
      pecasNecessarias: [
        { pecaId: 'kawasaki-corrente-ninja300', quantidade: 1, obrigatoria: true }
      ],
      intervalos: {
        quilometragem: 20000,
        tempo: 24
      },
      ativo: true
    },

    // SERVIÇOS CORRETIVOS
    {
      id: 'reparo-motor',
      nome: 'Reparo de Motor',
      categoria: 'corretiva',
      descricao: 'Diagnóstico e reparo de problemas no motor',
      tempoEstimado: 8.0,
      precoBase: 500.00,
      ativo: true
    },
    {
      id: 'reparo-sistema-eletrico',
      nome: 'Reparo Sistema Elétrico',
      categoria: 'corretiva',
      descricao: 'Diagnóstico e reparo de problemas elétricos',
      tempoEstimado: 2.5,
      precoBase: 120.00,
      ativo: true
    },
    {
      id: 'reparo-suspensao',
      nome: 'Reparo de Suspensão',
      categoria: 'corretiva',
      descricao: 'Manutenção e reparo do sistema de suspensão',
      tempoEstimado: 3.0,
      precoBase: 180.00,
      ativo: true
    },

    // SERVIÇOS DE EMERGÊNCIA
    {
      id: 'socorro-mecanico',
      nome: 'Socorro Mecânico',
      categoria: 'emergencia',
      descricao: 'Atendimento emergencial para panes',
      tempoEstimado: 1.0,
      precoBase: 80.00,
      ativo: true
    },
    {
      id: 'reparo-pneu-furo',
      nome: 'Reparo de Pneu (Furo)',
      categoria: 'emergencia',
      descricao: 'Reparo emergencial de furo em pneu',
      tempoEstimado: 0.5,
      precoBase: 25.00,
      ativo: true
    },

    // SERVIÇOS ESPECÍFICOS POR FABRICANTE
    {
      id: 'regulagem-valvulas-honda',
      nome: 'Regulagem de Válvulas Honda',
      categoria: 'revisao',
      descricao: 'Regulagem específica para motores Honda',
      tempoEstimado: 4.0,
      precoBase: 300.00,
      intervalos: {
        quilometragem: 24000,
        tempo: 24
      },
      fabricantesEspecificos: ['Honda'],
      ativo: true
    },
    {
      id: 'sincronismo-carburadores-yamaha',
      nome: 'Sincronismo de Carburadores Yamaha',
      categoria: 'revisao',
      descricao: 'Sincronização de carburadores múltiplos Yamaha',
      tempoEstimado: 2.5,
      precoBase: 180.00,
      fabricantesEspecificos: ['Yamaha'],
      ativo: true
    }
  ];

  static async getTiposServico(): Promise<TipoServico[]> {
    const stored = localStorage.getItem('motogestor_tipos_servico');
    return stored ? JSON.parse(stored) : this.tiposServico;
  }

  static async getTipoServicoById(id: string): Promise<TipoServico | null> {
    const tipos = await this.getTiposServico();
    return tipos.find(t => t.id === id) || null;
  }

  static async criarTipoServico(tipo: Omit<TipoServico, 'id'>): Promise<TipoServico> {
    const tipos = await this.getTiposServico();
    
    const novoTipo: TipoServico = {
      ...tipo,
      id: Math.random().toString(36).substr(2, 9)
    };

    tipos.push(novoTipo);
    localStorage.setItem('motogestor_tipos_servico', JSON.stringify(tipos));
    
    return novoTipo;
  }

  static async atualizarTipoServico(id: string, updates: Partial<TipoServico>): Promise<TipoServico> {
    const tipos = await this.getTiposServico();
    const index = tipos.findIndex(t => t.id === id);
    
    if (index === -1) throw new Error('Tipo de serviço não encontrado');
    
    tipos[index] = { ...tipos[index], ...updates };
    localStorage.setItem('motogestor_tipos_servico', JSON.stringify(tipos));
    
    return tipos[index];
  }

  static async deletarTipoServico(id: string): Promise<void> {
    const tipos = await this.getTiposServico();
    const filtered = tipos.filter(t => t.id !== id);
    localStorage.setItem('motogestor_tipos_servico', JSON.stringify(filtered));
  }

  // Buscar tipos de serviço por categoria
  static async getTiposPorCategoria(categoria: TipoServico['categoria']): Promise<TipoServico[]> {
    const tipos = await this.getTiposServico();
    return tipos.filter(t => t.categoria === categoria && t.ativo);
  }

  // Buscar tipos de serviço por fabricante
  static async getTiposPorFabricante(fabricante: string): Promise<TipoServico[]> {
    const tipos = await this.getTiposServico();
    return tipos.filter(t => 
      t.ativo && (
        !t.fabricantesEspecificos || 
        t.fabricantesEspecificos.includes(fabricante)
      )
    );
  }

  // Calcular preço estimado incluindo peças
  static async calcularPrecoEstimado(tipoId: string): Promise<number> {
    const tipo = await this.getTipoServicoById(tipoId);
    if (!tipo) return 0;

    let precoTotal = tipo.precoBase || 0;

    if (tipo.pecasNecessarias) {
      // Em produção, buscaria preços reais das peças
      const precoPecas = tipo.pecasNecessarias.reduce((sum, peca) => {
        // Preço simulado baseado no catálogo
        const precoUnitario = 50; // Preço médio simulado
        return sum + (precoUnitario * peca.quantidade);
      }, 0);
      
      precoTotal += precoPecas;
    }

    return precoTotal;
  }

  // Obter serviços recomendados baseado no histórico
  static async getServicosRecomendados(
    fabricante: string, 
    modelo: string, 
    quilometragem: number,
    ultimoServico?: Date
  ): Promise<TipoServico[]> {
    const tipos = await this.getTiposPorFabricante(fabricante);
    const recomendados: TipoServico[] = [];

    tipos.forEach(tipo => {
      if (tipo.intervalos) {
        let precisaServico = false;

        // Verificar por quilometragem
        if (tipo.intervalos.quilometragem) {
          const proximaQuilometragem = Math.floor(quilometragem / tipo.intervalos.quilometragem) * tipo.intervalos.quilometragem + tipo.intervalos.quilometragem;
          if (quilometragem >= proximaQuilometragem - 500) { // 500km de tolerância
            precisaServico = true;
          }
        }

        // Verificar por tempo
        if (tipo.intervalos.tempo && ultimoServico) {
          const mesesDesdeUltimo = Math.floor(
            (new Date().getTime() - ultimoServico.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          if (mesesDesdeUltimo >= tipo.intervalos.tempo) {
            precisaServico = true;
          }
        }

        if (precisaServico) {
          recomendados.push(tipo);
        }
      }
    });

    return recomendados.sort((a, b) => (a.precoBase || 0) - (b.precoBase || 0));
  }
}