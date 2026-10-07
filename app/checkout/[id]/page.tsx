'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Landmark,
  Loader2,
  Lock,
  Scale,
  ShieldCheck,
  Unlock,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORIA_INFO, TAXA_INTERMEDIACAO, TRANSPORTADORA, type Pedido } from '@/lib/data';
import { brl, dataHora, num, ton } from '@/lib/format';
import { CategoriaBadge, PerigosoBadge, StatusBadge } from '@/components/ui';
import MtrModal from '@/components/MtrModal';
import Sheet from '@/components/Sheet';

const METODOS = [
  { id: 'pix', label: 'PIX', detalhe: 'Compensação imediata' },
  { id: 'ted', label: 'TED', detalhe: 'Compensação no mesmo dia útil' },
] as const;

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const { pedidos, emitirMtr, pagarEscrow, confirmarRecebimento } = useStore();
  const pedido = pedidos.find((p) => p.id === id);

  const [mtrAberto, setMtrAberto] = useState(false);
  const [escrowAberto, setEscrowAberto] = useState(false);
  const [metodo, setMetodo] = useState<(typeof METODOS)[number]['id']>('pix');
  const [pagando, setPagando] = useState(false);
  const [pesando, setPesando] = useState(false);
  const [peso, setPeso] = useState<string>(pedido ? String(pedido.lote.quantidade) : '');

  if (!pedido) {
    return (
      <div className="card p-6 text-center sm:p-10">
        <p className="text-slate-500">Pedido não encontrado.</p>
        <Link href="/pedidos" className="btn-secondary mt-4">Meus pedidos</Link>
      </div>
    );
  }

  const info = CATEGORIA_INFO[pedido.lote.categoria];
  const { valores } = pedido;
  const pago = pedido.status !== 'Aguardando Pagamento';
  const concluido = pedido.status === 'Concluído';
  const podeConfirmar = pago && !!pedido.mtr && !concluido;

  const simular = (setLoading: (b: boolean) => void, acao: () => void, ms = 1400) => {
    setLoading(true);
    setTimeout(() => {
      acao();
      setLoading(false);
    }, ms);
  };

  const pagar = () =>
    simular(setPagando, () => {
      pagarEscrow(pedido.id);
      setEscrowAberto(false);
    });

  const confirmar = () => simular(setPesando, () => confirmarRecebimento(pedido.id, Number(peso)), 1600);

  // Próxima ação do fluxo — exibida na barra fixa do rodapé no mobile
  const proxima: { label: string; icon: LucideIcon; onClick?: () => void; href?: string; cls: string; disabled?: boolean; loading?: boolean } =
    !pedido.mtr
      ? { label: 'Gerar MTR SINIR/IBAMA', icon: FileText, onClick: () => setMtrAberto(true), cls: 'btn-primary' }
      : !pago
        ? { label: 'Pagar em Custódia (Escrow)', icon: Lock, onClick: () => setEscrowAberto(true), cls: 'btn-eco' }
        : !concluido
          ? {
              label: pesando ? 'Registrando pesagem…' : 'Confirmar Recebimento',
              icon: Scale,
              onClick: confirmar,
              cls: 'btn-primary',
              disabled: pesando || !(Number(peso) > 0),
              loading: pesando,
            }
          : { label: 'Ver Impacto ESG', icon: ArrowRight, href: '/esg', cls: 'btn-eco' };

  return (
    <div>
      <Link
        href="/pedidos"
        className="mb-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-700 md:mb-6 md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" /> Meus pedidos
      </Link>

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-eco-600">Checkout B2B · {pedido.id}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-navy-700 sm:text-3xl">{pedido.lote.nome}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <CategoriaBadge categoria={pedido.lote.categoria} />
            {info.perigoso && <PerigosoBadge />}
            <span className="sm:hidden">
              <StatusBadge status={pedido.status} />
            </span>
          </div>
        </div>
        <span className="hidden sm:block">
          <StatusBadge status={pedido.status} />
        </span>
      </div>

      <Timeline pedido={pedido} />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-5">
        {/* Resumo do pedido: primeiro no mobile, coluna direita no desktop */}
        <aside className="lg:order-last lg:col-span-2">
          <div className="card p-4 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-semibold text-navy-700">Resumo do Pedido</h2>
            <p className="mt-1 text-xs text-slate-500">
              {ton(pedido.lote.quantidade)} × {brl(pedido.lote.precoUnidade)}/t
            </p>

            <Resumo pedido={pedido} />

            {/* Ações completas a partir de md; no mobile ficam na barra fixa do rodapé */}
            <div className="mt-6 hidden space-y-3 md:block">
              <button onClick={() => setMtrAberto(true)} className={pedido.mtr ? 'btn-secondary w-full' : 'btn-primary w-full'}>
                <FileText className="h-4 w-4" />
                {pedido.mtr ? `Visualizar MTR nº ${pedido.mtr.numero}` : 'Gerar MTR SINIR/IBAMA'}
              </button>
              <button onClick={() => setEscrowAberto(true)} disabled={pago} className="btn-eco w-full">
                {pago ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {pago ? 'Pago em Custódia' : 'Pagar em Custódia (Escrow)'}
              </button>
            </div>

            {/* No mobile, a ação secundária (ver MTR) fica aqui; a principal vai para o rodapé */}
            {pedido.mtr && (
              <button onClick={() => setMtrAberto(true)} className="btn-secondary mt-4 w-full md:hidden">
                <FileText className="h-4 w-4" /> Visualizar MTR nº {pedido.mtr.numero}
              </button>
            )}

            <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-eco-500" />
              O valor fica retido em conta de custódia e só é liberado ao gerador após a confirmação de pesagem no destino.
            </p>
          </div>
        </aside>

        <div className="space-y-4 sm:space-y-6 lg:col-span-3">
          <div className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6">
            {[
              ['Gerador (vendedor)', pedido.lote.gerador.nome, pedido.lote.gerador.cidade],
              ['Transportador', TRANSPORTADORA.nome, info.perigoso ? 'Habilitado para carga perigosa' : 'Frota licenciada'],
              ['Destinador (comprador)', pedido.comprador.nome, pedido.comprador.cidade],
            ].map(([papel, nome, sub]) => (
              <div key={papel}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{papel}</p>
                <p className="mt-1 text-sm font-semibold text-navy-700">{nome}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>

          <EscrowCard pedido={pedido} />

          <div className="card p-4 sm:p-6">
            <h2 className="flex items-center gap-2 font-semibold text-navy-700">
              <Scale className="h-5 w-5 text-eco-500" /> Recebimento na balança
            </h2>

            {concluido ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-eco-200 bg-eco-50 p-4 text-sm text-eco-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Recebimento confirmado · MTR {pedido.mtr?.numero} baixado no SINIR</p>
                    <p className="mt-0.5">
                      Pesagem de {ton(pedido.pesoBalanca ?? 0)} registrada em {dataHora(pedido.recebidoEm!)}. Saldo liberado do escrow.
                    </p>
                  </div>
                </div>
                <Link href="/esg" className="btn-primary hidden md:inline-flex">
                  Ver Impacto ESG <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-slate-500">
                  Ao chegar no destino, a carga é pesada e o comprador confirma o recebimento. Isso dá baixa no MTR e libera os
                  valores retidos para o gerador e o transportador.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="sm:w-48">
                    <label className="label" htmlFor="peso">Peso aferido (t)</label>
                    <input
                      id="peso"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      className="input"
                      value={peso}
                      disabled={!podeConfirmar || pesando}
                      onChange={(e) => setPeso(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary hidden flex-1 md:inline-flex"
                    disabled={!podeConfirmar || pesando || !(Number(peso) > 0)}
                    onClick={confirmar}
                  >
                    {pesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                    {pesando ? 'Registrando ticket de pesagem…' : 'Confirmar Recebimento na Balança'}
                  </button>
                </div>
                {!podeConfirmar && (
                  <p className="mt-3 text-xs text-amber-700">
                    Requer: {[!pedido.mtr && 'MTR emitido', !pago && 'pagamento em custódia'].filter(Boolean).join(' e ')}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de ação fixa no rodapé (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,31,54,0.08)] backdrop-blur md:hidden print:hidden">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[11px] text-slate-500">Total</p>
            <p className="text-base font-bold tabular-nums text-navy-700">{brl(valores.total)}</p>
          </div>
          {proxima.href ? (
            <Link href={proxima.href} className={`${proxima.cls} flex-1`}>
              {proxima.label} <proxima.icon className="h-4 w-4" />
            </Link>
          ) : (
            <button onClick={proxima.onClick} disabled={proxima.disabled} className={`${proxima.cls} flex-1`}>
              {proxima.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <proxima.icon className="h-4 w-4" />}
              {proxima.label}
            </button>
          )}
        </div>
      </div>

      {mtrAberto && <MtrModal pedido={pedido} onEmitir={() => emitirMtr(pedido.id)} onClose={() => setMtrAberto(false)} />}

      {escrowAberto && (
        <Sheet
          titulo="Pagamento em custódia (Escrow)"
          onClose={() => !pagando && setEscrowAberto(false)}
          rodape={
            <button onClick={pagar} disabled={pagando} className="btn-eco w-full">
              {pagando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {pagando ? 'Processando depósito…' : `Confirmar depósito de ${brl(valores.total)}`}
            </button>
          }
        >
          <div className="space-y-5 p-4 sm:p-5">
            <div className="flex items-start gap-3 rounded-lg bg-navy-50 p-4 text-sm text-navy-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                O valor será depositado em uma <strong>conta custódia</strong> e só será liberado ao gerador e ao transportador após a
                confirmação de recebimento na balança.
              </p>
            </div>

            <Resumo pedido={pedido} />

            <fieldset>
              <legend className="label">Forma de depósito</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {METODOS.map((m) => (
                  <label
                    key={m.id}
                    className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                      metodo === m.id ? 'border-eco-500 bg-eco-50 ring-1 ring-eco-500' : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      className="h-4 w-4 accent-eco-600"
                      checked={metodo === m.id}
                      onChange={() => setMetodo(m.id)}
                    />
                    <span>
                      <span className="block font-semibold text-navy-700">{m.label}</span>
                      <span className="text-xs text-slate-500">{m.detalhe}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <dl className="grid grid-cols-1 gap-1 rounded-lg border border-slate-200 p-3 text-xs text-slate-600 sm:grid-cols-2">
              <div><dt className="inline text-slate-400">Banco custodiante: </dt><dd className="inline">Banco Parceiro S.A. (simulado)</dd></div>
              <div><dt className="inline text-slate-400">Conta escrow: </dt><dd className="inline">0001 / 778899-0</dd></div>
              <div><dt className="inline text-slate-400">Pedido: </dt><dd className="inline">{pedido.id}</dd></div>
              <div><dt className="inline text-slate-400">Beneficiário final: </dt><dd className="inline">{pedido.lote.gerador.nome}</dd></div>
            </dl>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Resumo({ pedido }: { pedido: Pedido }) {
  const { valores } = pedido;
  const info = CATEGORIA_INFO[pedido.lote.categoria];
  return (
    <dl className="mt-5 space-y-3 text-sm">
      <Linha rotulo="Valor dos Resíduos" valor={valores.residuos} />
      <Linha rotulo={info.perigoso ? 'Frete Especializado Carga Perigosa' : 'Frete Especializado'} sub="Simulado" valor={valores.frete} />
      <Linha rotulo={`Taxa de Intermediação EcoSearch (${TAXA_INTERMEDIACAO * 100}%)`} valor={valores.taxa} />
      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <dt className="font-semibold text-navy-700">Total</dt>
        <dd className="text-2xl font-bold tabular-nums text-navy-700">{brl(valores.total)}</dd>
      </div>
    </dl>
  );
}

function Linha({ rotulo, sub, valor }: { rotulo: string; sub?: string; valor: number }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-600">
        {rotulo}
        {sub && <span className="ml-1 text-xs text-slate-400">({sub})</span>}
      </dt>
      <dd className="whitespace-nowrap font-medium tabular-nums text-slate-800">{brl(valor)}</dd>
    </div>
  );
}

function Timeline({ pedido }: { pedido: Pedido }) {
  const etapas = [
    { titulo: 'Pedido criado', quando: pedido.criadoEm },
    { titulo: 'MTR emitido', quando: pedido.mtr?.emitidoEm ?? null },
    { titulo: 'Pagamento em escrow', quando: pedido.pagoEm },
    { titulo: 'Recebido e liberado', quando: pedido.recebidoEm },
  ];
  return (
    <ol className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
      {etapas.map((e, i) => (
        <li key={e.titulo} className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              e.quando ? 'bg-eco-500 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {e.quando ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <div className="min-w-0">
            <p className={`text-sm font-medium ${e.quando ? 'text-navy-700' : 'text-slate-400'}`}>{e.titulo}</p>
            <p className="text-xs text-slate-400">{e.quando ? dataHora(e.quando) : 'Pendente'}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EscrowCard({ pedido }: { pedido: Pedido }) {
  const { valores, status } = pedido;
  const estado =
    status === 'Aguardando Pagamento'
      ? { icon: Landmark, cor: 'bg-slate-50 text-slate-600 ring-slate-200', titulo: 'Aguardando depósito', texto: 'Nenhum valor em custódia ainda.' }
      : status === 'Pagamento Retido no Escrow'
        ? {
            icon: Lock,
            cor: 'bg-navy-50 text-navy-700 ring-navy-200',
            titulo: `${brl(valores.total)} retidos em custódia`,
            texto: 'Conta escrow no banco parceiro. Liberação automática após baixa do MTR na balança.',
          }
        : { icon: Unlock, cor: 'bg-eco-50 text-eco-800 ring-eco-200', titulo: 'Saldo liberado', texto: 'Valores distribuídos às partes.' };
  const Icon = estado.icon;

  const repasses = [
    ['Gerador', pedido.lote.gerador.nome, valores.residuos],
    ['Transportador', TRANSPORTADORA.nome, valores.frete],
    ['EcoSearch', 'Taxa de intermediação', valores.taxa],
  ] as const;

  const situacao =
    status === 'Concluído' ? (
      <span className="font-medium text-eco-600">Liberado</span>
    ) : status === 'Pagamento Retido no Escrow' ? (
      <span className="font-medium text-navy-600">Retido</span>
    ) : (
      <span className="text-slate-400">—</span>
    );

  return (
    <div className="card p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-semibold text-navy-700">
        <ShieldCheck className="h-5 w-5 text-eco-500" /> Custódia (Escrow)
      </h2>
      <div className={`mt-4 flex items-start gap-3 rounded-lg p-4 ring-1 ring-inset ${estado.cor}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{estado.titulo}</p>
          <p className="text-sm opacity-80">{estado.texto}</p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-slate-100 text-sm">
        {repasses.map(([papel, nome, valor]) => (
          <li key={papel} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="font-medium text-slate-700">{papel}</p>
              <p className="truncate text-xs text-slate-400">{nome}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular-nums">{brl(valor)}</p>
              <p className="text-xs">{situacao}</p>
            </div>
          </li>
        ))}
      </ul>
      {pedido.pesoBalanca !== null && pedido.pesoBalanca !== pedido.lote.quantidade && (
        <p className="mt-3 text-xs text-slate-500">
          Peso aferido ({num(pedido.pesoBalanca)} t) difere do anunciado ({num(pedido.lote.quantidade)} t) — dentro da tolerância contratual.
        </p>
      )}
    </div>
  );
}
