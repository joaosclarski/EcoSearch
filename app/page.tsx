'use client';

import Link from 'next/link';
import { ArrowRight, Factory, FileText, Lock, Scale, ShoppingCart, TreePine } from 'lucide-react';
import { useStore } from '@/lib/store';
import { impactoPedido } from '@/lib/data';
import { num } from '@/lib/format';
import { QrCard } from '@/components/QrAcesso';

const ETAPAS = [
  { icon: Factory, titulo: 'Anúncio com laudo', texto: 'Gerador publica o lote com laudo de caracterização e FDS/FISPQ.' },
  { icon: FileText, titulo: 'MTR automático', texto: 'Manifesto de Transporte emitido no padrão SINIR/IBAMA no checkout.' },
  { icon: Lock, titulo: 'Pagamento em escrow', texto: 'O valor fica em custódia até a pesagem no destino.' },
  { icon: Scale, titulo: 'Baixa na balança', texto: 'Recebimento confirmado, MTR baixado e saldo liberado.' },
];

export default function Home() {
  const { lotes, pedidos, setPerfil } = useStore();
  const disponiveis = lotes.filter((l) => l.status === 'Disponível');
  const desviadas = pedidos.filter((p) => p.status === 'Concluído').reduce((s, p) => s + impactoPedido(p).toneladas, 0);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-eco-500/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-eco-100">
            <TreePine className="h-3.5 w-3.5" /> {num(desviadas)} t já desviadas de aterros
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            O marketplace B2B que transforma resíduo industrial em matéria-prima.
          </h1>
          <p className="mt-4 text-navy-100">
            Conformidade ambiental, logística de carga perigosa e pagamento protegido em um só fluxo — com rastreabilidade
            de ponta a ponta para o seu relatório ESG.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/gerador" onClick={() => setPerfil('gerador')} className="btn bg-white text-navy-700 hover:bg-navy-50">
              <Factory className="h-4 w-4" /> Sou Gerador
            </Link>
            <Link href="/comprador" onClick={() => setPerfil('comprador')} className="btn-eco">
              <ShoppingCart className="h-4 w-4" /> Sou Comprador · {disponiveis.length} lotes disponíveis
            </Link>
          </div>
        </div>
      </section>

      <QrCard />

      <section>
        <h2 className="text-lg font-semibold text-navy-700">Como funciona</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map(({ icon: Icon, titulo, texto }, i) => (
            <li key={titulo} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-eco-50 text-eco-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-slate-400">ETAPA {i + 1}</span>
              </div>
              <h3 className="mt-3 font-semibold text-navy-700">{titulo}</h3>
              <p className="mt-1 text-sm text-slate-500">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <Link href="/esg" className="card group flex items-center justify-between p-5 transition hover:border-eco-300">
        <div>
          <p className="font-semibold text-navy-700">Painel de Impacto ESG</p>
          <p className="text-sm text-slate-500">Toneladas desviadas do aterro, CO₂ evitado e economia obtida.</p>
        </div>
        <ArrowRight className="h-5 w-5 text-eco-500 transition group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
