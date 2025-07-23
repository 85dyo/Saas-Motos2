import { Moto, HistoricoServico, AlertaManutencao } from '../types';

// Interface para configuração de IA
interface IAConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'grok' | 'llama' | 'none';
  apiKey: string;
  model?: string;
}

// Função para obter configuração de IA
const getIAConfig = (): IAConfig | null => {
  try {
    const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
    const integracao = config.integracao || {};
    
    if (!integracao.aiProvider || integracao.aiProvider === 'none' || !integracao.aiApiKey) {
      return null;
    }
    
    return {
      provider: integracao.aiProvider,
      apiKey: integracao.aiApiKey,
      model: integracao.aiModel
    };
  } catch (error) {
    console.error('Erro ao obter configuração de IA:', error);
    return null;
  }
};

// Função para chamar API de IA
const callAIAPI = async (prompt: string, config: IAConfig): Promise<string | null> => {
  try {
    let apiUrl = '';
    let headers: any = {
      'Content-Type': 'application/json'
    };
    let body: any = {};
    
    switch (config.provider) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = {
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        };
        break;
        
      case 'anthropic':
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: config.model || 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        };
        break;
        
      case 'google':
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`;
        body = {
          contents: [{ parts: [{ text: prompt }] }]
        };
        break;
        
      default:
        console.warn(`Provedor de IA ${config.provider} não implementado ainda`);
        return null;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extrair resposta baseada no provedor
    switch (config.provider) {
      case 'openai':
        return data.choices?.[0]?.message?.content || null;
      case 'anthropic':
        return data.content?.[0]?.text || null;
      case 'google':
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      default:
        return null;
    }
  } catch (error) {
    console.error('Erro ao chamar API de IA:', error);
    return null;
  }
};

// Base de dados de manutenção por fabricante/modelo
interface ManualManutencao {
  fabricante: string;
  modelo?: string;
  intervalos: {
    oleo: { km: number; meses: number };
    filtroOleo: { km: number; meses: number };
    filtroAr: { km: number; meses: number };
    velas: { km: number; meses: number };
    corrente: { km: number; meses: number };
    freios: { km: number; meses: number };
    revisaoGeral: { km: number; meses: number };
  };
  alertasEspeciais?: {
    item: string;
    condicao: string;
    recomendacao: string;
  }[];
}

const manuaisManutencao: ManualManutencao[] = [
  {
    fabricante: 'Honda',
    intervalos: {
      oleo: { km: 3000, meses: 6 },
      filtroOleo: { km: 6000, meses: 12 },
      filtroAr: { km: 12000, meses: 12 },
      velas: { km: 12000, meses: 24 },
      corrente: { km: 15000, meses: 18 },
      freios: { km: 20000, meses: 24 },
      revisaoGeral: { km: 6000, meses: 12 }
    },
    alertasEspeciais: [
      {
        item: 'Válvulas',
        condicao: 'A cada 24.000km',
        recomendacao: 'Regulagem de válvulas necessária'
      }
    ]
  },
  {
    fabricante: 'Yamaha',
    intervalos: {
      oleo: { km: 3000, meses: 6 },
      filtroOleo: { km: 6000, meses: 12 },
      filtroAr: { km: 10000, meses: 12 },
      velas: { km: 10000, meses: 18 },
      corrente: { km: 12000, meses: 15 },
      freios: { km: 18000, meses: 24 },
      revisaoGeral: { km: 5000, meses: 10 }
    }
  },
  {
    fabricante: 'Kawasaki',
    intervalos: {
      oleo: { km: 4000, meses: 6 },
      filtroOleo: { km: 8000, meses: 12 },
      filtroAr: { km: 12000, meses: 12 },
      velas: { km: 15000, meses: 24 },
      corrente: { km: 15000, meses: 18 },
      freios: { km: 20000, meses: 24 },
      revisaoGeral: { km: 8000, meses: 12 }
    }
  }
];

export class AnaliseInteligente {
  // Analisar risco baseado no histórico e manual do fabricante
  static async analisarRiscoMoto(
    moto: Moto, 
    historico: HistoricoServico[], 
    quilometragemAtual: number
  ): Promise<{
    riscoPotencial: 'baixo' | 'medio' | 'alto' | 'critico';
    score: number;
    fatoresRisco: string[];
    recomendacoes: string[];
    proximosServicos: { item: string; urgencia: 'baixa' | 'media' | 'alta'; prazo: string }[];
  }> {
    // Verificar se IA está configurada
    const iaConfig = getIAConfig();
    
    if (iaConfig) {
      try {
        const prompt = `
Analise o histórico de manutenção desta motocicleta e forneça insights:

Motocicleta: ${moto.fabricante} ${moto.modelo} (${moto.ano})
Quilometragem atual: ${quilometragemAtual}km

Histórico de serviços (${historico.length} registros):
${historico.slice(0, 10).map(h => 
  `- ${h.data}: ${h.descricao} (${h.quilometragem}km, ${h.tipoServico}, R$ ${h.valor})`
).join('\n')}

Por favor, forneça uma análise estruturada em JSON com:
{
  "riscoPotencial": "baixo|medio|alto|critico",
  "score": 0-100,
  "fatoresRisco": ["fator1", "fator2"],
  "recomendacoes": ["rec1", "rec2"],
  "proximosServicos": [{"item": "nome", "urgencia": "baixa|media|alta", "prazo": "descrição"}]
}

Base sua análise em:
- Frequência de manutenções
- Tipos de serviços (preventivo vs corretivo)
- Idade da motocicleta
- Padrões de quilometragem
- Custos crescentes
        `;
        
        const aiResponse = await callAIAPI(prompt, iaConfig);
        
        if (aiResponse) {
          try {
            const parsed = JSON.parse(aiResponse);
            return {
              riscoPotencial: parsed.riscoPotencial || 'medio',
              score: parsed.score || 70,
              fatoresRisco: parsed.fatoresRisco || [],
              recomendacoes: parsed.recomendacoes || [],
              proximosServicos: parsed.proximosServicos || []
            };
          } catch (parseError) {
            console.error('Erro ao parsear resposta da IA:', parseError);
          }
        }
      } catch (error) {
        console.error('Erro na análise com IA:', error);
      }
    }
    
    // Fallback para análise tradicional
    const manual = this.getManualManutencao(moto.fabricante, moto.modelo);
    const ultimoServico = historico[0];
    const hoje = new Date();
    
    let score = 100; // Começa com score máximo
    const fatoresRisco: string[] = [];
    const recomendacoes: string[] = [];
    const proximosServicos: any[] = [];

    // Análise temporal - último serviço
    if (ultimoServico) {
      const diasSemServico = Math.floor(
        (hoje.getTime() - new Date(ultimoServico.data).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diasSemServico > 365) {
        score -= 40;
        fatoresRisco.push('Mais de 1 ano sem manutenção');
        recomendacoes.push('Revisão geral urgente recomendada');
      } else if (diasSemServico > 180) {
        score -= 25;
        fatoresRisco.push('Mais de 6 meses sem manutenção');
        recomendacoes.push('Agendar revisão preventiva');
      }
    } else {
      score -= 50;
      fatoresRisco.push('Nenhum histórico de manutenção');
      recomendacoes.push('Primeira revisão completa necessária');
    }

    // Análise baseada no manual do fabricante
    if (manual) {
      const servicosVencidos = this.verificarServicosVencidos(
        manual, 
        historico, 
        quilometragemAtual, 
        hoje
      );

      servicosVencidos.forEach(servico => {
        const penalidade = this.calcularPenalidadeServico(servico.tipo, servico.atraso);
        score -= penalidade;
        fatoresRisco.push(`${servico.tipo} vencido há ${servico.atraso.dias} dias`);
        
        proximosServicos.push({
          item: servico.tipo,
          urgencia: servico.atraso.dias > 90 ? 'alta' : servico.atraso.dias > 30 ? 'media' : 'baixa',
          prazo: servico.atraso.dias > 0 ? 'Vencido' : `${servico.diasRestantes} dias`
        });
      });
    }

    // Análise de padrões no histórico
    const padroes = this.analisarPadroesHistorico(historico);
    
    if (padroes.frequenciaProblemas > 0.3) {
      score -= 20;
      fatoresRisco.push('Alta frequência de problemas');
      recomendacoes.push('Investigar causa raiz dos problemas recorrentes');
    }

    if (padroes.custoCrescente) {
      score -= 15;
      fatoresRisco.push('Custos de manutenção crescentes');
      recomendacoes.push('Avaliar custo-benefício de manutenções preventivas');
    }

    // Análise específica por idade da moto
    const idadeMoto = hoje.getFullYear() - moto.ano;
    if (idadeMoto > 10) {
      score -= 10;
      fatoresRisco.push('Motocicleta com mais de 10 anos');
      recomendacoes.push('Atenção especial a componentes de desgaste');
    }

    // Determinar nível de risco
    let riscoPotencial: 'baixo' | 'medio' | 'alto' | 'critico';
    if (score >= 80) riscoPotencial = 'baixo';
    else if (score >= 60) riscoPotencial = 'medio';
    else if (score >= 40) riscoPotencial = 'alto';
    else riscoPotencial = 'critico';

    return {
      riscoPotencial,
      score: Math.max(0, score),
      fatoresRisco,
      recomendacoes,
      proximosServicos
    };
  }

  // Gerar alertas inteligentes baseados no manual
  static async gerarAlertasInteligentes(
    moto: Moto,
    historico: HistoricoServico[],
    quilometragemAtual: number
  ): Promise<Omit<AlertaManutencao, 'id' | 'clienteId' | 'createdAt'>[]> {
    // Verificar se IA está configurada para alertas preditivos
    const iaConfig = getIAConfig();
    const config = JSON.parse(localStorage.getItem('motogestor_config') || '{}');
    
    if (iaConfig && config.integracao?.alertasPreditivos) {
      try {
        const prompt = `
Gere alertas de manutenção inteligentes para esta motocicleta:

Motocicleta: ${moto.fabricante} ${moto.modelo} (${moto.ano})
Quilometragem atual: ${quilometragemAtual}km

Histórico recente:
${historico.slice(0, 5).map(h => 
  `- ${h.data}: ${h.descricao} (${h.quilometragem}km)`
).join('\n')}

Forneça alertas em JSON:
[
  {
    "tipo": "quilometragem|tempo|peca_garantia",
    "prioridade": "baixa|media|alta|critica",
    "titulo": "Título do alerta",
    "descricao": "Descrição detalhada",
    "diasParaVencimento": 30,
    "kmParaVencimento": 1000
  }
]

Base os alertas em:
- Intervalos típicos para ${moto.fabricante}
- Padrão de uso baseado no histórico
- Idade da motocicleta
- Peças que podem estar próximas do fim da vida útil
        `;
        
        const aiResponse = await callAIAPI(prompt, iaConfig);
        
        if (aiResponse) {
          try {
            const alertasIA = JSON.parse(aiResponse);
            const hoje = new Date();
            
            return alertasIA.map((alerta: any) => ({
              motoId: moto.id,
              tipo: alerta.tipo || 'quilometragem',
              prioridade: alerta.prioridade || 'media',
              titulo: alerta.titulo,
              descricao: alerta.descricao,
              dataVencimento: new Date(hoje.getTime() + (alerta.diasParaVencimento || 30) * 24 * 60 * 60 * 1000),
              quilometragemVencimento: quilometragemAtual + (alerta.kmParaVencimento || 1000),
              status: 'ativo' as const
            }));
          } catch (parseError) {
            console.error('Erro ao parsear alertas da IA:', parseError);
          }
        }
      } catch (error) {
        console.error('Erro ao gerar alertas com IA:', error);
      }
    }
    
    // Fallback para alertas baseados no manual
    const manual = this.getManualManutencao(moto.fabricante, moto.modelo);
    const alertas: Omit<AlertaManutencao, 'id' | 'clienteId' | 'createdAt'>[] = [];
    
    if (!manual) return alertas;

    const hoje = new Date();
    
    // Verificar cada tipo de manutenção
    Object.entries(manual.intervalos).forEach(([tipo, intervalo]) => {
      const ultimaManutencao = this.encontrarUltimaManutencao(historico, tipo);
      
      let proximaData = new Date(hoje);
      let proximaQuilometragem = quilometragemAtual;
      
      if (ultimaManutencao) {
        proximaData = new Date(ultimaManutencao.data);
        proximaData.setMonth(proximaData.getMonth() + intervalo.meses);
        proximaQuilometragem = ultimaManutencao.quilometragem + intervalo.km;
      } else {
        // Se nunca foi feito, usar intervalos a partir de agora
        proximaData.setMonth(proximaData.getMonth() + intervalo.meses);
        proximaQuilometragem += intervalo.km;
      }

      // Calcular urgência
      const diasRestantes = Math.floor(
        (proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      const kmRestantes = proximaQuilometragem - quilometragemAtual;

      let prioridade: 'baixa' | 'media' | 'alta' | 'critica' = 'baixa';
      let status: 'ativo' | 'agendado' | 'concluido' | 'ignorado' = 'ativo';

      if (diasRestantes <= 0 || kmRestantes <= 0) {
        prioridade = 'critica';
      } else if (diasRestantes <= 30 || kmRestantes <= 500) {
        prioridade = 'alta';
      } else if (diasRestantes <= 60 || kmRestantes <= 1000) {
        prioridade = 'media';
      }

      if (prioridade !== 'baixa') {
        alertas.push({
          motoId: moto.id,
          tipo: 'quilometragem',
          prioridade,
          titulo: this.getTituloManutencao(tipo),
          descricao: this.getDescricaoManutencao(tipo, diasRestantes, kmRestantes),
          dataVencimento: proximaData,
          quilometragemVencimento: proximaQuilometragem,
          status
        });
      }
    });

    // Alertas especiais do fabricante
    if (manual.alertasEspeciais) {
      manual.alertasEspeciais.forEach(alerta => {
        // Lógica para alertas especiais baseada na condição
        if (alerta.condicao.includes('24.000km') && quilometragemAtual >= 24000) {
          const ultimaRegulagem = this.encontrarUltimaManutencao(historico, 'válvulas');
          if (!ultimaRegulagem || (quilometragemAtual - ultimaRegulagem.quilometragem) >= 24000) {
            alertas.push({
              motoId: moto.id,
              tipo: 'quilometragem',
              prioridade: 'alta',
              titulo: alerta.item,
              descricao: alerta.recomendacao,
              dataVencimento: hoje,
              quilometragemVencimento: quilometragemAtual,
              status: 'ativo'
            });
          }
        }
      });
    }

    return alertas;
  }

  private static getManualManutencao(fabricante: string, modelo?: string): ManualManutencao | null {
    return manuaisManutencao.find(m => 
      m.fabricante.toLowerCase() === fabricante.toLowerCase() &&
      (!m.modelo || !modelo || m.modelo.toLowerCase() === modelo.toLowerCase())
    ) || manuaisManutencao.find(m => m.fabricante.toLowerCase() === fabricante.toLowerCase());
  }

  private static verificarServicosVencidos(
    manual: ManualManutencao,
    historico: HistoricoServico[],
    quilometragemAtual: number,
    hoje: Date
  ) {
    const servicosVencidos: any[] = [];

    Object.entries(manual.intervalos).forEach(([tipo, intervalo]) => {
      const ultimaManutencao = this.encontrarUltimaManutencao(historico, tipo);
      
      if (ultimaManutencao) {
        const proximaData = new Date(ultimaManutencao.data);
        proximaData.setMonth(proximaData.getMonth() + intervalo.meses);
        
        const proximaQuilometragem = ultimaManutencao.quilometragem + intervalo.km;
        
        const diasAtraso = Math.floor((hoje.getTime() - proximaData.getTime()) / (1000 * 60 * 60 * 24));
        const kmAtraso = quilometragemAtual - proximaQuilometragem;
        
        if (diasAtraso > 0 || kmAtraso > 0) {
          servicosVencidos.push({
            tipo,
            atraso: { dias: Math.max(0, diasAtraso), km: Math.max(0, kmAtraso) },
            diasRestantes: Math.max(0, -diasAtraso)
          });
        }
      }
    });

    return servicosVencidos;
  }

  private static encontrarUltimaManutencao(historico: HistoricoServico[], tipo: string): HistoricoServico | null {
    const palavrasChave = this.getPalavrasChaveManutencao(tipo);
    
    return historico.find(h => 
      palavrasChave.some(palavra => 
        h.descricao.toLowerCase().includes(palavra) ||
        h.pecasTrocadas.some(p => p.nome.toLowerCase().includes(palavra))
      )
    ) || null;
  }

  private static getPalavrasChaveManutencao(tipo: string): string[] {
    const mapa: { [key: string]: string[] } = {
      'oleo': ['óleo', 'oleo', 'lubrificante'],
      'filtroOleo': ['filtro óleo', 'filtro oleo', 'filtro de óleo'],
      'filtroAr': ['filtro ar', 'filtro de ar'],
      'velas': ['vela', 'velas', 'ignição'],
      'corrente': ['corrente', 'transmissão', 'relação'],
      'freios': ['freio', 'freios', 'pastilha', 'disco'],
      'revisaoGeral': ['revisão', 'revisao', 'geral', 'completa'],
      'válvulas': ['válvula', 'valvula', 'regulagem']
    };
    
    return mapa[tipo] || [tipo];
  }

  private static calcularPenalidadeServico(tipo: string, atraso: { dias: number; km: number }): number {
    const penalidades: { [key: string]: number } = {
      'oleo': 30, // Óleo é crítico
      'freios': 25, // Freios são segurança
      'velas': 15,
      'filtroOleo': 20,
      'filtroAr': 10,
      'corrente': 15,
      'revisaoGeral': 20
    };
    
    const basePenalty = penalidades[tipo] || 10;
    const multiplicador = Math.min(3, Math.max(1, atraso.dias / 30)); // Aumenta com o tempo
    
    return basePenalty * multiplicador;
  }

  private static analisarPadroesHistorico(historico: HistoricoServico[]) {
    if (historico.length < 3) {
      return { frequenciaProblemas: 0, custoCrescente: false };
    }

    // Calcular frequência de problemas (serviços corretivos vs preventivos)
    const servicosCorretivos = historico.filter(h => h.tipoServico === 'corretiva').length;
    const frequenciaProblemas = servicosCorretivos / historico.length;

    // Analisar tendência de custos
    const custosRecentes = historico.slice(0, 3).map(h => h.valor);
    const custosAntigos = historico.slice(-3).map(h => h.valor);
    
    const mediaCustosRecentes = custosRecentes.reduce((a, b) => a + b, 0) / custosRecentes.length;
    const mediaCustosAntigos = custosAntigos.reduce((a, b) => a + b, 0) / custosAntigos.length;
    
    const custoCrescente = mediaCustosRecentes > mediaCustosAntigos * 1.2;

    return { frequenciaProblemas, custoCrescente };
  }

  private static getTituloManutencao(tipo: string): string {
    const titulos: { [key: string]: string } = {
      'oleo': 'Troca de Óleo',
      'filtroOleo': 'Troca do Filtro de Óleo',
      'filtroAr': 'Troca do Filtro de Ar',
      'velas': 'Troca das Velas',
      'corrente': 'Manutenção da Corrente',
      'freios': 'Revisão dos Freios',
      'revisaoGeral': 'Revisão Geral'
    };
    
    return titulos[tipo] || `Manutenção: ${tipo}`;
  }

  private static getDescricaoManutencao(tipo: string, diasRestantes: number, kmRestantes: number): string {
    const base = this.getTituloManutencao(tipo);
    
    if (diasRestantes <= 0 && kmRestantes <= 0) {
      return `${base} - VENCIDA! Agende imediatamente.`;
    } else if (diasRestantes <= 30 || kmRestantes <= 500) {
      return `${base} - Vence em ${diasRestantes} dias ou ${kmRestantes}km. Agende em breve.`;
    } else {
      return `${base} - Próxima em ${diasRestantes} dias ou ${kmRestantes}km.`;
    }
  }
}