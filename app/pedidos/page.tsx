'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { useStore } from '@/lib/store';
import { EMPRESA_COMPRADORA } from '@/lib/data';
import { brl, dataHora, ton } from '@/lib/format';
import { CategoriaBadge, PageHeader, StatusBadge } from '@/components/ui';

export default function PedidosPage() {
  const pedidos = useStore().pedidos.filter((p) => p.comprador.cnpj === EMPRESA_COMPRADORA.cnpj);

  return (
    <div>
      <PageHeader eyebrow="Visão Comprador" title="Meus Pedidos" description="Acompanhe MTR, custódia e recebimento de cada compra." />

      {pedidos.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Nenhum pedido ainda.{' '}
          <Link href="/comprador" className="font-medium text-eco-600 hover:underline">Explorar catálogo</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/checkout/${p.id}`}
                className="card group flex flex-col gap-4 p-5 transition hover:border-eco-300 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">{p.id}</span>
                    <CategoriaBadge categoria={p.lote.categoria} />
                    {p.mtr && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <FileText className="h-3.5 w-3.5" /> MTR {p.mtr.numero}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-semibold text-navy-700">{p.lote.nome}</p>
                  <p className="text-sm text-slate-500">
                    {ton(p.lote.quantidade)} · {p.lote.gerador.nome} · {dataHora(p.criadoEm)}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                  <StatusBadge status={p.status} />
                  <span className="font-bold tabular-nums text-navy-700">{brl(p.valores.total)}</span>
                </div>
                <ArrowRight className="hidden h-5 w-5 text-slate-300 transition group-hover:text-eco-500 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
