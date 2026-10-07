import type { Metadata } from 'next';
import './globals.css';
import { HydrationGate, StoreProvider } from '@/lib/store';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'EcoSearch — Marketplace B2B de Resíduos Industriais',
  description: 'Compra e venda de resíduos industriais com MTR, custódia (escrow) e rastreabilidade ESG.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <StoreProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <HydrationGate>{children}</HydrationGate>
          </main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            EcoSearch · Protótipo de demonstração — dados simulados, sem valor legal ou financeiro.
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
