export type Perfil = 'gerador' | 'comprador';
export type Categoria = 'Plástico' | 'Químico' | 'Metal';
export type StatusLote = 'Disponível' | 'Reservado' | 'Vendido';
export type StatusPedido = 'Aguardando Pagamento' | 'Pagamento Retido no Escrow' | 'Concluído';

export const CATEGORIAS: Categoria[] = ['Plástico', 'Químico', 'Metal'];

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
  residuos: number;
  frete: number;
  taxa: number;
  total: number;
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

export const EMPRESA_GERADORA: Empresa = {
  nome: 'Química Vale do Paraíba Ltda',
  cnpj: '12.345.678/0001-90',
  cidade: 'São José dos Campos/SP',
  endereco: 'Rod. Presidente Dutra, km 148 — Distrito Industrial',
};

export const EMPRESA_COMPRADORA: Empresa = {
  nome: 'Recicla Brasil Indústria S.A.',
  cnpj: '98.765.432/0001-10',
  cidade: 'Campinas/SP',
  endereco: 'Av. John Boyd Dunlop, 7.200 — Jd. Ipaussurama',
};

export const TRANSPORTADORA: Empresa = {
  nome: 'EcoLog Transportes Especializados Ltda',
  cnpj: '45.678.901/0001-23',
  cidade: 'Jacareí/SP',
  endereco: 'Rua das Indústrias, 900 — Parque Meia Lua',
};

export const TAXA_INTERMEDIACAO = 0.08;

export const CATEGORIA_INFO: Record<
  Categoria,
  {
    perigoso: boolean;
    classe: string;
    codigoIbama: string;
    descricaoIbama: string;
    estadoFisico: string;
    acondicionamento: string;
    tecnologia: string;
    onu: string | null;
    frete: number;
    fatorCO2: number; // tCO2e evitadas por tonelada reaproveitada
    precoVirgem: number; // R$/t da matéria-prima virgem equivalente
    custoDestinacao: number; // R$/t do aterro/incineração evitado pelo gerador
  }
> = {
  Plástico: {
    perigoso: false,
    classe: 'Classe II B — Não perigoso, inerte (NBR 10004)',
    codigoIbama: '07 02 13',
    descricaoIbama: 'Resíduos de plásticos',
    estadoFisico: 'Sólido',
    acondicionamento: 'Fardos prensados',
    tecnologia: 'Reciclagem mecânica',
    onu: null,
    frete: 1200,
    fatorCO2: 1.8,
    precoVirgem: 6800,
    custoDestinacao: 220,
  },
  Químico: {
    perigoso: true,
    classe: 'Classe I — Perigoso (NBR 10004)',
    codigoIbama: '07 01 04*',
    descricaoIbama: 'Outros solventes orgânicos, líquidos de lavagem e licores-mãe',
    estadoFisico: 'Líquido',
    acondicionamento: 'Tambores 200 L / IBC 1.000 L',
    tecnologia: 'Recuperação / rerrefino de solventes',
    onu: 'ONU 1993 — Líquido inflamável, N.E. — Classe de risco 3',
    frete: 2000,
    fatorCO2: 2.3,
    precoVirgem: 4200,
    custoDestinacao: 1450,
  },
  Metal: {
    perigoso: false,
    classe: 'Classe II A — Não perigoso, não inerte (NBR 10004)',
    codigoIbama: '12 01 01',
    descricaoIbama: 'Aparas e limalhas de metais ferrosos',
    estadoFisico: 'Sólido',
    acondicionamento: 'Caçamba basculante',
    tecnologia: 'Reciclagem siderúrgica',
    onu: null,
    frete: 1200,
    fatorCO2: 1.6,
    precoVirgem: 4800,
    custoDestinacao: 260,
  },
};

