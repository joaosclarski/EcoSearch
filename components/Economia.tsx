'use client';

import { Check, Crown, Landmark, PiggyBank, TrendingDown } from 'lucide-react';
import {
  FAIXA_ECONOMIA_VIRGEM,
  LIMITE_TRANSACOES_GRATIS,
  PRECO_PRO,
  TAXA_INTERMEDIACAO,
  TAXA_MARGEM_FRETE,
  economiaLote,
  type Lote,
} from '@/lib/data';
import { brl, pct } from '@/lib/format';

type LoteBase = Pick<Lote, 'quantidade' | 'precoUnidade' | 'categoria' | 'gerador'>;

/** Gerador: "Custo com Aterro Evitado: ~R$ X | Receita Gerada: +R$ Y". */
export function ComparativoGerador({ lote, className = '' }: { lote: LoteBase; className?: string }) {
  const e = economiaLote(lote);
  return (
    <div className={`grid grid-cols-1 overflow-hidden rounded-lg ring-1 ring-inset ring-eco-200 sm:grid-cols-2 ${className}`}>
      <div className="flex items-center gap-3 bg-eco-50 p-3">
        <TrendingDown className="h-5 w-5 shrink-0 text-eco-600" />
        <div>
          <p className="text-xs text-eco-700">Custo com Aterro Evitado</p>
          <p className="font-bold tabular-nums text-eco-800">~{brl(e.aterroEvitado)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-eco-200 bg-white p-3 sm:border-l sm:border-t-0">
        <Landmark className="h-5 w-5 shrink-0 text-navy-600" />
        <div>
          <p className="text-xs text-slate-500">Receita Gerada</p>
          <p className="font-bold tabular-nums text-navy-700">+{brl(e.receitaGerador)}</p>
        </div>
      </div>
    </div>
  );
}

/** Comprador: economia estimada vs. matéria-prima virgem (faixa 40–50%). */
export function ComparativoComprador({ lote, className = '' }: { lote?: LoteBase; className?: string }) {
  const e = lote ? economiaLote(lote) : null;
  return (
    <div className={`flex items-center gap-3 rounded-lg bg-eco-50 p-3 ring-1 ring-inset ring-eco-200 ${className}`}>
      <PiggyBank className="h-5 w-5 shrink-0 text-eco-600" />
      <p className="text-sm text-eco-800">
        Economia estimada vs. Matéria-Prima Virgem:{' '}
        {e ? (
          <strong className="whitespace-nowrap">
            ~{pct(e.percentualVirgem)} ({brl(e.economiaComprador)})
          </strong>
        ) : (
          <strong className="whitespace-nowrap">
            ~{pct(FAIXA_ECONOMIA_VIRGEM[0])} a {pct(FAIXA_ECONOMIA_VIRGEM[1])}
          </strong>
        )}
      </p>
    </div>
  );
}

/** Planos PME: gratuito (pay-per-transaction) e SaaS Pro opcional. */
export function PlanosPme({
  planoPro,
  onAssinar,
  transacoesMes,
}: {
  planoPro?: boolean;
  onAssinar?: (ativo: boolean) => void;
  transacoesMes?: number;
}) {
  const recomendarPro = transacoesMes !== undefined && transacoesMes > LIMITE_TRANSACOES_GRATIS && !planoPro;
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
      <div className={`card p-4 sm:p-5 ${!planoPro && onAssinar ? 'ring-2 ring-eco-500' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-eco-600">Gratuito · Pay-per-transaction</p>
            <p className="mt-1 text-2xl font-bold text-navy-700">
              R$ 0<span className="text-sm font-medium text-slate-500">/mês</span>
            </p>
          </div>
          {!planoPro && onAssinar && <span className="rounded-full bg-eco-500 px-2 py-0.5 text-xs font-semibold text-white">Seu plano</span>}
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {[
            'Cadastro e anúncios ilimitados sem mensalidade',
            `Taxa só quando vende: ${TAXA_INTERMEDIACAO * 100}% sobre o lote + ${TAXA_MARGEM_FRETE * 100}% sobre o frete`,
            'MTR, escrow e frete local integrados',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-eco-500" /> {t}
            </li>
          ))}
        </ul>
      </div>

      <div className={`card p-4 sm:p-5 ${planoPro ? 'ring-2 ring-navy-600' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-navy-600">
              <Crown className="h-3.5 w-3.5" /> SaaS Pro · Opcional
            </p>
            <p className="mt-1 text-2xl font-bold text-navy-700">
              {brl(PRECO_PRO)}
              <span className="text-sm font-medium text-slate-500">/mês</span>
            </p>
          </div>
          {planoPro && <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs font-semibold text-white">Seu plano</span>}
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {[`Para PMEs com mais de ${LIMITE_TRANSACOES_GRATIS} transações/mês`, 'Relatórios ESG completos', 'MTRs ilimitados'].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" /> {t}
            </li>
          ))}
        </ul>
        {recomendarPro && (
          <p className="mt-3 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            Você fez {transacoesMes} transações este mês — o Pro é recomendado para o seu volume.
          </p>
        )}
        {onAssinar && (
          <button onClick={() => onAssinar(!planoPro)} className={`mt-4 w-full ${planoPro ? 'btn-secondary' : 'btn-primary'}`}>
            {planoPro ? 'Voltar ao plano gratuito' : 'Assinar Pro (simulado)'}
          </button>
        )}
      </div>
    </div>
  );
}
