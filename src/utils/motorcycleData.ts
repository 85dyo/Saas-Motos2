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
    'Bros 160',
    'Bros 150',
    'CB 600F Hornet',
    'CB 650R',
    'CBR 600RR',
    'CBR 1000RR',
    'CB 250F Twister',
    'CB 300R',
    'CG 160',
    'CG 160 Start',
    'CG 160 Fan',
    'CG 160 Titan',
    'CG 125',
    'Pop 110i',
    'Biz 125',
    'Biz 110i',
    'PCX 150',
    'ADV 150',
    'Elite 125',
    'XRE 300',
    'XRE 190',
    'NC 750X',
    'NC 700X',
    'CB 1000R',
    'CB 650F',
    'Shadow 600',
    'Shadow 750',
    'Gold Wing',
    'CB 500F',
    'CBR 500R',
    'CB 500X',
    'Rebel 300',
    'Rebel 500'
  ],
  'Yamaha': [
    'Factor 150',
    'Factor 125',
    'Lander 250',
    'Crosser 150',
    'Fazer 150',
    'Fazer 250',
    'XTZ 125',
    'XTZ 150 Crosser',
    'XTZ 250 Lander',
    'YZF-R1',
    'YZF-R1M',
    'YZF-R6',
    'YZF-R3',
    'YZF-R15',
    'MT-07',
    'MT-09',
    'MT-03',
    'MT-15',
    'MT-10',
    'XJ6',
    'XJ6 N',
    'Neo 125',
    'Neo 115',
    'Crypton 115',
    'Crypton T115',
    'Tenere 250',
    'Tenere 660',
    'Tenere 700',
    'V-Max',
    'Bolt',
    'Tracer 900',
    'Tracer 700',
    'FZ25',
    'XSR 155',
    'NMAX 160',
    'Aerox 155'
  ],
  'Kawasaki': [
    'Ninja 300',
    'Ninja 400',
    'Ninja 650',
    'Ninja 1000',
    'Ninja ZX-6R',
    'Ninja ZX-10R',
    'Ninja ZX-10RR',
    'Ninja H2',
    'Ninja H2R',
    'Z300',
    'Z400',
    'Z650',
    'Z900',
    'Z1000',
    'Z1000R',
    'Z125 Pro',
    'Versys 650',
    'Versys 1000',
    'Versys-X 300',
    'Vulcan S',
    'Vulcan 900',
    'W800',
    'W175',
    'KLX 450R',
    'KLX 230',
    'KX 250F',
    'Eliminator'
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
  
  // Formato antigo: LLL-NNNN (3 letras + 4 números)
  if (limpa.length <= 7 && /^[A-Z]{0,3}[0-9]{0,4}$/.test(limpa)) {
    if (limpa.length > 3) {
      return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
    }
    return limpa;
  }
  
  // Formato Mercosul: LLLNLNN (3 letras + 1 número + 1 letra + 2 números)
  if (limpa.length <= 7 && /^[A-Z]{0,3}[0-9]{0,1}[A-Z]{0,1}[0-9]{0,2}$/.test(limpa)) {
    return limpa;
  }
  
  return limpa;
};

export const validarPlaca = (placa: string): boolean => {
  const limpa = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Formato antigo: LLL-NNNN (3 letras + 4 números)
  const formatoAntigo = /^[A-Z]{3}[0-9]{4}$/.test(limpa);
  
  // Formato Mercosul: LLLNLNN (3 letras + 1 número + 1 letra + 2 números)
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