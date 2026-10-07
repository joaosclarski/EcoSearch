'use client';

import Link from 'next/link';
import { Car, CloudOff, PiggyBank, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORIAS, CATEGORIA_INFO, envolveEmpresaDemo, impactoPedido } from '@/lib/data';
import { brl, data, num, ton } from '@/lib/format';
import { CATEGORIA_ESTILO, CategoriaBadge, PageHeader, StatTile, StatusBadge } from '@/components/ui';

const CO2_POR_CARRO_ANO = 4.6; // tCO2e/ano de um carro de passeio médio

export default function EsgPage() {
  const { pedidos } = useStore();
  const concluidos = pedidos
    .filter((p) => p.status === 'Concluído' && envolveEmpresaDemo(p))
    .map((p) => ({ pedido: p, ...impactoPedido(p) }))
    .sort((a, b) => (b.pedido.recebidoEm ?? '').localeCompare(a.pedido.recebidoEm ?? ''));

  const total = concluidos.reduce(
    (s, c) => ({
      toneladas: s.toneladas + c.toneladas,
      co2: s.co2 + c.co2,
      economia: s.economia + c.economia,
      comprador: s.comprador + c.economiaComprador,
      gerador: s.gerador + c.economiaGerador,
    }),
    { toneladas: 0, co2: 0, economia: 0, comprador: 0, gerador: 0 },
  );

  const porCategoria = CATEGORIAS.map((cat) => ({
    cat,
    toneladas: concluidos.filter((c) => c.pedido.lote.categoria === cat).reduce((s, c) => s + c.toneladas, 0),
  }));
  const maxCat = Math.max(1, ...porCategoria.map((c) => c.toneladas));

  return (
    <div>
      <PageHeader
        eyebrow="Relatório ESG"
        title="Impacto Ambiental e Econômico"
        description="Indicadores consolidados das transações concluídas (MTR baixado). Dados rastreáveis para relatórios GRI 306 e inventário GHG Protocol."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={Trash2} tone="eco" label="Toneladas desviadas do aterro" value={ton(total.toneladas)} hint={`${concluidos.length} lote(s) concluído(s)`} />
        <StatTile icon={CloudOff} tone="eco" label="CO₂e evitado" value={`${num(total.co2)} t`} hint="Emissões evitadas vs. matéria-prima virgem" />
        <StatTile icon={PiggyBank} label="Economia obtida" value={brl(total.economia)} hint="Comprador + gerador" />
        <StatTile icon={Car} label="Equivalência" value={`${num(total.co2 / CO2_POR_CARRO_ANO)} carros`} hint="fora de circulação por 1 ano" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4 sm:p-6 lg:p-8">
          <h2 className="font-semibold text-navy-700">Toneladas por categoria</h2>
          <ul className="mt-5 space-y-4">
            {porCategoria.map(({ cat, toneladas }) => (
              <li key={cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    {(() => {
                      const Icon = CATEGORIA_ESTILO[cat].icon;
                      return <Icon className="h-4 w-4 text-slate-400" />;
                    })()}
                    {cat}
                  </span>
                  <span className="font-semibold tabular-nums text-navy-700">{ton(toneladas)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-eco-500 transition-all" style={{ width: `${(toneladas / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4 sm:p-6 md:col-span-1 lg:col-span-2">
          <h2 className="font-semibold text-navy-700">Composição da economia</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-xs font-medium text-navy-600">Comprador · economia vs. matéria-prima virgem (~40–50%)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-navy-700">{brl(total.comprador)}</p>
            </div>
            <div className="rounded-lg bg-eco-50 p-4">
              <p className="text-xs font-medium text-eco-700">Gerador · custo com aterro evitado</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-eco-800">{brl(total.gerador)}</p>
            </div>
          </div>
          {total.economia > 0 && (
            <div className="mt-5">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-navy-600" style={{ width: `${(total.comprador / total.economia) * 100}%` }} />
                <div className="bg-eco-500" style={{ width: `${(total.gerador / total.economia) * 100}%` }} />
              </div>
            </div>
          )}
          <p className="mt-5 text-xs leading-relaxed text-slate-400">
            Metodologia (simulada, premissas PME/RMC): fatores de emissão evitada por tonelada —{' '}
            {CATEGORIAS.map((c) => `${c} ${num(CATEGORIA_INFO[c].fatorCO2)}`).join(' · ')} tCO₂e/t. Economia do comprador = economia
            estimada vs. matéria-prima virgem (~40% a 50% conforme a categoria). Economia do gerador = custo de aterro/destinação
            evitado ({CATEGORIAS.map((c) => `${c} ${brl(CATEGORIA_INFO[c].custoAterro)}/t`).join(' · ')}).
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy-700">Transações rastreadas</h2>
        {concluidos.length === 0 ? (
          <div className="card mt-4 p-6 text-center sm:p-10 text-sm text-slate-500">
            Nenhuma transação concluída ainda. Conclua um checkout para ver o impacto aqui.
          </div>
        ) : (
          <>
          <ul className="mt-4 block space-y-3 md:hidden">
            {concluidos.map(({ pedido, toneladas, co2, economia }) => (
              <li key={pedido.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/checkout/${pedido.id}`} className="min-w-0 font-semibold leading-snug text-navy-700">
                    {pedido.lote.nome}
                  </Link>
                  <StatusBadge status={pedido.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <CategoriaBadge categoria={pedido.lote.categoria} />
                  <span className="font-mono">MTR {pedido.mtr?.numero}</span>
                  {pedido.recebidoEm && <span>· baixa {data(pedido.recebidoEm)}</span>}
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Peso</dt>
                    <dd className="font-medium tabular-nums">{ton(toneladas)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">CO₂e evitado</dt>
                    <dd className="font-medium tabular-nums">{num(co2)} t</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-xs text-slate-400">Economia</dt>
                    <dd className="font-semibold tabular-nums text-eco-700">{brl(economia)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="card mt-4 hidden overflow-x-auto md:block">
            <table className="hidden min-w-full divide-y divide-slate-200 text-sm md:table">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">MTR</th>
                  <th className="px-4 py-3 text-right">Peso (balança)</th>
                  <th className="px-4 py-3 text-right">CO₂e evitado</th>
                  <th className="px-4 py-3 text-right">Economia</th>
                  <th className="px-4 py-3">Baixa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {concluidos.map(({ pedido, toneladas, co2, economia }) => (
                  <tr key={pedido.id}>
                    <td className="px-4 py-3">
                      <Link href={`/checkout/${pedido.id}`} className="font-medium text-navy-700 hover:text-eco-600">
                        {pedido.lote.nome}
                      </Link>
                      <div className="mt-1">
                        <CategoriaBadge categoria={pedido.lote.categoria} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{pedido.mtr?.numero}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{ton(toneladas)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{num(co2)} t</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-eco-700">{brl(economia)}</td>
                    <td className="px-4 py-3 text-slate-500">{pedido.recebidoEm && data(pedido.recebidoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
