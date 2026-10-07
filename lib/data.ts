export type Perfil = 'gerador' | 'comprador';
export type Categoria = 'Papelão e Papel' | 'Plásticos' | 'Sucatas e Metais' | 'Madeira' | 'Químicos e Tintas';
export type StatusLote = 'Disponível' | 'Reservado' | 'Vendido';
export type StatusPedido = 'Aguardando Pagamento' | 'Pagamento Retido no Escrow' | 'Concluído';

export const CATEGORIAS: Categoria[] = ['Papelão e Papel', 'Plásticos', 'Sucatas e Metais', 'Madeira', 'Químicos e Tintas'];

export interface Empresa {
  nome: string;
  cnpj: string;
  cidade: string;
  endereco: string;
}

export interface Lote {
  id: string;
  nome: string;
  categoria: Categoria;
  quantidade: number; // toneladas
  precoUnidade: number; // R$ por tonelada
  descricao: string;
  gerador: Empresa;
  laudo: string | null;
  fds: string | null;
  status: StatusLote;
  criadoEm: string;
}

export interface Valores {
  residuos: number; // valor do material (repassado ao gerador)
  frete: number; // cotação do transporte local (repassada ao transportador)
  taxaIntermediacao: number; // 8% sobre o valor do lote
  margemFrete: number; // 6% sobre a cotação do frete
  taxa: number; // taxa de serviços EcoSearch = intermediação + margem de frete
  total: number; // total em custódia (escrow)
}

export interface Pedido {
  id: string;
  loteId: string;
  lote: Lote; // snapshot no momento da compra
  comprador: Empresa;
  valores: Valores;
  status: StatusPedido;
  criadoEm: string;
  mtr: { numero: string; emitidoEm: string } | null;
  pagoEm: string | null;
  recebidoEm: string | null;
  pesoBalanca: number | null;
}

// ─── Unit economics PME (premissas Inova Sebrae · RMC) ────────────────────────
export const TAXA_INTERMEDIACAO = 0.08;
export const TAXA_MARGEM_FRETE = 0.06;
export const PRECO_PRO = 99; // R$/mês — Plano SaaS Pro opcional
export const LIMITE_TRANSACOES_GRATIS = 3; // acima disso por mês, o Pro é recomendado
export const ASSINANTES_PRO_BASE = 7; // assinantes Pro da plataforma (mock)
export const BREAK_EVEN_OPERACOES = 34; // operações/mês na RMC
export const FAIXA_VOLUME = [1.5, 3] as const; // t por lote
export const FAIXA_TICKET = [1200, 3500] as const; // R$ por lote
export const FAIXA_FRETE = [300, 500] as const; // R$ frete local
export const FAIXA_ECONOMIA_VIRGEM = [0.4, 0.5] as const;

// ─── Empresas (fictícias) ─────────────────────────────────────────────────────
const empresa = (nome: string, cnpj: string, cidade: string, endereco: string): Empresa => ({ nome, cnpj, cidade, endereco });

export const EMPRESA_GERADORA = empresa(
  'Embalagens Iguaçu Ltda',
  '12.345.678/0001-90',
  'São José dos Pinhais/PR',
  'Av. Rui Barbosa, 5.500 — Afonso Pena',
);

export const EMPRESA_COMPRADORA = empresa(
  'Recicla Paraná Comércio de Recicláveis Ltda',
  '98.765.432/0001-10',
  'Curitiba/PR',
  'Rua Pedro Gusso, 2.800 — CIC',
);

export const TRANSPORTADORA = empresa(
  'Rápido RMC Transportes Ltda',
  '45.678.901/0001-23',
  'Curitiba/PR',
  'Rod. BR-116, 12.400 — Fanny',
);

