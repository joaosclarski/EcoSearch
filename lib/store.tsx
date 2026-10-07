'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  EMPRESA_GERADORA,
  EMPRESA_COMPRADORA,
  SEED_LOTES,
  SEED_PEDIDOS,
  calcularValores,
  gerarId,
  gerarNumeroMtr,
  type Categoria,
  type Lote,
  type Pedido,
  type Perfil,
} from './data';

const STORAGE_KEY = 'ecosearch-demo-v2';

interface State {
  perfil: Perfil;
  lotes: Lote[];
  pedidos: Pedido[];
}

export interface NovoLote {
  nome: string;
  categoria: Categoria;
  quantidade: number;
  precoUnidade: number;
  descricao: string;
  laudo: string | null;
  fds: string | null;
}

interface Store extends State {
  hydrated: boolean;
  setPerfil: (p: Perfil) => void;
  anunciarLote: (dados: NovoLote) => void;
  comprarLote: (loteId: string) => string;
  emitirMtr: (pedidoId: string) => void;
  pagarEscrow: (pedidoId: string) => void;
  confirmarRecebimento: (pedidoId: string, peso: number) => void;
  resetDemo: () => void;
}

const inicial = (): State => ({ perfil: 'comprador', lotes: SEED_LOTES, pedidos: SEED_PEDIDOS });

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(inicial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const agora = () => new Date().toISOString();

  const atualizarPedido = (id: string, fn: (p: Pedido) => Pedido) =>
    setState((s) => ({ ...s, pedidos: s.pedidos.map((p) => (p.id === id ? fn(p) : p)) }));

  const store: Store = {
    ...state,
    hydrated,
    setPerfil: (perfil) => setState((s) => (s.perfil === perfil ? s : { ...s, perfil })),

    anunciarLote: (dados) =>
      setState((s) => ({
        ...s,
        lotes: [
          { ...dados, id: gerarId('LT'), gerador: EMPRESA_GERADORA, status: 'Disponível', criadoEm: agora() },
          ...s.lotes,
        ],
      })),

    comprarLote: (loteId) => {
      const existente = state.pedidos.find((p) => p.loteId === loteId && p.status !== 'Concluído');
      if (existente) return existente.id;
      const lote = state.lotes.find((l) => l.id === loteId);
      if (!lote) throw new Error(`Lote ${loteId} não encontrado`);
      const pedido: Pedido = {
        id: gerarId('PED'),
        loteId,
        lote,
        comprador: EMPRESA_COMPRADORA,
        valores: calcularValores(lote),
        status: 'Aguardando Pagamento',
        criadoEm: agora(),
        mtr: null,
        pagoEm: null,
        recebidoEm: null,
        pesoBalanca: null,
      };
      setState((s) => ({
        ...s,
        pedidos: [pedido, ...s.pedidos],
        lotes: s.lotes.map((l) => (l.id === loteId ? { ...l, status: 'Reservado' } : l)),
      }));
      return pedido.id;
    },

    emitirMtr: (id) => atualizarPedido(id, (p) => (p.mtr ? p : { ...p, mtr: { numero: gerarNumeroMtr(), emitidoEm: agora() } })),

    pagarEscrow: (id) => atualizarPedido(id, (p) => ({ ...p, status: 'Pagamento Retido no Escrow', pagoEm: agora() })),

    confirmarRecebimento: (id, peso) =>
      setState((s) => {
        const pedido = s.pedidos.find((p) => p.id === id);
        return {
          ...s,
          pedidos: s.pedidos.map((p) =>
            p.id === id ? { ...p, status: 'Concluído', recebidoEm: agora(), pesoBalanca: peso } : p,
          ),
          lotes: s.lotes.map((l) => (l.id === pedido?.loteId ? { ...l, status: 'Vendido' } : l)),
        };
      }),

    resetDemo: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      setState(inicial());
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore deve ser usado dentro de <StoreProvider>');
  return ctx;
}

export function HydrationGate({ children }: { children: ReactNode }) {
  const { hydrated } = useStore();
  if (!hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">Carregando dados da demonstração…</div>
    );
  }
  return <>{children}</>;
}
