'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeDollarSign, Download, Hourglass, Lock, Percent, Receipt, Truck, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORIAS, TAXA_INTERMEDIACAO, type Pedido, type StatusPedido } from '@/lib/data';
import { brl, data, num } from '@/lib/format';
import { CATEGORIA_ESTILO, CategoriaBadge, PageHeader, StatTile, StatusBadge } from '@/components/ui';

type Periodo = 'mes' | '90d' | 'ano' | 'tudo';

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: 'mes', label: 'Mês atual' },
  { id: '90d', label: 'Últimos 90 dias' },
  { id: 'ano', label: 'Ano corrente' },
  { id: 'tudo', label: 'Todo o período' },
];

const STATUS: (StatusPedido | 'Todos')[] = ['Todos', 'Concluído', 'Pagamento Retido no Escrow', 'Aguardando Pagamento'];

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

export default function FaturamentoPage() {
  const { pedidos } = useStore();
  const [periodo, setPeriodo] = useState<Periodo>('ano');
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | 'Todos'>('Todos');

  const inicio = inicioPeriodo(periodo);
  const noPeriodo = pedidos.filter((p) => dataRef(p) >= inicio);
  const realizados = noPeriodo.filter((p) => p.status === 'Concluído');

  // Posição atual (independe do período)
  const emEscrow = pedidos.filter((p) => p.status === 'Pagamento Retido no Escrow');
  const aguardando = pedidos.filter((p) => p.status === 'Aguardando Pagamento');

  const receita = soma(realizados, 'taxa');
  const gmv = soma(realizados, 'residuos');
  const takeRate = gmv ? receita / gmv : TAXA_INTERMEDIACAO;
  const ticketMedio = realizados.length ? receita / realizados.length : 0;

  // Últimos 6 meses (receita realizada)
  const hoje = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 5 + i, 1);
    const doMes = pedidos.filter((p) => {
      if (p.status !== 'Concluído') return false;
      const r = dataRef(p);
      return r.getFullYear() === d.getFullYear() && r.getMonth() === d.getMonth();
    });
    return {
      rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      receita: soma(doMes, 'taxa'),
      pedidos: doMes.length,
      atual: i === 5,
    };
  });
  const maxMes = Math.max(1, ...meses.map((m) => m.receita));
  const variacao = meses[4].receita ? (meses[5].receita - meses[4].receita) / meses[4].receita : null;

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
    .slice(0, 5);

  const tabela = noPeriodo
    .filter((p) => filtroStatus === 'Todos' || p.status === filtroStatus)
    .sort((a, b) => dataRef(b).getTime() - dataRef(a).getTime());

  function exportarCsv() {
    const linhas = [
      ['Pedido', 'Data', 'Status', 'Material', 'Categoria', 'Gerador', 'Comprador', 'Valor resíduos', 'Frete', 'Taxa EcoSearch', 'Total'],
      ...tabela.map((p) => [
        p.id,
        data(dataRef(p).toISOString()),
        p.status,
        p.lote.nome,
        p.lote.categoria,
        p.lote.gerador.nome,
        p.comprador.nome,
        p.valores.residuos.toFixed(2).replace('.', ','),
        p.valores.frete.toFixed(2).replace('.', ','),
        p.valores.taxa.toFixed(2).replace('.', ','),
        p.valores.total.toFixed(2).replace('.', ','),
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
        description="Receita de intermediação da plataforma. A taxa é reconhecida como receita quando o recebimento é confirmado na balança e o escrow é liberado."
        actions={
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className="input w-auto" aria-label="Período">
            {PERIODOS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={BadgeDollarSign} tone="eco" label="Receita realizada" value={brl(receita)} hint={`${realizados.length} pedido(s) concluído(s)`} />
        <StatTile icon={Lock} label="A receber (em escrow)" value={brl(soma(emEscrow, 'taxa'))} hint={`${emEscrow.length} pedido(s) · posição atual`} />
        <StatTile icon={Hourglass} label="Pipeline (aguardando pagto.)" value={brl(soma(aguardando, 'taxa'))} hint={`${aguardando.length} pedido(s) · posição atual`} />
        <StatTile icon={TrendingUp} label="GMV transacionado" value={brl(gmv)} hint="Valor dos resíduos concluídos" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-navy-700">Receita mensal (últimos 6 meses)</h2>
            {variacao !== null && (
              <span className={`text-sm font-medium ${variacao >= 0 ? 'text-eco-600' : 'text-red-600'}`}>
                {variacao >= 0 ? '▲' : '▼'} {num(Math.abs(variacao) * 100)}% vs. mês anterior
              </span>
            )}
          </div>
          <div className="mt-6 flex h-56 items-end gap-3 sm:gap-5">
            {meses.map((m) => (
              <div key={m.rotulo} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-semibold tabular-nums text-navy-700 sm:text-xs">
                  {m.receita ? brl(m.receita).replace(/,\d{2}$/, '') : '—'}
                </span>
                <div
                  className={`w-full max-w-14 rounded-t-md ${m.atual ? 'bg-eco-500' : 'bg-navy-600'}`}
                  style={{ height: `${Math.max(2, (m.receita / maxMes) * 100)}%` }}
                  title={`${m.pedidos} pedido(s)`}
                />
                <span className="text-xs capitalize text-slate-500">{m.rotulo}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Mês atual em destaque (parcial).</p>
        </div>

        <div className="space-y-4">
          <StatTile icon={Percent} label="Take rate efetivo" value={`${num(takeRate * 100)}%`} hint={`Taxa contratual ${TAXA_INTERMEDIACAO * 100}%`} />
          <StatTile icon={Receipt} label="Receita média por pedido" value={brl(ticketMedio)} />
          <StatTile icon={Truck} label="Frete intermediado (repasse)" value={brl(soma(realizados, 'frete'))} hint="Não compõe receita — repassado ao transportador" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-navy-700">Receita por categoria</h2>
          <ul className="mt-5 space-y-4">
            {porCategoria.map(({ cat, receita: r }) => {
              const Icon = CATEGORIA_ESTILO[cat].icon;
              return (
                <li key={cat}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Icon className="h-4 w-4 text-slate-400" /> {cat}
                    </span>
                    <span className="tabular-nums">
                      <span className="font-semibold text-navy-700">{brl(r)}</span>
                      <span className="ml-2 text-xs text-slate-400">{receita ? num((r / receita) * 100) : 0}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-navy-600" style={{ width: `${receita ? (r / receita) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-navy-700">Top geradores por receita</h2>
          {porGerador.length === 0 ? (
            <p className="mt-5 text-sm text-slate-400">Sem receita no período.</p>
          ) : (
            <ol className="mt-4 divide-y divide-slate-100">
              {porGerador.map((g, i) => (
                <li key={g.nome} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-semibold text-navy-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-700">{g.nome}</span>
                    <span className="text-xs text-slate-400">{g.pedidos} pedido(s)</span>
                  </span>
                  <span className="font-semibold tabular-nums text-navy-700">{brl(g.receita)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-navy-700">Lançamentos</h2>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS.map((s) => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filtroStatus === s ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'Pagamento Retido no Escrow' ? 'Em escrow' : s}
              </button>
            ))}
            <button onClick={exportarCsv} disabled={!tabela.length} className="btn-secondary px-3 py-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="card mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Partes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Resíduos</th>
                <th className="px-4 py-3 text-right">Frete</th>
                <th className="px-4 py-3 text-right">Taxa EcoSearch</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tabela.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/checkout/${p.id}`} className="font-medium text-navy-700 hover:text-eco-600">{p.lote.nome}</Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <CategoriaBadge categoria={p.lote.categoria} />
                      {p.id} · {data(dataRef(p).toISOString())}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <p className="truncate"><span className="text-slate-400">G:</span> {p.lote.gerador.nome}</p>
                    <p className="truncate"><span className="text-slate-400">C:</span> {p.comprador.nome}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(p.valores.residuos)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{brl(p.valores.frete)}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${p.status === 'Concluído' ? 'text-eco-700' : 'text-slate-400'}`}>
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
                  <td className="px-4 py-3" colSpan={3}>Total ({tabela.length})</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(soma(tabela, 'residuos'))}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(soma(tabela, 'frete'))}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-eco-700">{brl(soma(tabela, 'taxa'))}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(soma(tabela, 'total'))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">Taxas em cinza ainda não foram reconhecidas como receita (pedido não concluído).</p>
      </section>
    </div>
  );
}
