import { CatalogoPeca } from '../types';

// Base de dados de peças baseada nas referências Honda, Yamaha e catálogos reais
export const catalogoPecas: CatalogoPeca[] = [
  // HONDA - Peças Motor
  {
    id: 'honda-oleo-10w30',
    codigo: '08221-99974',
    nome: 'Óleo Motor Honda 10W-30 SL',
    categoria: 'lubrificantes',
    subcategoria: 'Óleo Motor',
    fabricante: 'Honda',
    modelosCompativeis: ['CB 600F Hornet', 'CB 650R', 'CBR 600RR', 'NC 750X'],
    anosCompativeis: [2019, 2020, 2021, 2022, 2023, 2024],
    especificacoes: {
      'Viscosidade': '10W-30',
      'Classificação': 'SL',
      'Volume': '1 Litro',
      'Tipo': 'Sintético'
    },
    precoSugerido: 45.90,
    fornecedores: [
      { nome: 'Honda Oficial', preco: 45.90, prazoEntrega: 2, disponibilidade: 'disponivel' },
      { nome: 'Distribuidora ABC', preco: 42.50, prazoEntrega: 3, disponibilidade: 'disponivel' }
    ]
  },
  {
    id: 'honda-filtro-oleo-cb600',
    codigo: '15410-MCJ-505',
    nome: 'Filtro de Óleo CB 600F Hornet',
    categoria: 'filtros',
    subcategoria: 'Filtro de Óleo',
    fabricante: 'Honda',
    modelosCompativeis: ['CB 600F Hornet'],
    anosCompativeis: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014],
    especificacoes: {
      'Tipo': 'Cartucho',
      'Material': 'Papel',
      'Rosca': 'M20 x 1.5'
    },
    precoSugerido: 28.90,
    fornecedores: [
      { nome: 'Honda Oficial', preco: 28.90, prazoEntrega: 1, disponibilidade: 'disponivel' },
      { nome: 'Mann Filter', preco: 25.50, prazoEntrega: 2, disponibilidade: 'disponivel' }
    ]
  },
  {
    id: 'honda-pastilha-freio-cb600',
    codigo: '06455-MCJ-006',
    nome: 'Pastilha de Freio Dianteira CB 600F',
    categoria: 'freios',
    subcategoria: 'Pastilhas',
    fabricante: 'Honda',
    modelosCompativeis: ['CB 600F Hornet', 'CBR 600RR'],
    anosCompativeis: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014],
    especificacoes: {
      'Posição': 'Dianteira',
      'Material': 'Semi-metálica',
      'Espessura': '7.0mm'
    },
    precoSugerido: 89.90,
    fornecedores: [
      { nome: 'Honda Oficial', preco: 89.90, prazoEntrega: 2, disponibilidade: 'disponivel' },
      { nome: 'Cobreq', preco: 75.00, prazoEntrega: 1, disponibilidade: 'disponivel' }
    ]
  },

  // YAMAHA - Peças Motor
  {
    id: 'yamaha-oleo-yamalube',
    codigo: '90790-38056',
    nome: 'Óleo Yamalube 4T 20W-50',
    categoria: 'lubrificantes',
    subcategoria: 'Óleo Motor',
    fabricante: 'Yamaha',
    modelosCompativeis: ['XJ6', 'MT-07', 'MT-09', 'YZF-R3', 'Fazer 250'],
    anosCompativeis: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    especificacoes: {
      'Viscosidade': '20W-50',
      'Classificação': 'SL',
      'Volume': '1 Litro',
      'Tipo': 'Mineral'
    },
    precoSugerido: 38.90,
    fornecedores: [
      { nome: 'Yamaha Oficial', preco: 38.90, prazoEntrega: 2, disponibilidade: 'disponivel' },
      { nome: 'Distribuidora XYZ', preco: 35.50, prazoEntrega: 3, disponibilidade: 'disponivel' }
    ]
  },
  {
    id: 'yamaha-filtro-ar-xj6',
    codigo: '1WD-14451-00',
    nome: 'Filtro de Ar XJ6',
    categoria: 'filtros',
    subcategoria: 'Filtro de Ar',
    fabricante: 'Yamaha',
    modelosCompativeis: ['XJ6', 'XJ6 N'],
    anosCompativeis: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
    especificacoes: {
      'Tipo': 'Papel',
      'Formato': 'Retangular',
      'Dimensões': '280x180x45mm'
    },
    precoSugerido: 45.90,
    fornecedores: [
      { nome: 'Yamaha Oficial', preco: 45.90, prazoEntrega: 3, disponibilidade: 'disponivel' },
      { nome: 'Tecfil', preco: 38.90, prazoEntrega: 2, disponibilidade: 'disponivel' }
    ]
  },

  // KAWASAKI - Peças
  {
    id: 'kawasaki-corrente-ninja300',
    codigo: '92057-0003',
    nome: 'Corrente de Transmissão Ninja 300',
    categoria: 'transmissao',
    subcategoria: 'Corrente',
    fabricante: 'Kawasaki',
    modelosCompativeis: ['Ninja 300', 'Z300'],
    anosCompativeis: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    especificacoes: {
      'Tipo': '520',
      'Elos': '110',
      'Tensão': '22-27mm'
    },
    precoSugerido: 125.90,
    fornecedores: [
      { nome: 'Kawasaki Oficial', preco: 125.90, prazoEntrega: 5, disponibilidade: 'sob_encomenda' },
      { nome: 'DID Chain', preco: 110.00, prazoEntrega: 3, disponibilidade: 'disponivel' }
    ]
  },

  // PEÇAS UNIVERSAIS
  {
    id: 'universal-vela-ngk-cr8e',
    codigo: 'CR8E',
    nome: 'Vela de Ignição NGK CR8E',
    categoria: 'eletrica',
    subcategoria: 'Velas',
    fabricante: 'NGK',
    modelosCompativeis: ['CB 600F Hornet', 'XJ6', 'Ninja 650', 'MT-07'],
    anosCompativeis: [2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    especificacoes: {
      'Abertura': '0.8mm',
      'Rosca': '12mm',
      'Alcance': '19mm',
      'Grau Térmico': '8'
    },
    precoSugerido: 18.90,
    fornecedores: [
      { nome: 'NGK Oficial', preco: 18.90, prazoEntrega: 1, disponibilidade: 'disponivel' },
      { nome: 'Auto Peças Silva', preco: 16.50, prazoEntrega: 1, disponibilidade: 'disponivel' }
    ]
  },
  {
    id: 'universal-oleo-motul-5100',
    codigo: 'MOTUL-5100-10W40',
    nome: 'Óleo Motul 5100 10W-40 4T',
    categoria: 'lubrificantes',
    subcategoria: 'Óleo Motor',
    fabricante: 'Motul',
    modelosCompativeis: ['Todas as motocicletas 4 tempos'],
    anosCompativeis: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    especificacoes: {
      'Viscosidade': '10W-40',
      'Classificação': 'SL/MA2',
      'Volume': '1 Litro',
      'Tipo': 'Semi-sintético'
    },
    precoSugerido: 52.90,
    fornecedores: [
      { nome: 'Motul Brasil', preco: 52.90, prazoEntrega: 2, disponibilidade: 'disponivel' },
      { nome: 'Distribuidora Premium', preco: 48.90, prazoEntrega: 3, disponibilidade: 'disponivel' }
    ]
  }
];

