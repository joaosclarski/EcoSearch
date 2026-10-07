'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, MapPin, Search, SearchX } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORIAS, CATEGORIA_INFO, type Categoria } from '@/lib/data';
import { brl, ton } from '@/lib/format';
import { CATEGORIA_ESTILO, CategoriaBadge, PageHeader, PerigosoBadge } from '@/components/ui';

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function CatalogoPage() {
  const { lotes } = useStore();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Categoria | 'Todas'>('Todas');

  const termo = normalizar(busca.trim());
  const disponiveis = lotes.filter((l) => l.status === 'Disponível');
  const resultado = disponiveis.filter(
    (l) =>
      (filtro === 'Todas' || l.categoria === filtro) &&
      (!termo || normalizar(`${l.nome} ${l.descricao} ${l.categoria} ${l.gerador.nome} ${l.gerador.cidade}`).includes(termo)),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Visão Comprador"
        title="Catálogo de Resíduos"
        description="Lotes com laudo de caracterização verificado, prontos para compra com MTR e pagamento em custódia."
      />

      <div className="card mb-4 flex flex-col gap-3 p-3 sm:mb-6 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por material, gerador ou cidade…"
            className="input pl-9"
          />
        </div>
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:flex-wrap md:px-0">
          {(['Todas', ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className={`chip ${
                filtro === c ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {resultado.length} de {disponiveis.length} lotes disponíveis
      </p>

      {resultado.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center text-slate-500">
          <SearchX className="h-8 w-8 text-slate-300" />
          <p>Nenhum lote encontrado para os filtros atuais.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resultado.map((l) => {
            const { icon: Icon, tile } = CATEGORIA_ESTILO[l.categoria];
            return (
              <Link
                key={l.id}
                href={`/comprador/${l.id}`}
                className="card group flex flex-col p-4 transition sm:p-5 hover:-translate-y-0.5 hover:border-eco-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tile}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    <CategoriaBadge categoria={l.categoria} />
                    {CATEGORIA_INFO[l.categoria].perigoso && <PerigosoBadge />}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold leading-snug text-navy-700">{l.nome}</h3>
                <p className="mt-1 text-sm text-slate-500">{l.gerador.nome}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5" /> {l.gerador.cidade}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400">Quantidade</dt>
                    <dd className="font-semibold tabular-nums text-navy-700">{ton(l.quantidade)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Preço/t</dt>
                    <dd className="font-semibold tabular-nums text-navy-700">{brl(l.precoUnidade)}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold tabular-nums text-eco-600">{brl(l.quantidade * l.precoUnidade)}</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-navy-600 group-hover:text-eco-600">
                    Ver detalhes <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
