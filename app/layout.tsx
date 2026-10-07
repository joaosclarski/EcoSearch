import type { Metadata, Viewport } from 'next';
import './globals.css';
import { HydrationGate, StoreProvider } from '@/lib/store';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'EcoSearch — Marketplace B2B de Resíduos Industriais',
  description: 'Compra e venda de resíduos industriais com MTR, custódia (escrow) e rastreabilidade ESG.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1B365D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      {/* padding inferior reserva espaço para a barra de navegação / ação fixa no mobile */}
      <body className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom))] font-sans text-slate-900 antialiased md:pb-0">
        <StoreProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <HydrationGate>{children}</HydrationGate>
          </main>
          <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
            EcoSearch · Protótipo de demonstração — dados simulados, sem valor legal ou financeiro.
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
