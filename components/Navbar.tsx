'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BadgeDollarSign, Factory, Leaf, RotateCcw, ShoppingCart } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Perfil } from '@/lib/data';
import { QrBotao } from './QrAcesso';

const LINKS: Record<Perfil, { href: string; label: string }[]> = {
  gerador: [
    { href: '/gerador', label: 'Anunciar Resíduo' },
    { href: '/gerador#meus-lotes', label: 'Meus Lotes' },
    { href: '/esg', label: 'Impacto ESG' },
  ],
  comprador: [
    { href: '/comprador', label: 'Catálogo' },
    { href: '/pedidos', label: 'Meus Pedidos' },
    { href: '/esg', label: 'Impacto ESG' },
  ],
};

const PERFIS: { id: Perfil; label: string; icon: typeof Factory; home: string }[] = [
  { id: 'gerador', label: 'Visão Gerador', icon: Factory, home: '/gerador' },
  { id: 'comprador', label: 'Visão Comprador', icon: ShoppingCart, home: '/comprador' },
];

export default function Navbar() {
  const { perfil, setPerfil, resetDemo } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  // Mantém o perfil coerente com a rota acessada diretamente
  useEffect(() => {
    if (pathname.startsWith('/gerador')) setPerfil('gerador');
    else if (['/comprador', '/checkout', '/pedidos'].some((p) => pathname.startsWith(p))) setPerfil('comprador');
  }, [pathname, setPerfil]);

  const ativo = (href: string) => {
    if (href.includes('#')) return false;
    return href === '/comprador' ? pathname.startsWith('/comprador') : pathname === href;
  };

  return (
    <header className="sticky top-0 z-40 bg-navy-700 text-white shadow-md print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-eco-500">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Eco<span className="text-eco-200">Search</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
          {LINKS[perfil].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                ativo(l.href) ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/faturamento"
            title="Painel de Faturamento (uso interno EcoSearch)"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              pathname === '/faturamento' ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BadgeDollarSign className="h-4 w-4" />
            <span className="hidden lg:inline">Faturamento</span>
          </Link>
          <div className="flex rounded-lg bg-navy-900/60 p-1" role="tablist" aria-label="Perfil">
            {PERFIS.map(({ id, label, icon: Icon, home }) => (
              <button
                key={id}
                role="tab"
                aria-selected={perfil === id}
                onClick={() => {
                  setPerfil(id);
                  router.push(home);
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  perfil === id ? 'bg-eco-500 text-white shadow' : 'text-navy-100 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <QrBotao />
          <button
            onClick={() => {
              resetDemo();
              router.push('/');
            }}
            title="Restaurar dados da demonstração"
            className="rounded-md p-2 text-navy-200 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