const G = {
  demo: EMPRESA_GERADORA,
  mercado: empresa('Supermercado Bom Preço Pinhais Ltda', '21.111.222/0001-01', 'Pinhais/PR', 'Av. Camilo di Lellis, 1.020 — Centro'),
  moveleira: empresa('Moveleira Araucária Ltda', '21.222.333/0001-02', 'Araucária/PR', 'Rua Manoel Ribas, 4.150 — Costeira'),
  autopecas: empresa('Autopeças Colombo Ltda', '21.333.444/0001-03', 'Colombo/PR', 'Rod. da Uva, 3.300 — Roça Grande'),
  grafica: empresa('Gráfica Boqueirão Ltda', '21.444.555/0001-04', 'Curitiba/PR', 'Rua Francisco Derosso, 1.900 — Xaxim'),
  plasticos: empresa('Plásticos Fazenda Rio Grande Ltda', '21.555.666/0001-05', 'Fazenda Rio Grande/PR', 'Av. das Indústrias, 800 — Eucaliptos'),
  atacado: empresa('Distribuidora CIC Atacado Ltda', '21.666.777/0001-06', 'Curitiba/PR', 'Rua João Bettega, 5.200 — CIC'),
  serralheria: empresa('Serralheria Afonso Pena Ltda', '21.777.888/0001-07', 'São José dos Pinhais/PR', 'Rua Joinville, 2.410 — Afonso Pena'),
};

const C = {
  demo: EMPRESA_COMPRADORA,
  aparas: empresa('Aparas Paraná Comércio de Papéis Ltda', '31.111.222/0001-11', 'Campo Largo/PR', 'Rod. do Café, km 6 — Rondinha'),
  plastrecicla: empresa('PlastRecicla RMC Ltda', '31.222.333/0001-12', 'São José dos Pinhais/PR', 'Rua Izabel A Redentora, 3.050 — Centro'),
  sucatas: empresa('Sucatas Iguaçu Comércio de Metais Ltda', '31.333.444/0001-13', 'Fazenda Rio Grande/PR', 'Av. Brasil, 1.200 — Nações'),
  biomassa: empresa('Biomassa Sul Energia Ltda', '31.444.555/0001-14', 'Araucária/PR', 'Rod. do Xisto, km 18 — Distrito Industrial'),
  solvtec: empresa('Solvtec Recuperação de Solventes Ltda', '31.555.666/0001-15', 'Araucária/PR', 'Rua Pedro Druszcz, 600 — Thomaz Coelho'),
};

// ─── Parâmetros técnicos e de impacto por categoria ───────────────────────────
export const CATEGORIA_INFO: Record<
  Categoria,
  {
    perigoso: boolean;
    classe: string;
    classeCurta: 'I' | 'II A' | 'II B';
    codigoIbama: string;
    descricaoIbama: string;
    estadoFisico: string;
    acondicionamento: string;
    tecnologia: string;
    onu: string | null;
    exemplos: string;
    fatorCO2: number; // tCO2e evitadas por tonelada reaproveitada
    economiaVirgem: number; // economia do comprador vs. matéria-prima virgem (fração)
    custoAterro: number; // R$/t de aterro/destinação evitado pelo gerador
  }
> = {
  'Papelão e Papel': {
    perigoso: false,
    classe: 'Classe II A — Não perigoso, não inerte (NBR 10004)',
    classeCurta: 'II A',
    codigoIbama: '15 01 01',
    descricaoIbama: 'Embalagens de papel e cartão',
    estadoFisico: 'Sólido',
    acondicionamento: 'Fardos prensados',
    tecnologia: 'Reciclagem — aparas para indústria papeleira',
    onu: null,
    exemplos: 'Papelão ondulado, papel branco, cartonagem',
    fatorCO2: 0.9,
    economiaVirgem: 0.45,
    custoAterro: 400,
  },
  Plásticos: {
    perigoso: false,
    classe: 'Classe II B — Não perigoso, inerte (NBR 10004)',
    classeCurta: 'II B',
    codigoIbama: '15 01 02',
    descricaoIbama: 'Embalagens de plástico',
    estadoFisico: 'Sólido',
    acondicionamento: 'Fardos / big bags',
    tecnologia: 'Reciclagem mecânica',
    onu: null,
    exemplos: 'PP, PEAD, PET, PVC',
    fatorCO2: 1.5,
    economiaVirgem: 0.48,
    custoAterro: 400,
  },
  'Sucatas e Metais': {
    perigoso: false,
    classe: 'Classe II A — Não perigoso, não inerte (NBR 10004)',
    classeCurta: 'II A',
    codigoIbama: '17 04 07',
    descricaoIbama: 'Mistura de metais',
    estadoFisico: 'Sólido',
    acondicionamento: 'Caçamba / big bags',
    tecnologia: 'Reciclagem metalúrgica',
    onu: null,
    exemplos: 'Alumínio, aço, cobre',
    fatorCO2: 1.6,
    economiaVirgem: 0.42,
    custoAterro: 350,
  },
  Madeira: {
    perigoso: false,
    classe: 'Classe II A — Não perigoso, não inerte (NBR 10004)',
    classeCurta: 'II A',
    codigoIbama: '03 01 05',
    descricaoIbama: 'Serradura, aparas, fitas de aplainamento, madeira',
    estadoFisico: 'Sólido',
    acondicionamento: 'Granel / pallets empilhados',
    tecnologia: 'Reaproveitamento e biomassa',
    onu: null,
    exemplos: 'Pallets, serragem, retalhos',
    fatorCO2: 0.5,
    economiaVirgem: 0.4,
    custoAterro: 300,
  },
  'Químicos e Tintas': {
    perigoso: true,
    classe: 'Classe I — Perigoso (NBR 10004)',
    classeCurta: 'I',
    codigoIbama: '08 01 11*',
    descricaoIbama: 'Resíduos de tintas e vernizes contendo solventes orgânicos',
    estadoFisico: 'Líquido / pastoso',
    acondicionamento: 'Bombonas 50 L / tambores 200 L',
    tecnologia: 'Recuperação de solventes / coprocessamento',
    onu: 'ONU 1263 — Tinta ou material relacionado — Classe de risco 3',
    exemplos: 'Bombonas, solventes, borra de tinta (menor volume)',
    fatorCO2: 2.3,
    economiaVirgem: 0.5,
    custoAterro: 1800,
  },
};

