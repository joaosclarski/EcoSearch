'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeDollarSign, Crown, Download, Lock, Target, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  ASSINANTES_PRO_BASE,
  BREAK_EVEN_OPERACOES,
  CATEGORIAS,
  EMPRESA_GERADORA,
  PRECO_PRO,
  TAXA_INTERMEDIACAO,
  TAXA_MARGEM_FRETE,
  calcularValores,
  type Pedido,
  type StatusPedido,
} from '@/lib/data';
import { brl, brlCompacto, data, num, ton } from '@/lib/format';
import { CATEGORIA_ESTILO, CategoriaBadge, PageHeader, StatTile, StatusBadge } from '@/components/ui';

type Periodo = 'mes' | '90d' | 'ano' | 'tudo';

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: 'mes', label: 'Mês atual' },
  { id: '90d', label: 'Últimos 90 dias' },
  { id: 'ano', label: 'Ano corrente' },
  { id: 'tudo', label: 'Todo o período' },
];

const STATUS: (StatusPedido | 'Todos')[] = ['Todos', 'Concluído', 'Pagamento Retido no Escrow', 'Aguardando Pagamento'];
const POR_PAGINA = 15;

// Operação padrão PME: 2,0 t × R$ 1.250/t, frete local SJP → Curitiba
const PADRAO = calcularValores({ quantidade: 2, precoUnidade: 1250, categoria: 'Papelão e Papel', gerador: EMPRESA_GERADORA });

/** Data de referência contábil: conclusão para receita realizada, criação para as demais. */
const dataRef = (p: Pedido) => new Date(p.recebidoEm ?? p.criadoEm);

function inicioPeriodo(periodo: Periodo) {
  const hoje = new Date();
  switch (periodo) {
    case 'mes':
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    case '90d':
      return new Date(hoje.getTime() - 90 * 864e5);
    case 'ano':
      return new Date(hoje.getFullYear(), 0, 1);
    default:
      return new Date(0);
  }
}

const soma = (ps: Pedido[], campo: keyof Pedido['valores']) => ps.reduce((s, p) => s + p.valores[campo], 0);
const fmtCsv = (n: number) => n.toFixed(2).replace('.', ',');

