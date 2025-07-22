import { HistoricoServico, PecaTrocada, AlertaManutencao } from '../types';
import { AnaliseInteligente } from './analiseInteligente';

export class HistoricoService {
  private static getHistorico(): HistoricoServico[] {
    const stored = localStorage.getItem('motogestor_historico');
    return stored ? JSON.parse(stored) : [];
  }

  private static saveHistorico(historico: HistoricoServico[]): void {
    localStorage.setItem('motogestor_historico', JSON.stringify(historico));
  }

  private static getAlertas(): AlertaManutencao[] {
    const stored = localStorage.getItem('motogestor_alertas');
    return stored ? JSON.parse(stored) : [];
  }

  private static saveAlertas(alertas: AlertaManutencao[]): void {
    localStorage.setItem('motogestor_alertas', JSON.stringify(alertas));
  }

  // Histórico de Serviços
  static async getHistoricoMoto(motoId: string): Promise<HistoricoServico[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const historico = this.getHistorico();
    return historico
      .filter(h => h.motoId === motoId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  static async adicionarHistorico(dados: Omit<HistoricoServico, 'id'>): Promise<HistoricoServico> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const historico = this.getHistorico();
    const novoRegistro: HistoricoServico = {
      ...dados,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    historico.push(novoRegistro);
    this.saveHistorico(historico);
    
    // Gerar alertas automáticos baseados no serviço
    await this.gerarAlertasAutomaticos(novoRegistro);
    
    return novoRegistro;
  }

  // Sistema de Alertas Inteligentes
  static async getAlertasAtivos(clienteId?: string): Promise<AlertaManutencao[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const alertas = this.getAlertas();
    
    let filtrados = alertas.filter(a => a.status === 'ativo');
    
    if (clienteId) {
      filtrados = filtrados.filter(a => a.clienteId === clienteId);
    }
    
    return filtrados.sort((a, b) => {
      const prioridadeOrder = { 'critica': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
      return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
    });
  }

  static async gerarAlertasAutomaticos(historico: HistoricoServico): Promise<void> {
    const alertas = this.getAlertas();
    
    // Alerta de próxima revisão baseado em quilometragem
    if (historico.proximaRevisao) {
      const alertaRevisao: AlertaManutencao = {
        id: Math.random().toString(36).substr(2, 9),
        motoId: historico.motoId,
        clienteId: '', // Será preenchido pelo serviço que chama
        tipo: 'quilometragem',
        prioridade: 'media',
        titulo: 'Revisão Programada',
        descricao: `Próxima revisão em ${historico.proximaRevisao.quilometragem}km ou ${historico.proximaRevisao.data.toLocaleDateString()}`,
        dataVencimento: historico.proximaRevisao.data,
        quilometragemVencimento: historico.proximaRevisao.quilometragem,
        status: 'ativo',
        createdAt: new Date()
      };
      
      alertas.push(alertaRevisao);
    }

    // Alertas de garantia de peças
    historico.pecasTrocadas.forEach(peca => {
      if (peca.garantia) {
        const dataVencimento = new Date();
        dataVencimento.setMonth(dataVencimento.getMonth() + peca.garantia.meses);
        
        const alertaGarantia: AlertaManutencao = {
          id: Math.random().toString(36).substr(2, 9),
          motoId: historico.motoId,
          clienteId: '',
          tipo: 'peca_garantia',
          prioridade: 'baixa',
          titulo: 'Garantia de Peça',
          descricao: `Garantia da peça ${peca.nome} vence em ${dataVencimento.toLocaleDateString()}`,
          dataVencimento,
          quilometragemVencimento: historico.quilometragem + (peca.garantia.quilometragem || 0),
          status: 'ativo',
          createdAt: new Date()
        };
        
        alertas.push(alertaGarantia);
      }
    });

    this.saveAlertas(alertas);
  }

  // IA Preditiva para Manutenção
  static async analisarPadraoManutencao(motoId: string): Promise<{
    proximosServicos: string[];
    riscoPotencial: 'baixo' | 'medio' | 'alto';
    recomendacoes: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const historico = await this.getHistoricoMoto(motoId);

    // Usar análise inteligente se disponível
    const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
    if (config.integracao?.analiseIA) {
      try {
        // Buscar dados da moto (simulado)
        const moto = { id: motoId, fabricante: 'Honda', modelo: 'CB 600F', ano: 2020 };
        const quilometragemAtual = 15000; // Simulado
        
        const analise = await AnaliseInteligente.analisarRiscoMoto(moto, historico, quilometragemAtual);
        
        return {
          proximosServicos: analise.proximosServicos.map(s => s.item),
          riscoPotencial: analise.riscoPotencial === 'critico' ? 'alto' : analise.riscoPotencial,
          recomendacoes: analise.recomendacoes
        };
      } catch (error) {
        console.error('Erro na análise inteligente:', error);
      }
    }

    // Fallback para análise simples
    return this.analiseSimplesPatrao(historico);
  }

  private static analiseSimplesPatrao(historico: HistoricoServico[]) {
    const servicosFrequentes = this.analisarFrequenciaServicos(historico);
    const ultimoServico = historico[0];
    
    let riscoPotencial: 'baixo' | 'medio' | 'alto' = 'baixo';
    const recomendacoes: string[] = [];
    
    if (ultimoServico) {
      const diasDesdeUltimoServico = Math.floor(
        (new Date().getTime() - new Date(ultimoServico.data).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasDesdeUltimoServico > 180) {
        riscoPotencial = 'alto';
        recomendacoes.push('Revisão geral recomendada - mais de 6 meses sem manutenção');
      } else if (diasDesdeUltimoServico > 90) {
        riscoPotencial = 'medio';
        recomendacoes.push('Verificação preventiva recomendada');
      }
    }
    
    const proximosServicos = servicosFrequentes.slice(0, 3);
    
    return {
      proximosServicos,
      riscoPotencial,
      recomendacoes
    };
  }

  private static analisarFrequenciaServicos(historico: HistoricoServico[]): string[] {
    const frequencia: { [key: string]: number } = {};
    
    historico.forEach(h => {
      const palavrasChave = h.descricao.toLowerCase().split(' ');
      palavrasChave.forEach(palavra => {
        if (palavra.length > 3) {
          frequencia[palavra] = (frequencia[palavra] || 0) + 1;
        }
      });
    });
    
    return Object.entries(frequencia)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([servico]) => servico);
  }

  // Relatório Médico da Moto
  static async gerarRelatorioMedico(motoId: string): Promise<{
    resumo: string;
    historico: HistoricoServico[];
    alertas: AlertaManutencao[];
    analise: any;
    proximasManutencoes: { tipo: string; data: Date; prioridade: string }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const [historico, alertas, analise] = await Promise.all([
      this.getHistoricoMoto(motoId),
      this.getAlertasAtivos(),
      this.analisarPadraoManutencao(motoId)
    ]);
    
    const alertasMoto = alertas.filter(a => a.motoId === motoId);
    
    const resumo = this.gerarResumoMedico(historico, alertasMoto);
    
    const proximasManutencoes = alertasMoto.map(alerta => ({
      tipo: alerta.titulo,
      data: alerta.dataVencimento,
      prioridade: alerta.prioridade
    }));
    
    return {
      resumo,
      historico,
      alertas: alertasMoto,
      analise,
      proximasManutencoes
    };
  }

  private static gerarResumoMedico(historico: HistoricoServico[], alertas: AlertaManutencao[]): string {
    const totalServicos = historico.length;
    const valorTotal = historico.reduce((sum, h) => sum + h.valor, 0);
    const ultimoServico = historico[0];
    const alertasCriticos = alertas.filter(a => a.prioridade === 'critica').length;
    
    let resumo = `Motocicleta com ${totalServicos} serviços realizados, `;
    resumo += `investimento total de R$ ${valorTotal.toFixed(2)}. `;
    
    if (ultimoServico) {
      const diasUltimoServico = Math.floor(
        (new Date().getTime() - new Date(ultimoServico.data).getTime()) / (1000 * 60 * 60 * 24)
      );
      resumo += `Último serviço há ${diasUltimoServico} dias. `;
    }
    
    if (alertasCriticos > 0) {
      resumo += `⚠️ ${alertasCriticos} alerta(s) crítico(s) pendente(s).`;
    } else {
      resumo += `✅ Situação geral: Em dia com as manutenções.`;
    }
    
    return resumo;
  }
}