const municipio = (cidade: string) => cidade.split('/')[0];

/** Cotação do frete local na RMC: mesma cidade R$ 300, entre municípios R$ 400, carga perigosa R$ 500. */
export function cotarFrete(origem: string, destino: string, perigoso: boolean) {
  if (perigoso) return FAIXA_FRETE[1];
  return municipio(origem) === municipio(destino) ? FAIXA_FRETE[0] : 400;
}

export function rotaFrete(lote: Lote, comprador: Empresa) {
  return `${municipio(lote.gerador.cidade)} → ${municipio(comprador.cidade)}`;
}

export function calcularValores(
  lote: Pick<Lote, 'quantidade' | 'precoUnidade' | 'categoria' | 'gerador'>,
  comprador: Empresa = EMPRESA_COMPRADORA,
): Valores {
  const residuos = round2(lote.quantidade * lote.precoUnidade);
  const frete = cotarFrete(lote.gerador.cidade, comprador.cidade, CATEGORIA_INFO[lote.categoria].perigoso);
  const taxaIntermediacao = round2(residuos * TAXA_INTERMEDIACAO);
  const margemFrete = round2(frete * TAXA_MARGEM_FRETE);
  const taxa = round2(taxaIntermediacao + margemFrete);
  return { residuos, frete, taxaIntermediacao, margemFrete, taxa, total: round2(residuos + frete + taxa) };
}

/** Comparativo de economia para o gerador (aterro evitado + receita) e para o comprador (vs. virgem). */
export function economiaLote(lote: Pick<Lote, 'quantidade' | 'precoUnidade' | 'categoria' | 'gerador'>, comprador?: Empresa) {
  const info = CATEGORIA_INFO[lote.categoria];
  const valores = calcularValores(lote, comprador);
  const custoVirgem = valores.total / (1 - info.economiaVirgem);
  return {
    aterroEvitado: info.custoAterro * lote.quantidade,
    receitaGerador: valores.residuos,
    percentualVirgem: info.economiaVirgem,
    economiaComprador: custoVirgem - valores.total,
  };
}

/** Pedido em que a empresa demo participa (como compradora ou geradora). */
export function envolveEmpresaDemo(p: Pedido) {
  return p.comprador.cnpj === EMPRESA_COMPRADORA.cnpj || p.lote.gerador.cnpj === EMPRESA_GERADORA.cnpj;
}

export function impactoPedido(p: Pedido) {
  const info = CATEGORIA_INFO[p.lote.categoria];
  const toneladas = p.pesoBalanca ?? p.lote.quantidade;
  const co2 = toneladas * info.fatorCO2;
  const economiaComprador = (p.valores.total / (1 - info.economiaVirgem)) * info.economiaVirgem;
  const economiaGerador = info.custoAterro * toneladas;
  return { toneladas, co2, economiaComprador, economiaGerador, economia: economiaComprador + economiaGerador };
}

