// Dados de motocicletas para dropdowns inteligentes
export const fabricantes = [
  'Honda',
  'Yamaha', 
  'Kawasaki',
  'Suzuki',
  'BMW',
  'Ducati',
  'Triumph',
  'Harley-Davidson',
  'KTM',
  'Aprilia',
  'Moto Guzzi',
  'Indian',
  'Royal Enfield',
  'Benelli',
  'CF Moto',
  'Shineray',
  'Traxx',
  'Dafra',
  'Kasinski',
  'Outros'
];

export const modelosPorFabricante: { [key: string]: string[] } = {
  'Honda': [
    'CB 600F Hornet',
    'CB 650R',
    'CBR 600RR',
    'CBR 1000RR',
    'CG 160',
    'CG 125',
    'Biz 125',
    'PCX 150',
    'CB 250F Twister',
    'XRE 300',
    'NC 750X',
    'CB 1000R',
    'Shadow 600',
    'Gold Wing',
    'CB 500F',
    'CBR 500R',
    'CB 500X'
  ],
  'Yamaha': [
    'YZF-R1',
    'YZF-R6',
    'YZF-R3',
    'MT-07',
    'MT-09',
    'MT-03',
    'XJ6',
    'XJ6 N',
    'Fazer 250',
    'Factor 125',
    'Neo 125',
    'Crypton 115',
    'XTZ 250 Lander',
    'XTZ 150 Crosser',
    'Tenere 250',
    'V-Max',
    'Bolt',
    'Tracer 900'
  ],
  'Kawasaki': [
    'Ninja 300',
    'Ninja 400',
    'Ninja 650',
    'Ninja ZX-6R',
    'Ninja ZX-10R',
    'Ninja H2',
    'Z300',
    'Z400',
    'Z650',
    'Z900',
    'Z1000',
    'Versys 650',
    'Versys 1000',
    'Vulcan S',
    'W800',
    'KLX 450R'
  ],
  'Suzuki': [
    'GSX-R600',
    'GSX-R750',
    'GSX-R1000',
    'GSX-S750',
    'GSX-S1000',
    'Bandit 650',
    'Bandit 1250',
    'V-Strom 650',
    'V-Strom 1000',
    'Hayabusa',
    'Boulevard M800',
    'Intruder 125',
    'Yes 125',
    'Burgman 125',
    'Burgman 400'
  ],
  'BMW': [
    'S1000RR',
    'S1000R',
    'S1000XR',
    'F800R',
    'F800GS',
    'F700GS',
    'R1200GS',
    'R1250GS',
    'K1600GT',
    'C650GT',
    'G310R',
    'G310GS'
  ],
  'Ducati': [
    'Panigale V4',
    'Panigale V2',
    'Monster 821',
    'Monster 1200',
    'Multistrada 950',
    'Multistrada 1260',
    'Scrambler Icon',
    'Scrambler Desert Sled',
    'Diavel 1260',
    'XDiavel',
    'Hypermotard 950'
  ]
};

// Gerar anos de fabricação (últimos 30 anos)
export const anosDisponiveis = (): number[] => {
  const anoAtual = new Date().getFullYear();
  const anos = [];
  for (let ano = anoAtual + 1; ano >= anoAtual - 30; ano--) {
    anos.push(ano);
  }
  return anos;
};

// Cores mais comuns para motocicletas
export const coresDisponiveis = [
  'Preta',
  'Branca',
  'Vermelha',
  'Azul',
  'Prata',
  'Cinza',
  'Verde',
  'Amarela',
  'Laranja',
  'Roxa',
  'Dourada',
  'Bronze',
  'Outras'
];

// Validação e formatação de placa
export const formatarPlaca = (placa: string): string => {
  // Remove caracteres não alfanuméricos
  const limpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Formato antigo: ABC-1234
  if (limpa.length <= 7 && /^[A-Z]{0,3}[0-9]{0,4}$/.test(limpa)) {
    if (limpa.length > 3) {
      return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
    }
    return limpa;
  }
  
  // Formato Mercosul: ABC1D23
  if (limpa.length <= 7 && /^[A-Z]{0,3}[0-9]{0,1}[A-Z]{0,1}[0-9]{0,2}$/.test(limpa)) {
    return limpa;
  }
  
  return limpa;
};

export const validarPlaca = (placa: string): boolean => {
  const limpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Formato antigo: ABC1234
  const formatoAntigo = /^[A-Z]{3}[0-9]{4}$/.test(limpa);
  
  // Formato Mercosul: ABC1D23
  const formatoMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/.test(limpa);
  
  return formatoAntigo || formatoMercosul;
};

export const getTipoPlaca = (placa: string): 'antiga' | 'mercosul' | 'invalida' => {
  const limpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  if (/^[A-Z]{3}[0-9]{4}$/.test(limpa)) {
    return 'antiga';
  }
  
  if (/^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/.test(limpa)) {
    return 'mercosul';
  }
  
  return 'invalida';
};