export default function FaturamentoPage() {
  const { pedidos, planoPro } = useStore();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | 'Todos'>('Todos');
  const [limite, setLimite] = useState(POR_PAGINA);

  const inicio = inicioPeriodo(periodo);
  const noPeriodo = pedidos.filter((p) => dataRef(p) >= inicio);
  const realizados = noPeriodo.filter((p) => p.status === 'Concluído');
  const todosConcluidos = pedidos.filter((p) => p.status === 'Concluído');

  // Posição atual (independe do período)
  const emEscrow = pedidos.filter((p) => p.status === 'Pagamento Retido no Escrow');
  const assinantesPro = ASSINANTES_PRO_BASE + (planoPro ? 1 : 0);
  const mrr = assinantesPro * PRECO_PRO;

  const receita = soma(realizados, 'taxa');
  const takeRate = soma(realizados, 'taxaIntermediacao');
  const margemFrete = soma(realizados, 'margemFrete');
  const gmv = soma(realizados, 'residuos');

  // Unit economics observados (todo o histórico concluído)
  const n = Math.max(1, todosConcluidos.length);
  const receitaMediaOp = soma(todosConcluidos, 'taxa') / n;
  const ticketMedio = soma(todosConcluidos, 'residuos') / n;
  const freteMedio = soma(todosConcluidos, 'frete') / n;
  const volumeMedio = todosConcluidos.reduce((s, p) => s + (p.pesoBalanca ?? p.lote.quantidade), 0) / n;
  const custoFixoImplicito = BREAK_EVEN_OPERACOES * receitaMediaOp;

  // Últimos 6 meses
  const hoje = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
    const doMes = todosConcluidos.filter((p) => {
      const r = dataRef(p);
      return r.getFullYear() === d.getFullYear() && r.getMonth() === d.getMonth();
    });
    return {
      chave: `${d.getFullYear()}-${d.getMonth()}`,
      rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      operacoes: doMes.length,
      receita: soma(doMes, 'taxa'),
      atual: i === 5,
    };
  });

  // Break-even do mês corrente com projeção pelo ritmo atual
  const mesAtual = meses[5];
  const mesAnterior = meses[4];
  const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const projecao = Math.round((mesAtual.operacoes / Math.max(1, hoje.getDate())) * diasMes);
  const escalaMax = Math.max(BREAK_EVEN_OPERACOES * 1.2, projecao, ...meses.map((m) => m.operacoes)) * 1.1;
  const altura = (v: number) => `${(v / escalaMax) * 100}%`;
  const progresso = Math.min(1, mesAtual.operacoes / BREAK_EVEN_OPERACOES);

  const porCategoria = CATEGORIAS.map((cat) => ({ cat, receita: soma(realizados.filter((p) => p.lote.categoria === cat), 'taxa') }));

  const porGerador = Object.values(
    realizados.reduce<Record<string, { nome: string; receita: number; pedidos: number }>>((acc, p) => {
      const g = (acc[p.lote.gerador.cnpj] ??= { nome: p.lote.gerador.nome, receita: 0, pedidos: 0 });
      g.receita += p.valores.taxa;
      g.pedidos += 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 6);

  const tabela = noPeriodo
    .filter((p) => filtroStatus === 'Todos' || p.status === filtroStatus)
    .sort((a, b) => dataRef(b).getTime() - dataRef(a).getTime());
  const visiveis = tabela.slice(0, limite);

  const composicao = [
    { rotulo: `Take rate ${TAXA_INTERMEDIACAO * 100}% (lotes)`, valor: takeRate, cor: 'bg-navy-600' },
    { rotulo: `Margem de frete ${TAXA_MARGEM_FRETE * 100}%`, valor: margemFrete, cor: 'bg-eco-500' },
    { rotulo: 'SaaS Pro (MRR atual)', valor: mrr, cor: 'bg-amber-400' },
  ];
  const totalComposicao = composicao.reduce((s, c) => s + c.valor, 0);

  function exportarCsv() {
    const linhas = [
      ['Pedido', 'Data', 'Status', 'Material', 'Categoria', 'Toneladas', 'Gerador', 'Comprador', 'Valor material', 'Frete', 'Take rate 8%', 'Margem frete 6%', 'Taxa EcoSearch', 'Total escrow'],
      ...tabela.map((p) => [
        p.id,
        data(dataRef(p).toISOString()),
        p.status,
        p.lote.nome,
        p.lote.categoria,
        String(p.lote.quantidade).replace('.', ','),
        p.lote.gerador.nome,
        p.comprador.nome,
        fmtCsv(p.valores.residuos),
        fmtCsv(p.valores.frete),
        fmtCsv(p.valores.taxaIntermediacao),
        fmtCsv(p.valores.margemFrete),
        fmtCsv(p.valores.taxa),
        fmtCsv(p.valores.total),
      ]),
    ];
    const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `ecosearch-faturamento-${periodo}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Uso interno · EcoSearch"
        title="Painel de Faturamento"
        description={`Modelo pay-per-transaction para PMEs da RMC: ${TAXA_INTERMEDIACAO * 100}% sobre o lote + ${TAXA_MARGEM_FRETE * 100}% sobre o frete, reconhecidos na baixa do MTR, mais o Plano SaaS Pro opcional (${brl(PRECO_PRO)}/mês).`}
        actions={
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className="input sm:w-auto" aria-label="Período">
            {PERIODOS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={BadgeDollarSign} tone="eco" label="Receita de transações" value={brl(receita)} hint={`${realizados.length} operação(ões) concluída(s)`} />
        <StatTile icon={Crown} label="MRR · SaaS Pro" value={brl(mrr)} hint={`${assinantesPro} assinantes × ${brl(PRECO_PRO)}`} />
        <StatTile icon={Lock} label="A receber (em escrow)" value={brl(soma(emEscrow, 'taxa'))} hint={`${emEscrow.length} pedido(s) · posição atual`} />
        <StatTile icon={TrendingUp} label="GMV (valor dos lotes)" value={brl(gmv)} hint={`Ticket médio ${brl(realizados.length ? gmv / realizados.length : 0)}`} />
      </div>

      {/* Ponto de equilíbrio */}
      <div className="card mt-4 p-4 sm:mt-6 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 font-semibold text-navy-700">
              <Target className="h-5 w-5 text-eco-500" /> Ponto de Equilíbrio · RMC
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Break-even: <strong className="text-navy-700">{BREAK_EVEN_OPERACOES} operações/mês</strong> na Região Metropolitana de
              Curitiba — custo fixo implícito de ~{brl(custoFixoImplicito)}/mês ({BREAK_EVEN_OPERACOES} × {brl(receitaMediaOp)} por operação).
            </p>

            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate-600">
                  Mês atual: <strong className="tabular-nums text-navy-700">{mesAtual.operacoes}</strong> de {BREAK_EVEN_OPERACOES} operações
                </span>
                <span className="tabular-nums text-slate-400">{num(Math.round(progresso * 100))}%</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-eco-200"
                  style={{ width: `${Math.min(100, (projecao / BREAK_EVEN_OPERACOES) * 100)}%` }}
                  title="Projeção do mês"
                />
                <div className="absolute inset-y-0 left-0 rounded-full bg-eco-500" style={{ width: `${progresso * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Projeção pelo ritmo atual:{' '}
                <strong className={projecao >= BREAK_EVEN_OPERACOES ? 'text-eco-700' : 'text-amber-700'}>{projecao} operações</strong>{' '}
                {projecao >= BREAK_EVEN_OPERACOES ? '— acima do ponto de equilíbrio.' : `— faltam ${BREAK_EVEN_OPERACOES - projecao} para o equilíbrio.`}{' '}
                Mês anterior: {mesAnterior.operacoes} operações.
              </p>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm lg:w-80">
            {[
              ['Receita média/op.', brl(receitaMediaOp)],
              ['Ticket médio', brl(ticketMedio)],
              ['Volume médio', ton(Math.round(volumeMedio * 10) / 10)],
              ['Frete médio', brl(freteMedio)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-400">{k}</dt>
                <dd className="font-semibold tabular-nums text-navy-700">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Operações por mês com linha de break-even */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">Operações concluídas por mês</p>
          <div className="relative h-40 border-b border-slate-200 sm:h-48">
            <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-amber-500" style={{ bottom: altura(BREAK_EVEN_OPERACOES) }}>
              <span className="absolute -top-5 right-0 rounded bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-700">
                Break-even {BREAK_EVEN_OPERACOES}
              </span>
            </div>
            <div className="absolute inset-0 flex items-end gap-2 sm:gap-5">
              {meses.map((m) => (
                <div key={m.chave} className="relative flex h-full flex-1 items-end justify-center">
                  {m.atual && projecao > m.operacoes && (
                    <div
                      className="absolute bottom-0 w-full max-w-14 rounded-t-md border-2 border-dashed border-eco-300"
                      style={{ height: altura(projecao) }}
                      title={`Projeção: ${projecao}`}
                    />
                  )}
                  <div
                    className={`relative w-full max-w-14 rounded-t-md ${m.operacoes >= BREAK_EVEN_OPERACOES ? 'bg-eco-500' : m.atual ? 'bg-eco-400' : 'bg-navy-600'}`}
                    style={{ height: altura(Math.max(m.operacoes, 0.3)) }}
                  >
                    <span className="absolute -top-5 inset-x-0 text-center text-xs font-semibold tabular-nums text-navy-700">{m.operacoes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex gap-2 sm:gap-5">
            {meses.map((m) => (
              <div key={m.chave} className="flex-1 text-center">
                <p className="text-xs capitalize text-slate-500">{m.rotulo}</p>
                <p className="whitespace-nowrap text-[10px] tabular-nums text-slate-400">{brlCompacto(m.receita)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Mês atual parcial; contorno tracejado = projeção pelo ritmo atual. Abaixo de cada mês, a receita de transações.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold text-navy-700">Composição da receita</h2>
          <p className="text-xs text-slate-400">Transações no período + MRR atual</p>
          <ul className="mt-4 space-y-3 text-sm">
            {composicao.map((r) => (
              <li key={r.rotulo} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.cor}`} />
                <span className="flex-1 text-slate-600">{r.rotulo}</span>
                <span className="font-semibold tabular-nums text-navy-700">{brl(r.valor)}</span>
              </li>
            ))}
          </ul>
          {totalComposicao > 0 && (
            <div className="mt-4 flex h-3 overflow-hidden rounded-full">
              {composicao.map((r) => (
                <div key={r.rotulo} className={r.cor} style={{ width: `${(r.valor / totalComposicao) * 100}%` }} />
              ))}
            </div>
          )}
          <p className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-navy-700">
            <span>Total</span>
            <span className="tabular-nums">{brl(totalComposicao)}</span>
          </p>
        </div>

        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold text-navy-700">Unit economics · operação padrão</h2>
          <p className="text-xs text-slate-400">Lote PME de 2,0 t · frete local SJP → Curitiba</p>
          <dl className="mt-4 space-y-2 text-sm">
            {(
              [
                ['Valor do material (gerador)', PADRAO.residuos, false],
                ['Frete local terceirizado', PADRAO.frete, false],
                [`Take rate ${TAXA_INTERMEDIACAO * 100}%`, PADRAO.taxaIntermediacao, true],
                [`Margem de frete ${TAXA_MARGEM_FRETE * 100}%`, PADRAO.margemFrete, true],
              ] as const
            ).map(([rotulo, valor, receitaEco]) => (
              <div key={rotulo} className="flex justify-between gap-3">
                <dt className={receitaEco ? 'text-eco-700' : 'text-slate-600'}>{rotulo}</dt>
                <dd className={`tabular-nums ${receitaEco ? 'font-semibold text-eco-700' : ''}`}>{brl(valor)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-2">
              <dt className="text-slate-600">Total em custódia</dt>
              <dd className="font-semibold tabular-nums text-navy-700">{brl(PADRAO.total)}</dd>
            </div>
            <div className="flex justify-between gap-3 rounded-md bg-eco-50 px-2 py-1.5">
              <dt className="font-medium text-eco-800">Receita EcoSearch/op.</dt>
              <dd className="font-bold tabular-nums text-eco-800">{brl(PADRAO.taxa)}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-4 sm:p-6 md:col-span-2 lg:col-span-1">
          <h2 className="font-semibold text-navy-700">Receita por categoria</h2>
          <ul className="mt-4 space-y-3">
            {porCategoria.map(({ cat, receita: r }) => {
              const { icon: Icon, barra } = CATEGORIA_ESTILO[cat];
              return (
                <li key={cat}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" /> <span className="truncate">{cat}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-navy-700">{brl(r)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${barra}`} style={{ width: `${receita ? (r / receita) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="card mt-4 p-4 sm:mt-6 sm:p-6">
        <h2 className="font-semibold text-navy-700">Top geradores por receita</h2>
        {porGerador.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Sem receita no período.</p>
        ) : (
          <ol className="mt-3 grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {porGerador.map((g, i) => (
              <li key={g.nome} className="flex items-center gap-3 border-b border-slate-100 py-2.5 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-semibold text-navy-600">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-700">{g.nome}</span>
                  <span className="text-xs text-slate-400">{g.pedidos} operação(ões)</span>
                </span>
                <span className="font-semibold tabular-nums text-navy-700">{brl(g.receita)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-navy-700">Lançamentos</h2>
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {STATUS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFiltroStatus(s);
                  setLimite(POR_PAGINA);
                }}
                className={`chip text-xs ${filtroStatus === s ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {s === 'Pagamento Retido no Escrow' ? 'Em escrow' : s}
              </button>
            ))}
            <button onClick={exportarCsv} disabled={!tabela.length} className="btn-secondary shrink-0 px-4 text-xs md:px-3 md:py-1.5">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Cards (mobile) */}
        <ul className="mt-4 block space-y-3 md:hidden">
          {visiveis.map((p) => (
            <li key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/checkout/${p.id}`} className="font-semibold leading-snug text-navy-700">{p.lote.nome}</Link>
                  <p className="mt-0.5 text-xs text-slate-400">{p.id} · {data(dataRef(p).toISOString())} · {ton(p.lote.quantidade)}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                <CategoriaBadge categoria={p.lote.categoria} />
                <p className="truncate pt-1"><span className="text-slate-400">Gerador:</span> {p.lote.gerador.nome}</p>
                <p className="truncate"><span className="text-slate-400">Comprador:</span> {p.comprador.nome}</p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Material</dt>
                  <dd className="tabular-nums">{brl(p.valores.residuos)}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-xs text-slate-400">Frete</dt>
                  <dd className="tabular-nums text-slate-500">{brl(p.valores.frete)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Taxa EcoSearch</dt>
                  <dd className={`font-semibold tabular-nums ${p.status === 'Concluído' ? 'text-eco-700' : 'text-slate-400'}`}>{brl(p.valores.taxa)}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-xs text-slate-400">Total escrow</dt>
                  <dd className="font-semibold tabular-nums text-navy-700">{brl(p.valores.total)}</dd>
                </div>
              </dl>
            </li>
          ))}
          {tabela.length === 0 && <li className="card p-6 text-center text-sm text-slate-400">Nenhum lançamento para os filtros atuais.</li>}
        </ul>

        {/* Tabela (md+) */}
        <div className="card mt-4 hidden overflow-x-auto md:block">
          <table className="hidden min-w-full divide-y divide-slate-200 text-sm md:table">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Partes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Material</th>
                <th className="px-4 py-3 text-right">Frete</th>
                <th className="px-4 py-3 text-right">Taxa EcoSearch</th>
                <th className="px-4 py-3 text-right">Total escrow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiveis.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/checkout/${p.id}`} className="font-medium text-navy-700 hover:text-eco-600">{p.lote.nome}</Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <CategoriaBadge categoria={p.lote.categoria} />
                      {p.id} · {data(dataRef(p).toISOString())} · {ton(p.lote.quantidade)}
                    </div>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 text-xs text-slate-500">
                    <p className="truncate"><span className="text-slate-400">G:</span> {p.lote.gerador.nome}</p>
                    <p className="truncate"><span className="text-slate-400">C:</span> {p.comprador.nome}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(p.valores.residuos)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{brl(p.valores.frete)}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${p.status === 'Concluído' ? 'text-eco-700' : 'text-slate-400'}`}
                    title={`Take rate ${brl(p.valores.taxaIntermediacao)} + margem frete ${brl(p.valores.margemFrete)}`}
                  >
                    {brl(p.valores.taxa)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(p.valores.total)}</td>
                </tr>
              ))}
              {tabela.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nenhum lançamento para os filtros atuais.</td>
                </tr>
              )}
            </tbody>
            {tabela.length > 0 && (
              <tfoot className="bg-slate-50 text-sm font-semibold text-navy-700">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Total do filtro ({tabela.length})</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(soma(tabela, 'residuos'))}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(soma(tabela, 'frete'))}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-eco-700">{brl(soma(tabela, 'taxa'))}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(soma(tabela, 'total'))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {tabela.length > 0 && (
          <>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Exibindo {visiveis.length} de {tabela.length} · Taxas em cinza ainda não reconhecidas (pedido não concluído).
              </p>
              {limite < tabela.length && (
                <button onClick={() => setLimite(limite + POR_PAGINA)} className="btn-secondary w-full sm:w-auto">
                  Mostrar mais
                </button>
              )}
            </div>
            <div className="mt-3 rounded-xl bg-navy-700 p-4 text-sm text-white md:hidden">
              <div className="flex justify-between">
                <span>Total do filtro ({tabela.length})</span>
                <span className="tabular-nums">{brl(soma(tabela, 'total'))}</span>
              </div>
              <div className="mt-1 flex justify-between font-semibold text-eco-200">
                <span>Taxas EcoSearch</span>
                <span className="tabular-nums">{brl(soma(tabela, 'taxa'))}</span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