export function gerarId(prefixo: string) {
  return `${prefixo}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function gerarNumeroMtr() {
  return `${new Date().getFullYear()}${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── Catálogo atual (lotes disponíveis) ───────────────────────────────────────
const HOJE = new Date();
const diasAtras = (d: number, hora = 13) => {
  const x = new Date(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate() - d, hora);
  return x.toISOString();
};

const lote = (
  id: string,
  nome: string,
  categoria: Categoria,
  quantidade: number,
  precoUnidade: number,
  gerador: Empresa,
  descricao: string,
  dias: number,
): Lote => ({
  id,
  nome,
  categoria,
  quantidade,
  precoUnidade,
  descricao,
  gerador,
  laudo: `laudo_${id.toLowerCase()}.pdf`,
  fds: CATEGORIA_INFO[categoria].perigoso ? `FISPQ_${id.toLowerCase()}.pdf` : null,
  status: 'Disponível',
  criadoEm: diasAtras(dias),
});

const LOTES_DISPONIVEIS: Lote[] = [
  lote('LT-PAP01', 'Aparas de Papelão Ondulado', 'Papelão e Papel', 2, 1250, G.demo,
    'Caixas de papelão ondulado pós-consumo do setor de expedição, secas e enfardadas (~250 kg/fardo).', 1),
  lote('LT-PLA02', 'Filme Stretch PEBD Transparente', 'Plásticos', 1.8, 1400, G.mercado,
    'Filme de paletização limpo, separado no recebimento de mercadorias. Geração recorrente de ~2 t/mês.', 2),
  lote('LT-MET03', 'Sucata de Aço Mista', 'Sucatas e Metais', 2.5, 1100, G.autopecas,
    'Retalhos de chapa e peças de aço carbono, sem óleo. Retirada em caçamba.', 2),
  lote('LT-MAD04', 'Pallets PBR Danificados', 'Madeira', 3, 600, G.atacado,
    'Cerca de 120 pallets PBR com avarias, ideais para recuperação ou biomassa.', 3),
  lote('LT-QUI05', 'Solvente de Limpeza Usado (bombonas 50 L)', 'Químicos e Tintas', 0.8, 2400, G.grafica,
    'Solvente de limpeza de impressoras offset, 16 bombonas de 50 L lacradas. Volume reduzido.', 3),
  lote('LT-PLA06', 'Bombonas de PEAD Limpas', 'Plásticos', 1.5, 1500, G.demo,
    'Bombonas de 50 L tríplice lavadas, sem rótulo de produto perigoso.', 4),
  lote('LT-PAP07', 'Papel Branco de Escritório', 'Papelão e Papel', 1.6, 1300, G.grafica,
    'Aparas de papel offset branco, sem impressão em cores. Alto valor para reciclagem.', 5),
  lote('LT-MET08', 'Sucata de Alumínio (perfis)', 'Sucatas e Metais', 0.45, 6800, G.serralheria,
    'Retalhos de perfis de alumínio de esquadrias. Lote de menor volume e alto valor.', 6),
  lote('LT-MAD09', 'Serragem e Maravalha', 'Madeira', 2.8, 450, G.moveleira,
    'Serragem seca de pinus, ensacada. Indicada para biomassa e cama de aviário.', 6),
];

// ─── Histórico de transações (gerado de forma determinística) ────────────────
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Material {
  nome: string;
  categoria: Categoria;
  qtd: [number, number];
  preco: [number, number];
}

const MATERIAIS: Material[] = [
  { nome: 'Aparas de Papelão Ondulado', categoria: 'Papelão e Papel', qtd: [1.5, 3], preco: [900, 1350] },
  { nome: 'Papelão Misto Enfardado', categoria: 'Papelão e Papel', qtd: [1.5, 3], preco: [800, 1200] },
  { nome: 'Papel Branco de Escritório', categoria: 'Papelão e Papel', qtd: [1.5, 2.5], preco: [1100, 1450] },
  { nome: 'Filme Stretch PEBD', categoria: 'Plásticos', qtd: [1.5, 2.5], preco: [1100, 1500] },
  { nome: 'Garrafas PET Prensadas', categoria: 'Plásticos', qtd: [1.5, 2.2], preco: [1300, 1600] },
  { nome: 'Aparas de PP Injetado', categoria: 'Plásticos', qtd: [1.5, 2.2], preco: [1200, 1550] },
  { nome: 'Tubos e Perfis de PVC', categoria: 'Plásticos', qtd: [1.5, 2.5], preco: [900, 1300] },
  { nome: 'Sucata de Aço Mista', categoria: 'Sucatas e Metais', qtd: [1.5, 3], preco: [950, 1250] },
  { nome: 'Cavaco de Aço Carbono', categoria: 'Sucatas e Metais', qtd: [1.5, 2.5], preco: [900, 1200] },
  { nome: 'Sucata de Alumínio', categoria: 'Sucatas e Metais', qtd: [0.3, 0.5], preco: [6200, 7000] },
  { nome: 'Sucata de Cobre', categoria: 'Sucatas e Metais', qtd: [0.06, 0.1], preco: [30000, 34000] },
  { nome: 'Pallets PBR Danificados', categoria: 'Madeira', qtd: [2.2, 3], preco: [550, 800] },
  { nome: 'Serragem e Maravalha', categoria: 'Madeira', qtd: [2.5, 3], preco: [420, 600] },
  { nome: 'Retalhos de MDF e Compensado', categoria: 'Madeira', qtd: [2, 3], preco: [500, 750] },
  { nome: 'Solvente de Limpeza Usado', categoria: 'Químicos e Tintas', qtd: [0.5, 1], preco: [2000, 3000] },
  { nome: 'Borra de Tinta Base Solvente', categoria: 'Químicos e Tintas', qtd: [0.5, 1], preco: [1600, 2400] },
];

const GERADORES: { empresa: Empresa; categorias: Categoria[]; peso: number }[] = [
  { empresa: G.demo, categorias: ['Papelão e Papel', 'Plásticos'], peso: 3 },
  { empresa: G.mercado, categorias: ['Papelão e Papel', 'Plásticos'], peso: 3 },
  { empresa: G.atacado, categorias: ['Papelão e Papel', 'Madeira'], peso: 3 },
  { empresa: G.autopecas, categorias: ['Sucatas e Metais'], peso: 2 },
  { empresa: G.serralheria, categorias: ['Sucatas e Metais'], peso: 2 },
  { empresa: G.plasticos, categorias: ['Plásticos'], peso: 2 },
  { empresa: G.moveleira, categorias: ['Madeira'], peso: 2 },
  { empresa: G.grafica, categorias: ['Papelão e Papel', 'Químicos e Tintas'], peso: 2 },
];

const COMPRADORES: Record<Categoria, Empresa[]> = {
  'Papelão e Papel': [C.demo, C.aparas, C.aparas],
  Plásticos: [C.demo, C.plastrecicla, C.plastrecicla],
  'Sucatas e Metais': [C.demo, C.sucatas, C.sucatas],
  Madeira: [C.biomassa],
  'Químicos e Tintas': [C.solvtec],
};

function historico(
  id: string,
  mat: Pick<Material, 'nome' | 'categoria'>,
  quantidade: number,
  precoUnidade: number,
  gerador: Empresa,
  comprador: Empresa,
  ref: Date,
  status: StatusPedido = 'Concluído',
): Pedido {
  const antes = (dias: number) => new Date(ref.getTime() - dias * 864e5).toISOString();
  const lt: Lote = {
    id: `LT-${id.slice(4)}`,
    nome: mat.nome,
    categoria: mat.categoria,
    quantidade,
    precoUnidade,
    descricao: '',
    gerador,
    laudo: 'laudo_caracterizacao.pdf',
    fds: CATEGORIA_INFO[mat.categoria].perigoso ? 'FISPQ.pdf' : null,
    status: status === 'Concluído' ? 'Vendido' : 'Reservado',
    criadoEm: antes(6),
  };
  const aguardando = status === 'Aguardando Pagamento';
  const concluido = status === 'Concluído';
  return {
    id,
    loteId: lt.id,
    lote: lt,
    comprador,
    valores: calcularValores(lt, comprador),
    status,
    criadoEm: aguardando ? antes(0) : antes(concluido ? 3 : 1),
    mtr: aguardando ? null : { numero: `${ref.getFullYear()}${String(ref.getTime() % 1e6).padStart(6, '0')}`, emitidoEm: antes(concluido ? 3 : 1) },
    pagoEm: aguardando ? null : antes(concluido ? 2 : 0.5),
    recebidoEm: concluido ? antes(0) : null,
    pesoBalanca: concluido ? quantidade : null,
  };
}

/**
 * Últimos 6 meses de operações na RMC, relativos à data atual: crescimento mês a mês
 * até se aproximar do ponto de equilíbrio (34 operações/mês).
 */
function gerarHistorico(): Pedido[] {
  const rnd = mulberry32(2026);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const entre = (a: number, b: number) => a + rnd() * (b - a);
  const geradores = GERADORES.flatMap((g) => Array<(typeof GERADORES)[number]>(g.peso).fill(g));
  const pedidos: Pedido[] = [];
  let seq = 0;

  const novo = (ref: Date, status: StatusPedido) => {
    const g = pick(geradores);
    const categoria = pick(g.categorias);
    const mat = pick(MATERIAIS.filter((m) => m.categoria === categoria));
    const passo = mat.qtd[1] < 1 ? 100 : 10; // lotes pequenos (metais nobres, químicos) com 2 casas
    const qtd = Math.round(entre(...mat.qtd) * passo) / passo;
    const lo = Math.max(FAIXA_TICKET[0], qtd * mat.preco[0]);
    const hi = Math.min(FAIXA_TICKET[1], qtd * mat.preco[1]);
    // valor do lote concentrado em torno do ticket padrão de R$ 2.500
    const alvo = lo <= hi ? Math.min(hi, Math.max(lo, 2500 + (rnd() + rnd() - 1) * 1000)) : (lo + hi) / 2;
    const preco = Math.round(alvo / qtd / 10) * 10;
    const id = `PED-${String(++seq).padStart(4, '0')}`;
    pedidos.push(historico(id, mat, qtd, preco, g.empresa, pick(COMPRADORES[categoria]), ref, status));
  };

  const operacoesPorMes = [9, 14, 19, 25, 31]; // 5 meses anteriores
  for (let i = 0; i < 5; i++) {
    const inicio = new Date(HOJE.getFullYear(), HOJE.getMonth() - 5 + i, 1);
    const dias = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
    for (let k = 0; k < operacoesPorMes[i]; k++) {
      novo(new Date(inicio.getFullYear(), inicio.getMonth(), 1 + Math.floor(rnd() * dias), 15), 'Concluído');
    }
  }

  // Mês corrente: ritmo projetado de ~36 operações (acima do break-even)
  const diaHoje = HOJE.getDate();
  const diasMes = new Date(HOJE.getFullYear(), HOJE.getMonth() + 1, 0).getDate();
  const concluidosMes = Math.max(1, Math.round((36 * diaHoje) / diasMes));
  for (let k = 0; k < concluidosMes; k++) {
    novo(new Date(HOJE.getFullYear(), HOJE.getMonth(), 1 + Math.floor(rnd() * Math.max(1, diaHoje - 1)), 15), 'Concluído');
  }
  for (let k = 0; k < 3; k++) novo(new Date(HOJE.getTime() - (k + 1) * 864e5), 'Pagamento Retido no Escrow');
  for (let k = 0; k < 2; k++) novo(new Date(HOJE.getTime() - k * 36e5), 'Aguardando Pagamento');

  // Garante um pedido em andamento da empresa compradora demo
  pedidos.push(
    historico('PED-DEMO', MATERIAIS[4], 2.2, 1450, G.plasticos, C.demo, new Date(HOJE.getTime() - 864e5), 'Pagamento Retido no Escrow'),
  );

  return pedidos.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export const SEED_PEDIDOS: Pedido[] = gerarHistorico();

// Lotes já vendidos/reservados pela empresa geradora demo aparecem em "Meus Lotes"
export const SEED_LOTES: Lote[] = [
  ...LOTES_DISPONIVEIS,
  ...SEED_PEDIDOS.filter((p) => p.lote.gerador.cnpj === EMPRESA_GERADORA.cnpj).map((p) => p.lote),
];
