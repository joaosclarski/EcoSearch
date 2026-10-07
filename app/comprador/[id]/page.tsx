'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, FileCheck2, Lock, MapPin, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORIA_INFO, EMPRESA_COMPRADORA, calcularValores, rotaFrete } from '@/lib/data';
import { ComparativoComprador } from '@/components/Economia';
import { brl, data, ton } from '@/lib/format';
import { CATEGORIA_ESTILO, CategoriaBadge, PerigosoBadge, StatusBadge } from '@/components/ui';

export default function DetalheLotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lotes, pedidos, comprarLote } = useStore();
  const lote = lotes.find((l) => l.id === id);

  if (!lote) {
    return (
      <div className="card p-6 text-center sm:p-10">
        <p className="text-slate-500">Lote não encontrado.</p>
        <Link href="/comprador" className="btn-secondary mt-4">Voltar ao catálogo</Link>
      </div>
    );
  }

  const info = CATEGORIA_INFO[lote.categoria];
  const valores = calcularValores(lote);
  const { icon: Icon, tile } = CATEGORIA_ESTILO[lote.categoria];
  const pedido = pedidos.find((p) => p.loteId === lote.id);

  const comprar = () => router.push(`/checkout/${comprarLote(lote.id)}`);

  const especificacoes = [
    ['Classificação', info.classe],
    ['Código IBAMA', info.codigoIbama],
    ['Estado físico', info.estadoFisico],
    ['Acondicionamento', info.acondicionamento],
    ['Destinação sugerida', info.tecnologia],
    ...(info.onu ? [['Transporte (ANTT)', info.onu]] : []),
  ];

  return (
    <div>
      <Link href="/comprador" className="mb-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-700 md:mb-6 md:min-h-0">
        <ArrowLeft className="h-4 w-4" /> Catálogo
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <div className="card p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tile}`}>
                <Icon className="h-7 w-7" />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  <CategoriaBadge categoria={lote.categoria} />
                  {info.perigoso && <PerigosoBadge />}
                  <StatusBadge status={lote.status} />
                </div>
                <h1 className="mt-2 text-xl font-bold tracking-tight text-navy-700 sm:text-2xl">{lote.nome}</h1>
                <p className="mt-1 text-xs text-slate-400">
                  {lote.id} · anunciado em {data(lote.criadoEm)}
                </p>
              </div>
            </div>
            {lote.descricao && <p className="mt-5 text-sm leading-relaxed text-slate-600">{lote.descricao}</p>}
          </div>

          <div className="card p-4 sm:p-6 lg:p-8">
            <h2 className="font-semibold text-navy-700">Especificações técnicas</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {especificacoes.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="card p-4 sm:p-6 lg:p-8">
              <h2 className="flex items-center gap-2 font-semibold text-navy-700">
                <Building2 className="h-4 w-4 text-eco-500" /> Gerador
              </h2>
              <p className="mt-3 text-sm font-medium text-slate-700">{lote.gerador.nome}</p>
              <p className="text-xs text-slate-500">CNPJ {lote.gerador.cnpj}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {lote.gerador.cidade}
              </p>
            </div>
            <div className="card p-4 sm:p-6 lg:p-8">
              <h2 className="flex items-center gap-2 font-semibold text-navy-700">
                <ShieldCheck className="h-4 w-4 text-eco-500" /> Documentação
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ['Laudo de caracterização', lote.laudo],
                  ['FDS / FISPQ', lote.fds],
                ].map(([rotulo, arquivo]) => (
                  <li key={rotulo} className="flex items-start gap-2">
                    <FileCheck2 className={`mt-0.5 h-4 w-4 shrink-0 ${arquivo ? 'text-eco-500' : 'text-slate-300'}`} />
                    <span>
                      <span className="text-slate-700">{rotulo}</span>
                      <span className="block break-all text-xs text-slate-400">{arquivo ?? 'Não aplicável'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4 sm:p-6 lg:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Valor do lote</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-navy-700">{brl(valores.residuos)}</p>
            <p className="text-sm text-slate-500">
              {ton(lote.quantidade)} × {brl(lote.precoUnidade)}/t
            </p>

            <ComparativoComprador lote={lote} className="mt-4" />

            <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-eco-500" />
                Frete local ({rotaFrete(lote, EMPRESA_COMPRADORA)}): {brl(valores.frete)}
              </li>
              <li className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-eco-500" /> MTR SINIR emitido no checkout
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-eco-500" /> Pagamento protegido em escrow
              </li>
            </ul>

            {lote.status === 'Disponível' ? (
              <button onClick={comprar} className="btn-eco mt-6 hidden w-full py-3 text-base md:flex">
                <ShoppingCart className="h-5 w-5" /> Comprar Lote
              </button>
            ) : (
              <div className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-500">
                Este lote não está mais disponível.
                {pedido && (
                  <Link href={`/checkout/${pedido.id}`} className="mt-1 block font-medium text-eco-600 hover:underline">
                    Ver pedido {pedido.id}
                  </Link>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Barra de ação fixa no rodapé (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,31,54,0.08)] backdrop-blur md:hidden">
        {lote.status === 'Disponível' ? (
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[11px] text-slate-500">{ton(lote.quantidade)}</p>
              <p className="text-base font-bold tabular-nums text-navy-700">{brl(valores.residuos)}</p>
            </div>
            <button onClick={comprar} className="btn-eco flex-1">
              <ShoppingCart className="h-5 w-5" /> Comprar Lote
            </button>
          </div>
        ) : pedido ? (
          <Link href={`/checkout/${pedido.id}`} className="btn-secondary w-full">Ver pedido {pedido.id}</Link>
        ) : (
          <Link href="/comprador" className="btn-secondary w-full">Voltar ao catálogo</Link>
        )}
      </div>
    </div>
  );
}
