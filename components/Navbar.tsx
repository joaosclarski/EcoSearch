'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  BadgeDollarSign,
  ClipboardList,
  Factory,
  LayoutGrid,
  Leaf,
  Package,
  PlusCircle,
  RotateCcw,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Perfil } from '@/lib/data';
import { QrBotao } from './QrAcesso';

interface Item {
  href: string;
  label: string; // rótulo curto (barra inferior)
  completo?: string; // rótulo do header desktop
  icon: LucideIcon;
}

const ESG: Item = { href: '/esg', label: 'ESG', completo: 'Impacto ESG', icon: Leaf };
const FATURAMENTO: Item = { href: '/faturamento', label: 'Faturamento', icon: BadgeDollarSign };

const LINKS: Record<Perfil, Item[]> = {
  gerador: [
    { href: '/gerador', label: 'Anunciar', completo: 'Anunciar Resíduo', icon: PlusCircle },
    { href: '/gerador#meus-lotes', label: 'Meus Lotes', icon: ClipboardList },
    ESG,
  ],
  comprador: [
    { href: '/comprador', label: 'Catálogo', icon: LayoutGrid },
    { href: '/pedidos', label: 'Pedidos', completo: 'Meus Pedidos', icon: Package },
    ESG,
  ],
};

const PERFIS: { id: Perfil; label: string; icon: LucideIcon; home: string }[] = [
  { id: 'gerador', label: 'Visão Gerador', icon: Factory, home: '/gerador' },
  { id: 'comprador', label: 'Visão Comprador', icon: ShoppingCart, home: '/comprador' },
];

/** Rotas de fluxo focado: escondem a barra inferior para dar lugar à barra de ação fixa. */
const rotaFocada = (p: string) => p.startsWith('/checkout') || /^\/comprador\/.+/.test(p);

const iconBtn =
  'flex h-11 w-11 items-center justify-center rounded-lg text-navy-200 transition hover:bg-white/10 hover:text-white md:h-9 md:w-9';

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
    <>
      <header className="z-40 bg-navy-700 text-white shadow-md md:sticky md:top-0 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6 md:py-3 lg:px-8">
          <Link href="/" className="flex min-h-[44px] items-center gap-2 md:min-h-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-eco-500">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Eco<span className="text-eco-200">Search</span>
            </span>
          </Link>

          <nav className="hidden gap-1 md:flex">
            {LINKS[perfil].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  ativo(l.href) ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {l.completo ?? l.label}
              </Link>
            ))}
          </nav>

          {/* Alternador de perfil: largura total em uma segunda linha no mobile */}
          <div
            className="order-last flex w-full rounded-lg bg-navy-900/60 p-1 md:order-none md:ml-auto md:w-auto"
            role="tablist"
            aria-label="Perfil"
          >
            {PERFIS.map(({ id, label, icon: Icon, home }) => (
              <button
                key={id}
                role="tab"
                aria-selected={perfil === id}
                onClick={() => {
                  setPerfil(id);
                  router.push(home);
                }}
                className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold transition md:min-h-0 md:flex-none md:py-1.5 ${
                  perfil === id ? 'bg-eco-500 text-white shadow' : 'text-navy-100 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href={FATURAMENTO.href}
              title="Painel de Faturamento (uso interno EcoSearch)"
              className={`hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition md:flex ${
                pathname === FATURAMENTO.href ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BadgeDollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">Faturamento</span>
            </Link>
            <QrBotao className={iconBtn} />
            <button
              onClick={() => {
                resetDemo();
                router.push('/');
              }}
              title="Restaurar dados da demonstração"
              aria-label="Restaurar dados da demonstração"
              className={iconBtn}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar (mobile) */}
      {!rotaFocada(pathname) && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 block border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
          aria-label="Navegação principal"
        >
          <ul className="grid grid-cols-4">
            {[...LINKS[perfil], FATURAMENTO].map(({ href, label, icon: Icon }) => {
              const on = ativo(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                      on ? 'text-eco-600' : 'text-slate-500 active:text-navy-700'
                    }`}
                  >
                    {on && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-eco-500" />}
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
}
