'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Printer } from 'lucide-react';
import Sheet from './Sheet';
import { CATEGORIA_INFO, TRANSPORTADORA, type Empresa, type Pedido } from '@/lib/data';
import { dataHora, num } from '@/lib/format';

const ETAPAS_EMISSAO = [
  'Autenticando no SINIR com certificado digital…',
  'Validando código IBAMA e classificação NBR 10004…',
  'Registrando transportador e destinador licenciados…',
  'Gerando manifesto e assinatura eletrônica…',
];

export default function MtrModal({
  pedido,
  onEmitir,
  onClose,
}: {
  pedido: Pedido;
  onEmitir: () => void;
  onClose: () => void;
}) {
  const [etapa, setEtapa] = useState(pedido.mtr ? ETAPAS_EMISSAO.length : 0);

  useEffect(() => {
    if (pedido.mtr) return;
    if (etapa >= ETAPAS_EMISSAO.length) {
      onEmitir();
      return;
    }
    const t = setTimeout(() => setEtapa((e) => e + 1), 650);
    return () => clearTimeout(t);
  }, [etapa, pedido.mtr, onEmitir]);

  const emitido = !!pedido.mtr;

  return (
    <Sheet
      titulo="Manifesto de Transporte de Resíduos (MTR)"
      onClose={onClose}
      largura="md:max-w-3xl"
      rodape={
        emitido && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-sm text-eco-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> MTR nº {pedido.mtr!.numero} emitido com sucesso
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button onClick={onClose} className="btn-secondary">Fechar</button>
              <button onClick={() => window.print()} className="btn-primary">
                <Printer className="h-4 w-4" /> Baixar PDF
              </button>
            </div>
          </div>
        )
      }
    >
      {!emitido ? (
        <div className="px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
          <div className="mx-auto max-w-sm">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-eco-500" />
            <p className="mt-4 text-center font-medium text-navy-700">Emitindo MTR no SINIR/IBAMA</p>
            <ul className="mt-6 space-y-3">
              {ETAPAS_EMISSAO.map((txt, i) => (
                <li key={txt} className={`flex items-center gap-2 text-sm ${i < etapa ? 'text-eco-700' : i === etapa ? 'text-navy-700' : 'text-slate-300'}`}>
                  {i < etapa ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Loader2 className={`h-4 w-4 shrink-0 ${i === etapa ? 'animate-spin' : ''}`} />}
                  {txt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 p-3 sm:p-6 print:bg-white print:p-0">
          <Documento pedido={pedido} />
        </div>
      )}
    </Sheet>
  );
}

function Documento({ pedido }: { pedido: Pedido }) {
  const info = CATEGORIA_INFO[pedido.lote.categoria];
  const mtr = pedido.mtr!;

  return (
    <article className="print-area relative mx-auto bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-800 shadow sm:p-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="-rotate-[25deg] whitespace-nowrap text-4xl font-bold tracking-widest text-red-500/10 sm:text-5xl">
          DOCUMENTO SIMULADO
        </span>
      </div>

      <header className="flex items-start justify-between gap-4 border-b-2 border-navy-700 pb-3">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos
          </p>
          <p className="font-sans text-base font-bold text-navy-700">SINIR · Manifesto de Transporte de Resíduos</p>
          <p className="font-sans text-[10px] text-slate-500">Portaria MMA nº 280/2020 — Protótipo EcoSearch, sem validade legal</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-slate-500">MTR nº</p>
          <p className="font-sans text-lg font-bold text-navy-700">{mtr.numero}</p>
          <p className="text-[10px] text-slate-500">Emissão: {dataHora(mtr.emitidoEm)}</p>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Parte titulo="1. Gerador" empresa={pedido.lote.gerador} />
        <Parte titulo="2. Transportador" empresa={TRANSPORTADORA} extra={info.perigoso ? 'Licença ANTT RNTRC · Motorista MOPP · Placa EKO-2A26' : 'Licença RNTRC · Placa EKO-1B26'} />
        <Parte titulo="3. Destinador" empresa={pedido.comprador} extra={`Tecnologia: ${info.tecnologia}`} />
      </div>

      <section className="mt-4">
        <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-navy-700">4. Identificação do resíduo</p>
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-300 text-left">
            <thead className="bg-slate-100 text-[10px] uppercase">
              <tr>
                {['Código IBAMA', 'Descrição', 'Classe', 'Estado', 'Acondic.', 'Qtd.', 'Un.'].map((h) => (
                  <th key={h} className="border border-slate-300 px-2 py-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-1">{info.codigoIbama}</td>
                <td className="border border-slate-300 px-2 py-1">{info.descricaoIbama} — {pedido.lote.nome}</td>
                <td className="border border-slate-300 px-2 py-1">{info.perigoso ? 'I' : info.classe.includes('II A') ? 'II A' : 'II B'}</td>
                <td className="border border-slate-300 px-2 py-1">{info.estadoFisico}</td>
                <td className="border border-slate-300 px-2 py-1">{info.acondicionamento}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{num(pedido.lote.quantidade)}</td>
                <td className="border border-slate-300 px-2 py-1">t</td>
              </tr>
            </tbody>
          </table>
        </div>
        {info.onu && <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-red-700">⚠ Produto perigoso: {info.onu}</p>}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="border border-slate-300 p-2">
          <p className="text-[10px] uppercase text-slate-500">Documentos vinculados</p>
          <p>Laudo: {pedido.lote.laudo ?? '—'}</p>
          <p>FDS/FISPQ: {pedido.lote.fds ?? 'N/A'}</p>
          <p>Pedido EcoSearch: {pedido.id}</p>
        </div>
        <div className="border border-slate-300 p-2">
          <p className="text-[10px] uppercase text-slate-500">Recebimento (destinador)</p>
          {pedido.recebidoEm ? (
            <>
              <p>Data: {dataHora(pedido.recebidoEm)}</p>
              <p>Peso balança: {num(pedido.pesoBalanca ?? 0)} t</p>
              <p className="font-bold text-eco-700">MTR BAIXADO</p>
            </>
          ) : (
            <p className="text-slate-400">Aguardando pesagem no destino</p>
          )}
        </div>
      </section>

      <footer className="mt-6 flex items-end justify-between gap-4">
        <div className="grid flex-1 grid-cols-3 gap-4 text-center text-[10px] text-slate-500">
          {['Gerador', 'Transportador', 'Destinador'].map((r) => (
            <div key={r}>
              <div className="mb-1 border-b border-slate-400 pb-4 font-sans italic text-slate-400">assinado digitalmente</div>
              {r}
            </div>
          ))}
        </div>
        <QrFalso semente={mtr.numero} />
      </footer>
    </article>
  );
}

function Parte({ titulo, empresa, extra }: { titulo: string; empresa: Empresa; extra?: string }) {
  return (
    <div className="border border-slate-300 p-2">
      <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-navy-700">{titulo}</p>
      <p className="font-semibold">{empresa.nome}</p>
      <p>CNPJ {empresa.cnpj}</p>
      <p>{empresa.endereco}</p>
      <p>{empresa.cidade}</p>
      {extra && <p className="mt-1 text-slate-500">{extra}</p>}
    </div>
  );
}

function QrFalso({ semente }: { semente: string }) {
  const n = 11;
  let s = Number(semente) || 1;
  const celulas = Array.from({ length: n * n }, () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280 > 0.5;
  });
  return (
    <div className="grid h-16 w-16 shrink-0 border border-slate-300 p-0.5" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden>
      {celulas.map((on, i) => (
        <span key={i} className={on ? 'bg-slate-800' : ''} />
      ))}
    </div>
  );
}