// Categorias de peças organizadas
export const categoriasPecas = {
  'motor': {
    nome: 'Motor',
    subcategorias: ['Pistão', 'Biela', 'Virabrequim', 'Válvulas', 'Comando', 'Junta do Cabeçote']
  },
  'transmissao': {
    nome: 'Transmissão',
    subcategorias: ['Corrente', 'Coroa', 'Pinhão', 'Embreagem', 'Cabo de Embreagem']
  },
  'freios': {
    nome: 'Freios',
    subcategorias: ['Pastilhas', 'Disco', 'Fluido', 'Cabo de Freio', 'Cilindro Mestre']
  },
  'suspensao': {
    nome: 'Suspensão',
    subcategorias: ['Amortecedor', 'Garfo', 'Mola', 'Rolamento', 'Retentor']
  },
  'eletrica': {
    nome: 'Elétrica',
    subcategorias: ['Velas', 'Bateria', 'Alternador', 'Regulador', 'Chicote', 'Lâmpadas']
  },
  'carroceria': {
    nome: 'Carroceria',
    subcategorias: ['Carenagem', 'Para-lama', 'Tanque', 'Banco', 'Espelhos']
  },
  'filtros': {
    nome: 'Filtros',
    subcategorias: ['Filtro de Óleo', 'Filtro de Ar', 'Filtro de Combustível']
  },
  'lubrificantes': {
    nome: 'Lubrificantes',
    subcategorias: ['Óleo Motor', 'Óleo de Transmissão', 'Graxa', 'Fluido de Freio']
  }
};

// Função para buscar peças por modelo/ano
export const buscarPecasPorModelo = (modelo: string, ano: number): CatalogoPeca[] => {
  return catalogoPecas.filter(peca => 
    peca.modelosCompativeis.some(m => m.toLowerCase().includes(modelo.toLowerCase())) &&
    peca.anosCompativeis.includes(ano)
  );
};

// Função para buscar peças por categoria
export const buscarPecasPorCategoria = (categoria: string): CatalogoPeca[] => {
  return catalogoPecas.filter(peca => peca.categoria === categoria);
};

// Função para buscar peças por código
export const buscarPecaPorCodigo = (codigo: string): CatalogoPeca | undefined => {
  return catalogoPecas.find(peca => 
    peca.codigo.toLowerCase() === codigo.toLowerCase()
  );
};

// Função para obter fornecedores de uma peça
export const obterFornecedoresPeca = (pecaId: string) => {
  const peca = catalogoPecas.find(p => p.id === pecaId);
  return peca?.fornecedores || [];
};

// Função para calcular preço médio de uma peça
export const calcularPrecoMedio = (pecaId: string): number => {
  const peca = catalogoPecas.find(p => p.id === pecaId);
  if (!peca || peca.fornecedores.length === 0) return 0;
  
  const precoTotal = peca.fornecedores.reduce((sum, fornecedor) => sum + fornecedor.preco, 0);
  return precoTotal / peca.fornecedores.length;
};