export function calcularValores(lote: Pick<Lote, 'quantidade' | 'precoUnidade' | 'categoria'>): Valores {
  const residuos = round2(lote.quantidade * lote.precoUnidade);
  const frete = CATEGORIA_INFO[lote.categoria].frete;
  const taxa = round2(residuos * TAXA_INTERMEDIACAO);
  return { residuos, frete, taxa, total: round2(residuos + frete + taxa) };
}

/** Pedido em que a empresa demo participa (como compradora ou geradora). */
export function envolveEmpresaDemo(p: Pedido) {
  return p.comprador.cnpj === EMPRESA_COMPRADORA.cnpj || p.lote.gerador.cnpj === EMPRESA_GERADORA.cnpj;
}

export function impactoPedido(p: Pedido) {
  const info = CATEGORIA_INFO[p.lote.categoria];
  const toneladas = p.pesoBalanca ?? p.lote.quantidade;
  const co2 = toneladas * info.fatorCO2;
  const economiaComprador = Math.max(0, info.precoVirgem * toneladas - p.valores.total);
  const economiaGerador = info.custoDestinacao * toneladas;
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

const outro = (nome: string, cnpj: string, cidade: string, endereco: string): Empresa => ({ nome, cnpj, cidade, endereco });

export const SEED_LOTES: Lote[] = [
  {
    id: 'LT-SOLV01',
    nome: 'Solvente Orgânico Usado (Acetona/Xileno)',
    categoria: 'Químico',
    quantidade: 10,
    precoUnidade: 1500,
    descricao:
      'Mistura de acetona e xileno proveniente da limpeza de linhas de pintura. Teor de água < 5%. Ideal para destilação e recuperação de solventes.',
    gerador: EMPRESA_GERADORA,
    laudo: 'laudo_caracterizacao_solvente_2026.pdf',
    fds: 'FISPQ_acetona_xileno_rev04.pdf',
    status: 'Disponível',
    criadoEm: '2026-09-28T10:15:00.000Z',
  },
  {
    id: 'LT-PEAD02',
    nome: 'Aparas de PEAD Pós-Industrial',
    categoria: 'Plástico',
    quantidade: 24,
    precoUnidade: 2100,
    descricao: 'Aparas de bombonas e tampas em PEAD, cor natural, sem contaminação química. Enfardadas em ~400 kg.',
    gerador: EMPRESA_GERADORA,
    laudo: 'laudo_pead_lote_0926.pdf',
    fds: null,
    status: 'Disponível',
    criadoEm: '2026-09-30T14:40:00.000Z',
  },
  {
    id: 'LT-ACO03',
    nome: 'Cavaco de Aço Carbono SAE 1045',
    categoria: 'Metal',
    quantidade: 18,
    precoUnidade: 1350,
    descricao: 'Cavaco de usinagem CNC, centrifugado (óleo residual < 2%). Retirada em caçamba de 30 m³.',
    gerador: outro('Metalúrgica Sorocabana S.A.', '23.456.789/0001-11', 'Sorocaba/SP', 'Av. Independência, 4.100'),
    laudo: 'laudo_cavaco_aco_1045.pdf',
    fds: null,
    status: 'Disponível',
    criadoEm: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'LT-PEBD04',
    nome: 'Filme Stretch PEBD Prensado',
    categoria: 'Plástico',
    quantidade: 8,
    precoUnidade: 1800,
    descricao: 'Filme stretch transparente de paletização, limpo e prensado. Geração recorrente de ~8 t/mês.',
    gerador: outro('Logística Integrada Cajamar Ltda', '34.567.890/0001-22', 'Cajamar/SP', 'Rod. Anhanguera, km 33'),
    laudo: 'laudo_pebd_stretch.pdf',
    fds: null,
    status: 'Disponível',
    criadoEm: '2026-10-02T16:20:00.000Z',
  },
  {
    id: 'LT-TINT05',
    nome: 'Borra de Tinta Base Solvente',
    categoria: 'Químico',
    quantidade: 5,
    precoUnidade: 900,
    descricao: 'Borra de cabine de pintura com alto poder calorífico. Indicada para coprocessamento em fornos de cimento.',
    gerador: outro('Tintas Horizonte Ltda', '56.789.012/0001-33', 'Guarulhos/SP', 'Rua Pirapora, 210 — Cumbica'),
    laudo: 'laudo_borra_tinta.pdf',
    fds: 'FDS_borra_tinta_solvente.pdf',
    status: 'Disponível',
    criadoEm: '2026-10-03T11:05:00.000Z',
  },
  {
    id: 'LT-ALU06',
    nome: 'Sucata de Alumínio — Perfis 6063',
    categoria: 'Metal',
    quantidade: 6,
    precoUnidade: 7200,
    descricao: 'Retalhos de perfis extrudados liga 6063, sem pintura. Alto teor de recuperação.',
    gerador: outro('Esquadrias Paraná Ltda', '67.890.123/0001-44', 'Curitiba/PR', 'Rua João Bettega, 3.500 — CIC'),
    laudo: 'laudo_aluminio_6063.pdf',
    fds: null,
    status: 'Disponível',
    criadoEm: '2026-10-05T08:30:00.000Z',
  },
  {
    id: 'LT-TAMB07',
    nome: 'Tambores Metálicos Descontaminados',
    categoria: 'Metal',
    quantidade: 12,
    precoUnidade: 1100,
    descricao: 'Tambores de aço 200 L tríplice lavados e prensados.',
    gerador: EMPRESA_GERADORA,
    laudo: 'laudo_descontaminacao_tambores.pdf',
    fds: null,
    status: 'Vendido',
    criadoEm: '2026-09-10T13:00:00.000Z',
  },
];

const loteHistorico = SEED_LOTES.find((l) => l.id === 'LT-TAMB07')!;

const COMPRADORES = {
  plastimax: outro('Plastimax Embalagens Ltda', '11.222.333/0001-44', 'Joinville/SC', 'Rua Dona Francisca, 8.300'),
  valeVerde: outro('Siderúrgica Vale Verde S.A.', '22.333.444/0001-55', 'Volta Redonda/RJ', 'Av. dos Trabalhadores, 2.000'),
  solvex: outro('Solvex Recuperadora Química Ltda', '33.444.555/0001-66', 'Paulínia/SP', 'Rod. SP-332, km 130'),
};

const GERADORES = {
  autopecas: outro('Autopeças Taubaté S.A.', '44.555.666/0001-77', 'Taubaté/SP', 'Av. Charles Schnneider, 1.700'),
  itajai: outro('Embalagens Itajaí Ltda', '55.666.777/0001-88', 'Itajaí/SC', 'Rua Blumenau, 1.250'),
  farmo: outro('Farmoquímica Jundiaí Ltda', '66.777.888/0001-99', 'Jundiaí/SP', 'Av. Antonio Frederico Ozanan, 4.000'),
};

/** Transação histórica da plataforma; `dia` é a data de conclusão (ou da etapa atual). */
function historico(
  id: string,
  nome: string,
  categoria: Categoria,
  quantidade: number,
  precoUnidade: number,
  gerador: Empresa,
  comprador: Empresa,
  dia: string,
  status: StatusPedido = 'Concluído',
): Pedido {
  const ref = new Date(`${dia}T15:00:00.000Z`).getTime();
  const antes = (dias: number) => new Date(ref - dias * 864e5).toISOString();
  const lote: Lote = {
    id: `LT-${id.slice(4)}`,
    nome,
    categoria,
    quantidade,
    precoUnidade,
    descricao: '',
    gerador,
    laudo: 'laudo_caracterizacao.pdf',
    fds: CATEGORIA_INFO[categoria].perigoso ? 'FISPQ.pdf' : null,
    status: status === 'Concluído' ? 'Vendido' : 'Reservado',
    criadoEm: antes(10),
  };
  const aguardando = status === 'Aguardando Pagamento';
  const concluido = status === 'Concluído';
  return {
    id,
    loteId: lote.id,
    lote,
    comprador,
    valores: calcularValores(lote),
    status,
    criadoEm: aguardando ? antes(0) : antes(concluido ? 4 : 2),
    mtr: aguardando ? null : { numero: `2026${String(ref % 1e6).padStart(6, '0')}`, emitidoEm: antes(concluido ? 4 : 2) },
    pagoEm: aguardando ? null : antes(concluido ? 3 : 1),
    recebidoEm: concluido ? antes(0) : null,
    pesoBalanca: concluido ? quantidade : null,
  };
}

const G = GERADORES;
const C = COMPRADORES;

export const SEED_PEDIDOS: Pedido[] = [
  historico('PED-OUT02', 'Chapas de Aço Carbono (retalhos)', 'Metal', 16, 1250, G.autopecas, C.valeVerde, '2026-10-06', 'Aguardando Pagamento'),
  historico('PED-OUT01', 'Aparas de ABS Injetado', 'Plástico', 9, 3100, G.itajai, EMPRESA_COMPRADORA, '2026-10-04', 'Pagamento Retido no Escrow'),
  historico('PED-SET03', 'Cavaco de Latão', 'Metal', 5, 14000, G.autopecas, C.valeVerde, '2026-10-02'),
  historico('PED-SET02', 'Resina Epóxi Vencida', 'Químico', 6, 1800, G.farmo, C.solvex, '2026-09-24'),
  historico('PED-SET01', 'Filme PEBD Colorido', 'Plástico', 11, 1600, EMPRESA_GERADORA, C.plastimax, '2026-09-09'),
  historico('PED-AGO03', 'Sucata de Alumínio (latas)', 'Metal', 7, 6800, G.itajai, EMPRESA_COMPRADORA, '2026-08-30'),
  historico('PED-AGO02', 'Ácido Sulfúrico Residual', 'Químico', 14, 600, G.farmo, C.solvex, '2026-08-19'),
  historico('PED-AGO01', 'Aparas de PEAD Natural', 'Plástico', 20, 2200, EMPRESA_GERADORA, C.plastimax, '2026-08-05'),
  historico('PED-JUL02', 'Retalhos de Aço Inox 304', 'Metal', 9, 6500, G.autopecas, C.valeVerde, '2026-07-22'),
  historico('PED-JUL01', 'Solvente Thinner Usado', 'Químico', 8, 1400, EMPRESA_GERADORA, C.solvex, '2026-07-09'),
  historico('PED-JUN03', 'Sucata de Cobre Misto', 'Metal', 3, 31000, G.autopecas, EMPRESA_COMPRADORA, '2026-06-28'),
  historico('PED-JUN02', 'Garrafas PET Pós-Industrial', 'Plástico', 18, 2900, G.itajai, C.plastimax, '2026-06-17'),
  historico('PED-JUN01', 'Óleo Lubrificante Usado', 'Químico', 12, 1300, G.farmo, C.solvex, '2026-06-03'),
  historico('PED-MAI02', 'Cavaco de Ferro Fundido', 'Metal', 22, 1100, G.autopecas, C.valeVerde, '2026-05-21'),
  historico('PED-MAI01', 'Aparas de PP Injetado', 'Plástico', 15, 2400, G.itajai, EMPRESA_COMPRADORA, '2026-05-08'),
  {
    id: 'PED-H7K2QX',
    loteId: loteHistorico.id,
    lote: loteHistorico,
    comprador: EMPRESA_COMPRADORA,
    valores: calcularValores(loteHistorico),
    status: 'Concluído',
    criadoEm: '2026-09-12T10:00:00.000Z',
    mtr: { numero: '2026481230', emitidoEm: '2026-09-12T10:20:00.000Z' },
    pagoEm: '2026-09-12T11:00:00.000Z',
    recebidoEm: '2026-09-15T15:40:00.000Z',
    pesoBalanca: 12,
  },
];
