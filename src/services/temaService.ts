import { TemaPersonalizado } from '../types';

export class TemaService {
  private static temas: TemaPersonalizado[] = [
    {
      id: 'default',
      nome: 'MotoGestor Padrão',
      cores: {
        primaria: '#3B82F6',
        secundaria: '#6B7280',
        sucesso: '#10B981',
        aviso: '#F59E0B',
        erro: '#EF4444',
        fundo: '#F9FAFB',
        texto: '#111827'
      },
      ativo: true,
      createdAt: new Date()
    },
    {
      id: 'dark',
      nome: 'Modo Escuro',
      cores: {
        primaria: '#3B82F6',
        secundaria: '#9CA3AF',
        sucesso: '#10B981',
        aviso: '#F59E0B',
        erro: '#EF4444',
        fundo: '#1F2937',
        texto: '#F9FAFB'
      },
      ativo: false,
      createdAt: new Date()
    },
    {
      id: 'orange',
      nome: 'Laranja Vibrante',
      cores: {
        primaria: '#EA580C',
        secundaria: '#6B7280',
        sucesso: '#10B981',
        aviso: '#F59E0B',
        erro: '#EF4444',
        fundo: '#FFF7ED',
        texto: '#111827'
      },
      ativo: false,
      createdAt: new Date()
    }
  ];

  static async getTemas(): Promise<TemaPersonalizado[]> {
    const stored = localStorage.getItem('motogestor_temas');
    return stored ? JSON.parse(stored) : this.temas;
  }

  static async getTemaAtivo(): Promise<TemaPersonalizado> {
    const temas = await this.getTemas();
    return temas.find(t => t.ativo) || temas[0];
  }

  static async criarTema(tema: Omit<TemaPersonalizado, 'id' | 'createdAt'>): Promise<TemaPersonalizado> {
    const temas = await this.getTemas();
    
    const novoTema: TemaPersonalizado = {
      ...tema,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };

    temas.push(novoTema);
    localStorage.setItem('motogestor_temas', JSON.stringify(temas));
    
    return novoTema;
  }

  static async ativarTema(temaId: string): Promise<void> {
    const temas = await this.getTemas();
    
    // Desativar todos os temas
    temas.forEach(t => t.ativo = false);
    
    // Ativar o tema selecionado
    const tema = temas.find(t => t.id === temaId);
    if (tema) {
      tema.ativo = true;
      localStorage.setItem('motogestor_temas', JSON.stringify(temas));
      await this.aplicarTema(tema);
    }
  }

  static async aplicarTema(tema: TemaPersonalizado): Promise<void> {
    const root = document.documentElement;
    
    // Aplicar variáveis CSS
    root.style.setProperty('--cor-primaria', tema.cores.primaria);
    root.style.setProperty('--cor-secundaria', tema.cores.secundaria);
    root.style.setProperty('--cor-sucesso', tema.cores.sucesso);
    root.style.setProperty('--cor-aviso', tema.cores.aviso);
    root.style.setProperty('--cor-erro', tema.cores.erro);
    root.style.setProperty('--cor-fundo', tema.cores.fundo);
    root.style.setProperty('--cor-texto', tema.cores.texto);

    // Salvar tema ativo
    localStorage.setItem('tema_ativo', tema.id);
  }

  static async inicializarTema(): Promise<void> {
    const temaAtivoId = localStorage.getItem('tema_ativo');
    
    if (temaAtivoId) {
      const temas = await this.getTemas();
      const tema = temas.find(t => t.id === temaAtivoId);
      if (tema) {
        await this.aplicarTema(tema);
      }
    }
  }

  static async deletarTema(temaId: string): Promise<void> {
    if (temaId === 'default') return; // Não permitir deletar tema padrão
    
    const temas = await this.getTemas();
    const temasAtualizados = temas.filter(t => t.id !== temaId);
    
    localStorage.setItem('motogestor_temas', JSON.stringify(temasAtualizados));
  }

  // Gerar paleta de cores automaticamente
  static gerarPaletaCores(corBase: string): TemaPersonalizado['cores'] {
    // Algoritmo simples para gerar paleta baseada em uma cor
    // Em produção, usaria uma biblioteca como chroma.js
    
    return {
      primaria: corBase,
      secundaria: this.ajustarCor(corBase, -20),
      sucesso: '#10B981',
      aviso: '#F59E0B',
      erro: '#EF4444',
      fundo: this.ajustarCor(corBase, 95),
      texto: '#111827'
    };
  }

  private static ajustarCor(cor: string, porcentagem: number): string {
    // Função simples para ajustar luminosidade da cor
    // Em produção, usaria uma biblioteca mais robusta
    
    const hex = cor.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * porcentagem);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
}